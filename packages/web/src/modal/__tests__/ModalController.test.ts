import "./dialog-polyfill";

import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { ModalController, type ModalControllerHost } from "../ModalController";

type Recorded = ModalControllerHost & { changes: boolean[]; open: boolean };

/** A host that starts `open` and records every change it is asked for. */
function hostWith(open = false, extra: Partial<ModalControllerHost> = {}): Recorded {
  const host: Recorded = {
    open,
    changes: [],
    state: () => ({ open: host.open }),
    change(next) {
      host.changes.push(next);
    },
    ...extra,
  };
  return host;
}

/** A connected controller over a `<dialog>` holding `inner` markup. */
function connected(host: ModalControllerHost, inner = "<button>First</button><button>Last</button>") {
  const dialog = document.createElement("dialog");
  dialog.innerHTML = inner;
  document.body.append(dialog);
  const controller = new ModalController(dialog, host);
  controller.connect();
  return { dialog, controller };
}

/** Pretend the dialog occupies (100,100)-(300,300) in the viewport. */
function placed(dialog: HTMLDialogElement) {
  dialog.getBoundingClientRect = () => ({ left: 100, top: 100, right: 300, bottom: 300 }) as DOMRect;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ModalController", () => {
  describe("sync", () => {
    it("shows the dialog modally when the host is open", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host);
      const showModal = vi.spyOn(dialog, "showModal");

      // Act
      controller.sync();

      // Assert
      expect(showModal).toHaveBeenCalledTimes(1);
      expect(dialog.open).toBe(true);
    });

    it("closes the dialog when the host is closed", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host);
      controller.sync();
      host.open = false;

      // Act
      controller.sync();

      // Assert
      expect(dialog.open).toBe(false);
    });

    it("leaves a dialog that already matches the host alone", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host);
      controller.sync();
      const showModal = vi.spyOn(dialog, "showModal");
      const close = vi.spyOn(dialog, "close");

      // Act
      controller.sync();
      host.open = false;
      controller.sync();
      controller.sync();

      // Assert
      expect(showModal).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  describe("dismissal", () => {
    it("asks the host to close when the dialog closes natively", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog } = connected(host);

      // Act
      fireEvent(dialog, new Event("close"));

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("takes Escape over from the browser and asks the host to close", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog } = connected(host);
      const cancel = new Event("cancel", { cancelable: true });

      // Act
      dialog.dispatchEvent(cancel);

      // Assert
      expect(cancel.defaultPrevented).toBe(true);
      expect(host.changes).toEqual([false]);
    });

    it("lets the host veto Escape, still keeping the browser from closing", () => {
      // Arrange
      const escapeKeyDown = vi.fn((event: Event) => event.preventDefault());
      const host = hostWith(true, { escapeKeyDown });
      const { dialog } = connected(host);
      const cancel = new Event("cancel", { cancelable: true });

      // Act
      dialog.dispatchEvent(cancel);

      // Assert
      expect(escapeKeyDown).toHaveBeenCalledWith(cancel);
      expect(cancel.defaultPrevented).toBe(true);
      expect(host.changes).toEqual([]);
    });

    it("asks the host to close on a press outside the dialog's box", () => {
      // Arrange
      const pointerDownOutside = vi.fn();
      const host = hostWith(true, { pointerDownOutside });
      const { dialog } = connected(host);
      placed(dialog);

      // Act
      fireEvent.pointerDown(dialog, { clientX: 50, clientY: 50 });

      // Assert
      expect(pointerDownOutside).toHaveBeenCalledTimes(1);
      expect(host.changes).toEqual([false]);
    });

    it("lets the host veto a press outside", () => {
      // Arrange
      const host = hostWith(true, { pointerDownOutside: (event) => event.preventDefault() });
      const { dialog } = connected(host);
      placed(dialog);

      // Act
      fireEvent.pointerDown(dialog, { clientX: 350, clientY: 200 });

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("ignores a press on something inside the dialog that hangs outside its box", () => {
      // A select's list is a top-layer popover, so it can paint past the dialog's
      // edge while still being the dialog's descendant: pressing an option there
      // is a press in the dialog, not on the backdrop.
      const pointerDownOutside = vi.fn();
      const host = hostWith(true, { pointerDownOutside });
      const { dialog } = connected(host, '<div role="listbox"><div role="option">Work</div></div>');
      placed(dialog);

      // Act
      fireEvent.pointerDown(dialog.querySelector('[role="option"]') as HTMLElement, { clientX: 200, clientY: 360 });

      // Assert
      expect(pointerDownOutside).not.toHaveBeenCalled();
      expect(host.changes).toEqual([]);
    });

    it("ignores a press inside the dialog's box", () => {
      // Arrange
      const pointerDownOutside = vi.fn();
      const host = hostWith(true, { pointerDownOutside });
      const { dialog } = connected(host);
      placed(dialog);

      // Act
      fireEvent.pointerDown(dialog, { clientX: 200, clientY: 200 });

      // Assert
      expect(pointerDownOutside).not.toHaveBeenCalled();
      expect(host.changes).toEqual([]);
    });

    it("works without the optional host hooks", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog } = connected(host);
      placed(dialog);

      // Act
      fireEvent.pointerDown(dialog, { clientX: 0, clientY: 0 });

      // Assert
      expect(host.changes).toEqual([false]);
    });
  });

  describe("focus trap", () => {
    it("wraps Tab from the last focusable to the first", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith(true);
      const { dialog, controller } = connected(host);
      controller.sync();
      const [first, last] = dialog.querySelectorAll("button");
      last.focus();

      // Act
      await user.tab();

      // Assert
      expect(document.activeElement).toBe(first);
    });

    it("wraps Shift+Tab from the first focusable to the last", async () => {
      // Arrange
      const user = userEvent.setup();
      const host = hostWith(true);
      const { dialog, controller } = connected(host);
      controller.sync();
      const [first, last] = dialog.querySelectorAll("button");
      first.focus();

      // Act
      await user.tab({ shift: true });

      // Assert
      expect(document.activeElement).toBe(last);
    });

    it("leaves an interior Tab to the browser", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host, "<button>A</button><button>B</button><button>C</button>");
      controller.sync();
      dialog.querySelector("button")!.focus();

      // Act
      const notCancelled = fireEvent.keyDown(document.activeElement!, { key: "Tab" });

      // Assert
      expect(notCancelled).toBe(true);
    });

    it("blocks Tab in a dialog with nothing focusable", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host, "<p>Nothing to focus</p>");
      controller.sync();

      // Act
      const notCancelled = fireEvent.keyDown(dialog, { key: "Tab" });

      // Assert
      expect(notCancelled).toBe(false);
    });

    it("does nothing while the dialog is closed", () => {
      // Arrange
      const host = hostWith(false);
      const { dialog } = connected(host, "<p>Nothing to focus</p>");

      // Act
      const notCancelled = fireEvent.keyDown(dialog, { key: "Tab" });

      // Assert
      expect(notCancelled).toBe(true);
    });
  });

  describe("lifecycle", () => {
    it("stops listening once disconnected", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host);

      // Act
      controller.disconnect();
      fireEvent(dialog, new Event("close"));

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("stops handling Escape, backdrop presses and Tab once disconnected", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host, "<p>Nothing to focus</p>");
      controller.sync();
      placed(dialog);
      const cancel = new Event("cancel", { cancelable: true });

      // Act
      controller.disconnect();
      dialog.dispatchEvent(cancel);
      fireEvent.pointerDown(dialog, { clientX: 0, clientY: 0 });
      const tabNotCancelled = fireEvent.keyDown(dialog, { key: "Tab" });

      // Assert
      expect(cancel.defaultPrevented).toBe(false);
      expect(tabNotCancelled).toBe(true);
      expect(host.changes).toEqual([]);
    });

    it("can be disconnected before it was ever connected", () => {
      // Arrange
      const controller = new ModalController(document.createElement("dialog"), hostWith());

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
    });

    it("never stacks a second set of listeners when connected twice", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host);

      // Act
      controller.connect();
      fireEvent(dialog, new Event("close"));

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("resumes listening when connected again", () => {
      // Arrange
      const host = hostWith(true);
      const { dialog, controller } = connected(host);
      controller.disconnect();

      // Act
      controller.connect();
      fireEvent(dialog, new Event("close"));

      // Assert
      expect(host.changes).toEqual([false]);
    });
  });
});
