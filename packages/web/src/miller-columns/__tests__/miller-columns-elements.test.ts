import "./jsdom";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { defineMillerColumns, type ElementRegistry } from "../elements";
import { scrollTo } from "./jsdom";
import { millerColumnsHtml, type MillerColumnsHtml } from "./miller-columns.fixtures";

// jsdom reports an exception thrown in an event listener on window rather than
// failing the test, so every test here asserts none was.
const thrown: unknown[] = [];
const onError = (event: ErrorEvent) => thrown.push(event.error);
beforeEach(() => {
  thrown.length = 0;
  window.addEventListener("error", onError);
});

afterEach(() => {
  window.removeEventListener("error", onError);
  expect(thrown).toEqual([]);
  document.body.replaceChildren();
  vi.restoreAllMocks();
  scrollTo.mockClear();
  vi.unstubAllGlobals();
});

/** Let the root's MutationObserver deliver, and anything it triggers. */
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

async function mount(html: string | MillerColumnsHtml = {}) {
  defineMillerColumns();
  document.body.innerHTML = typeof html === "string" ? html : millerColumnsHtml(html);
  await settle();
}

const root = () => document.querySelector<HTMLElement & { value: string }>("primitiv-miller-columns")!;
const item = (name: string) => screen.getByRole("treeitem", { name });
const column = (parent: string | null) =>
  document.querySelector<HTMLElement>(
    parent ? `primitiv-miller-columns-column[parent="${parent}"]` : "primitiv-miller-columns-column:not([parent])",
  )!;
const handle = () => screen.getByRole("separator");

describe("defineMillerColumns", () => {
  it("defines exactly the seven tag names on the registry it is given", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: () => undefined,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineMillerColumns(registry);

    // Assert
    expect(defined).toEqual([
      "primitiv-miller-columns",
      "primitiv-miller-columns-tree",
      "primitiv-miller-columns-column",
      "primitiv-miller-columns-item",
      "primitiv-miller-columns-item-indicator",
      "primitiv-miller-columns-resize-handle",
      "primitiv-miller-columns-preview-panel",
    ]);
  });
});

