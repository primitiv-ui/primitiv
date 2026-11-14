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

  describe("keyboard", () => {
    const key = (k: string) => new KeyboardEvent("keydown", { key: k, cancelable: true });
    const el = (id: string) => document.getElementById(id) as HTMLElement;

    it("travels the top-level entries with the arrows and claims the key", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      const event = key("ArrowRight");

      // Act
      controller.travel(el("blog"), event);

      // Assert
      expect(document.activeElement).toBe(el("pricing"));
      expect(event.defaultPrevented).toBe(true);
    });

    it("reads the axis and direction live", () => {
      // Arrange
      const host = hostWith("", { orientation: "vertical" });
      const controller = new NavigationMenuController(host);

      // Act
      controller.travel(el("docs"), key("ArrowUp"));

      // Assert
      expect(document.activeElement).toBe(el("pricing"));
    });

    it("mirrors under RTL", () => {
      // Arrange
      const host = hostWith("", { dir: "rtl" });
      const controller = new NavigationMenuController(host);

      // Act
      controller.travel(el("docs"), key("ArrowLeft"));

      // Assert
      expect(document.activeElement).toBe(el("blog"));
    });

    it("leaves a key it does not travel with alone", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      el("docs").focus();
      const event = key("Enter");

      // Act
      controller.travel(el("docs"), event);

      // Assert
      expect(document.activeElement).toBe(el("docs"));
      expect(event.defaultPrevented).toBe(false);
    });

    it("opens a closed panel with the enter-panel arrow, and focuses it once the host syncs", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      el("docs").focus();
      const event = key("ArrowDown");

      // Act
      controller.triggerKeydown("docs", el("docs"), event);
      const before = document.activeElement;
      controller.sync();

      // Assert
      expect(event.defaultPrevented).toBe(true);
      expect(host.changes).toEqual(["docs"]);
      expect(before).toBe(el("docs"));
      expect(document.activeElement?.textContent).toBe("Guides");
    });

    it("spends the pending focus only once the entry is open", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      host.change = (next) => host.changes.push(next);
      el("docs").focus();

      // Act
      controller.triggerKeydown("docs", el("docs"), key("ArrowDown"));
      controller.sync();
      const vetoed = document.activeElement;
      host.current = { ...host.current, value: "docs" };
      controller.sync();

      // Assert
      expect(vetoed).toBe(el("docs"));
      expect(document.activeElement?.textContent).toBe("Guides");
    });

    it("spends the pending focus once, so a later sync does not steal focus back", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      controller.triggerKeydown("docs", el("docs"), key("ArrowDown"));
      controller.sync();
      el("pricing").focus();

      // Act
      controller.sync();

      // Assert
      expect(document.activeElement).toBe(el("pricing"));
    });

    it("moves straight into an already-open panel", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerKeydown("docs", el("docs"), key("ArrowDown"));

      // Assert
      expect(host.changes).toEqual([]);
      expect(document.activeElement?.textContent).toBe("Guides");
    });

    it("cancels a pending hover open as the keyboard enters a panel", () => {
      // Arrange
      vi.useFakeTimers();
      const host = hostWith();
      const controller = new NavigationMenuController(host);
      controller.triggerPointerEnter("blog");

      // Act
      controller.triggerKeydown("docs", el("docs"), key("ArrowDown"));
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual(["docs"]);
    });

    it("leaves focus where it is when an open panel has nothing to focus", () => {
      // Arrange
      const host = hostWith("blog");
      const controller = new NavigationMenuController(host);
      el("blog").focus();

      // Act
      controller.triggerKeydown("blog", el("blog"), key("ArrowDown"));

      // Assert
      expect(document.activeElement).toBe(el("blog"));
    });

    it("travels from a trigger with the keys that do not enter its panel", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerKeydown("docs", el("docs"), key("ArrowRight"));

      // Assert
      expect(host.changes).toEqual([]);
      expect(document.activeElement).toBe(el("blog"));
    });

    it("closes with Escape and hands focus back to the open entry's trigger", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);
      el("pricing").focus();

      // Act
      controller.rootKeydown(key("Escape"));

      // Assert
      expect(host.changes).toEqual([""]);
      expect(document.activeElement).toBe(el("docs"));
    });

    it("still closes with Escape when the open entry has no trigger to refocus", () => {
      // Arrange
      const host = hostWith("faq");
      const controller = new NavigationMenuController(host);

      // Act
      controller.rootKeydown(key("Escape"));

      // Assert
      expect(host.changes).toEqual([""]);
    });

    it("opens an entry with no panel to focus without throwing", () => {
      // Arrange
      const host = hostWith();
      const controller = new NavigationMenuController(host);

      // Act
      controller.triggerKeydown("faq", el("docs"), key("ArrowDown"));
      controller.sync();

      // Assert
      expect(host.changes).toEqual(["faq"]);
    });

    it.each([
      ["nothing is open", "", "Escape"],
      ["the key is not Escape", "docs", "Enter"],
    ])("ignores the root's keys when %s", (_case, value, k) => {
      // Arrange
      const host = hostWith(value);
      const controller = new NavigationMenuController(host);

      // Act
      controller.rootKeydown(key(k));

      // Assert
      expect(host.changes).toEqual([]);
    });

    it("closes when focus leaves the nav, without moving it", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.focusOut(el("docs").parentElement as HTMLElement, el("outside"));

      // Assert
      expect(host.changes).toEqual([""]);
    });

    it("closes when focus leaves for nowhere", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.focusOut(el("docs").parentElement as HTMLElement, null);

      // Assert
      expect(host.changes).toEqual([""]);
    });

    it.each([
      ["focus moves within the nav", "docs", "pricing"],
      ["nothing is open", "", "outside"],
    ])("stays as it is when %s", (_case, value, next) => {
      // Arrange
      const host = hostWith(value);
      const controller = new NavigationMenuController(host);

      // Act
      controller.focusOut(el("docs").parentElement as HTMLElement, el(next));

      // Assert
      expect(host.changes).toEqual([]);
    });
  });

  describe("links", () => {
    it("closes the menu when a link is followed, cancelling a pending open", () => {
      // Arrange
      vi.useFakeTimers();
      const host = hostWith("");
      const controller = new NavigationMenuController(host);
      controller.triggerPointerEnter("docs");

      // Act
      controller.linkClick();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([""]);
    });

    it("closes the open panel as the pointer reaches a top-level link", () => {
      // Arrange
      const host = hostWith("docs");
      const controller = new NavigationMenuController(host);

      // Act
      controller.linkPointerEnter();

      // Assert
      expect(host.changes).toEqual([""]);
    });

    it("cancels a pending hover open as the pointer reaches a top-level link", () => {
      // Arrange
      vi.useFakeTimers();
      const host = hostWith("");
      const controller = new NavigationMenuController(host);
      controller.triggerPointerEnter("docs");

      // Act
      controller.linkPointerEnter();
      vi.advanceTimersByTime(500);

      // Assert
      expect(host.changes).toEqual([""]);
    });

    it("leaves the menu alone on a link hover when hover-to-open is off", () => {
      // Arrange
      const host = hostWith("docs", { openOnHover: false });
      const controller = new NavigationMenuController(host);

      // Act
      controller.linkPointerEnter();

      // Assert
      expect(host.changes).toEqual([]);
    });
  });
});
