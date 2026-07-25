import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";

import { NavigationMenu } from "../NavigationMenu";

describe("NavigationMenu — asChild", () => {
  it("renders a consumer element as the trigger, keeping the disclosure ARIA", async () => {
    const user = userEvent.setup();
    render(
      <NavigationMenu.Root>
        <NavigationMenu.List>
          <NavigationMenu.Item value="concepts">
            <NavigationMenu.Trigger asChild>
              <span role="button" tabIndex={0}>
                Concepts
              </span>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content data-testid="panel">
              <NavigationMenu.Link href="/tokens">Tokens</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>,
    );

    const trigger = screen.getByRole("button", { name: "Concepts" });

    expect(trigger.tagName).toBe("SPAN");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("panel")).toBeVisible();
  });

  it("composes an external trigger ref with the internal one", async () => {
    const user = userEvent.setup();

    function WithRef() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <NavigationMenu.Root>
          <NavigationMenu.List>
            <NavigationMenu.Item value="concepts">
              <NavigationMenu.Trigger ref={ref}>Concepts</NavigationMenu.Trigger>
              <NavigationMenu.Content data-testid="panel" />
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="/changelog">
                Changelog
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <button type="button" onClick={() => ref.current?.focus()}>
            Focus it
          </button>
        </NavigationMenu.Root>
      );
    }

    render(<WithRef />);
    await user.click(screen.getByRole("button", { name: "Focus it" }));

    // The external ref reaches the DOM node...
    expect(screen.getByRole("button", { name: "Concepts" })).toHaveFocus();

    // ...and the internal one still drives arrow-key travel.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("link", { name: "Changelog" })).toHaveFocus();
  });
});
