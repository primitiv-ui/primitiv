import { deriveId, treePath, type TreeNode, type TreeSelectModifiers } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { TreeController, type TreeControllerHost } from "./TreeController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineTree registry test instead.
const ROOT = "primitiv-tree";
const ITEM = "primitiv-tree-item";
const BRANCH = "primitiv-tree-branch";
const CONTROL = "primitiv-tree-branch-control";
const CONTENT = "primitiv-tree-branch-content";
const INDICATOR = "primitiv-tree-branch-indicator";
const PATH = "primitiv-tree-selection-path";
const NODE = `${ITEM}, ${BRANCH}`;
// Stryker restore StringLiteral

/** A space-separated attribute as a list. */
// Stryker disable next-line ArrowFunction: static — created once at import, so runtime mutant switching never reaches it; every selection and expansion test pins it.
const list = (value: string): string[] => value.split(" ").filter(Boolean);

/** A node as the root reads it from the DOM: the element, its depth and its label. */
type Part = TreeNode & { element: HTMLElement; depth: number; label: string };

/** One crumb of a selection path. */
type Segment = Pick<Part, "value" | "label" | "disabled">;

/** React's headless `Breadcrumb.Root`: a `<nav>` named "Breadcrumb". */
function breadcrumb(): HTMLElement {
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Breadcrumb");
  return nav;
}

/**
 * The trails for `paths`, one `<nav>` each: clones of the `<template>` the
 * consumer wrote, or React's headless Breadcrumb markup without one.
 */
function trails(paths: readonly Segment[][], template: HTMLTemplateElement | null): string {
  const holder = document.createElement("div");
  for (const path of paths) {
    const nav = (template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined) ?? breadcrumb();
    const ol = nav.querySelector("ol") ?? nav.appendChild(document.createElement("ol"));
    const crumb = ol.querySelector("li:has([data-tree-selection-segment]:not([aria-current]))");
    const page = ol.querySelector("li:has([aria-current])");
    const separator = ol.querySelector('li[role="presentation"]');
    ol.replaceChildren();
    path.forEach((segment, index) => {
      const last = index === path.length - 1;
      const li = ((last ? page : crumb)?.cloneNode(true) as HTMLElement | undefined) ?? document.createElement("li");
      const span =
        li.querySelector<HTMLElement>("[data-tree-selection-segment]") ?? li.appendChild(document.createElement("span"));
      span.setAttribute("data-tree-selection-segment", "");
      span.setAttribute("data-value", segment.value);
      span.toggleAttribute("data-disabled", segment.disabled);
      if (last) span.setAttribute("aria-current", "page");
      span.textContent = segment.label;
      ol.append(li);
      if (last) return;
      const gap = (separator?.cloneNode(true) as HTMLElement | undefined) ?? document.createElement("li");
      if (!separator) {
        gap.setAttribute("role", "presentation");
        gap.setAttribute("aria-hidden", "true");
        gap.textContent = "/";
      }
      ol.append(gap);
    });
    holder.append(nav);
  }
  return holder.innerHTML;
}

