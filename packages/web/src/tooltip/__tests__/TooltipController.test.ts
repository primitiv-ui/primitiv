import { fireEvent } from "@testing-library/dom";

import { TooltipController, type TooltipControllerHost } from "../TooltipController";
import { TooltipGroup } from "../TooltipGroup";

type Recorded = TooltipControllerHost & { changes: boolean[]; open: boolean; group: TooltipGroup };

/** A host with a 700ms delay that records every change and applies it. */
function hostWith(open = false, extra: Partial<TooltipControllerHost> = {}): Recorded {
  const content = document.body.appendChild(document.createElement("div"));
  content.innerHTML = "<span>Inside</span>";
  const group = new TooltipGroup(() => 300);
  const host: Recorded = {
    open,
    changes: [],
    group,
    state: () => ({ open: host.open }),
    change(next) {
      host.changes.push(next);
      host.open = next;
    },
    delay: () => 700,
    tooltipGroup: () => group,
    content: () => content,
    ...extra,
  };
  return host;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("TooltipController", () => {
  describe("opening", () => {
    it("opens after the delay on hover, and tells the group", () => {
      // Arrange
      const host = hostWith();
      const controller = new TooltipController(host);

      // Act
      controller.hoverStart();
      vi.advanceTimersByTime(699);
      const early = [...host.changes];
      vi.advanceTimersByTime(1);

      // Assert
      expect(early).toEqual([]);
      expect(host.changes).toEqual([true]);
      expect(host.group.isOpen()).toBe(true);
    });

    it("opens at once on hover while the group is in its skip window", () => {
      // Arrange
      const host = hostWith();
      host.group.opened();
      const controller = new TooltipController(host);

      // Act
      controller.hoverStart();

      // Assert
      expect(host.changes).toEqual([true]);
    });

    it("opens at once with no delay", () => {
      // Arrange
      const host = hostWith(false, { delay: () => 0 });
      const controller = new TooltipController(host);

      // Act
      controller.hoverStart();

      // Assert
      expect(host.changes).toEqual([true]);
    });

    it("opens now, cancelling a pending hover open", () => {
      // Arrange
      const host = hostWith();
      const controller = new TooltipController(host);
      controller.hoverStart();

      // Act
      controller.openNow();
      vi.advanceTimersByTime(700);

      // Assert
      expect(host.changes).toEqual([true]);
    });
  });

  describe("closing", () => {
    it("closes after the grace period once the pointer leaves, and starts the group's skip window", () => {
      // Arrange
      const host = hostWith(true);
      host.group.opened();
      const controller = new TooltipController(host);

      // Act
      controller.hoverEnd();
      vi.advanceTimersByTime(99);
      const early = [...host.changes];
      vi.advanceTimersByTime(1);
      vi.advanceTimersByTime(300);

      // Assert
      expect(early).toEqual([]);
      expect(host.changes).toEqual([false]);
      expect(host.group.isOpen()).toBe(false);
    });

    it("cancels a pending hover open when the pointer leaves first", () => {
      // Arrange
      const host = hostWith();
      const controller = new TooltipController(host);
      controller.hoverStart();

      // Act
      controller.hoverEnd();
      vi.advanceTimersByTime(1000);

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("holds it open when the pointer reaches the content within the grace period", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.hoverEnd();

      // Act
      controller.holdOpen();
      vi.advanceTimersByTime(1000);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("closes now, cancelling a pending grace close, and starts the group's skip window", () => {
      // Arrange
      const host = hostWith(true);
      host.group.opened();
      const controller = new TooltipController(host);
      controller.hoverEnd();

      // Act
      controller.closeNow();
      vi.advanceTimersByTime(1000);

      // Assert
      expect(host.changes).toEqual([false]);
      expect(host.group.isOpen()).toBe(false);
    });

    it("reports every close it is asked for, even when already closed", () => {
      // Arrange
      const host = hostWith(false);
      const controller = new TooltipController(host);

      // Act
      controller.closeNow();
      controller.closeNow();

      // Assert
      expect(host.changes).toEqual([false, false]);
    });
  });

  describe("dismissal while open", () => {
    it("closes on Escape anywhere, unless the host vetoes it", () => {
      // Arrange
      const escapeKeyDown = vi.fn((event: KeyboardEvent) => {
        if (escapeKeyDown.mock.calls.length === 1) event.preventDefault();
      });
      const host = hostWith(true, { escapeKeyDown });
      const controller = new TooltipController(host);
      controller.sync();

      // Act
      fireEvent.keyDown(document, { key: "Escape" });
      const afterVeto = [...host.changes];
      fireEvent.keyDown(document, { key: "Escape" });

      // Assert
      expect(afterVeto).toEqual([]);
      expect(host.changes).toEqual([false]);
    });

    it("ignores other keys", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.sync();

      // Act
      fireEvent.keyDown(document, { key: "Enter" });

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("closes on a press outside the content, unless the host vetoes it", () => {
      // Arrange
      let veto = true;
      const host = hostWith(true, { pointerDownOutside: (event) => veto && event.preventDefault() });
      const controller = new TooltipController(host);
      controller.sync();

      // Act
      fireEvent.pointerDown(document.body);
      const afterVeto = [...host.changes];
      veto = false;
      fireEvent.pointerDown(document.body);

      // Assert
      expect(afterVeto).toEqual([]);
      expect(host.changes).toEqual([false]);
    });

    it("ignores a press inside the content", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.sync();

      // Act
      fireEvent.pointerDown(host.content()!.querySelector("span")!);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("treats every press as outside when there is no content", () => {
      // Arrange
      const host = hostWith(true, { content: () => null });
      const controller = new TooltipController(host);
      controller.sync();

      // Act
      fireEvent.pointerDown(document.body);

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("listens only while open", () => {
      // Arrange
      const host = hostWith(false);
      const controller = new TooltipController(host);
      controller.sync();

      // Act
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.pointerDown(document.body);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("stops listening once it syncs closed, and listens once however often it syncs open", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.sync();
      controller.sync();

      // Act
      fireEvent.keyDown(document, { key: "Escape" });
      controller.sync();
      fireEvent.keyDown(document, { key: "Escape" });

      // Assert
      expect(host.changes).toEqual([false]);
    });
    it("keeps hearing presses outside however often it syncs open", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.sync();
      controller.sync();

      // Act
      fireEvent.pointerDown(document.body);

      // Assert
      expect(host.changes).toEqual([false]);
    });

    it("stops hearing presses outside once it syncs closed", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.sync();
      host.open = false;

      // Act
      controller.sync();
      fireEvent.pointerDown(document.body);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("lifecycle", () => {
    it("cancels its timers and its listeners when disconnected", () => {
      // Arrange
      const host = hostWith(true);
      const controller = new TooltipController(host);
      controller.sync();
      controller.hoverEnd();

      // Act
      controller.disconnect();
      vi.advanceTimersByTime(1000);
      fireEvent.keyDown(document, { key: "Escape" });

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("cancels a pending hover open when disconnected", () => {
      // Arrange
      const host = hostWith();
      const controller = new TooltipController(host);
      controller.hoverStart();

      // Act
      controller.disconnect();
      vi.advanceTimersByTime(1000);

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("placement", () => {
    /** Stub an element's box: jsdom lays nothing out. */
    const at = (element: HTMLElement, left: number, top: number, width: number, height: number) => {
      element.getBoundingClientRect = () => ({ left, top, right: left + width, bottom: top + height }) as DOMRect;
    };
    /** The browser's scroll or resize, which jsdom cannot produce: no input device scrolls it. */
    const browser = (type: "scroll" | "resize") => window.dispatchEvent(new Event(type));

    /** An open host whose tooltip sits above an anchor. */
    function placed() {
      const anchor = document.body.appendChild(document.createElement("button"));
      const host = hostWith(true, { anchor: () => anchor });
      const content = host.content() as HTMLElement;
      at(anchor, 100, 100, 60, 20);
      at(content, 80, 40, 100, 50);
      return { host, content, controller: new TooltipController(host) };
    }

    it("marks the side and alignment the tooltip landed on once it is open", () => {
      // Arrange
      const { content, controller } = placed();

      // Act
      controller.sync();

      // Assert
      expect(content.getAttribute("data-side")).toBe("top");
      expect(content.getAttribute("data-align")).toBe("center");
    });

    it("follows the tooltip as the page scrolls and resizes while it is open, once however often it syncs", () => {
      // Arrange
      const { content, controller } = placed();
      controller.sync();
      controller.sync();
      let measured = 0;
      content.getBoundingClientRect = () => {
        measured++;
        return { left: 80, top: 130, right: 180, bottom: 180 } as DOMRect;
      };

      // Act
      browser("scroll");
      const afterScroll = content.getAttribute("data-side");
      at(content, 170, 85, 100, 50);
      browser("resize");

      // Assert
      expect(afterScroll).toBe("bottom");
      expect(measured).toBe(1);
      expect(content.getAttribute("data-side")).toBe("right");
    });

    it("stops following once closed, and once disconnected", () => {
      // Arrange
      const { host, content, controller } = placed();
      controller.sync();
      host.open = false;
      controller.sync();
      at(content, 80, 130, 100, 50);
      browser("scroll");
      const afterClose = content.getAttribute("data-side");
      host.open = true;
      controller.sync();
      controller.disconnect();

      // Act
      at(content, 170, 85, 100, 50);
      browser("resize");

      // Assert
      expect(afterClose).toBe("top");
      expect(content.getAttribute("data-side")).toBe("bottom");
    });

    it("marks nothing without an anchor or a tooltip to measure", () => {
      // Arrange
      const anchorless = hostWith(true);
      const contentless = hostWith(true, { anchor: () => document.body, content: () => null });

      // Act
      new TooltipController(anchorless).sync();
      new TooltipController(contentless).sync();
      browser("scroll");

      // Assert
      expect((anchorless.content() as HTMLElement).hasAttribute("data-side")).toBe(false);
    });
  });
});
