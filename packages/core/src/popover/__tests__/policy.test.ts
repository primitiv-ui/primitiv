import { popoverKeydown, popoverPressDismisses } from "../policy";

describe("popoverKeydown", () => {
  it("closes on Escape", () => {
    // Arrange & Act
    const outcome = popoverKeydown("Escape");

    // Assert
    expect(outcome).toEqual({ open: false });
  });

  it.each(["Enter", " ", "Tab", "ArrowDown"])("leaves %j alone", (key) => {
    // Arrange & Act & Assert
    expect(popoverKeydown(key)).toBeNull();
  });
});

describe("popoverPressDismisses", () => {
  const outside = { open: true, nativeLightDismiss: false, inTrigger: false, inPopover: false };

  it("dismisses an open popover on a press outside it, where the browser does not", () => {
    // Arrange & Act & Assert
    expect(popoverPressDismisses(outside)).toBe(true);
  });

  it("leaves dismissal to the browser where it light-dismisses natively", () => {
    // Arrange & Act & Assert
    expect(popoverPressDismisses({ ...outside, nativeLightDismiss: true })).toBe(false);
  });

  it("ignores a press on the trigger, which toggles it instead", () => {
    // Arrange & Act & Assert
    expect(popoverPressDismisses({ ...outside, inTrigger: true })).toBe(false);
  });

  it("ignores a press inside any popover, this one or one nested in it", () => {
    // Arrange & Act & Assert
    expect(popoverPressDismisses({ ...outside, inPopover: true })).toBe(false);
  });

  it("does nothing while closed", () => {
    // Arrange & Act & Assert
    expect(popoverPressDismisses({ ...outside, open: false })).toBe(false);
  });
});
