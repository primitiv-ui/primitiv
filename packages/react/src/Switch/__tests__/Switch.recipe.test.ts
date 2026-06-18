import { switchRecipe } from "../../../../../registry/components/switch/switch.recipe";

describe("Switch recipe size variants", () => {
  it("includes base class and defaults to md size", () => {
    const result = switchRecipe();
    expect(result).toContain("primitiv-switch");
    expect(result).toContain("primitiv-switch--md");
  });

  it.each([
    ["xs", "primitiv-switch--xs"],
    ["sm", "primitiv-switch--sm"],
    ["md", "primitiv-switch--md"],
    ["lg", "primitiv-switch--lg"],
    ["xl", "primitiv-switch--xl"],
  ] as const)("applies %s size modifier class", (size, expected) => {
    expect(switchRecipe({ size })).toContain(expected);
  });
});