describe("<primitiv-miller-columns> rendering", () => {
  it("marks the strip and the tree with the hooks the stylesheet reads", async () => {
    // Arrange & Act
    await mount();

    // Assert
    expect(root().getAttribute("data-miller-columns-strip")).toBe("");
    expect(root().getAttribute("data-orientation")).toBe("horizontal");
    expect(screen.getByRole("tree").getAttribute("data-miller-columns-tree")).toBe("");
  });

  it("hides every column off the path and numbers the open ones by depth", async () => {
    // Arrange & Act
    await mount({ value: ["docs"] });

    // Assert
    expect(column(null).getAttribute("data-depth")).toBe("0");
    expect(column("docs").getAttribute("data-depth")).toBe("1");
    expect(column("docs").hidden).toBe(false);
    expect(column("guides").getAttribute("hidden")).toBe("");
    expect(column("blog").hidden).toBe(true);
    expect(column("docs").getAttribute("data-miller-columns-column")).toBe("");
  });

  it("leaves a closed column's items unwritten", async () => {
    // Arrange & Act
    await mount();

    // Assert
    const intro = document.querySelector('primitiv-miller-columns-item[value="intro"]')!;
    expect(intro.hasAttribute("role")).toBe(false);
    expect(intro.hasAttribute("aria-level")).toBe(false);
  });

  it("puts no item in the Tab order while the root column has no enabled item and nothing is selected", async () => {
    // Arrange & Act
    await mount({ tree: [{ label: "Only" }], disabled: ["only"] });

    // Assert
    expect(item("Only").tabIndex).toBe(-1);
  });

  it("tells apart items sharing a value at different depths", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      `<primitiv-miller-columns value="x"><primitiv-miller-columns-tree aria-label="Files">` +
        `<primitiv-miller-columns-column><primitiv-miller-columns-item value="x">Top</primitiv-miller-columns-item></primitiv-miller-columns-column>` +
        `<primitiv-miller-columns-column parent="x"><primitiv-miller-columns-item value="x" disabled>Deep</primitiv-miller-columns-item><primitiv-miller-columns-item value="y">Other</primitiv-miller-columns-item></primitiv-miller-columns-column>` +
        `</primitiv-miller-columns-tree></primitiv-miller-columns>`,
    );

    // Assert — the tab stop is the selected item at depth 0 only
    expect(item("Top").tabIndex).toBe(0);
    expect(item("Deep").tabIndex).toBe(-1);

    // Act — the disabled "x" at depth 1 is not the enabled one at depth 0
    await user.click(item("Top"));
    item("Other").focus();
    await user.keyboard("{ArrowUp}");

    // Assert — ArrowUp from Other skips the disabled "x" and wraps to Other
    expect(document.activeElement).toBe(item("Other"));
    expect(root().value).toBe("x");
  });

  it("marks branches, depth and the selected state on each open item", async () => {
    // Arrange & Act
    await mount({ value: ["docs"], disabled: ["readme"] });

    // Assert
    expect(item("Docs").getAttribute("data-has-children")).toBe("");
    expect(item("Readme").hasAttribute("data-has-children")).toBe(false);
    expect(item("API").getAttribute("data-depth")).toBe("1");
    expect(item("Docs").getAttribute("data-terminal")).toBe("");
    expect(item("Docs").getAttribute("aria-selected")).toBe("true");
    expect(item("Blog").getAttribute("aria-selected")).toBe("false");
    expect(item("Readme").getAttribute("data-disabled")).toBe("");
    expect(item("Blog").hasAttribute("data-disabled")).toBe(false);
    expect(item("Blog").hasAttribute("aria-disabled")).toBe(false);
    expect(item("Guides").tabIndex).toBe(-1);
  });

  it("marks an empty column, and the column the path's branch names even when it has no items yet", async () => {
    // Arrange & Act
    await mount(
      `<primitiv-miller-columns value="docs"><primitiv-miller-columns-tree aria-label="Files">` +
        `<primitiv-miller-columns-column><primitiv-miller-columns-item value="docs">Docs</primitiv-miller-columns-item></primitiv-miller-columns-column>` +
        `<primitiv-miller-columns-column parent="docs"></primitiv-miller-columns-column>` +
        `</primitiv-miller-columns-tree></primitiv-miller-columns>`,
    );

    // Assert
    expect(column("docs").getAttribute("data-empty")).toBe("");
    expect(column(null).hasAttribute("data-empty")).toBe(false);
    expect(item("Docs").getAttribute("aria-expanded")).toBe("true");
  });

  it("shows an item's indicator only while the item is a branch, following its state", async () => {
    // Arrange & Act
    await mount({ value: ["docs"] });
    const indicators = [...document.querySelectorAll<HTMLElement>("primitiv-miller-columns-item-indicator")];
    const leaf = document.createElement("primitiv-miller-columns-item-indicator");
    item("Readme").append(leaf);
    await settle();

    // Assert
    expect(indicators[0].getAttribute("aria-hidden")).toBe("true");
    expect(indicators[0].getAttribute("data-state")).toBe("selected");
    expect(indicators[0].getAttribute("data-has-children")).toBe("");
    expect(indicators[1].getAttribute("data-state")).toBe("unselected");
    expect(leaf.getAttribute("hidden")).toBe("");
    expect(leaf.hasAttribute("data-has-children")).toBe(false);
  });

  it("hides an indicator outside any open item", async () => {
    // Arrange & Act
    await mount();
    const deep = document.querySelector<HTMLElement>(
      'primitiv-miller-columns-column[parent="docs"] primitiv-miller-columns-item-indicator',
    )!;

    // Assert
    expect(deep.hidden).toBe(true);
    expect(deep.getAttribute("data-state")).toBe("unselected");
  });

  it("reports an item with no value once and leaves it out", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      `<primitiv-miller-columns><primitiv-miller-columns-tree aria-label="Files"><primitiv-miller-columns-column>` +
        `<primitiv-miller-columns-item>Nameless</primitiv-miller-columns-item>` +
        `<primitiv-miller-columns-item value="a">A</primitiv-miller-columns-item>` +
        `</primitiv-miller-columns-column></primitiv-miller-columns-tree></primitiv-miller-columns>`,
    );
    root().setAttribute("value", "a");
    await settle();

    // Assert
    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]![0])).toContain("<primitiv-miller-columns-item> needs a value");
    expect(screen.getAllByRole("treeitem")).toHaveLength(1);
  });

  it("leaves a nested strip's parts to it", async () => {
    // Arrange & Act
    await mount(
      millerColumnsHtml({ value: ["readme"], preview: "" }).replace(
        ">Preview<",
        `>${millerColumnsHtml({ id: "inner", label: "Inner", value: ["blog"] })}<`,
      ),
    );

    // Assert
    const inner = document.getElementById("inner")!;
    const outerTree = screen.getByRole("tree", { name: "Files" });
    expect(outerTree.querySelectorAll('[role="treeitem"]')).toHaveLength(3);
    expect(inner.querySelector('primitiv-miller-columns-item[value="blog"]')!.getAttribute("aria-selected")).toBe("true");
    expect(outerTree.querySelector('primitiv-miller-columns-item[value="readme"]')!.getAttribute("aria-selected")).toBe("true");
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(millerColumnsHtml({ value: ["docs", "guides"], disabled: ["blog"], preview: "", resize: ' min-width="120"' }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    document.body.innerHTML = rendered;
    await settle();

    // Assert
    expect(writes).not.toHaveBeenCalled();
    expect(removals).not.toHaveBeenCalled();
  });
});

