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

    // The ids are a public surface — a consumer targeting them in CSS or a test
    // depends on the role suffix, not just on the two sides agreeing.
    expect(trigger.id).toContain("-trigger-concepts");
    expect(panel.id).toContain("-panel-concepts");
  });

  it("does not treat an entry whose value is the empty string as open", () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="">
            <NavigationMenu.Trigger>Blank</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="blank-panel" />
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    // `""` is the closed sentinel, so an Item that adopts it as its value must
    // not read back as the open entry.
    expect(screen.getByRole("button", { name: "Blank" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByTestId("blank-panel")).not.toBeVisible();
  });

  it("republishes an Item's value when it changes", () => {
    function Nav({ itemValue }: { itemValue: string }) {
      return (
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item value={itemValue}>
              <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
              <NavigationMenu.Content data-testid="panel" />
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
      );
    }

    const { rerender } = render(<Nav itemValue="alpha" />);
    rerender(<Nav itemValue="beta" />);

    expect(screen.getByRole("button", { name: "Concepts" }).id).toContain(
      "-trigger-beta",
    );
    expect(screen.getByTestId("panel").id).toContain("-panel-beta");
  });
});
