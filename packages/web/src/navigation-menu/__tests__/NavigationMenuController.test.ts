import { NavigationMenuController, type NavigationMenuControllerHost } from "../NavigationMenuController";

type State = ReturnType<NavigationMenuControllerHost["state"]>;
type Recorded = NavigationMenuControllerHost & { changes: string[]; current: State };

/**
 * A host over a bar of two triggers (docs, blog) and a link, each with a
 * panel holding one link, that records every change and applies it.
 */
function hostWith(value = "", extra: Partial<State> = {}): Recorded {
  document.body.innerHTML = `
    <nav>
      <button id="docs">Docs</button><button id="blog">Blog</button><a id="pricing" href="#p">Pricing</a>
      <div id="docs-panel"><a href="#g">Guides</a></div>
      <div id="blog-panel"><span>No links</span></div>
    </nav>
    <button id="outside">Outside</button>`;
  const byId = (id: string) => document.getElementById(id);
  const host: Recorded = {
    changes: [],
    current: { value, orientation: "horizontal", dir: "ltr", openOnHover: true, delay: 200, closeDelay: 150, ...extra },
    state: () => host.current,
    change(next) {
      host.changes.push(next);
      host.current = { ...host.current, value: next };
    },
    trigger: (entry) => byId(entry),
    panel: (entry) => byId(`${entry}-panel`),
    entries: () => ["docs", "blog", "pricing"].map((id) => byId(id) as HTMLElement),
  };
  return host;
}

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("NavigationMenuController", () => {
  describe("clicks", () => {
    it("opens a closed entry, and closes it again", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerClick("docs");
      controller.triggerClick("docs");

      // Assert
      expect(host.changes).toEqual(["docs", ""]);
    });

    it("toggles against what was open when the pointer arrived, so a click after a hover open keeps it", () => {
      // Arrange
      const host = hostWith("", { delay: 0 });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.triggerClick("docs");

      // Assert
      expect(host.changes).toEqual(["docs", "docs"]);
    });

    it("spends the arrival on that click, so a second click closes", () => {
      // Arrange
      const host = hostWith("", { delay: 0 });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.triggerClick("docs");
      controller.triggerClick("docs");

      // Assert
      expect(host.changes).toEqual(["docs", "docs", ""]);
    });

    it("forgets the arrival once the pointer leaves", () => {
      // Arrange
      const host = hostWith("", { delay: 0 });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.triggerPointerLeave();
      controller.triggerClick("docs");

      // Assert
      expect(host.changes).toEqual(["docs", ""]);
    });

    it("keeps one trigger's arrival when another trigger is clicked", () => {
      // Arrange
      const host = hostWith("docs", { openOnHover: false });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.triggerClick("blog");
      controller.triggerClick("docs");

      // Assert
      expect(host.changes).toEqual(["blog", ""]);
    });

    it("cancels a pending hover open, since a click is a decision", () => {
      // Arrange
      vi.useFakeTimers();
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.triggerClick("blog");
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual(["blog"]);
    });
  });

  describe("hover intent", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("opens after the delay", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      vi.advanceTimersByTime(199);
      const early = [...host.changes];
      vi.advanceTimersByTime(1);

      // Assert
      expect(early).toEqual([]);
      expect(host.changes).toEqual(["docs"]);
    });

    it("opens at once with no delay", () => {
      // Arrange
      const host = hostWith("", { delay: 0 });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");

      // Assert
      expect(host.changes).toEqual(["docs"]);
    });

    it("swaps to a sibling at once while a panel is open", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("blog");

      // Assert
      expect(host.changes).toEqual(["blog"]);
    });

    it("cancels the pending open when the pointer leaves first", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.triggerPointerLeave();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("restarts the delay when the pointer crosses to another trigger before it opens", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      vi.advanceTimersByTime(100);
      controller.triggerPointerEnter("blog");
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual(["blog"]);
    });

    it("does nothing on hover when hover-to-open is off", () => {
      // Arrange
      const host = hostWith("", { openOnHover: false });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("closes after the close delay once the pointer leaves the nav", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.rootPointerLeave();
      vi.advanceTimersByTime(149);
      const early = [...host.changes];
      vi.advanceTimersByTime(1);

      // Assert
      expect(early).toEqual([]);
      expect(host.changes).toEqual([""]);
    });

    it("stays open when the pointer comes back before the close delay", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.rootPointerLeave();
      controller.rootPointerEnter();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("replaces a pending close on a second leave, so one return keeps it open", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.rootPointerLeave();
      controller.rootPointerLeave();
      controller.rootPointerEnter();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("cancels a pending hover open as the pointer leaves the nav", () => {
      // Arrange
      const host = hostWith("", { closeDelay: 1000 });
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerPointerEnter("docs");
      controller.rootPointerLeave();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("cancels a pending close when hover opens another entry", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.rootPointerLeave();
      controller.triggerPointerEnter("blog");
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual(["blog"]);
    });

    it("cancels every timer as it disconnects", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      controller.triggerPointerEnter("docs");
      const leavingHost = hostWith("docs");
      const leaving = new NavigationMenuController(leavingHost);
      leaving.rootPointerLeave();

      // Act
      controller.disconnect();
      leaving.disconnect();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([]);
      expect(leavingHost.changes).toEqual([]);
    });
  });
});
