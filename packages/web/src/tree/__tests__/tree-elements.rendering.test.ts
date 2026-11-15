import { defineTree, type ElementRegistry, type PrimitivTreeElement } from "../elements";
import { treeHtml } from "./tree.fixtures";
import { control, group, listenerErrors, mount, node, path, root, settle } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const ELEMENTS = ["", "-item", "-branch", "-branch-control", "-branch-content", "-branch-indicator", "-selection-path"].map(
  (suffix) => `primitiv-tree${suffix}`,
);

describe("<primitiv-tree> rendering", () => {
  it("defines exactly the seven tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-tree-item" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineTree(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-tree-item"));
  });

  it("publishes each node's depth for a stylesheet to indent by, and what kind of node it is", async () => {
    // Arrange & Act
    await mount(treeHtml({ expanded: ["docs", "guides"], selected: ["intro"], disabled: ["api"] }));

    // Assert
    expect(root().getAttribute("data-selection-mode")).toBe("single");
    expect(node("intro").getAttribute("data-depth")).toBe("2");
    expect(node("intro").style.getPropertyValue("--primitiv-tree-depth")).toBe("2");
    expect(node("docs").style.getPropertyValue("--primitiv-tree-depth")).toBe("0");
    expect(node("intro").getAttribute("data-leaf")).toBe("");
    expect(node("intro").getAttribute("data-selected")).toBe("");
    expect(node("guides").getAttribute("data-branch")).toBe("");
    expect(node("guides").getAttribute("data-state")).toBe("open");
    expect(node("api").getAttribute("data-disabled")).toBe("");
    expect(group("docs").getAttribute("data-depth")).toBe("1");
    expect(group("guides").getAttribute("data-state")).toBe("open");
  });

  it("labels each branch by its row, deriving the row's id from the root's", async () => {
    // Arrange & Act
    await mount(treeHtml({ id: "site" }));

    // Assert
    expect(control("docs").id).toBe("site-branch-control-docs");
    expect(node("docs").getAttribute("aria-labelledby")).toBe("site-branch-control-docs");
  });

  it("keeps a row id the markup has", async () => {
    // Arrange & Act
    await mount(treeHtml().replace("<primitiv-tree-branch-control>Docs", '<primitiv-tree-branch-control id="docs-row">Docs'));

    // Assert
    expect(node("docs").getAttribute("aria-labelledby")).toBe("docs-row");
  });

  it("keeps force-mounted groups rendered while collapsed, hidden from assistive tech instead", async () => {
    // Arrange & Act
    await mount(treeHtml({ forceMount: true, expanded: ["docs"] }));

    // Assert
    expect(group("guides").hidden).toBe(false);
    expect(group("guides").getAttribute("aria-hidden")).toBe("true");
    expect(group("docs").hasAttribute("aria-hidden")).toBe(false);
    expect(group("guides").getAttribute("data-state")).toBe("closed");
  });

  it("hides a collapsed group with an empty hidden attribute", async () => {
    // Arrange
    await mount(treeHtml({ expanded: ["docs"] }));

    // Act
    (root() as PrimitivTreeElement).expanded = "";
    await settle();

    // Assert
    expect(group("docs").getAttribute("hidden")).toBe("");
    expect(group("docs").getAttribute("aria-hidden")).toBe("true");
  });

  it("marks only its own branch's indicator, not a nested branch's", async () => {
    // Arrange & Act
    await mount(
      treeHtml({ expanded: ["docs"] })
        .replace("<primitiv-tree-branch-control>Docs", "<primitiv-tree-branch-control>Docs<primitiv-tree-branch-indicator></primitiv-tree-branch-indicator>")
        .replace("<primitiv-tree-branch-control>Guides", "<primitiv-tree-branch-control>Guides<primitiv-tree-branch-indicator></primitiv-tree-branch-indicator>"),
    );

    // Assert
    const [docs, guides] = document.querySelectorAll("primitiv-tree-branch-indicator");
    expect(docs.getAttribute("data-state")).toBe("open");
    expect(docs.getAttribute("aria-hidden")).toBe("true");
    expect(guides.getAttribute("data-state")).toBe("closed");
    // Adopted again as rendered, nothing is rewritten — not even in passing.
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    document.body.innerHTML = rendered;
    await settle();
    expect(writes.mock.contexts.filter((element) => (element as Element).isConnected)).toEqual([]);
  });

  it("follows the selection mode as it changes", async () => {
    // Arrange
    await mount(treeHtml());

    // Act
    root().setAttribute("selection-mode", "multiple");
    await settle();

    // Assert
    expect(root().getAttribute("aria-multiselectable")).toBe("true");
  });

  it("follows a node's disabled as it changes", async () => {
    // Arrange
    await mount(treeHtml());

    // Act
    node("blog").setAttribute("disabled", "");
    await settle();

    // Assert
    expect(node("blog").getAttribute("aria-disabled")).toBe("true");
  });

  it("follows a group's force-mount as it changes", async () => {
    // Arrange
    await mount(treeHtml());

    // Act
    group("docs").setAttribute("force-mount", "");
    await settle();

    // Assert
    expect(group("docs").hidden).toBe(false);
  });

  it("renders React's headless breadcrumb markup for the selection path", async () => {
    // Arrange & Act
    await mount(treeHtml({ selected: ["api"], disabled: ["docs"], selectionPath: true }));

    // Assert
    expect(path().getAttribute("data-tree-selection-path")).toBe("");
    expect(path().innerHTML).toBe(
      '<nav aria-label="Breadcrumb"><ol>' +
        '<li><span data-tree-selection-segment="" data-value="docs" data-disabled="">Docs</span></li>' +
        '<li role="presentation" aria-hidden="true">/</li>' +
        '<li><span data-tree-selection-segment="" data-value="api" aria-current="page">API</span></li>' +
        "</ol></nav>",
    );
  });

  it("clones the template it is given for each trail, keeping the template", async () => {
    // Arrange
    const template =
      '<template><nav class="crumbs" aria-label="Location"><ol class="list">' +
      '<li class="item"><span class="crumb" data-tree-selection-segment></span></li>' +
      '<li class="sep" role="presentation" aria-hidden="true">›</li>' +
      '<li class="item"><span class="page" aria-current="page" data-tree-selection-segment></span></li>' +
      "</ol></nav></template>";

    // Act
    await mount(treeHtml({ selected: ["api"], selectionPath: true, pathInner: template }));

    // Assert
    expect(path().querySelector("template")).not.toBeNull();
    expect(path().querySelector(":scope > nav")?.outerHTML).toBe(
      '<nav class="crumbs" aria-label="Location"><ol class="list">' +
        '<li class="item"><span class="crumb" data-tree-selection-segment="" data-value="docs">Docs</span></li>' +
        '<li class="sep" role="presentation" aria-hidden="true">›</li>' +
        '<li class="item"><span class="page" aria-current="page" data-tree-selection-segment="" data-value="api">API</span></li>' +
        "</ol></nav>",
    );
  });

  it("builds what a template leaves out: the list, the crumbs and the separator", async () => {
    // Arrange & Act
    await mount(treeHtml({ selected: ["api"], selectionPath: true, pathInner: "<template><nav></nav></template>" }));

    // Assert
    expect(path().querySelector(":scope > nav")?.innerHTML).toBe(
      '<ol><li><span data-tree-selection-segment="" data-value="docs">Docs</span></li>' +
        '<li role="presentation" aria-hidden="true">/</li>' +
        '<li><span data-tree-selection-segment="" data-value="api" aria-current="page">API</span></li></ol>',
    );
  });

  it("shows a label change in the path, and falls back to the value with no label", async () => {
    // Arrange
    await mount(treeHtml({ selected: ["blog"], selectionPath: true }).replace(' label="Blog"', ""));
    const unlabelled = path().textContent;

    // Act
    node("blog").setAttribute("label", "News");
    await settle();

    // Assert
    expect(unlabelled).toBe("blog");
    expect(path().textContent).toBe("News");
  });

  it("empties the path as the selection clears", async () => {
    // Arrange
    await mount(treeHtml({ selected: ["blog"], selectionPath: true }));

    // Act
    (root() as PrimitivTreeElement).value = "";
    await settle();

    // Assert
    expect(path().getAttribute("data-empty")).toBe("");
    expect(path().children).toHaveLength(0);
  });

  it("reflects the selection and expansion as properties", async () => {
    // Arrange
    await mount(treeHtml());
    const element = root() as PrimitivTreeElement;
    const before = [element.value, element.expanded];

    // Act
    element.value = "blog";
    element.expanded = "docs";

    // Assert
    expect(before).toEqual(["", ""]);
    expect([element.getAttribute("value"), element.getAttribute("expanded")]).toEqual(["blog", "docs"]);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(
      treeHtml({ id: "a", expanded: ["docs"], selected: ["api"], disabled: ["blog"], selectionPath: true }) +
        treeHtml({ id: "b", multiple: true, forceMount: true, selected: ["intro", "blog"], selectionPath: true }),
    );
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");
    const styles = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty");
    const inserts = vi.spyOn(Element.prototype, "insertAdjacentHTML");

    // Act
    document.body.innerHTML = rendered;
    await settle();

    // Assert — the selection path builds its trails in a detached holder to
    // compare with the page, so only a write to a connected element counts.
    const live = (spy: { mock: { contexts: unknown[] } }) =>
      spy.mock.contexts.filter((element) => (element as Element).isConnected);
    expect(live(writes)).toEqual([]);
    expect(live(removals)).toEqual([]);
    expect(styles).not.toHaveBeenCalled();
    expect(inserts).not.toHaveBeenCalled();
  });
});
