import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavigationMenu } from "../NavigationMenu";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu.Link", () => {
  it("marks the active link as the current page", () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/start" active>
              Start Here
            </NavigationMenu.Link>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="/changelog">Changelog</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    const active = screen.getByRole("link", { name: "Start Here" });
    const inactive = screen.getByRole("link", { name: "Changelog" });

    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("data-active", "");
    expect(inactive).not.toHaveAttribute("aria-current");
    expect(inactive).not.toHaveAttribute("data-active");
  });

  it("closes the open panel when a link inside it is clicked", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    await user.click(screen.getByRole("link", { name: "Tokens" }));

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("closes the open panel when a top-level link is clicked", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    await user.click(screen.getByRole("link", { name: "Changelog" }));

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("renders a consumer element instead of the anchor with asChild", () => {
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Link asChild active>
              <button type="button">Start Here</button>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    const rendered = screen.getByRole("button", { name: "Start Here" });

    expect(rendered.tagName).toBe("BUTTON");
    expect(rendered).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("still closes the panel through an asChild link", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <NavigationMenu.Root defaultValue="concepts">
        <NavigationMenu.List>
          <NavigationMenu.Item value="concepts">
            <NavigationMenu.Trigger>Concepts</NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="concepts-panel">
              <NavigationMenu.Link asChild>
                <a href="/tokens" onClick={onClick}>
                  Tokens
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    await user.click(screen.getByRole("link", { name: "Tokens" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });
});
