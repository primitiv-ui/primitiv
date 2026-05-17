export const determinateStateCases = [
  { value: 0, max: 100, expectedState: "loading" },
  { value: 60, max: 100, expectedState: "loading" },
  { value: 100, max: 100, expectedState: "complete" },
  { value: 30, max: 60, expectedState: "loading" },
  { value: 60, max: 60, expectedState: "complete" },
] as const;
