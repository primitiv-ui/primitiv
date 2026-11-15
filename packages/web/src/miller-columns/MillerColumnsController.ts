import {
  LISTBOX_TYPEAHEAD_RESET_MS,
  listboxTypeahead,
  millerColumnsKeydown,
  millerColumnsResizeDrag,
  millerColumnsResizeKeydown,
  millerColumnsSelect,
  millerColumnsTabStop,
  type MillerColumnsAddress,
  type MillerColumnsItem,
  type MillerColumnsReadingDirection,
} from "@primitiv-ui/core";

/** An item as a host describes it to the controller: core's item and the element that is its treeitem. */
export type MillerColumnsControllerItem = MillerColumnsItem & { element: HTMLElement };

/**
 * What a {@link MillerColumnsController} asks of whoever hosts it. The
 * controller owns behaviour and never owns state (RFC 0033 D28): the custom
 * elements keep the path in a reflected attribute, the React adapter in React,
 * and each answers these calls from wherever it keeps it.
 */
export type MillerColumnsControllerHost = {
  state(): { path: readonly string[]; dir: MillerColumnsReadingDirection };
  /** Every item in the open columns, in document order within each column. */
  items(): readonly MillerColumnsControllerItem[];
  /** Apply a path the user asked for. */
  select(path: string[]): void;
};

/** The key and default-prevention a keydown needs: a DOM event, or React's. */
type KeyPress = { key: string; defaultPrevented: boolean; preventDefault(): void };

/**
 * The behaviour of a Miller Columns strip: selection from clicks and keys,
 * focus moved within a column and into and out of the next, and typeahead
 * scoped to the focused column. Its host wires each item's events to the
 * intents below, so the React adapter keeps composing them with its consumers'
 * handlers. The controller owns the typeahead query and the column a step-in
 * is waiting to focus, and its host calls {@link settle} each time it has
 * rendered, since the column a selection opens appears only then.
 */
export class MillerColumnsController {
  readonly #host: MillerColumnsControllerHost;
  /** The column a step-in opened, whose first item takes focus once it is there. */
  #pendingColumn: number | null = null;
  #query = "";
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(host: MillerColumnsControllerHost) {
    this.#host = host;
  }

  /** The one item in the Tab order, given the item focus was last on. */
  tabStop(active: MillerColumnsAddress | null): MillerColumnsAddress | null {
    return millerColumnsTabStop({ active, path: this.#host.state().path, items: this.#host.items() });
  }

  /** A click on an item, which selects it unless it is disabled. */
  click(address: MillerColumnsAddress): void {
    // A host only ever reports an address it listed, so the item is there.
    if (this.#item(address)!.disabled) return;
    this.#select(address);
  }

  /** A key press on an item: the keymap first, then typeahead for a key it left alone. */
  keydown(address: MillerColumnsAddress, event: KeyPress): void {
    const { path, dir } = this.#host.state();
    const items = this.#host.items();
    const outcome = millerColumnsKeydown({ path, dir, items }, address, event.key);
    if (!outcome) {
      if (!event.defaultPrevented) this.#typeahead(address, event);
      return;
    }
    event.preventDefault();
    if (outcome.select) {
      // The column opens only once the host has rendered the new path.
      this.#pendingColumn = outcome.focusColumn ?? null;
      this.#select(outcome.select);
      this.settle();
    } else {
      // A move, or Enter on a disabled item, names no column: that finds nothing and does nothing.
      this.#focusFirst(outcome.focusColumn ?? null);
    }
    // The keymap only ever names an item the host listed.
    if (outcome.focus) this.#item(outcome.focus)!.element.focus();
  }

  /** The host has rendered: focus the column a step-in is waiting for, once it is there. */
  settle(): void {
    if (this.#focusFirst(this.#pendingColumn)) this.#pendingColumn = null;
  }

  /** Stop the typeahead timer, for a host leaving the page. */
  disconnect(): void {
    clearTimeout(this.#timer);
    this.#query = "";
  }

  #select({ depth, value }: MillerColumnsAddress): void {
    this.#host.select(millerColumnsSelect(this.#host.state().path, depth, value));
  }

  #item({ depth, value }: MillerColumnsAddress): MillerColumnsControllerItem | undefined {
    return this.#host.items().find((item) => item.depth === depth && item.value === value);
  }

  /**
   * Focus the first enabled item at `depth`; `false` until focus has landed —
   * the column may be listed before its host has shown it, and a hidden item
   * takes no focus.
   */
  #focusFirst(depth: number | null): boolean {
    const first = this.#host.items().find((item) => item.depth === depth && !item.disabled);
    if (!first) return false;
    first.element.focus();
    return first.element.matches(":focus");
  }

  #typeahead({ depth, value }: MillerColumnsAddress, event: KeyPress): void {
    const navigable = this.#host.items().filter((item) => item.depth === depth && !item.disabled);
    const match = listboxTypeahead({
      query: this.#query,
      key: event.key,
      // An element's text is never null; only a document's is.
      labels: navigable.map((item) => item.element.textContent as string),
      active: navigable.findIndex((item) => item.value === value),
    });
    if (!match) return;
    this.#query = match.query;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#query = "";
    }, LISTBOX_TYPEAHEAD_RESET_MS);
    if (match.focus === null) return;
    event.preventDefault();
    navigable[match.focus].element.focus();
  }
}

/**
 * What a {@link MillerColumnsResizeController} asks of whoever hosts a resize
 * handle: the column's width and bounds, and somewhere to put a new width.
 */
export type MillerColumnsResizeHost = {
  /** The column's width: the one it was resized to, else its rendered width. */
  width(): number;
  bounds(): { min: number; max: number; step: number };
  dir(): MillerColumnsReadingDirection;
  setWidth(width: number): void;
  /** A pointer drag has started or ended. */
  dragging(active: boolean): void;
};

/**
 * A WAI-ARIA window splitter over one column's width: arrow keys, Home and End
 * from its keymap, and a pointer drag tracked on `window` so the pointer can
 * travel anywhere once it is down. The drag's listeners live only for the
 * drag.
 */
export class MillerColumnsResizeController {
  readonly #host: MillerColumnsResizeHost;
  #drag: AbortController | null = null;

  constructor(host: MillerColumnsResizeHost) {
    this.#host = host;
  }

  keydown(event: KeyPress): void {
    const next = millerColumnsResizeKeydown(
      { width: this.#host.width(), ...this.#host.bounds(), dir: this.#host.dir() },
      event.key,
    );
    if (next === null) return;
    event.preventDefault();
    this.#host.setWidth(next);
  }

  pointerdown({ clientX: startX }: { clientX: number }): void {
    this.#drag?.abort();
    const drag = new AbortController();
    this.#drag = drag;
    const startWidth = this.#host.width();
    const end = (): void => this.disconnect();
    window.addEventListener(
      "pointermove",
      ({ clientX: x }) => this.#host.setWidth(millerColumnsResizeDrag({ startWidth, startX, x, ...this.#host.bounds() })),
      { signal: drag.signal },
    );
    // Stryker disable ObjectLiteral: equivalent — an end listener left behind by a finished drag finds no drag to end, or ends the next one on its own release, which that drag's listener does too.
    window.addEventListener("pointerup", end, { signal: drag.signal });
    window.addEventListener("pointercancel", end, { signal: drag.signal });
    // Stryker restore ObjectLiteral
    this.#host.dragging(true);
  }

  /** End any drag in progress. */
  disconnect(): void {
    if (!this.#drag) return;
    this.#drag.abort();
    this.#drag = null;
    this.#host.dragging(false);
  }
}