describe("<primitiv-miller-columns> observed attributes", () => {
  // One attribute per case: a change to any observed attribute reconciles them
  // all, so changing several at once would hide one that is not observed.
  it("follows a column's parent as it changes", async () => {
    // Arrange
    await mount({ value: ["readme"] });

    // Act
    column("blog").setAttribute("parent", "readme");
    await settle();

    // Assert
    expect(item("Post").getAttribute("aria-level")).toBe("2");
  });

  it("follows an item's disabled as it changes", async () => {
    // Arrange
    await mount();

    // Act
    item("Readme").setAttribute("disabled", "");
    await settle();

    // Assert
    expect(item("Readme").getAttribute("aria-disabled")).toBe("true");
  });

  it("follows the preview panel's force-mount as it changes", async () => {
    // Arrange
    await mount({ preview: "" });
    const panel = document.querySelector<HTMLElement>("primitiv-miller-columns-preview-panel")!;

    // Act
    panel.setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(panel.hidden).toBe(false);
  });

  it("follows a handle's min-width as it changes", async () => {
    // Arrange
    await mount({ resize: "" });

    // Act
    handle().setAttribute("min-width", "50");
    await settle();

    // Assert
    expect(handle().getAttribute("aria-valuemin")).toBe("50");
  });

  it("follows a handle's max-width as it changes", async () => {
    // Arrange
    await mount({ resize: "" });

    // Act
    handle().setAttribute("max-width", "300");
    await settle();

    // Assert
    expect(handle().getAttribute("aria-valuemax")).toBe("300");
  });
});

