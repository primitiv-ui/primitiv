/** Three options, enough to exercise wrap-around in both directions. */
export const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
] as const;

/**
 * Cursor movement cases for a vertical listbox. `from` seeds the cursor via
 * `defaultValue`; `expected` is the option the key should move it to.
 */
export const cursorKeyCases = [
  { key: "{ArrowDown}", from: "apple", expected: "Banana" },
  { key: "{ArrowDown}", from: "cherry", expected: "Apple" },
  { key: "{ArrowUp}", from: "banana", expected: "Apple" },
  { key: "{ArrowUp}", from: "apple", expected: "Cherry" },
  { key: "{Home}", from: "cherry", expected: "Apple" },
  { key: "{End}", from: "apple", expected: "Cherry" },
] as const;
