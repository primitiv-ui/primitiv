import {
  treeKeydown,
  treeSelect,
  treeTabStop,
  treeToggle,
  treeVisibleOrder,
  type TreeNode,
  type TreeSelectionMode,
  type TreeSelectModifiers,
} from "@primitiv-ui/core";

/**
 * What a {@link TreeController} asks of whoever hosts it. The controller owns
 * behaviour and never owns state (RFC 0033 D28): the custom elements keep the
 * selection and expansion in reflected attributes, the React adapter keeps them
 * in React, and each answers these calls from wherever it keeps them.
 */
export type TreeControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    mode: TreeSelectionMode;
    /** The selected values, in the order they were selected. */
    selected: readonly string[];
    /** The expanded branches. */
    expanded: readonly string[];
  };
  /** Every node, siblings in document order. */
  nodes(): readonly TreeNode[];
  /** The focusable treeitem for `value`. */
  element(value: string): HTMLElement | null | undefined;
  /** Apply a selection the user asked for. */
  select(selected: string[]): void;
  /** Apply an expansion the user asked for. */
  expand(expanded: string[]): void;
};

/**
 * The behaviour of a WAI-ARIA tree view: selection from clicks and keys
 * (single, or multiple with Shift ranges and Ctrl / Meta toggles), branches
 * expanded and collapsed, and focus moved over the visible items. Its host
 * wires each treeitem's and branch row's own events to the intents below, so
 * the React adapter keeps composing them with its consumers' handlers; the
 * controller owns the anchor a Shift range pins to.
 */
export class TreeController {
  readonly #host: TreeControllerHost;
  /** The value a Shift range pins to: the last one selected without Shift. */
  #anchor: string | null = null;

  constructor(host: TreeControllerHost) {
    this.#host = host;
  }

  /** The values a keyboard user can reach, in order. */
  order(): string[] {
    return treeVisibleOrder(this.#host.nodes(), this.#host.state().expanded);
  }

  /** The one item in the Tab order, given the item focus was last on. */
  tabStop(active: string | null): string | null {
    return treeTabStop({ order: this.order(), disabled: this.#disabled(), active });
  }

  /** A click on the item `value`, which selects it. */
  click(value: string, modifiers: TreeSelectModifiers = {}): void {
    if (this.#disabled().has(value)) return;
    this.#apply(this.#decide(value, modifiers));
  }

  /**
   * A click on the branch `value`'s row, which toggles it and selects it — a
   * Shift range spanning the order as it was before the toggle.
   */
  toggleClick(value: string, modifiers: TreeSelectModifiers = {}): void {
    if (this.#disabled().has(value)) return;
    const decision = this.#decide(value, modifiers);
    this.#host.expand(treeToggle(this.#host.state().expanded, value));
    this.#apply(decision);
  }

  /** A key press on the treeitem `value`. */
  keydown(value: string, event: KeyboardEvent): void {
    const { expanded } = this.#host.state();
    const nodes = this.#host.nodes();
    const outcome = treeKeydown(
      {
        order: treeVisibleOrder(nodes, expanded),
        expanded,
        disabled: this.#disabled(nodes),
        nodeOf: (candidate) => nodes.find((node) => node.value === candidate),
      },
      value,
      event.key,
    );
    if (!outcome) return;
    event.preventDefault();
    if (outcome.toggle !== undefined) this.#host.expand(treeToggle(expanded, outcome.toggle));
    if (outcome.select !== undefined) this.#apply(this.#decide(outcome.select));
    if (outcome.focus !== undefined) this.#host.element(outcome.focus)?.focus();
  }

  #decide(value: string, modifiers?: TreeSelectModifiers): ReturnType<typeof treeSelect> {
    const { mode, selected } = this.#host.state();
    return treeSelect(
      { mode, selected, anchor: this.#anchor, order: this.order(), disabled: this.#disabled() },
      value,
      modifiers,
    );
  }

  #apply(decision: ReturnType<typeof treeSelect>): void {
    if (!decision) return;
    this.#anchor = decision.anchor;
    this.#host.select(decision.selected);
  }

  #disabled(nodes: readonly TreeNode[] = this.#host.nodes()): Set<string> {
    return new Set(nodes.filter((node) => node.disabled).map((node) => node.value));
  }
}