/**
 * `<primitiv-tree>` — the state owner of a WAI-ARIA tree view: nested items and
 * branches, one roving tab stop, branches expanded and collapsed, and single or
 * multiple selection.
 *
 * The root finds its own parts, so a tree nested inside another keeps its own,
 * and reconciles them from its reflected attributes whenever a part arrives,
 * leaves, or changes an attribute it reads (the lifecycle is
 * `PrimitivRootElement`'s). Each item and branch gets its `aria-level`,
 * `data-depth` and the `--primitiv-tree-depth` custom property a stylesheet
 * indents by, from where it sits.
 *
 * @customElement primitiv-tree
 * @summary The state owner of a WAI-ARIA tree view.
 * @attr {string} value - The selected values, space-separated, in the order they were selected. Reflected: it changes as the user selects, so a server re-render or a history snapshot sees the live selection.
 * @attr {string} expanded - The expanded branches' values, space-separated. Reflected, like `value`.
 * @attr {"single" | "multiple"} selection-mode - `multiple` allows several values: Ctrl or Meta toggles one, Shift selects a range. Defaults to `single`.
 * @fires {CustomEvent<{ value: string[] }>} primitiv-tree-change - Bubbles, cancelable, fired before a user's selection applies, with the selection afterwards. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<{ expanded: string[] }>} primitiv-tree-expanded-change - Bubbles, cancelable, fired before a user expands or collapses a branch, with the expanded branches afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivTreeElement extends PrimitivRootElement {
  /** The item focus was last on, which holds the tab stop while it is visible. */
  #active: string | null = null;
  readonly #tree: TreeController = new TreeController(this.#host());
  /** The root's own listeners, while connected. */
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => {
      // A root disconnects only after it connected, so it is listening.
      (this.#listening as AbortController).abort();
      this.#listening = null;
    },
  };
  protected readonly reconcileOn: readonly string[] = [
    "value",
    "expanded",
    "selection-mode",
    "disabled",
    "label",
    "force-mount",
  ];

  /** The selected values, space-separated, reflected as the `value` attribute. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** The expanded branches' values, space-separated, reflected as the `expanded` attribute. */
  get expanded(): string {
    return this.getAttribute("expanded") ?? "";
  }

  set expanded(next: string) {
    this.setAttribute("expanded", next);
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): TreeControllerHost {
    return {
      state: () => ({
        mode: this.getAttribute("selection-mode") === "multiple" ? "multiple" : "single",
        selected: list(this.value),
        expanded: list(this.expanded),
      }),
      nodes: () => this.#parts(),
      // The controller only asks for a value it just read from these same parts.
      element: (value) => this.#parts().find((part) => part.value === value)!.element,
      select: (value) => {
        if (this.announce("primitiv-tree-change", { value })) this.value = value.join(" ");
      },
      expand: (expanded) => {
        if (this.announce("primitiv-tree-expanded-change", { expanded })) this.expanded = expanded.join(" ");
      },
    };
  }

  /** The branch `element` sits in, if it is this tree's. */
  #owner(element: Element): HTMLElement | null {
    // Every node and branch sits inside the root, so it always has a parent.
    const branch = (element.parentElement as HTMLElement).closest<HTMLElement>(BRANCH);
    return branch && this.#mine(branch) ? branch : null;
  }

  #mine(element: Element): boolean {
    return element.closest(ROOT) === this;
  }

  /** Every item and branch with a value, in document order. */
  #parts(): Part[] {
    return this.parts(NODE).flatMap((element) => {
      const value = element.getAttribute("value");
      if (value === null) {
        reportOnce(element, `<${element.localName}> needs a value.`);
        return [];
      }
      let depth = 0;
      for (let owner = this.#owner(element); owner; owner = this.#owner(owner)) depth++;
      return [
        {
          value,
          parent: this.#owner(element)?.getAttribute("value") ?? null,
          isBranch: element.localName === BRANCH,
          disabled: element.hasAttribute("disabled"),
          element,
          depth,
          label: element.getAttribute("label") ?? value,
        },
      ];
    });
  }

  #connect(): void {
    this.#listening = new AbortController();
    const options = { signal: this.#listening.signal };
    this.addEventListener("click", (event) => this.#click(event), options);
    this.addEventListener("keydown", (event) => this.#keydown(event), options);
    this.addEventListener("focusin", (event) => this.#focusin(event), options);
  }

  /** The item or branch an event happened in, if it is this tree's. */
  #node(event: Event): HTMLElement | null {
    const node = (event.target as Element).closest<HTMLElement>(NODE);
    return node && this.#mine(node) ? node : null;
  }

  #click(event: MouseEvent): void {
    const modifiers: TreeSelectModifiers = { shift: event.shiftKey, ctrl: event.ctrlKey, meta: event.metaKey };
    const control = (event.target as Element).closest(CONTROL);
    const node = this.#node(event);
    const value = node?.getAttribute("value");
    if (value == null) return;
    if ((node as HTMLElement).localName === ITEM) this.#tree.click(value, modifiers);
    else if (control && control.parentElement === node) this.#tree.toggleClick(value, modifiers);
  }

  #keydown(event: KeyboardEvent): void {
    const value = this.#node(event)?.getAttribute("value");
    if (value != null) this.#tree.keydown(value, event);
  }

  #focusin(event: FocusEvent): void {
    const value = this.#node(event)?.getAttribute("value");
    if (value == null) return;
    this.#active = value;
    this.reconcile();
  }

  protected reconcile(): void {
    const { mode, selected, expanded } = this.#host().state();
    const rootId = this.rootId();
    write(this, "role", "tree");
    write(this, "aria-multiselectable", mode === "multiple" ? "true" : null);
    write(this, "data-selection-mode", mode);

    const parts = this.#parts();
    const stop = this.#tree.tabStop(this.#active);
    for (const { element, value, depth, isBranch, disabled } of parts) {
      const chosen = selected.includes(value);
      write(element, "role", "treeitem");
      write(element, "aria-level", String(depth + 1));
      write(element, "aria-selected", String(chosen));
      write(element, "aria-disabled", disabled ? "true" : null);
      write(element, "data-depth", String(depth));
      write(element, isBranch ? "data-branch" : "data-leaf", "");
      write(element, "data-selected", chosen ? "" : null);
      write(element, "data-disabled", disabled ? "" : null);
      write(element, "tabindex", value === stop ? "0" : "-1");
      if (element.style.getPropertyValue("--primitiv-tree-depth") !== String(depth)) {
        element.style.setProperty("--primitiv-tree-depth", String(depth));
      }
      if (isBranch) this.#branch(element, value, depth, expanded.includes(value), rootId);
    }

    const byValue = new Map(parts.map((part) => [part.value, part]));
    const paths = selected.map((value) => treePath((candidate) => byValue.get(candidate), value));
    for (const pathPart of this.parts(PATH)) {
      write(pathPart, "data-tree-selection-path", "");
      write(pathPart, "data-empty", paths.length ? null : "");
      const template = pathPart.querySelector<HTMLTemplateElement>(":scope > template");
      const rendered = [...pathPart.children].filter((child) => child !== template);
      const html = trails(paths, template);
      if (rendered.map((child) => child.outerHTML).join("") === html) continue;
      for (const child of rendered) child.remove();
      pathPart.insertAdjacentHTML("beforeend", html);
    }
  }

  /** Decorate the branch `element`'s row, group and indicators. */
  #branch(element: HTMLElement, value: string, depth: number, open: boolean, rootId: string): void {
    const state = open ? "open" : "closed";
    const control = element.querySelector<HTMLElement>(`:scope > ${CONTROL}`);
    const content = element.querySelector<HTMLElement>(`:scope > ${CONTENT}`);
    write(element, "aria-expanded", String(open));
    write(element, "data-state", state);
    if (control) {
      if (!control.id) control.id = deriveId(rootId, "branch-control", value);
      write(element, "aria-labelledby", control.id);
    } else {
      reportOnce(element, `<${BRANCH}> needs a <${CONTROL}> child, its row.`);
    }
    if (content) {
      const forced = content.hasAttribute("force-mount");
      write(content, "role", "group");
      write(content, "data-depth", String(depth + 1));
      write(content, "data-state", state);
      write(content, "hidden", open || forced ? null : "");
      // Also while merely `hidden`: a stylesheet that animates the group gives it
      // a `display` that beats `hidden`, which would leave it in the a11y tree.
      write(content, "aria-hidden", open ? null : "true");
    }
    for (const indicator of element.querySelectorAll<HTMLElement>(INDICATOR)) {
      if (indicator.closest(BRANCH) !== element) continue;
      write(indicator, "aria-hidden", "true");
      write(indicator, "data-state", state);
    }
  }
}

