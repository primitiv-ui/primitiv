import { render, screen } from "@testing-library/react";

import { NavigationMenu } from "../NavigationMenu";

describe("NavigationMenu — basic rendering", () => {
  it("renders a navigation landmark named Main by default", () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/start">Start Here</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });

  it("links a trigger to its panel and reports both closed", () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="concepts">
            <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="panel">
              <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    const trigger = screen.getByRole("button", { name: "Concepts" });
    const panel = screen.getByTestId("panel");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    expect(trigger).toHaveAttribute("data-state", "closed");
    expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
    expect(panel).toHaveAttribute("data-state", "closed");
  });
});
