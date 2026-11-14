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
});
