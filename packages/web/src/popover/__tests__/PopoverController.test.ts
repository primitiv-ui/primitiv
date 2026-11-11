import "./popover-polyfill";

import { fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { PopoverController, type PopoverControllerHost } from "../PopoverController";

type Recorded = PopoverControllerHost & { changes: boolean[]; open: boolean };

/** A host that starts `open`, records every change, and owns `trigger`. */
function hostWith(open: boolean, trigger: HTMLElement, extra: Partial<PopoverControllerHost> = {}): Recorded {
  const host: Recorded = {
    open,
    changes: [],
    state: () => ({ open: host.open }),
    change(next) {
      host.changes.push(next);
    },
    trigger: () => trigger,
    ...extra,
  };
  return host;
}

/** A trigger, an outside button and a connected controller over a popover panel holding `inner`. */
function connected(open = false, inner = "<button>Inside</button>", extra: Partial<PopoverControllerHost> = {}) {
  document.body.innerHTML = `<button id="trigger">Open</button><button id="outside">Outside</button><div id="content" popover="auto" tabindex="-1">${inner}</div>`;
  const trigger = document.getElementById("trigger") as HTMLButtonElement;
  const content = document.getElementById("content") as HTMLElement;
  const host = hostWith(open, trigger, extra);
  const controller = new PopoverController(content, host);
  controller.connect();
  return { trigger, content, host, controller, outside: document.getElementById("outside") as HTMLButtonElement };
}

const shown = (content: HTMLElement) => content.hasAttribute("data-popover-open");

afterEach(() => {
  document.body.replaceChildren();
});

describe("PopoverController", () => {
  describe("sync", () => {
    it("shows the panel and moves focus to its first focusable when the host is open", () => {
      // Arrange
      const { content, controller } = connected(true);

      // Act
      controller.sync();

      // Assert
      expect(shown(content)).toBe(true);
      expect(document.activeElement).toBe(content.querySelector("button"));
    });

    it("focuses the panel itself when it holds nothing focusable", () => {
      // Arrange
      const { content, controller } = connected(true, "Just text");

      // Act
      controller.sync();

      // Assert
      expect(document.activeElement).toBe(content);
    });

    it("hands the browser the anchor to position against", () => {
      // Arrange
      const anchor = document.createElement("span");
      const { content, controller } = connected(true, "Text", { source: () => anchor });
      const showPopover = vi.spyOn(content, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith({ source: anchor });
    });

    it("passes no options without an anchor", () => {
      // Arrange
      const { content, controller } = connected(true, "Text");
      const showPopover = vi.spyOn(content, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledWith();
    });

    it("shows once, and moves focus once, however often it syncs while open", () => {
      // Arrange
      const { content, controller, outside } = connected(true);
      controller.sync();
      outside.focus();
      const showPopover = vi.spyOn(content, "showPopover");

      // Act
      controller.sync();

      // Assert
      expect(showPopover).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(outside);
    });

    it("hides the panel when the host closes", () => {
      // Arrange
      const { content, controller, host } = connected(true);
      controller.sync();
      host.open = false;

      // Act
      controller.sync();

      // Assert
      expect(shown(content)).toBe(false);
    });

    it("hides nothing that it never showed", () => {
      // Arrange
      const { content, controller } = connected(false);
      const hidePopover = vi.spyOn(content, "hidePopover");

      // Act
      controller.sync();

      // Assert
      expect(hidePopover).not.toHaveBeenCalled();
    });

    it("survives a browser that already hid the panel", () => {
      // Arrange
      const { content, controller, host } = connected(true);
      controller.sync();
      vi.spyOn(content, "hidePopover").mockImplementation(() => {
        throw new DOMException("not showing", "InvalidStateError");
      });
      host.open = false;

      // Act & Assert
      expect(() => controller.sync()).not.toThrow();
    });

    it("shows again after a close that fired no toggle event", () => {
      // Arrange
      const { content, controller, host } = connected(true);
      controller.sync();
      vi.spyOn(content, "hidePopover").mockImplementation(() => {});
      const showPopover = vi.spyOn(content, "showPopover");
      host.open = false;
      controller.sync();
      host.open = true;

      // Act
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
    });

    it("shows again after a close", () => {
      // Arrange
      const { content, controller, host } = connected(true);
      controller.sync();
      host.open = false;
      controller.sync();
      host.open = true;

      // Act
      controller.sync();

      // Assert
      expect(shown(content)).toBe(true);
    });
  });

  describe("dismissal", () => {
    it("follows the browser light-dismissing the panel", () => {
      // Arrange
      const { content, controller, host } = connected(true);
      controller.sync();
      const toggle = Object.assign(new Event("toggle"), { newState: "closed" });

      // Act
      content.dispatchEvent(toggle);
      host.open = true;
      controller.sync();

      // Assert
      expect(host.changes).toEqual([false]);
      expect(shown(content)).toBe(true);
    });

    it("ignores the toggle that reports it opening", () => {
      // Arrange
      const { content, host } = connected(false);

      // Act
      content.dispatchEvent(Object.assign(new Event("toggle"), { newState: "open" }));

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("closes on Escape inside the panel and hands focus back to the trigger", () => {
      // Arrange
      const { content, controller, host, trigger } = connected(true);
      controller.sync();

      // Act
      const notCancelled = fireEvent.keyDown(content.querySelector("button")!, { key: "Escape" });

      // Assert
      expect(notCancelled).toBe(false);
      expect(host.changes).toEqual([false]);
      expect(document.activeElement).toBe(trigger);
    });

    it("leaves an Escape that a popover nested inside it already handled", () => {
      // Arrange
      const { content, host } = connected(true);
      const nested = content.querySelector("button")!;
      nested.addEventListener("keydown", (event) => event.preventDefault());

      // Act
      fireEvent.keyDown(nested, { key: "Escape" });

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("leaves other keys alone", () => {
      // Arrange
      const { content, host } = connected(true);

      // Act
      const notCancelled = fireEvent.keyDown(content, { key: "Enter" });

      // Assert
      expect(notCancelled).toBe(true);
      expect(host.changes).toEqual([]);
    });

    it("closes on a press outside where the browser has no light dismiss", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host, outside } = connected(true);

      // Act
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("ignores a press on the trigger or inside a popover", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host, trigger, content } = connected(true);

      // Act
      await user.click(trigger);
      await user.click(content.querySelector("button")!);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("ignores an outside press while closed", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host, outside } = connected(false);

      // Act
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("leaves an outside press to a browser that light-dismisses natively", async () => {
      // Arrange
      const user = userEvent.setup();
      Object.defineProperty(HTMLElement.prototype, "popover", { configurable: true, get: () => "auto" });
      try {
        const { host, outside } = connected(true);

        // Act
        await user.click(outside);

        // Assert
        expect(host.changes).toEqual([]);
      } finally {
        delete (HTMLElement.prototype as unknown as { popover?: unknown }).popover;
      }
    });

    it("treats every outside press as outside when there is no trigger", async () => {
      // Arrange
      const user = userEvent.setup();
      const { host, outside } = connected(true, "Text", { trigger: () => null });

      // Act
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("works without a trigger to hand focus back to", () => {
      // Arrange
      const { content, controller, host } = connected(true, "Text", { trigger: () => null });
      controller.sync();

      // Act
      fireEvent.keyDown(content, { key: "Escape" });

      // Assert
      expect(host.changes).toEqual([false]);
    });
  });

  describe("lifecycle", () => {
    it("stops listening once disconnected", async () => {
      // Arrange
      const user = userEvent.setup();
      const { content, controller, host, outside } = connected(true);

      // Act
      controller.disconnect();
      content.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));
      fireEvent.keyDown(content, { key: "Escape" });
      await user.click(outside);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("can be disconnected before it was ever connected", () => {
      // Arrange
      const controller = new PopoverController(document.createElement("div"), hostWith(false, document.body));

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
    });

    it("never stacks a second set of listeners when connected twice", () => {
      // Arrange
      const { content, controller, host } = connected(true);

      // Act
      controller.connect();
      content.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("forgets the panel was showing once disconnected, so a reconnect shows it again", () => {
      // Arrange
      const { content, controller } = connected(true);
      controller.sync();
      const showPopover = vi.spyOn(content, "showPopover");

      // Act
      controller.disconnect();
      controller.connect();
      controller.sync();

      // Assert
      expect(showPopover).toHaveBeenCalledTimes(1);
    });
  });

  describe("placement", () => {
    /** Stub an element's box: jsdom lays nothing out. */
    const at = (element: HTMLElement, left: number, top: number, width: number, height: number) => {
      element.getBoundingClientRect = () => ({ left, top, right: left + width, bottom: top + height }) as DOMRect;
    };
    /** The browser's scroll or resize, which jsdom cannot produce: no input device scrolls it. */
    const browser = (type: "scroll" | "resize") => window.dispatchEvent(new Event(type));

    it("marks the side and alignment the panel landed on as it shows", () => {
      // Arrange
      const { trigger, content, controller } = connected(true);
      at(trigger, 100, 100, 60, 20);
      at(content, 80, 130, 100, 50);

      // Act
      controller.sync();

      // Assert
      expect(content.getAttribute("data-side")).toBe("bottom");
      expect(content.getAttribute("data-align")).toBe("center");
    });

    it("measures against the anchor it was shown from, over the trigger", () => {
      // Arrange
      const anchor = document.createElement("span");
      document.body.append(anchor);
      const { trigger, content, controller } = connected(true, "Text", { source: () => anchor });
      at(trigger, 100, 100, 60, 20);
      at(anchor, 400, 300, 60, 20);
      at(content, 380, 200, 100, 50);

      // Act
      controller.sync();

      // Assert
      expect(content.getAttribute("data-side")).toBe("top");
    });

    it("follows the panel as the page scrolls and resizes while it is open", () => {
      // Arrange
      const { trigger, content, controller } = connected(true);
      at(trigger, 100, 100, 60, 20);
      at(content, 80, 130, 100, 50);
      controller.sync();

      // Act
      at(content, 80, 40, 100, 50);
      browser("scroll");
      const afterScroll = content.getAttribute("data-side");
      at(content, 170, 85, 100, 50);
      browser("resize");

      // Assert
      expect(afterScroll).toBe("top");
      expect(content.getAttribute("data-side")).toBe("right");
    });

    it("follows a scroll inside a scrolling container, which does not bubble to the window", () => {
      // Arrange
      const { trigger, content, controller } = connected(true);
      const pane = document.body.appendChild(document.createElement("div"));
      at(trigger, 100, 100, 60, 20);
      at(content, 80, 130, 100, 50);
      controller.sync();

      // Act — the browser's scroll of an overflow pane, which jsdom cannot produce.
      at(content, 80, 40, 100, 50);
      pane.dispatchEvent(new Event("scroll"));

      // Assert
      expect(content.getAttribute("data-side")).toBe("top");
    });

    it("stops following once hidden, and once disconnected", () => {
      // Arrange
      const { trigger, content, host, controller } = connected(true);
      at(trigger, 100, 100, 60, 20);
      at(content, 80, 130, 100, 50);
      controller.sync();
      host.open = false;
      controller.sync();
      at(content, 80, 40, 100, 50);
      browser("scroll");
      const afterHide = content.getAttribute("data-side");
      host.open = true;
      controller.sync();
      controller.disconnect();

      // Act
      at(content, 170, 85, 100, 50);
      browser("resize");

      // Assert
      expect(afterHide).toBe("bottom");
      expect(content.getAttribute("data-side")).toBe("top");
    });

    it("stops following once the browser dismisses it", () => {
      // Arrange
      const { trigger, content, controller } = connected(true);
      at(trigger, 100, 100, 60, 20);
      at(content, 80, 130, 100, 50);
      controller.sync();

      // Act
      content.hidePopover();
      at(content, 80, 40, 100, 50);
      browser("scroll");

      // Assert
      expect(content.getAttribute("data-side")).toBe("bottom");
    });

    it("marks nothing with no anchor to measure against", () => {
      // Arrange
      const { content, controller } = connected(true, "Text", { trigger: () => null });

      // Act
      controller.sync();
      browser("scroll");

      // Assert
      expect(content.hasAttribute("data-side")).toBe(false);
    });
  });
});
