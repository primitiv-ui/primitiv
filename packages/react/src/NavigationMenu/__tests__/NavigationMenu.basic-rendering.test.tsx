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
});