describe("<primitiv-miller-columns> state and events", () => {
  it("reflects a user's selection into value and the value property", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount();

    // Act
    await user.click(item("Docs"));
    await user.click(item("Guides"));

    // Assert
    expect(root().getAttribute("value")).toBe("docs guides");
    expect(root().value).toBe("docs guides");
  });

  it("follows the value set from outside, by attribute or property", async () => {
    // Arrange
    await mount();

    // Act
    root().value = "blog";
    await settle();

    // Assert
    expect(column("blog").hidden).toBe(false);
    expect(item("Post").getAttribute("aria-level")).toBe("2");
    expect(document.createElement("primitiv-miller-columns") as HTMLElement & { value: string }).toHaveProperty("value", "");
  });

  it("announces a selection as a cancelable primitiv-miller-columns-change, which a listener can veto", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ value: ["docs"] });
    const seen: unknown[] = [];
    root().addEventListener("primitiv-miller-columns-change", (event) => {
      seen.push((event as CustomEvent).detail);
      event.preventDefault();
    });

    // Act
    await user.click(item("Guides"));

    // Assert
    expect(seen).toEqual([{ value: ["docs", "guides"] }]);
    expect(root().getAttribute("value")).toBe("docs");
  });

  it("announces a column as it opens, but not on first render", async () => {
    // Arrange
    const user = userEvent.setup();
    const shown: (string | null)[] = [];
    document.addEventListener("primitiv-miller-columns-show", (event) => {
      shown.push((event.target as HTMLElement).getAttribute("parent"));
    });
    await mount({ value: ["docs"] });
    expect(shown).toEqual([]);

    // Act
    await user.click(item("Guides"));
    await user.click(item("API"));
    await user.click(item("Guides"));

    // Assert
    expect(shown).toEqual(["guides", "guides"]);
  });

  it("scrolls the strip to its inline end when a column opens, not on first render nor as one closes", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ value: ["docs"] });
    expect(scrollTo).not.toHaveBeenCalled();

    // Act
    await user.click(item("API"));

    // Assert
    expect(scrollTo).not.toHaveBeenCalled();

    // Act
    await user.click(item("Guides"));

    // Assert
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: root().scrollWidth, behavior: "smooth" });
    expect(scrollTo.mock.contexts[0]).toBe(root());
  });

  it("ignores a click or key outside any open item", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ preview: " force-mount" });

    // Act
    await user.click(screen.getByText("Preview"));
    screen.getByRole("tree").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    screen.getByRole("tree").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    // Assert
    expect(root().getAttribute("value")).toBe("");
  });

  it("keeps the tab stop on the item focus was last on, whatever else takes focus", async () => {
    // Arrange
    await mount({ value: ["docs"], preview: ' force-mount' });
    const outside = document.createElement("button");
    document.querySelector("primitiv-miller-columns-preview-panel")!.append(outside);

    // Act
    item("API").focus();
    outside.focus();
    await settle();

    // Assert
    expect(item("API").tabIndex).toBe(0);
    expect(item("Docs").tabIndex).toBe(-1);
  });

  it("lapses the typeahead query, so a later key starts a new search", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount({ tree: [{ label: "Alpha" }, { label: "Beta" }, { label: "Bravo" }] });
    item("Alpha").focus();
    const press = (key: string) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

    // Act
    press("b");
    press("r");

    // Assert
    expect(document.activeElement).toBe(item("Bravo"));

    // Act
    vi.advanceTimersByTime(500);
    press("b");

    // Assert — a fresh "b" from Bravo cycles on to the next match
    expect(document.activeElement).toBe(item("Beta"));
    vi.useRealTimers();
  });

  it("keeps the typeahead query just short of the reset", async () => {
    // Arrange
    vi.useFakeTimers();
    await mount({ tree: [{ label: "Alpha" }, { label: "Beta" }, { label: "Bravo" }] });
    item("Alpha").focus();
    const press = (key: string) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

    // Act
    press("b");
    vi.advanceTimersByTime(499);
    press("r");

    // Assert
    expect(document.activeElement).toBe(item("Bravo"));
    vi.useRealTimers();
  });

  it("searches only the focused column's enabled items", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ value: ["docs"], disabled: ["readme"] });
    item("Docs").focus();

    // Act — API is in the next column, Readme is disabled
    await user.keyboard("a");
    await user.keyboard("r");

    // Assert
    expect(document.activeElement).toBe(item("Docs"));
  });

  it("cycles on from the focused item when a letter repeats", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ tree: [{ label: "Alpha" }, { label: "Beta" }, { label: "Bravo" }] });
    item("Beta").focus();

    // Act
    await user.keyboard("b");

    // Assert
    expect(document.activeElement).toBe(item("Bravo"));
  });

  it("forgets the typeahead query when it leaves the page", async () => {
    // Arrange
    await mount({ tree: [{ label: "Alpha" }, { label: "Beta" }, { label: "Bravo" }] });
    const press = (key: string) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    item("Alpha").focus();
    press("b");
    const element = root();

    // Act
    element.remove();
    document.body.append(element);
    item("Beta").focus();
    press("r");

    // Assert — a fresh "r" matches nothing; a kept "br" would have reached Bravo
    expect(document.activeElement).toBe(item("Beta"));
  });

  it("starts the typeahead query afresh after it leaves the page", async () => {
    // Arrange
    await mount({ tree: [{ label: "Alpha" }, { label: "Beta" }] });
    const element = root();

    // Act
    element.remove();
    document.body.append(element);
    item("Alpha").focus();
    item("Alpha").dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true, cancelable: true }));

    // Assert
    expect(document.activeElement).toBe(item("Beta"));
  });

  it("acts on the item at the address, not another sharing its value", async () => {
    // Arrange — the child column comes first in the markup, so its "x" is listed first
    const user = userEvent.setup();
    await mount(
      `<primitiv-miller-columns value="x"><primitiv-miller-columns-tree aria-label="Files">` +
        `<primitiv-miller-columns-column parent="x"><primitiv-miller-columns-item value="x" disabled>Deep</primitiv-miller-columns-item><primitiv-miller-columns-item value="y">Other</primitiv-miller-columns-item></primitiv-miller-columns-column>` +
        `<primitiv-miller-columns-column><primitiv-miller-columns-item value="x">Top</primitiv-miller-columns-item></primitiv-miller-columns-column>` +
        `</primitiv-miller-columns-tree></primitiv-miller-columns>`,
    );
    const changes = vi.fn();
    root().addEventListener("primitiv-miller-columns-change", changes);

    // Act
    await user.click(item("Top"));
    item("Other").focus();
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(changes).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(item("Top"));
  });

  it("leaves a key that matches nothing to the page", async () => {
    // Arrange
    await mount();
    item("Docs").focus();
    const event = new KeyboardEvent("keydown", { key: "z", bubbles: true, cancelable: true });

    // Act
    item("Docs").dispatchEvent(event);

    // Assert
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(item("Docs"));
  });

  it("offers typeahead no key a listener already handled", async () => {
    // Arrange
    await mount();
    item("Docs").focus();
    item("Docs").addEventListener("keydown", (event) => event.preventDefault());

    // Act
    item("Docs").dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true, cancelable: true }));

    // Assert
    expect(document.activeElement).toBe(item("Docs"));
  });

  it("focuses an already-open column's first item on the step-in key, without selecting again", async () => {
    // Arrange
    const user = userEvent.setup();
    const changes = vi.fn();
    await mount({ value: ["docs"], disabled: ["guides"] });
    root().addEventListener("primitiv-miller-columns-change", changes);
    item("Docs").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(document.activeElement).toBe(item("API"));
    expect(changes).not.toHaveBeenCalled();
  });

  it("drops a pending step-in focus when the column never opens", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount();
    root().addEventListener("primitiv-miller-columns-change", (event) => event.preventDefault());
    item("Docs").focus();

    // Act
    await user.keyboard("{ArrowRight}");
    root().value = "docs";
    await settle();

    // Assert — the vetoed step-in left its focus pending; the later open honours it
    expect(document.activeElement).toBe(item("Guides"));
  });

  it("does not focus a column that has no enabled item", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount({ value: ["blog"], disabled: ["post"] });
    item("Blog").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(document.activeElement).toBe(item("Blog"));
  });

  it("stops listening when it leaves the page", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount();
    const element = root();
    element.remove();
    document.body.append(element);
    await settle();

    const changes = vi.fn();
    element.addEventListener("primitiv-miller-columns-change", changes);

    // Act
    await user.click(item("Docs"));

    // Assert — one listener, so one change
    expect(changes).toHaveBeenCalledOnce();
    expect(element.getAttribute("value")).toBe("docs");
  });
});

