import userEvent from "@testing-library/user-event";

import { SliderController, type SliderControllerHost } from "../SliderController";

type HostState = ReturnType<SliderControllerHost["state"]>;

/** A track 100px wide at the page's left edge, so a pointer's x is its value on a 0–100 scale. */
const TRACK = { left: 0, top: 0, right: 100, bottom: 10, width: 100, height: 10, x: 0, y: 0, toJSON: () => ({}) };

/**
 * A connected controller over a root holding one thumb per value. The host
 * applies every change to its state, as the element and React do, and records
 * the changes and commits it is asked for.
 */
function connected(values: number[], overrides: Partial<HostState> = {}) {
  const state: HostState = {
    values,
    min: 0,
    max: 100,
    step: 1,
    minStepsBetweenThumbs: 0,
    orientation: "horizontal",
    dir: "ltr",
    inverted: false,
    disabled: false,
    ...overrides,
  };
  const changes: number[][] = [];
  const commits: number[][] = [];
  const root = document.createElement("span");
  root.getBoundingClientRect = () => TRACK as DOMRect;
  const thumbs = values.map((_, index) => {
    const thumb = document.createElement("span");
    thumb.tabIndex = 0;
    thumb.textContent = `Thumb ${index}`;
    root.append(thumb);
    return thumb;
  });
  document.body.append(root);
  const controller = new SliderController(root, {
    state: () => state,
    change: (next) => {
      changes.push(next);
      state.values = next;
    },
    commit: (next) => commits.push(next),
  });
  thumbs.forEach((thumb, index) => controller.registerTrigger(`thumb-${index}`, thumb));
  controller.connect();
  return { root, thumbs, changes, commits, controller };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SliderController", () => {
  describe("keys", () => {
    it("steps the focused thumb, changing and committing at once, and prevents the default", async () => {
      // Arrange
      const { thumbs, changes, commits } = connected([50]);
      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });

      // Act
      thumbs[0].dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(true);
      expect(changes).toEqual([[51]]);
      expect(commits).toEqual([[51]]);
    });

    it("moves the thumb the key was pressed on, within its neighbours", async () => {
      // Arrange
      const user = userEvent.setup();
      const { thumbs, changes } = connected([20, 40, 80], { minStepsBetweenThumbs: 5 });
      thumbs[1].focus();

      // Act
      await user.keyboard("{End}");

      // Assert
      expect(changes).toEqual([[20, 75, 80]]);
    });

    it("reads the scale and axis from the host", async () => {
      // Arrange
      const user = userEvent.setup();
      const { thumbs, changes } = connected([50], { step: 5, dir: "rtl" });
      thumbs[0].focus();

      // Act
      await user.keyboard("{ArrowLeft}");

      // Assert
      expect(changes).toEqual([[55]]);
    });

    it("asks nothing for a key it does not handle, or a step past the end, leaving the default", async () => {
      // Arrange
      const { thumbs, changes, commits } = connected([100]);
      const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      const end = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });

      // Act
      thumbs[0].dispatchEvent(enter);
      thumbs[0].dispatchEvent(end);

      // Assert
      expect(enter.defaultPrevented).toBe(false);
      expect(end.defaultPrevented).toBe(true);
      expect(changes).toEqual([]);
      expect(commits).toEqual([]);
    });

    it("does nothing while disabled", async () => {
      // Arrange
      const { thumbs, changes } = connected([50], { disabled: true });
      const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });

      // Act
      thumbs[0].dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(false);
      expect(changes).toEqual([]);
    });
  });

  describe("pointer", () => {
    it("jumps the nearest thumb to the press, focuses it, and follows the drag", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, thumbs, changes, commits } = connected([20, 80]);

      // Act
      await user.pointer({ keys: "[MouseLeft>]", target: root, coords: { clientX: 70 } });
      const pressed = [...changes];
      await user.pointer({ target: root, coords: { clientX: 60 } });
      const beforeRelease = [...commits];
      await user.pointer({ keys: "[/MouseLeft]", target: root, coords: { clientX: 60 } });

      // Assert
      expect(pressed).toEqual([[20, 70]]);
      expect(document.activeElement).toBe(thumbs[1]);
      expect(changes).toEqual([
        [20, 70],
        [20, 60],
      ]);
      expect(beforeRelease).toEqual([]);
      expect(commits).toEqual([[20, 60]]);
    });

    it("prevents the press's default, which would take focus from the thumb", () => {
      // Arrange
      const { root } = connected([20]);
      const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 50 });

      // Act
      root.dispatchEvent(event);

      // Assert
      expect(event.defaultPrevented).toBe(true);
    });

    it("stops following once released", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, changes } = connected([10]);

      // Act
      await user.pointer([
        { keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } },
        { keys: "[/MouseLeft]", target: root, coords: { clientX: 30 } },
      ]);
      document.dispatchEvent(new PointerEvent("pointermove", { clientX: 90 }));

      // Assert
      expect(changes).toEqual([[30]]);
    });

    it("commits nothing for a press that moves nothing", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, changes, commits } = connected([30]);

      // Act
      await user.pointer([
        { keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } },
        { target: root, coords: { clientX: 30 } },
        { keys: "[/MouseLeft]", target: root, coords: { clientX: 30 } },
      ]);

      // Assert
      expect(changes).toEqual([]);
      expect(commits).toEqual([]);
    });

    it("commits the last move when the press itself moved nothing", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, commits } = connected([30]);

      // Act
      await user.pointer([
        { keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } },
        { target: root, coords: { clientX: 45 } },
        { target: root, coords: { clientX: 45 } },
        { keys: "[/MouseLeft]", target: root, coords: { clientX: 45 } },
      ]);

      // Assert
      expect(commits).toEqual([[45]]);
    });

    it("reads the pointer along the host's axis", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, changes } = connected([10], { inverted: true });

      // Act
      await user.pointer({ keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } });

      // Assert
      expect(changes).toEqual([[70]]);
    });

    it("ignores a press while disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, changes } = connected([10], { disabled: true });

      // Act
      await user.pointer({ keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } });

      // Assert
      expect(changes).toEqual([]);
    });

    it("drops a drag in progress, and stops listening for presses, once disconnected", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, changes, controller } = connected([10]);
      await user.pointer({ keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } });

      // Act
      controller.disconnect();
      document.dispatchEvent(new PointerEvent("pointermove", { clientX: 90 }));
      root.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 50 }));

      // Assert
      expect(changes).toEqual([[30]]);
    });

    it("still moves the value when there is no thumb to focus", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, changes, controller } = connected([10]);
      controller.setTriggers([]);

      // Act
      await user.pointer({ keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } });

      // Assert
      expect(changes).toEqual([[30]]);
    });

    it("commits each of two drags in turn, once each", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, commits } = connected([10]);

      // Act
      await user.pointer([
        { keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } },
        { keys: "[/MouseLeft]", target: root, coords: { clientX: 30 } },
        { keys: "[MouseLeft>]", target: root, coords: { clientX: 60 } },
        { keys: "[/MouseLeft]", target: root, coords: { clientX: 60 } },
      ]);

      // Assert
      expect(commits).toEqual([[30], [60]]);
    });

    it("listens once however often it is connected", async () => {
      // Arrange
      const user = userEvent.setup();
      const { root, commits, controller } = connected([10]);
      controller.connect();

      // Act
      await user.pointer([
        { keys: "[MouseLeft>]", target: root, coords: { clientX: 30 } },
        { keys: "[/MouseLeft]", target: root, coords: { clientX: 30 } },
      ]);

      // Assert
      expect(commits).toEqual([[30]]);
    });
  });

  describe("lifecycle", () => {
    it("can be disconnected while idle, or before it ever connected", () => {
      // Arrange
      const { controller } = connected([10]);
      const unconnected = new SliderController(document.createElement("span"), {
        state: () => {
          throw new Error("never read");
        },
        change: () => {},
        commit: () => {},
      });

      // Act & Assert
      expect(() => controller.disconnect()).not.toThrow();
      expect(() => unconnected.disconnect()).not.toThrow();
    });
  });
});
