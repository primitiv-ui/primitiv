import userEvent from "@testing-library/user-event";

import { dropdownHtml, LABELS } from "./dropdown.fixtures";
import { content, mount, root, row, settle, shown, sub, subContent, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
});

/** Record every `type` event's detail and whether it was cancelable and bubbled to the document. */
function record(type: string) {
  const seen: unknown[] = [];
  const listener = (event: Event) => seen.push((event as CustomEvent).detail);
  document.addEventListener(type, listener);
  return { seen, stop: () => document.removeEventListener(type, listener) };
}

/** Veto every `type` event while the returned function has not been called. */
function veto(type: string) {
  const listener = (event: Event) => event.preventDefault();
  document.addEventListener(type, listener);
  return () => document.removeEventListener(type, listener);
}

/** A mounted dropdown, opened by a click. */
async function opened(html = dropdownHtml()) {
  const user = userEvent.setup();
  await mount(html);
  await user.click(trigger());
  await settle();
  return user;
}

describe("<primitiv-dropdown> interaction", () => {
  describe("the open state", () => {
    it("reports each user-driven change once with a bubbling, cancelable primitiv-dropdown-change", async () => {
      // Arrange
      const changes = record("primitiv-dropdown-change");
      let cancelable = false;
      document.addEventListener("primitiv-dropdown-change", (event) => (cancelable = event.cancelable), { once: true });

      // Act
      const user = await opened();
      await user.keyboard("{Escape}");
      await settle();
      changes.stop();

      // Assert
      expect(changes.seen).toEqual([{ open: true }, { open: false }]);
      expect(cancelable).toBe(true);
    });

    it("stays closed when the change is cancelled", async () => {
      // Arrange
      const user = userEvent.setup();
      await mount(dropdownHtml());
      const stop = veto("primitiv-dropdown-change");

      // Act
      await user.click(trigger());
      await settle();
      stop();

      // Assert
      expect(root().open).toBe(false);
      expect(shown()).toBe(false);
    });

    it("shows the menu again when a cancelled change finds the browser already hiding it", async () => {
      // Arrange
      await opened();
      const stop = veto("primitiv-dropdown-change");

      // Act
      content().hidePopover();
      await settle();
      stop();

      // Assert
      expect(root().open).toBe(true);
      expect(shown()).toBe(true);
    });

    it("follows open set from outside, as a property or an attribute, announcing nothing", async () => {
      // Arrange
      await mount(dropdownHtml());
      const changes = record("primitiv-dropdown-change");

      // Act
      root().open = true;
      await settle();
      const afterProperty = shown();
      root().removeAttribute("open");
      await settle();
      changes.stop();

      // Assert
      expect(afterProperty).toBe(true);
      expect(shown()).toBe(false);
      expect(changes.seen).toEqual([]);
    });
  });

  describe("choosing an item", () => {
    it("fires primitiv-dropdown-select on the item part, then closes", async () => {
      // Arrange
      const user = await opened();
      let target: EventTarget | null = null;
      document.addEventListener("primitiv-dropdown-select", (event) => (target = event.target), { once: true });

      // Act
      await user.click(row(LABELS.copy));
      await settle();

      // Assert
      expect(target).toBe(row(LABELS.copy).parentElement);
      expect(root().open).toBe(false);
      expect(document.activeElement).toBe(trigger());
    });

    it("stays open when the select is cancelled", async () => {
      // Arrange
      const user = await opened();
      const stop = veto("primitiv-dropdown-select");

      // Act
      await user.click(row(LABELS.copy));
      await settle();
      stop();

      // Assert
      expect(root().open).toBe(true);
    });

    it("toggles a checkbox item with a cancelable primitiv-dropdown-checked-change, and a mixed one to checked", async () => {
      // Arrange
      const user = await opened(dropdownHtml({ checked: ' checked="indeterminate"' }));
      const changes = record("primitiv-dropdown-checked-change");
      const stop = veto("primitiv-dropdown-select");

      // Act
      await user.click(row(LABELS.grid));
      await settle();
      const afterMixed = row(LABELS.grid).getAttribute("aria-checked");
      await user.click(row(LABELS.grid));
      await settle();
      stop();
      changes.stop();

      // Assert
      expect(changes.seen).toEqual([{ checked: true }, { checked: false }]);
      expect(afterMixed).toBe("true");
      expect(row(LABELS.grid).getAttribute("aria-checked")).toBe("false");
    });

    it("leaves a checkbox item as it was when its change is cancelled, but still selects", async () => {
      // Arrange
      const user = await opened();
      const stop = veto("primitiv-dropdown-checked-change");
      const selects = record("primitiv-dropdown-select");

      // Act
      await user.click(row(LABELS.grid));
      await settle();
      stop();
      selects.stop();

      // Assert
      expect(row(LABELS.grid).getAttribute("aria-checked")).toBe("false");
      expect(selects.seen).toEqual([null]);
    });

    it("sets the radio group's value with a cancelable primitiv-dropdown-value-change, and not for the checked item", async () => {
      // Arrange
      const user = await opened();
      const changes = record("primitiv-dropdown-value-change");
      const stop = veto("primitiv-dropdown-select");

      // Act
      await user.click(row(LABELS.small));
      await user.click(row(LABELS.large));
      await settle();
      stop();
      changes.stop();

      // Assert
      expect(changes.seen).toEqual([{ value: "large" }]);
      expect(document.querySelector("primitiv-dropdown-radio-group")?.getAttribute("value")).toBe("large");
    });

    it("keeps the radio group's value when its change is cancelled", async () => {
      // Arrange
      const user = await opened();
      const stop = veto("primitiv-dropdown-value-change");

      // Act
      await user.click(row(LABELS.large));
      await settle();
      stop();

      // Assert
      expect(row(LABELS.small).getAttribute("aria-checked")).toBe("true");
    });

    it("ignores a click on the menu itself, between items", async () => {
      // Arrange
      const user = await opened();
      const selects = record("primitiv-dropdown-select");

      // Act
      await user.click(document.querySelector("primitiv-dropdown-separator") as HTMLElement);
      await settle();
      selects.stop();

      // Assert
      expect(selects.seen).toEqual([]);
      expect(root().open).toBe(true);
    });
  });

  describe("the pointer", () => {
    it("highlights the item under the pointer, and only while it is there", async () => {
      // Arrange
      const user = await opened();

      // Act
      await user.hover(row(LABELS.copy));
      const over = row(LABELS.copy).hasAttribute("data-highlighted");
      await user.hover(row(LABELS.remove));

      // Assert
      expect(over).toBe(true);
      expect(row(LABELS.copy).hasAttribute("data-highlighted")).toBe(false);
      expect(row(LABELS.remove).hasAttribute("data-highlighted")).toBe(true);
    });

    it("keeps the highlight while the pointer moves within the item", async () => {
      // Arrange
      const user = await opened(
        dropdownHtml().replace(`<li>${LABELS.copy}</li>`, `<li>${LABELS.copy}<kbd id="shortcut">⌘C</kbd></li>`),
      );
      await user.hover(row(LABELS.copy));

      // Act
      await user.hover(document.getElementById("shortcut") as HTMLElement);

      // Assert
      expect(row(LABELS.copy).hasAttribute("data-highlighted")).toBe(true);
    });
  });

  describe("the submenu", () => {
    it("opens on hover with its row highlighted, and closes when the pointer reaches another row of the menu", async () => {
      // Arrange
      const user = await opened();
      const changes = record("primitiv-dropdown-sub-change");

      // Act
      await user.hover(row(LABELS.share));
      await settle();
      const openedOnHover = sub().open;
      const highlighted = row(LABELS.share).hasAttribute("data-highlighted");
      await user.hover(row(LABELS.email));
      const stillOpen = sub().open;
      await user.hover(row(LABELS.remove));
      await settle();
      changes.stop();

      // Assert
      expect(openedOnHover).toBe(true);
      expect(highlighted).toBe(true);
      expect(stillOpen).toBe(true);
      expect(sub().open).toBe(false);
      expect(shown(subContent())).toBe(false);
      expect(row(LABELS.share).hasAttribute("data-highlighted")).toBe(false);
      expect(changes.seen).toEqual([{ open: true }, { open: false }]);
    });

    it("stays open when the pointer leaves the menus altogether", async () => {
      // Arrange
      const user = await opened(dropdownHtml() + '<p id="away">Away</p>');
      await user.hover(row(LABELS.share));

      // Act
      await user.hover(document.getElementById("away") as HTMLElement);

      // Assert
      expect(sub().open).toBe(true);
    });

    it("stays shut, and its row only highlights, while its trigger is disabled", async () => {
      // Arrange
      const user = await opened(dropdownHtml().replace("<primitiv-dropdown-sub-trigger>", "<primitiv-dropdown-sub-trigger disabled>"));

      // Act
      await user.hover(row(LABELS.share));
      const highlighted = row(LABELS.share).hasAttribute("data-highlighted");
      await user.click(row(LABELS.share));
      row(LABELS.share).focus();
      await user.keyboard("{ArrowRight}");
      await settle();

      // Assert
      expect(highlighted).toBe(true);
      expect(sub().open).toBe(false);
    });

    it("opens and closes on the mirrored arrows right to left", async () => {
      // Arrange
      const user = await opened(dropdownHtml({ attrs: ' dir="rtl"' }));
      row(LABELS.share).focus();

      // Act
      await user.keyboard("{ArrowRight}");
      const afterRight = sub().open;
      await user.keyboard("{ArrowLeft}");
      await settle();
      const opened2 = sub().open;
      await user.keyboard("{ArrowRight}");
      await settle();

      // Assert
      expect(afterRight).toBe(false);
      expect(opened2).toBe(true);
      expect(sub().open).toBe(false);
      expect(document.activeElement).toBe(row(LABELS.share));
    });

    it("ignores keys on its rows other than the open arrow, and keys that are not on its trigger", async () => {
      // Arrange
      const user = await opened();
      await user.click(row(LABELS.share));
      await settle();
      row(LABELS.email).focus();

      // Act
      await user.keyboard("{ArrowRight}");
      row(LABELS.share).focus();
      await user.keyboard("{ArrowUp}");

      // Assert
      expect(sub().open).toBe(true);
      expect(document.activeElement).toBe(row(LABELS.large));
    });

    it("shows the submenu again when a cancelled close finds the browser already hiding it", async () => {
      // Arrange
      const user = await opened();
      await user.click(row(LABELS.share));
      await settle();
      const stop = veto("primitiv-dropdown-sub-change");

      // Act
      subContent().hidePopover();
      await settle();
      stop();

      // Assert
      expect(sub().open).toBe(true);
      expect(shown(subContent())).toBe(true);
    });
  });
});
