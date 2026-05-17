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