describe("<primitiv-miller-columns-preview-panel>", () => {
  it("shows while the deepest selected item is a leaf, and marks itself empty while nothing is selected", async () => {
    // Arrange & Act
    await mount({ preview: "" });
    const panel = document.querySelector<HTMLElement>("primitiv-miller-columns-preview-panel")!;

    // Assert
    expect(panel.getAttribute("hidden")).toBe("");
    expect(panel.getAttribute("data-empty")).toBe("");
    expect(panel.getAttribute("data-miller-columns-preview")).toBe("");

    // Act
    root().value = "readme";
    await settle();

    // Assert
    expect(panel.hidden).toBe(false);
    expect(panel.hasAttribute("data-empty")).toBe(false);
  });

  it("stays shown under force-mount whatever is selected", async () => {
    // Arrange & Act
    await mount({ value: ["docs"], preview: " force-mount" });

    // Assert
    expect(document.querySelector<HTMLElement>("primitiv-miller-columns-preview-panel")!.hidden).toBe(false);
  });

  it("stays hidden while the path ends on a value no open item has", async () => {
    // Arrange & Act
    await mount({ value: ["ghost"], preview: "" });

    // Assert
    expect(document.querySelector<HTMLElement>("primitiv-miller-columns-preview-panel")!.hidden).toBe(true);
  });
});

