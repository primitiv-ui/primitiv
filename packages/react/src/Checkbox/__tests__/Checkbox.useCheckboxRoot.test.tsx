import { act, renderHook } from "@testing-library/react";

import { useCheckboxRoot } from "../hooks/index.ts";

// useCheckboxRoot is the button-based tri-state hook that Dropdown /
// ContextMenu checkbox-items use (Checkbox itself is input-based via
// useCheckboxInput). It has no owning component in this package, so it is
// unit-tested directly here.
describe("useCheckboxRoot", () => {
  it("returns checked and toggle, defaulting to unchecked when uncontrolled", () => {
    // Arrange & Act
    const { result } = renderHook(() => useCheckboxRoot({}));

    // Assert
    expect(result.current.checked).toBe(false);
    expect(typeof result.current.toggle).toBe("function");
  });

  it("honours defaultChecked when uncontrolled", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useCheckboxRoot({ defaultChecked: true }),
    );

    // Assert
    expect(result.current.checked).toBe(true);
  });

  it("toggles false → true → false, reporting each change", () => {
    // Arrange
    const onCheckedChange = vi.fn();
    const { result } = renderHook(() => useCheckboxRoot({ onCheckedChange }));

    // Act & Assert — first toggle
    act(() => result.current.toggle());
    expect(result.current.checked).toBe(true);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);

    // Act & Assert — second toggle must read the updated state, not a stale
    // one frozen by empty callback dependencies
    act(() => result.current.toggle());
    expect(result.current.checked).toBe(false);
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("resolves indeterminate to checked on toggle (WAI-ARIA tri-state)", () => {
    // Arrange
    const onCheckedChange = vi.fn();
    const { result } = renderHook(() =>
      useCheckboxRoot({ defaultChecked: "indeterminate", onCheckedChange }),
    );
    expect(result.current.checked).toBe("indeterminate");

    // Act
    act(() => result.current.toggle());

    // Assert — indeterminate advances to checked, not to !indeterminate
    expect(result.current.checked).toBe(true);
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
  });

  it("does not throw when toggled without an onCheckedChange handler", () => {
    // Arrange
    const { result } = renderHook(() => useCheckboxRoot({}));

    // Act & Assert — the optional call must be a no-op, not a crash
    expect(() => act(() => result.current.toggle())).not.toThrow();
    expect(result.current.checked).toBe(true);
  });
});