/**
 * `<primitiv-tree-item>` — a leaf. Structural: it *is* the treeitem, focusable
 * with the roving tab stop, and a click selects it.
 *
 * @customElement primitiv-tree-item
 * @attr {string} value - The item's value, unique in the tree.
 * @attr {string} label - The name a selection path shows for it. Defaults to its `value`.
 * @attr {boolean} disabled - Marks it disabled: it is skipped by the arrow keys and never selected.
 */
export class PrimitivTreeItemElement extends ElementBase {}

/**
 * `<primitiv-tree-branch>` — a node with children. Structural: it *is* the
 * treeitem, named by its row, and holds a `<primitiv-tree-branch-control>`
 * (the row) and a `<primitiv-tree-branch-content>` (the children) as direct
 * children.
 *
 * @customElement primitiv-tree-branch
 * @attr {string} value - The branch's value, unique in the tree.
 * @attr {string} label - The name a selection path shows for it. Defaults to its `value`.
 * @attr {boolean} disabled - Marks it disabled: it is skipped by the arrow keys, never selected and never toggled.
 */
export class PrimitivTreeBranchElement extends ElementBase {}

/**
 * `<primitiv-tree-branch-control>` — a branch's row. A click on it toggles the
 * branch and selects it; it gets an id the branch is labelled by.
 *
 * The two are separate events, so each can be vetoed alone. A page outline
 * whose branches are section headings, never selected, cancels
 * `primitiv-tree-change` when its value names a branch; the branch still
 * toggles, because `primitiv-tree-expanded-change` is not cancelled.
 *
 * @customElement primitiv-tree-branch-control
 */
