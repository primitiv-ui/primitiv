import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { modalHtml } from "./modal.fixtures";
import { close, dialog, mount, root, settle, trigger } from "./mount";

let listeners = new AbortController();

afterEach(() => {
  document.body.replaceChildren();
  listeners.abort();
  listeners = new AbortController();
});

/** Record every primitiv-modal-change, optionally vetoing it. */
function changes(veto = false) {
  const seen: Array<{ open: boolean; bubbles: boolean; cancelable: boolean }> = [];
  document.addEventListener(
    "primitiv-modal-change",
    (event) => {
      const { detail, bubbles, cancelable } = event as CustomEvent<{
        open: boolean;
      }>;
      seen.push({ open: detail.open, bubbles, cancelable });
      if (veto) event.preventDefault();
    },
    { signal: listeners.signal },
  );
  return seen;
}

describe("<primitiv-modal> interaction", () => {
  it("opens on a click on the trigger, reflecting it into the open attribute", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml());

    // Act
    await user.click(trigger());

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
    expect(dialog().open).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  it("closes on a click on a close button", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml({ open: true }));

    // Act
    await user.click(close());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(dialog().open).toBe(false);
  });

  it("opens from any of its triggers and closes from any of its close buttons", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      `<primitiv-modal>` +
        `<primitiv-modal-trigger><button type="button">A</button></primitiv-modal-trigger>` +
        `<primitiv-modal-trigger><button type="button">B</button></primitiv-modal-trigger>` +
        `<primitiv-modal-content><dialog>` +
        `<primitiv-modal-close><button type="button">X</button></primitiv-modal-close>` +
        `<primitiv-modal-close><button type="button">Y</button></primitiv-modal-close>` +
        `</dialog></primitiv-modal-content></primitiv-modal>`,
    );
    const [, b, , y] = document.querySelectorAll("button");

    // Act
    await user.click(b);
    const afterOpen = root().hasAttribute("open");
    await user.click(y);

    // Assert
    expect(afterOpen).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("keeps a trigger with no dialog to veto safely", async () => {
    // Arrange
    const user = userEvent.setup();
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    window.addEventListener("error", onError);
    changes(true);
    await mount(
      `<primitiv-modal><primitiv-modal-trigger><button type="button">Open</button></primitiv-modal-trigger></primitiv-modal>`,
    );

    // Act
    await user.click(trigger());
    window.removeEventListener("error", onError);

    // Assert
    expect(errors).toEqual([]);
    expect(root().hasAttribute("open")).toBe(false);
  });

  it("ignores a click inside the dialog that is not on a close button", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml({ open: true }));

    // Act
    await user.click(document.querySelector("input")!);

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
  });

  it("reports each change once with a bubbling, cancelable primitiv-modal-change event", async () => {
    // Arrange
    const user = userEvent.setup();
    const seen = changes();
    await mount(modalHtml());

    // Act
    await user.click(trigger());
    await user.click(close());
    await settle();

    // Assert
    expect(seen).toEqual([
      { open: true, bubbles: true, cancelable: true },
      { open: false, bubbles: true, cancelable: true },
    ]);
  });

  it("stays closed when the change event is cancelled", async () => {
    // Arrange
    const user = userEvent.setup();
    changes(true);
    await mount(modalHtml());

    // Act
    await user.click(trigger());

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(dialog().open).toBe(false);
  });

  it("closes on Escape, and stays open when that is vetoed", async () => {
    // Arrange
    await mount(modalHtml({ open: true }));
    const vetoed = new Event("cancel", { cancelable: true });
    const veto = (event: Event) => event.preventDefault();
    document.addEventListener("primitiv-modal-change", veto);

    // Act
    dialog().dispatchEvent(vetoed);
    await settle();
    const afterVeto = root().hasAttribute("open");
    document.removeEventListener("primitiv-modal-change", veto);
    dialog().dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();

    // Assert
    expect(vetoed.defaultPrevented).toBe(true);
    expect(afterVeto).toBe(true);
    expect(root().hasAttribute("open")).toBe(false);
    expect(dialog().open).toBe(false);
  });

  it("closes on a press on the backdrop", async () => {
    // Arrange
    await mount(modalHtml({ open: true }));
    dialog().getBoundingClientRect = () => ({ left: 100, top: 100, right: 300, bottom: 300 }) as DOMRect;

    // Act
    fireEvent.pointerDown(dialog(), { clientX: 10, clientY: 10 });
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
  });

  it('follows a dialog closed natively, as a <form method="dialog"> does', async () => {
    // Arrange
    const seen = changes();
    await mount(modalHtml({ open: true }));

    // Act
    dialog().close();
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(false);
    expect(seen.map(({ open }) => open)).toEqual([false]);
  });

  it("reopens a dialog closed natively when that change is vetoed", async () => {
    // Arrange
    changes(true);
    await mount(modalHtml({ open: true }));

    // Act
    dialog().close();
    await settle();

    // Assert
    expect(root().hasAttribute("open")).toBe(true);
    expect(dialog().open).toBe(true);
  });

  it("follows open set from outside, as an attribute or a property, announcing nothing", async () => {
    // Arrange
    const seen = changes();
    await mount(modalHtml());

    // Act
    root().setAttribute("open", "");
    await settle();
    const afterAttribute = dialog().open;
    root().open = false;
    await settle();

    // Assert
    expect(afterAttribute).toBe(true);
    expect(root().open).toBe(false);
    expect(root().hasAttribute("open")).toBe(false);
    expect(dialog().open).toBe(false);
    expect(seen).toEqual([]);
  });

  it("wraps Tab inside the open dialog", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(modalHtml({ open: true }));
    close().focus();

    // Act
    await user.tab();

    // Assert
    expect(document.activeElement).toBe(document.querySelector("input"));
  });
});
