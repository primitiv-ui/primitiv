import { millerColumnsColumnDepths, type MillerColumnsAddress, type MillerColumnsReadingDirection } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import {
  MillerColumnsController,
  MillerColumnsResizeController,
  type MillerColumnsControllerHost,
  type MillerColumnsControllerItem,
} from "./MillerColumnsController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineMillerColumns registry test instead.
const ROOT = "primitiv-miller-columns";
const TREE = "primitiv-miller-columns-tree";
const COLUMN = "primitiv-miller-columns-column";
const ITEM = "primitiv-miller-columns-item";
const INDICATOR = "primitiv-miller-columns-item-indicator";
const HANDLE = "primitiv-miller-columns-resize-handle";
const PREVIEW = "primitiv-miller-columns-preview-panel";
// Stryker restore StringLiteral

/** The values of a space-separated attribute. */
const list = (value: string): string[] => value.split(" ").filter(Boolean);

/** A column in the strip, at its depth, with its own items. */
type Column = { element: HTMLElement; depth: number; items: MillerColumnsControllerItem[] };

/**
 * `<primitiv-miller-columns>` — the strip of a Miller Columns view, and the
 * state owner: a row of vertical lists where selecting a branch reveals its
 * children in the next column.
 *
 * **Columns are written as siblings, not nested.** Each column after the first
 * names the item it lists the children of with `parent`; the root shows the
 * root column (the one without a `parent`) and, for each value on the path,
 * the column naming it, and sets `hidden` on every other. An item is a branch
 * while some column names it. So a server can render the whole tree, or only
 * the open columns, or send a column when its branch is selected
 * (`primitiv-miller-columns-show`), and the root never moves a node it did not
 * write.
 *
 * **To load a branch lazily, render its column empty.** An item is a branch only
 * while a column names it, so a branch whose children are fetched later still
 * needs `<primitiv-miller-columns-column parent="…"></primitiv-miller-columns-column>`
 * in the markup up front; without it the item reads as a leaf and never opens.
 * Listen for `primitiv-miller-columns-show` on the strip, and when it comes from
 * an empty column, fetch and append its items.
 *
 * The strip scrolls to its inline end when a column opens (not on first
 * render). Resize handles keep each depth's width, so a column opened at a
 * resized depth takes that width, as React's do.
 *
 * @customElement primitiv-miller-columns
 * @summary The strip and state owner of a Miller Columns view.
 * @attr {string} value - The active path: the selected item's value in each column, from the root, space-separated. Reflected: it moves as the user selects, so a server re-render or a history snapshot sees the live path.
 * @fires {CustomEvent<{ value: string[] }>} primitiv-miller-columns-change - Bubbles, cancelable, fired before a user's selection applies, with the path afterwards. Call `preventDefault()` to keep the current path.
 */
