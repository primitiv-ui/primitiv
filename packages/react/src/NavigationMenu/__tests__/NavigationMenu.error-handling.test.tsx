import { render } from "@testing-library/react";

import { NavigationMenu } from "../NavigationMenu";

const MISSING_VALUE_ERROR =
  "NavigationMenu.Trigger and NavigationMenu.Content require a `value` on their NavigationMenu.Item";
const OUTSIDE_ROOT_ERROR =
  "Component must be rendered as a child of NavigationMenu.Root";
const OUTSIDE_ITEM_ERROR =
  "Component must be rendered as a child of NavigationMenu.Item";

describe("NavigationMenu — error handling", () => {
  it("throws when a Trigger's Item has no value", () => {
    expect(() =>
      render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      ),
    ).toThrow(MISSING_VALUE_ERROR);
  });

  it("throws when a Content's Item has no value", () => {
    expect(() =>
      render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Content />
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      ),
    ).toThrow(MISSING_VALUE_ERROR);
  });

  it.each([
    ["List", <NavigationMenu.List key="l" />],
    ["Viewport", <NavigationMenu.Viewport key="v" />],
    ["Indicator", <NavigationMenu.Indicator key="i" />],
    ["Link", <NavigationMenu.Link key="k" href="/x" />],
  ])("throws when %s is rendered outside a Root", (_name, element) => {
    expect(() => render(element)).toThrow(OUTSIDE_ROOT_ERROR);
  });

  it("throws when a Trigger is rendered outside an Item", () => {
    expect(() =>
      render(
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          </NavigationMenu.List>
        </NavigationMenu.Root>,
      ),
    ).toThrow(OUTSIDE_ITEM_ERROR);
  });
});
