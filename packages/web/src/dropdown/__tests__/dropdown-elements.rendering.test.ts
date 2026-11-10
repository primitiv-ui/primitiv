import { defineDropdown, type ElementRegistry } from "../elements";
import { dropdownHtml, LABELS } from "./dropdown.fixtures";
import { content, listenerErrors, mount, root, row, settle, shown, sub, subContent, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  expect(listenerErrors.splice(0)).toEqual([]);
});

const ELEMENTS = [
  "primitiv-dropdown",
  "primitiv-dropdown-trigger",
  "primitiv-dropdown-content",
  "primitiv-dropdown-item",
  "primitiv-dropdown-checkbox-item",
  "primitiv-dropdown-radio-group",
  "primitiv-dropdown-radio-item",
  "primitiv-dropdown-item-indicator",
  "primitiv-dropdown-group",
  "primitiv-dropdown-label",
  "primitiv-dropdown-separator",
  "primitiv-dropdown-sub",
  "primitiv-dropdown-sub-trigger",
  "primitiv-dropdown-sub-content",
];

const indicator = (name: string) => row(name).querySelector("primitiv-dropdown-item-indicator") as HTMLElement;

describe("<primitiv-dropdown> rendering", () => {
  it("defines exactly the fourteen tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name === "primitiv-dropdown-label" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineDropdown(registry);

    // Assert
    expect(defined).toEqual(ELEMENTS.filter((name) => name !== "primitiv-dropdown-label"));
  });

  it("wires the trigger to the menu and names both menus, keeping an id the markup gives", async () => {
    // Arrange & Act
    await mount(dropdownHtml({ id: "file" }).replace('<primitiv-dropdown-sub-content popover="auto">', '<primitiv-dropdown-sub-content id="share-menu" popover="auto">'));

    // Assert
    expect(content().id).toBe("file-content");
    expect(content().getAttribute("role")).toBe("menu");
    expect(trigger().getAttribute("aria-controls")).toBe("file-content");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(subContent().getAttribute("role")).toBe("menu");
    expect(row(LABELS.share).getAttribute("aria-controls")).toBe("share-menu");
    expect(row(LABELS.share).getAttribute("tabindex")).toBe("-1");
    expect(row(LABELS.share).hasAttribute("data-highlighted")).toBe(false);
    expect(row(LABELS.copy).hasAttribute("aria-checked")).toBe(false);
  });

  it("keeps the menus' own ids and popover values", async () => {
    // Arrange & Act
    await mount(
      dropdownHtml()
        .replace('<primitiv-dropdown-content popover="auto">', '<primitiv-dropdown-content id="mine" popover="manual">')
        .replace('<primitiv-dropdown-sub-content popover="auto">', '<primitiv-dropdown-sub-content popover="manual">'),
    );

    // Assert
    expect(content().id).toBe("mine");
    expect(content().getAttribute("popover")).toBe("manual");
    expect(subContent().getAttribute("popover")).toBe("manual");
  });

  it("names a submenu that has no id after its sub", async () => {
    // Arrange & Act
    await mount(dropdownHtml());

    // Assert
    expect(subContent().id).toMatch(/^primitiv-dropdown-sub-\d+-content$/);
    expect(row(LABELS.share).getAttribute("aria-controls")).toBe(subContent().id);
  });

  it("makes the menus popovers when the markup leaves it out", async () => {
    // Arrange & Act
    await mount(dropdownHtml().replaceAll(' popover="auto"', ""));

    // Assert
    expect(content().getAttribute("popover")).toBe("auto");
    expect(subContent().getAttribute("popover")).toBe("auto");
  });

  it("gives groups, the label, the radio group and the separator their roles", async () => {
    // Arrange & Act
    await mount(dropdownHtml({ id: "file" }));

    // Assert
    const group = document.querySelector("primitiv-dropdown-group") as HTMLElement;
    const label = document.querySelector("primitiv-dropdown-label") as HTMLElement;
    expect(group.getAttribute("role")).toBe("group");
    expect(label.id).toBe("file-label-1");
    expect(group.getAttribute("aria-labelledby")).toBe("file-label-1");
    expect(document.querySelector("primitiv-dropdown-radio-group")?.getAttribute("role")).toBe("group");
    expect(document.querySelector("primitiv-dropdown-separator")?.getAttribute("role")).toBe("separator");
  });

  it("numbers several labels, keeps an id a label has, and leaves a group with no label unnamed", async () => {
    // Arrange & Act
    await mount(
      dropdownHtml({ id: "file" }).replace(
        "<primitiv-dropdown-separator></primitiv-dropdown-separator>",
        '<primitiv-dropdown-label id="mine">Mine</primitiv-dropdown-label><primitiv-dropdown-label>Other</primitiv-dropdown-label>' +
          '<primitiv-dropdown-group id="bare"><primitiv-dropdown-item><li>Bare</li></primitiv-dropdown-item></primitiv-dropdown-group>',
      ),
    );

    // Assert
    const labels = [...document.querySelectorAll("primitiv-dropdown-label")].map((label) => label.id);
    expect(labels).toEqual(["mine", "file-label-1", "file-label-2"]);
    expect(document.getElementById("bare")?.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("hides the indicator of an unchecked item and shows a checked one, with its state", async () => {
    // Arrange & Act
    await mount(dropdownHtml());

    // Assert
    expect(indicator(LABELS.grid).getAttribute("hidden")).toBe("");
    expect(indicator(LABELS.grid).getAttribute("data-state")).toBe("unchecked");
    expect(indicator(LABELS.small).hidden).toBe(false);
    expect(indicator(LABELS.small).getAttribute("data-state")).toBe("checked");
    expect(indicator(LABELS.large).hidden).toBe(true);
  });

  it("marks a checkbox item checked or mixed from its checked attribute", async () => {
    // Arrange
    await mount(dropdownHtml({ checked: " checked" }));
    const checked = row(LABELS.grid).getAttribute("aria-checked");
    const shownChecked = indicator(LABELS.grid).hidden;

    // Act
    document.querySelector("primitiv-dropdown-checkbox-item")?.setAttribute("checked", "indeterminate");
    await settle();

    // Assert
    expect(checked).toBe("true");
    expect(shownChecked).toBe(false);
    expect(row(LABELS.grid).getAttribute("aria-checked")).toBe("mixed");
    expect(indicator(LABELS.grid).getAttribute("data-state")).toBe("indeterminate");
    expect(indicator(LABELS.grid).hidden).toBe(false);
  });

  it("keeps a force-mounted indicator shown while unchecked, and leaves a stray one unchecked", async () => {
    // Arrange & Act
    await mount(
      dropdownHtml().replace(
        "<primitiv-dropdown-checkbox-item><li>Show grid<primitiv-dropdown-item-indicator>",
        "<primitiv-dropdown-checkbox-item><li>Show grid<primitiv-dropdown-item-indicator force-mount>",
      ) .replace("<primitiv-dropdown-separator></primitiv-dropdown-separator>", '<primitiv-dropdown-item-indicator id="stray"></primitiv-dropdown-item-indicator>'),
    );

    // Assert
    expect(indicator(LABELS.grid).hidden).toBe(false);
    expect(indicator(LABELS.grid).getAttribute("data-state")).toBe("unchecked");
    expect(document.getElementById("stray")?.getAttribute("data-state")).toBe("unchecked");
    expect(document.getElementById("stray")?.hidden).toBe(true);
  });

  it("labels a group by its own label, not one in a group nested inside it", async () => {
    // Arrange & Act
    await mount(
      dropdownHtml({ id: "file" }).replace(
        "<primitiv-dropdown-separator></primitiv-dropdown-separator>",
        '<primitiv-dropdown-group id="outer"><primitiv-dropdown-group id="inner"><primitiv-dropdown-label>Inner</primitiv-dropdown-label>' +
          "</primitiv-dropdown-group></primitiv-dropdown-group>",
      ),
    );

    // Assert
    expect(document.getElementById("outer")?.hasAttribute("aria-labelledby")).toBe(false);
    expect(document.getElementById("inner")?.getAttribute("aria-labelledby")).toBe("file-label-1");
  });

  it("leaves a radio item outside any group unchecked", async () => {
    // Arrange & Act
    await mount(
      dropdownHtml().replace(
        "<primitiv-dropdown-separator></primitiv-dropdown-separator>",
        '<primitiv-dropdown-radio-item value="stray"><li>Stray</li></primitiv-dropdown-radio-item>',
      ),
    );

    // Assert
    expect(row("Stray").getAttribute("aria-checked")).toBe("false");
  });

  it("follows the radio group's value set from outside", async () => {
    // Arrange
    await mount(dropdownHtml());

    // Act
    document.querySelector("primitiv-dropdown-radio-group")?.setAttribute("value", "large");
    await settle();

    // Assert
    expect(row(LABELS.large).getAttribute("aria-checked")).toBe("true");
    expect(row(LABELS.small).getAttribute("aria-checked")).toBe("false");
  });

  it("marks a disabled item and a disabled sub-trigger, and follows the attribute", async () => {
    // Arrange
    await mount(dropdownHtml().replace("<primitiv-dropdown-sub-trigger>", "<primitiv-dropdown-sub-trigger disabled>"));
    const subDisabled = row(LABELS.share).getAttribute("aria-disabled");

    // Act
    document.querySelector("primitiv-dropdown-item[disabled]")?.removeAttribute("disabled");
    document.querySelector("primitiv-dropdown-sub-trigger")?.removeAttribute("disabled");
    await settle();

    // Assert
    expect(subDisabled).toBe("true");
    expect(row(LABELS.cut).hasAttribute("aria-disabled")).toBe(false);
    expect(row(LABELS.copy).hasAttribute("aria-disabled")).toBe(false);
    expect(row(LABELS.share).hasAttribute("aria-disabled")).toBe(false);
  });

  it("shows both menus with their trigger rows as their anchors", async () => {
    // Arrange
    await mount(dropdownHtml());
    const showMenu = vi.spyOn(content(), "showPopover");
    const showSub = vi.spyOn(subContent(), "showPopover");

    // Act
    root().open = true;
    sub().open = true;
    await settle();

    // Assert
    expect(showMenu).toHaveBeenCalledWith({ source: trigger() });
    expect(showSub).toHaveBeenCalledWith({ source: row(LABELS.share) });
  });

  it("shows a menu and submenu the server rendered open, highlighting the open submenu's row", async () => {
    // Arrange & Act
    await mount(dropdownHtml({ open: true, subOpen: true }));

    // Assert
    expect(shown()).toBe(true);
    expect(shown(subContent())).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(row(LABELS.share).getAttribute("aria-expanded")).toBe("true");
    expect(row(LABELS.share).getAttribute("data-highlighted")).toBe("");
    expect(sub().open).toBe(true);
  });
});
