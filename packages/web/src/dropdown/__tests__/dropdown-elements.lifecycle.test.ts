import userEvent from "@testing-library/user-event";

import { dropdownHtml, LABELS } from "./dropdown.fixtures";
import { content, mount, root, row, settle, shown, sub, subContent, trigger, listenerErrors } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  expect(listenerErrors.splice(0)).toEqual([]);
});

describe("<primitiv-dropdown> lifecycle", () => {
  it("shows an open menu again when it is moved, since leaving hid it", async () => {
    // Arrange
    await mount(dropdownHtml({ open: true, subOpen: true }) + '<div id="elsewhere"></div>');
    content().hidePopover = function (this: HTMLElement) {
      this.removeAttribute("data-popover-open");
    };

    // Act
    (document.getElementById("elsewhere") as HTMLElement).append(root());
    content().hidePopover();
    subContent().hidePopover?.call(subContent());
    await settle();

    // Assert
    expect(root().open).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("stops listening once removed, and resumes when put back", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(dropdownHtml());
    const element = root();
    element.remove();

    // Act
    document.body.append(element);
    await settle();
    await user.click(trigger());
    await settle();

    // Assert
    expect(root().open).toBe(true);
    expect(shown()).toBe(true);
  });

  it("follows a menu swapped for another", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(dropdownHtml());
    const replacement = document.createElement("primitiv-dropdown-content");
    replacement.setAttribute("popover", "auto");
    replacement.innerHTML = "<primitiv-dropdown-item><li>Fresh</li></primitiv-dropdown-item>";

    // Act
    content().replaceWith(replacement);
    await settle();
    await user.click(trigger());
    await settle();

    // Assert
    expect(trigger().getAttribute("aria-controls")).toBe(replacement.id);
    expect(document.activeElement).toBe(row("Fresh"));
  });

  it("follows a submenu swapped for another, and a removed submenu stops listening", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(dropdownHtml({ open: true }));
    const replacement = document.createElement("primitiv-dropdown-sub-content");
    replacement.setAttribute("popover", "auto");
    replacement.innerHTML = "<primitiv-dropdown-item><li>Fresh</li></primitiv-dropdown-item>";
    subContent().replaceWith(replacement);
    await settle();

    // Act
    row(LABELS.share).focus();
    await user.keyboard("{ArrowRight}");
    await settle();
    const focusedFresh = document.activeElement === row("Fresh");
    const element = sub();
    element.remove();
    await user.hover(row(LABELS.remove));

    // Assert
    expect(focusedFresh).toBe(true);
    expect(element.open).toBe(true);
  });

  it("lets go of a menu and a submenu that are removed", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(dropdownHtml({ open: true, subOpen: true }));
    const menu = content();
    const submenu = subContent();

    // Act
    submenu.remove();
    await settle();
    menu.remove();
    await settle();
    await user.click(trigger());
    await settle();

    // Assert
    expect(trigger().hasAttribute("aria-controls")).toBe(false);
    expect(row(LABELS.share)).toBeUndefined();
    expect(root().open).toBe(false);
  });

  it("stops a removed submenu listening to its own row", async () => {
    // Arrange
    await mount(dropdownHtml({ open: true }));
    const element = sub();
    const share = row(LABELS.share);
    element.remove();

    // Act — a script's click: the detached row cannot be reached any other way.
    share.click();
    await settle();

    // Assert
    expect(element.open).toBe(false);
  });
});