export class PrimitivMillerColumnsElement extends PrimitivRootElement {
  /** The item focus was last on, which holds the tab stop. */
  #active: MillerColumnsAddress | null = null;
  readonly #controller: MillerColumnsController = new MillerColumnsController(this.#host());
  readonly #resizers = new WeakMap<HTMLElement, MillerColumnsResizeController>();
  /** Each depth's resized width, applied to whichever column is open there. */
  readonly #widths = new Map<number, number>();
  /** The columns open at the last reconcile, so a newly opened one is announced. */
  #open = new Set<HTMLElement>();
  #rendered = false;
  #listening: AbortController | null = null;
  #observer: ResizeObserver | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => {
      // A root disconnects only after it connected, so it is listening.
      (this.#listening as AbortController).abort();
      this.#listening = null;
      this.#observer?.disconnect();
      this.#observer = null;
      this.#controller.disconnect();
      // A drag tracks the pointer on window, so it would outlive the strip.
      for (const handle of this.parts(HANDLE)) this.#resizers.get(handle)?.disconnect();
    },
  };
  protected readonly reconcileOn: readonly string[] = [
    "value",
    "parent",
    "disabled",
    "force-mount",
    "min-width",
    "max-width",
  ];

  /** The active path, space-separated, reflected as the `value` attribute. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** The controller's view of this element: state lives in the reflected path. */
  #host(): MillerColumnsControllerHost {
    return {
      state: () => ({ path: list(this.value), dir: this.direction() }),
      items: () => this.#columns().flatMap((column) => column.items),
      select: (path) => {
        if (this.announce("primitiv-miller-columns-change", { value: path })) this.value = path.join(" ");
      },
    };
  }

  /** Every open column, in document order, each with its items. */
  #columns(): Column[] {
    const elements = this.parts(COLUMN);
    const parents = elements.map((column) => column.getAttribute("parent"));
    const depths = millerColumnsColumnDepths(parents, list(this.value));
    return elements
      .flatMap((element, index) => {
        const depth = depths[index];
        return depth === null ? [] : [{ element, depth }];
      })
      .map(({ element, depth }) => ({
        element,
        depth,
        items: this.#items(element).map((item) => ({
          element: item,
          depth,
          value: item.getAttribute("value") as string,
          disabled: item.hasAttribute("disabled"),
          hasChildren: parents.includes(item.getAttribute("value")),
        })),
      }));
  }

  /** A column's own items with a value, reporting any without one. */
  #items(column: HTMLElement): HTMLElement[] {
    return this.parts(ITEM).filter((item) => {
      if (item.closest(COLUMN) !== column) return false;
      if (item.hasAttribute("value")) return true;
      reportOnce(item, `<${ITEM}> needs a value.`);
      return false;
    });
  }

  #connect(): void {
    this.#listening = new AbortController();
    const options = { signal: this.#listening.signal };
    this.addEventListener("click", (event) => this.#click(event), options);
    this.addEventListener("keydown", (event) => this.#keydown(event), options);
    this.addEventListener("focusin", (event) => this.#focusin(event), options);
    this.addEventListener("pointerdown", (event) => this.#pointerdown(event), options);
    // Where there is no ResizeObserver, a handle's value follows its own resizes only.
    if (typeof ResizeObserver === "function") this.#observer = new ResizeObserver(() => this.reconcile());
  }

  /** The open item an event happened in, as an address. */
  #address(event: Event): MillerColumnsAddress | null {
    const element = (event.target as Element).closest<HTMLElement>(ITEM);
    for (const column of this.#columns()) {
      const item = column.items.find((candidate) => candidate.element === element);
      if (item) return { depth: item.depth, value: item.value };
    }
    return null;
  }

  /** The handle an event happened on, if it sits in one of this strip's open columns. */
  #handle(event: Event): HTMLElement | null {
    const handle = (event.target as Element).closest<HTMLElement>(HANDLE);
    // Stryker disable next-line ConditionalExpression: equivalent — a handle outside this strip's open columns has no depth here, so a width set through it lands under no depth a column reads.
    return handle && this.#depthOf(handle) !== undefined ? handle : null;
  }

  /** The depth of the open column a handle sits in; `undefined` when it is in none of this strip's. */
  #depthOf(handle: HTMLElement): number | undefined {
    return this.#columns().find((open) => open.element === handle.closest(COLUMN))?.depth;
  }

  #click(event: MouseEvent): void {
    const address = this.#address(event);
    if (address) this.#controller.click(address);
  }

  #keydown(event: KeyboardEvent): void {
    const handle = this.#handle(event);
    if (handle) {
      this.#resizer(handle).keydown(event);
      return;
    }
    const address = this.#address(event);
    if (address) this.#controller.keydown(address, event);
  }

  #pointerdown(event: PointerEvent): void {
    const handle = this.#handle(event);
    if (handle) this.#resizer(handle).pointerdown(event);
  }

  #focusin(event: FocusEvent): void {
    const address = this.#address(event);
    if (!address) return;
    this.#active = address;
    this.reconcile();
  }

  /** The width of the column a handle resizes: the one its depth was resized to, else its rendered width. */
  #width(handle: HTMLElement): number {
    const column = handle.closest<HTMLElement>(COLUMN);
    // Only a handle in an open column is ever measured, so its depth is known.
    return this.#widths.get(this.#depthOf(handle) as number) ?? (column as HTMLElement).getBoundingClientRect().width;
  }

  #bounds(handle: HTMLElement): { min: number; max: number; step: number } {
    const number = (name: string, fallback: number) => {
      // A missing attribute reads as "null", which is not a number either.
      const value = Number.parseFloat(String(handle.getAttribute(name)));
      return Number.isNaN(value) ? fallback : value;
    };
    return { min: number("min-width", 0), max: number("max-width", Number.POSITIVE_INFINITY), step: number("step", 10) };
  }

  #resizer(handle: HTMLElement): MillerColumnsResizeController {
    let resizer = this.#resizers.get(handle);
    if (!resizer) {
      resizer = new MillerColumnsResizeController({
        width: () => this.#width(handle),
        bounds: () => this.#bounds(handle),
        dir: (): MillerColumnsReadingDirection => this.direction(),
        setWidth: (width) => {
          this.#widths.set(this.#depthOf(handle) as number, width);
          this.reconcile();
        },
        dragging: (active) => write(handle, "data-dragging", active ? "" : null),
      });
      this.#resizers.set(handle, resizer);
    }
    return resizer;
  }

  protected reconcile(): void {
    const path = list(this.value);
    write(this, "data-miller-columns-strip", "");
    write(this, "data-orientation", "horizontal");
    for (const tree of this.parts(TREE)) {
      write(tree, "role", "tree");
      write(tree, "data-miller-columns-tree", "");
    }

    const columns = this.#columns();
    const open = new Set(columns.map((column) => column.element));
    const items = columns.flatMap((column) => column.items);
    const stop = this.#controller.tabStop(this.#active);

    for (const element of this.parts(COLUMN)) {
      write(element, "role", "group");
      write(element, "data-miller-columns-column", "");
      write(element, "hidden", open.has(element) ? null : "");
    }

    for (const { element, depth, items: own } of columns) {
      write(element, "data-depth", String(depth));
      write(element, "data-empty", own.length ? null : "");
      // A column's depth follows from its parent, so it never changes, and a
      // depth's width is never forgotten: nothing here ever takes a width away.
      const width = this.#widths.get(depth);
      // Stryker disable next-line ConditionalExpression: equivalent — "undefinedpx" is not a width, and the style declaration ignores it.
      if (width !== undefined) element.style.width = `${width}px`;
      if (this.#rendered && !this.#open.has(element)) {
        element.dispatchEvent(new CustomEvent("primitiv-miller-columns-show", { bubbles: true }));
      }
    }

    for (const { element, depth, value, disabled, hasChildren } of items) {
      const selected = path[depth] === value;
      write(element, "role", "treeitem");
      write(element, "tabindex", stop && stop.depth === depth && stop.value === value ? "0" : "-1");
      write(element, "aria-selected", String(selected));
      write(element, "aria-level", String(depth + 1));
      write(element, "aria-expanded", hasChildren ? String(selected) : null);
      write(element, "data-state", selected ? "selected" : "unselected");
      write(element, "data-terminal", selected && depth === path.length - 1 ? "" : null);
      write(element, "data-depth", String(depth));
      write(element, "data-has-children", hasChildren ? "" : null);
      write(element, "aria-disabled", disabled ? "true" : null);
      write(element, "data-disabled", disabled ? "" : null);
    }

    for (const indicator of this.parts(INDICATOR)) {
      const item = items.find((candidate) => candidate.element === indicator.closest(ITEM));
      write(indicator, "aria-hidden", "true");
      write(indicator, "hidden", item?.hasChildren ? null : "");
      write(indicator, "data-has-children", item?.hasChildren ? "" : null);
      write(indicator, "data-state", item && path[item.depth] === item.value ? "selected" : "unselected");
    }

    for (const handle of this.parts(HANDLE)) {
      const { min, max } = this.#bounds(handle);
      write(handle, "role", "separator");
      write(handle, "aria-orientation", "vertical");
      write(handle, "tabindex", "0");
      write(handle, "data-miller-columns-resize-handle", "");
      write(handle, "aria-valuenow", String(Math.round(this.#width(handle))));
      write(handle, "aria-valuemin", String(min));
      write(handle, "aria-valuemax", Number.isFinite(max) ? String(max) : null);
      this.#observer?.observe(handle.closest(COLUMN) as HTMLElement);
    }

    // Finder puts the preview after the selected item, so it shows only while
    // that item has no column of its own to put there instead.
    // Stryker disable next-line ConditionalExpression: equivalent — an item is a branch by its value (a column names it), so every item sharing the terminal's value answers `hasChildren` alike, whatever its depth.
    const terminal = items.find((item) => item.depth === path.length - 1 && item.value === path[path.length - 1]);
    for (const preview of this.parts(PREVIEW)) {
      write(preview, "data-miller-columns-preview", "");
      write(preview, "data-empty", path.length ? null : "");
      write(preview, "hidden", preview.hasAttribute("force-mount") || terminal?.hasChildren === false ? null : "");
    }

    // A column opening scrolls the strip to its inline end; the first render
    // and a column closing do not.
    if (this.#rendered && columns.length > this.#open.size) this.scrollTo({ left: this.scrollWidth, behavior: "smooth" });
    this.#open = open;
    this.#rendered = true;
    this.#controller.settle();
  }
}

/**
 * `<primitiv-miller-columns-tree>` — the `role="tree"` widget inside the strip,
 * holding only the columns. Structural: the root writes its role. Name it with
 * `aria-label` or `aria-labelledby`. A tree may own only items and groups, so
 * the preview panel sits beside it, not in it.
 *
 * @customElement primitiv-miller-columns-tree
 */
export class PrimitivMillerColumnsTreeElement extends ElementBase {}

/**
 * `<primitiv-miller-columns-column>` — one column, a `role="group"` of items.
 * Structural: the root writes its ARIA and `hidden` while it is off the path.
 *
 * @customElement primitiv-miller-columns-column
 * @attr {string} parent - The value of the item whose children this column lists. Leave it off the root column.
 * @fires {CustomEvent} primitiv-miller-columns-show - Bubbles from the column as it opens (not on first render), so a lazy column can fetch its items.
 */
export class PrimitivMillerColumnsColumnElement extends ElementBase {}

/**
 * `<primitiv-miller-columns-item>` — one item, a `role="treeitem"`: a branch
 * while some column names it as `parent`, a leaf otherwise. Structural: the
 * root writes its ARIA. Its text is what typeahead matches.
 *
 * @customElement primitiv-miller-columns-item
 * @attr {string} value - The item's value, unique among its column's items; the path holds it and a child column names it.
 * @attr {boolean} disabled - Keeps the item focusable for discovery, but never selectable.
 */
export class PrimitivMillerColumnsItemElement extends ElementBase {}

/**
 * `<primitiv-miller-columns-item-indicator>` — a decorative `aria-hidden` glyph
 * in an item, shown only while that item is a branch.
 *
 * @customElement primitiv-miller-columns-item-indicator
 */
export class PrimitivMillerColumnsItemIndicatorElement extends ElementBase {}

/**
 * `<primitiv-miller-columns-resize-handle>` — a focusable WAI-ARIA window
 * splitter in a column: drag it, or press the arrows, Home or End, to set the
 * width of the column at its depth. Give it an accessible name.
 *
 * @customElement primitiv-miller-columns-resize-handle
 * @attr {number} min-width - The narrowest width, published as `aria-valuemin`. Defaults to `0`.
 * @attr {number} max-width - The widest width, published as `aria-valuemax`. Unbounded by default.
 * @attr {number} step - Pixels per arrow press. Defaults to `10`.
 */
export class PrimitivMillerColumnsResizeHandleElement extends ElementBase {}

/**
 * `<primitiv-miller-columns-preview-panel>` — the trailing preview pane, beside
 * the tree. It shows only while the deepest selected item is a leaf; what it
 * shows is yours, from `primitiv-miller-columns-change`.
 *
 * @customElement primitiv-miller-columns-preview-panel
 * @attr {boolean} force-mount - Keep the panel shown whatever is selected; `data-empty` marks it while nothing is.
 */
export class PrimitivMillerColumnsPreviewPanelElement extends ElementBase {}

/**
 * Define the seven Miller Columns elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineMillerColumns(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivMillerColumnsElement],
    [TREE, PrimitivMillerColumnsTreeElement],
    [COLUMN, PrimitivMillerColumnsColumnElement],
    [ITEM, PrimitivMillerColumnsItemElement],
    [INDICATOR, PrimitivMillerColumnsItemIndicatorElement],
    [HANDLE, PrimitivMillerColumnsResizeHandleElement],
    [PREVIEW, PrimitivMillerColumnsPreviewPanelElement],
  ]);
}
