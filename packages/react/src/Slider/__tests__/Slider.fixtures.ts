export const keyboardCases = [
  { key: "{ArrowRight}", from: 50, expected: 51 },
  { key: "{ArrowUp}", from: 50, expected: 51 },
  { key: "{ArrowLeft}", from: 50, expected: 49 },
  { key: "{ArrowDown}", from: 50, expected: 49 },
  { key: "{PageUp}", from: 50, expected: 60 },
  { key: "{PageDown}", from: 50, expected: 40 },
  { key: "{Home}", from: 50, expected: 0 },
  { key: "{End}", from: 50, expected: 100 },
] as const;

export const rtlKeyboardCases = [
  { name: "ArrowRight decreases the value", key: "{ArrowRight}", from: 50, expected: 49 },
  { name: "ArrowLeft increases the value", key: "{ArrowLeft}", from: 50, expected: 51 },
] as const;

export const invertedKeyboardCases = [
  {
    name: "horizontal ArrowRight decreases",
    orientation: "horizontal",
    key: "{ArrowRight}",
    from: 50,
    expected: 49,
  },
  {
    name: "horizontal ArrowLeft increases",
    orientation: "horizontal",
    key: "{ArrowLeft}",
    from: 50,
    expected: 51,
  },
  {
    name: "vertical ArrowUp decreases",
    orientation: "vertical",
    key: "{ArrowUp}",
    from: 50,
    expected: 49,
  },
  {
    name: "vertical ArrowDown increases",
    orientation: "vertical",
    key: "{ArrowDown}",
    from: 50,
    expected: 51,
  },
  {
    name: "vertical ArrowRight increases",
    orientation: "vertical",
    key: "{ArrowRight}",
    from: 50,
    expected: 51,
  },
] as const;