describe("<primitiv-miller-columns-resize-handle>", () => {
  /** Give every column a rendered width, as layout would. */
  const rendered = (width: number) =>
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);

  it("is a focusable vertical splitter publishing its column's rendered width and its bounds", async () => {
    // Arrange
    rendered(180.4);

    // Act
    await mount({ resize: "" });

    // Assert
    expect(handle().getAttribute("aria-valuenow")).toBe("180");
    expect(handle().getAttribute("aria-valuemin")).toBe("0");
    expect(handle().hasAttribute("aria-valuemax")).toBe(false);
    expect(handle().tabIndex).toBe(0);
    expect(handle().getAttribute("data-miller-columns-resize-handle")).toBe("");
  });

  it("steps by 10 by default, and by its own step", async () => {
    // Arrange
    rendered(200);
    const user = userEvent.setup();
    await mount({ resize: "" });
    handle().focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(handle().getAttribute("aria-valuenow")).toBe("210");

    // Act
    handle().setAttribute("step", "25");
    await settle();
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(handle().getAttribute("aria-valuenow")).toBe("185");
  });

  it("leaves a key outside its keymap alone", async () => {
    // Arrange
    rendered(200);
    await mount({ resize: "" });
    const event = new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true });

    // Act
    handle().dispatchEvent(event);

    // Assert
    expect(event.defaultPrevented).toBe(false);
    expect(handle().getAttribute("aria-valuenow")).toBe("200");
  });

  it("drags from the column's width while the pointer is down, marking itself dragging", async () => {
    // Arrange
    rendered(200);
    await mount({ resize: ' min-width="120" max-width="400"' });

    // Act
    handle().dispatchEvent(new PointerEvent("pointerdown", { clientX: 50, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 90 }));

    // Assert
    expect(handle().getAttribute("data-dragging")).toBe("");
    expect(column(null).style.width).toBe("240px");
    expect(handle().getAttribute("aria-valuenow")).toBe("240");

    // Act
    window.dispatchEvent(new PointerEvent("pointerup", { clientX: 90 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 500 }));

    // Assert
    expect(handle().hasAttribute("data-dragging")).toBe(false);
    expect(column(null).style.width).toBe("240px");
  });

  it("resumes a later drag from the width it was resized to, and ends one on pointercancel", async () => {
    // Arrange
    rendered(200);
    await mount({ resize: "" });
    handle().dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 30 }));
    window.dispatchEvent(new PointerEvent("pointercancel"));
    expect(handle().hasAttribute("data-dragging")).toBe(false);

    // Act
    handle().dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 10 }));

    // Assert
    expect(column(null).style.width).toBe("240px");
    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(handle().hasAttribute("data-dragging")).toBe(false);
  });

  it("ends a drag when the strip leaves the page mid-drag", async () => {
    // Arrange
    rendered(200);
    await mount({ resize: "" });
    const grip = handle();
    const strip = column(null);
    grip.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, bubbles: true }));
    // A key on the handle mid-drag goes to the same resizer, so it is that one the strip ends.
    grip.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    // Act
    root().remove();
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 40 }));

    // Assert
    expect(grip.hasAttribute("data-dragging")).toBe(false);
    expect(strip.style.width).toBe("");
  });

  it("restarts a drag cleanly if a second pointerdown arrives mid-drag", async () => {
    // Arrange
    rendered(200);
    await mount({ resize: "" });
    handle().dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, bubbles: true }));

    // Act
    handle().dispatchEvent(new PointerEvent("pointerdown", { clientX: 100, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 110 }));

    // Assert — one drag, from the second press
    expect(column(null).style.width).toBe("210px");
  });

  it("ignores a press outside any handle, and a handle of a nested strip", async () => {
    // Arrange
    rendered(200);
    await mount(
      millerColumnsHtml({ value: ["readme"], preview: "" }).replace(
        ">Preview<",
        `>${millerColumnsHtml({ id: "inner", label: "Inner", resize: "" })}<`,
      ),
    );

    // Act
    const readme = screen.getByRole("tree", { name: "Files" }).querySelector('primitiv-miller-columns-item[value="readme"]')!;
    readme.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, bubbles: true }));
    handle().dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 40 }));

    // Assert — only the inner strip's own column resized
    const inner = document.getElementById("inner")!;
    expect(inner.querySelector<HTMLElement>("primitiv-miller-columns-column")!.style.width).toBe("240px");
    expect(column(null).style.width).toBe("");
  });

  it("keeps a resized width for its depth, applied to whichever column opens there", async () => {
    // Arrange
    rendered(200);
    const user = userEvent.setup();
    await mount(
      millerColumnsHtml({ value: ["docs"] }).replace(
        '<primitiv-miller-columns-column parent="docs">',
        '<primitiv-miller-columns-column parent="docs"><primitiv-miller-columns-resize-handle aria-label="Resize column"></primitiv-miller-columns-resize-handle>',
      ),
    );
    handle().focus();
    await user.keyboard("{ArrowRight}");
    expect(column("docs").style.width).toBe("210px");

    // Act
    await user.click(item("Blog"));

    // Assert
    expect(column("blog").style.width).toBe("210px");
  });

  it("leaves a width the markup set on a column it never resized", async () => {
    // Arrange & Act
    await mount(millerColumnsHtml().replace("<primitiv-miller-columns-column>", '<primitiv-miller-columns-column style="width: 99px">'));

    // Assert
    expect(column(null).style.width).toBe("99px");
  });

  it("follows its column's rendered width through a ResizeObserver, and stops when it leaves", async () => {
    // Arrange
    const observers: { callback: () => void; observed: Element[]; disconnect: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observed: Element[] = [];
        disconnect = vi.fn();
        constructor(public callback: () => void) {
          observers.push(this);
        }
        observe(element: Element) {
          this.observed.push(element);
        }
      },
    );
    const width = rendered(200);
    await mount({ resize: "" });
    expect(observers[0].observed).toContain(column(null));

    // Act
    width.mockReturnValue({ width: 260 } as DOMRect);
    observers[0].callback();

    // Assert
    expect(handle().getAttribute("aria-valuenow")).toBe("260");

    // Act
    root().remove();

    // Assert
    expect(observers[0].disconnect).toHaveBeenCalled();
  });

  it("mirrors the arrows right to left", async () => {
    // Arrange
    rendered(200);
    const user = userEvent.setup();
    await mount({ resize: "", dir: "rtl" });
    handle().focus();

    // Act
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(handle().getAttribute("aria-valuenow")).toBe("210");
  });
});
