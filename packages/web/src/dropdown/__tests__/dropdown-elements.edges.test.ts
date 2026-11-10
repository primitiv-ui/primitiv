import userEvent from "@testing-library/user-event";

import { dropdownHtml, LABELS } from "./dropdown.fixtures";
import { content, mount, root, row, settle, shown, sub, subContent, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-dropdown> edges", () => {
  it("reports a trigger, item or sub-trigger without exactly one element child once each, and leaves it undecorated", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(
      dropdownHtml()
        .replace(`<button type="button">${LABELS.trigger}</button>`, "<button>A</button><button>B</button>")
        .replace(`<primitiv-dropdown-item><li>${LABELS.copy}</li></primitiv-dropdown-item>`, "<primitiv-dropdown-item>Copy</primitiv-dropdown-item>")
        .replace(`<li>${LABELS.share}</li>`, ""),
    );
    root().open = true;
    await settle();

    // Assert
    expect(error.mock.calls.map(([message]) => message)).toEqual([
      "<primitiv-dropdown-trigger> needs exactly one element child (a <button>) to decorate.",
      "<primitiv-dropdown-item> needs exactly one element child (an <li>) to decorate.",
      "<primitiv-dropdown-sub-trigger> needs exactly one element child (an <li>) to decorate.",
    ]);
    expect(document.querySelector("primitiv-dropdown-trigger button")?.hasAttribute("aria-haspopup")).toBe(false);
  });

  it("opens with no trigger, from its open attribute alone, shown with no anchor", async () => {
    // Arrange
    await mount(dropdownHtml().replace(/<primitiv-dropdown-trigger>.*?<\/primitiv-dropdown-trigger>/, ""));
    const showPopover = vi.spyOn(content(), "showPopover");

    // Act
    root().open = true;
    await settle();

    // Assert
    expect(showPopover).toHaveBeenCalledWith();
    expect(shown()).toBe(true);
  });

  it("gives a trigger with no menu no aria-controls, and toggles safely", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      `<primitiv-dropdown><primitiv-dropdown-trigger><button type="button">${LABELS.trigger}</button></primitiv-dropdown-trigger></primitiv-dropdown>`,
    );

    // Act
    await user.click(trigger());
    await settle();

    // Assert
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
    expect(root().open).toBe(true);
  });

  it("gives a sub-trigger with no submenu no aria-controls, and opens safely", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(dropdownHtml({ open: true }).replace(/<primitiv-dropdown-sub-content.*?<\/primitiv-dropdown-sub-content>/, ""));

    // Act
    await user.click(row(LABELS.share));
    await settle();

    // Assert
    expect(row(LABELS.share).hasAttribute("aria-controls")).toBe(false);
    expect(sub().open).toBe(true);
  });

  it("opens a submenu with no sub-trigger from its open attribute alone, shown with no anchor", async () => {
    // Arrange
    await mount(dropdownHtml({ open: true }).replace(/<primitiv-dropdown-sub-trigger>.*?<\/primitiv-dropdown-sub-trigger>/, ""));
    const showPopover = vi.spyOn(subContent(), "showPopover");

    // Act
    sub().open = true;
    await settle();
    await userEvent.setup().keyboard("{ArrowRight}");

    // Assert
    expect(showPopover).toHaveBeenCalledWith();
    expect(sub().open).toBe(true);
  });

  it("leaves a nested dropdown's parts to it", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      dropdownHtml({ open: true }).replace(
        "<primitiv-dropdown-separator></primitiv-dropdown-separator>",
        '<div><primitiv-dropdown id="inner"><primitiv-dropdown-trigger><button type="button">Inner</button></primitiv-dropdown-trigger>' +
          '<primitiv-dropdown-content popover="auto"><primitiv-dropdown-item><li>Nested</li></primitiv-dropdown-item></primitiv-dropdown-content></primitiv-dropdown></div>',
      ),
    );
    const selects: EventTarget[] = [];
    document.addEventListener("primitiv-dropdown-select", (event) => selects.push(event.currentTarget as EventTarget));

    // Act
    (document.getElementById("inner") as HTMLElement & { open: boolean }).open = true;
    await settle();
    await user.click(row("Nested"));
    await settle();

    // Assert
    expect(selects).toHaveLength(1);
    expect(root().open).toBe(true);
    expect((document.getElementById("inner") as HTMLElement & { open: boolean }).open).toBe(false);
  });

  it("ignores a press inside a submenu that is not a row", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(dropdownHtml({ open: true, subOpen: true }));

    // Act
    await user.hover(subContent());
    await settle();

    // Assert
    expect(sub().open).toBe(true);
  });
});