export class PrimitivTreeBranchControlElement extends ElementBase {}

/**
 * `<primitiv-tree-branch-content>` — a branch's children. Structural: the root
 * gives it `role="group"`, `data-depth`, `data-state`, and `hidden` and
 * `aria-hidden` while its branch is collapsed (write `hidden` in your markup too, so it is hidden
 * before the script loads).
 *
 * @customElement primitiv-tree-branch-content
 * @attr {boolean} force-mount - Keep it rendered while collapsed (`aria-hidden` rather than `hidden`), so a stylesheet can animate it.
 */
export class PrimitivTreeBranchContentElement extends ElementBase {}

/**
 * `<primitiv-tree-branch-indicator>` — the glyph that shows whether its branch
 * is open. Structural: the root gives it `aria-hidden` and `data-state`.
 *
 * @customElement primitiv-tree-branch-indicator
 */
export class PrimitivTreeBranchIndicatorElement extends ElementBase {}

/**
 * `<primitiv-tree-selection-path>` — the selected items' ancestry, one
 * breadcrumb trail per selected item, rebuilt as the selection changes. It
 * renders React's headless Breadcrumb markup — a `<nav>` of an `<ol>` whose
 * crumbs carry `data-tree-selection-segment`, the last `aria-current="page"` —
 * or, given a `<template>` child holding one `<nav>` with a crumb, a current
 * crumb and a `role="presentation"` separator, clones of yours. It carries
 * `data-empty` while nothing is selected.
 *
 * It must be a descendant of its `<primitiv-tree>`, which is what finds it. To
 * show the path somewhere else on the page, listen for `primitiv-tree-change`
 * and render a Breadcrumb from its `value` yourself.
 *
 * @customElement primitiv-tree-selection-path
 */
export class PrimitivTreeSelectionPathElement extends ElementBase {}

/**
 * Define the seven Tree elements on `registry` (the global `customElements` by
 * default). Safe to call more than once, and a no-op where there is no registry
 * (a server render).
 */
export function defineTree(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivTreeElement],
    [ITEM, PrimitivTreeItemElement],
    [BRANCH, PrimitivTreeBranchElement],
    [CONTROL, PrimitivTreeBranchControlElement],
    [CONTENT, PrimitivTreeBranchContentElement],
    [INDICATOR, PrimitivTreeBranchIndicatorElement],
    [PATH, PrimitivTreeSelectionPathElement],
  ]);
}
