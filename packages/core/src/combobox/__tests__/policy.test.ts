import { describe, expect, it } from "vitest";

import { comboboxKeydown, comboboxQuery } from "../policy";

const values = ["react", "preact", "vue"];

describe("comboboxKeydown while open", () => {
  it("seeds the cursor on the first option with ArrowDown and the last with ArrowUp", () => {
    // Arrange & Act
    const down = comboboxKeydown({ key: "ArrowDown", open: true, values, active: undefined });
    const up = comboboxKeydown({ key: "ArrowUp", open: true, values, active: undefined });

    // Assert
    expect(down).toEqual({ cursor: "react" });
    expect(up).toEqual({ cursor: "vue" });
  });

  it("re-seeds from the near end when the cursor sits on an option that has gone", () => {
    // Arrange & Act
    const down = comboboxKeydown({ key: "ArrowDown", open: true, values, active: "svelte" });
    const up = comboboxKeydown({ key: "ArrowUp", open: true, values, active: "svelte" });

    // Assert
    expect(down).toEqual({ cursor: "react" });
    expect(up).toEqual({ cursor: "vue" });
  });

  it("moves the cursor with the arrows, wrapping at either end", () => {
    // Arrange & Act
    const down = comboboxKeydown({ key: "ArrowDown", open: true, values, active: "react" });
    const wrapDown = comboboxKeydown({ key: "ArrowDown", open: true, values, active: "vue" });
    const up = comboboxKeydown({ key: "ArrowUp", open: true, values, active: "preact" });
    const wrapUp = comboboxKeydown({ key: "ArrowUp", open: true, values, active: "react" });

    // Assert
    expect(down).toEqual({ cursor: "preact" });
    expect(wrapDown).toEqual({ cursor: "react" });
    expect(up).toEqual({ cursor: "react" });
    expect(wrapUp).toEqual({ cursor: "vue" });
  });

  it("jumps to the ends on Home and End", () => {
    // Arrange & Act
    const home = comboboxKeydown({ key: "Home", open: true, values, active: "vue" });
    const end = comboboxKeydown({ key: "End", open: true, values, active: "preact" });

    // Assert
    expect(home).toEqual({ cursor: "react" });
    expect(end).toEqual({ cursor: "vue" });
  });

  it("commits the option under the cursor on Enter", () => {
    // Arrange & Act
    const outcome = comboboxKeydown({ key: "Enter", open: true, values, active: "preact" });

    // Assert
    expect(outcome).toEqual({ commit: "preact" });
  });

  it("leaves Enter alone with no cursor, or a cursor on an option that has gone", () => {
    // Arrange & Act
    const none = comboboxKeydown({ key: "Enter", open: true, values, active: undefined });
    const gone = comboboxKeydown({ key: "Enter", open: true, values, active: "svelte" });

    // Assert
    expect(none).toBeNull();
    expect(gone).toBeNull();
  });

  it("dismisses on Escape", () => {
    // Arrange & Act
    const outcome = comboboxKeydown({ key: "Escape", open: true, values: [], active: undefined });

    // Assert
    expect(outcome).toEqual({ dismiss: true });
  });

  it("moves nothing in an empty list", () => {
    // Arrange & Act
    const down = comboboxKeydown({ key: "ArrowDown", open: true, values: [], active: undefined });
    const home = comboboxKeydown({ key: "Home", open: true, values: [], active: undefined });

    // Assert
    expect(down).toBeNull();
    expect(home).toBeNull();
  });

  it("leaves every other key to the text field", () => {
    // Arrange & Act
    const outcomes = ["a", "ArrowLeft", "ArrowRight", " ", "Tab", "Backspace"].map((key) =>
      comboboxKeydown({ key, open: true, values, active: "react" }),
    );

    // Assert
    expect(outcomes).toEqual([null, null, null, null, null, null]);
  });
});

describe("comboboxKeydown while closed", () => {
  it("opens on ArrowDown and ArrowUp without placing a cursor", () => {
    // Arrange & Act
    const down = comboboxKeydown({ key: "ArrowDown", open: false, values, active: undefined });
    const up = comboboxKeydown({ key: "ArrowUp", open: false, values, active: undefined });

    // Assert
    expect(down).toEqual({ open: true });
    expect(up).toEqual({ open: true });
  });

  it("leaves Escape, Enter, Home and End alone, so an enclosing dialog or form still hears them", () => {
    // Arrange & Act
    const outcomes = ["Escape", "Enter", "Home", "End"].map((key) =>
      comboboxKeydown({ key, open: false, values, active: "react" }),
    );

    // Assert
    expect(outcomes).toEqual([null, null, null, null]);
  });
});

describe("comboboxQuery", () => {
  it("opens as the user types", () => {
    // Arrange & Act
    const outcome = comboboxQuery({ query: "re", value: "" });

    // Assert
    expect(outcome).toEqual({ open: true, clear: false });
  });

  it("clears the value when the field is emptied", () => {
    // Arrange & Act
    const outcome = comboboxQuery({ query: "", value: "react" });

    // Assert
    expect(outcome).toEqual({ open: true, clear: true });
  });

  it("clears nothing when the field empties with nothing chosen", () => {
    // Arrange & Act
    const outcome = comboboxQuery({ query: "", value: "" });

    // Assert
    expect(outcome).toEqual({ open: true, clear: false });
  });

  it("clears nothing while the field still holds text", () => {
    // Arrange & Act
    const outcome = comboboxQuery({ query: "r", value: "react" });

    // Assert
    expect(outcome).toEqual({ open: true, clear: false });
  });
});
