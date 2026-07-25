import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavigationMenu } from "../NavigationMenu";

function Nav({ forceMount }: { forceMount?: boolean }) {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="concepts">
          <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="panel" forceMount={forceMount}>
            <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

describe("NavigationMenu.Content — forceMount", () => {
  it("leaves a closed panel out of the accessibility tree without hiding it", () => {
    render(<Nav forceMount />);

    const panel = screen.getByTestId("panel");

    expect(panel).not.toHaveAttribute("hidden");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel).toHaveAttribute("data-state", "closed");
  });

  it("drops aria-hidden once the panel opens", async () => {
    const user = userEvent.setup();
    render(<Nav forceMount />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    const panel = screen.getByTestId("panel");

    expect(panel).not.toHaveAttribute("aria-hidden");
    expect(panel).toHaveAttribute("data-state", "open");
  });

  it("uses hidden when forceMount is not set", () => {
    render(<Nav />);

    const panel = screen.getByTestId("panel");

    expect(panel).toHaveAttribute("hidden");
    expect(panel).not.toHaveAttribute("aria-hidden");
  });
});
