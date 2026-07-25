import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavigationMenu } from "../NavigationMenu";
import type { NavigationMenuViewportProps } from "../types";

function NavWithViewport(props: NavigationMenuViewportProps) {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item value="concepts">
          <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="concepts-panel">
            <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item value="registry">
          <NavigationMenu.Trigger>Registry</NavigationMenu.Trigger>
          <NavigationMenu.Content data-testid="registry-panel">
            <NavigationMenu.Link href="/cli">CLI</NavigationMenu.Link>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Viewport data-testid="viewport" {...props} />
    </NavigationMenu.Root>
  );
}

describe("NavigationMenu.Viewport", () => {
  it("hosts every panel so they share one box", async () => {
    render(<NavWithViewport />);

    const viewport = screen.getByTestId("viewport");

    await waitFor(() =>
      expect(screen.getByTestId("concepts-panel").parentElement).toBe(viewport),
    );
    expect(screen.getByTestId("registry-panel").parentElement).toBe(viewport);
  });

  it("leaves panels in place when there is no Viewport", () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="concepts">
            <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="concepts-panel" />
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    expect(screen.getByTestId("concepts-panel").parentElement?.tagName).toBe(
      "LI",
    );
  });

  it("reports its own open state and hides itself while nothing is open", async () => {
    const user = userEvent.setup();
    render(<NavWithViewport />);

    const viewport = screen.getByTestId("viewport");

    expect(viewport).toHaveAttribute("data-state", "closed");
    expect(viewport).toHaveAttribute("hidden");

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(viewport).toHaveAttribute("data-state", "open");
    expect(viewport).not.toHaveAttribute("hidden");
  });

  it("carries the open entry's value so the box can size per panel", async () => {
    const user = userEvent.setup();
    render(<NavWithViewport />);

    await user.click(screen.getByRole("button", { name: "Registry" }));

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-value",
      "registry",
    );
  });

  it("stays mounted and unhidden with forceMount", () => {
    render(<NavWithViewport forceMount />);

    const viewport = screen.getByTestId("viewport");

    expect(viewport).not.toHaveAttribute("hidden");
    expect(viewport).toHaveAttribute("data-state", "closed");
  });

  it("still lands keyboard focus inside a hosted panel", async () => {
    const user = userEvent.setup();
    render(<NavWithViewport />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowDown}");

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Tokens" })).toHaveFocus(),
    );
  });
});
