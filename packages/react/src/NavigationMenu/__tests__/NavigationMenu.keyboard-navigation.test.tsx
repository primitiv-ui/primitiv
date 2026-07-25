import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { NavigationMenu } from "../NavigationMenu";

import {
  horizontalArrowCases,
  rtlArrowCases,
  ThreeEntryNav,
  verticalArrowCases,
} from "./NavigationMenu.fixtures";

describe("NavigationMenu — keyboard navigation", () => {
  describe.each(horizontalArrowCases)(
    "horizontal: $key from $from",
    ({ key, from, expected }) => {
      it(`moves focus to ${expected}`, async () => {
        const user = userEvent.setup();
        render(<ThreeEntryNav />);

        screen.getByRole(from === "Changelog" ? "link" : "button", {
          name: from,
        }).focus();
        await user.keyboard(key);

        expect(screen.getByText(expected)).toHaveFocus();
      });
    },
  );

  describe.each(verticalArrowCases)(
    "vertical: $key from $from",
    ({ key, from, expected }) => {
      it(`moves focus to ${expected}`, async () => {
        const user = userEvent.setup();
        render(<ThreeEntryNav orientation="vertical" />);

        screen.getByRole("button", { name: from }).focus();
        await user.keyboard(key);

        expect(screen.getByText(expected)).toHaveFocus();
      });
    },
  );

  describe.each(rtlArrowCases)(
    "rtl: $key from $from",
    ({ key, from, expected }) => {
      it(`moves focus to ${expected}`, async () => {
        const user = userEvent.setup();
        render(<ThreeEntryNav dir="rtl" />);

        screen.getByRole(from === "Changelog" ? "link" : "button", {
          name: from,
        }).focus();
        await user.keyboard(key);

        expect(screen.getByText(expected)).toHaveFocus();
      });
    },
  );

  it("keeps every top-level entry in the tab order", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Concepts" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Changelog" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Registry & CLI" })).toHaveFocus();
  });

  it("skips an entry that has since unmounted", async () => {
    const user = userEvent.setup();

    function ShrinkingNav() {
      const [showBeta, setShowBeta] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setShowBeta(false)}>
            Drop Beta
          </button>
          <NavigationMenu.Root>
            <NavigationMenu.List>
              <NavigationMenu.Item>
                <NavigationMenu.Link href="/alpha">Alpha</NavigationMenu.Link>
              </NavigationMenu.Item>
              {showBeta && (
                <NavigationMenu.Item>
                  <NavigationMenu.Link href="/beta">Beta</NavigationMenu.Link>
                </NavigationMenu.Item>
              )}
              <NavigationMenu.Item>
                <NavigationMenu.Link href="/gamma">Gamma</NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu.Root>
        </>
      );
    }

    render(<ShrinkingNav />);
    await user.click(screen.getByRole("button", { name: "Drop Beta" }));
    screen.getByRole("link", { name: "Alpha" }).focus();
    await user.keyboard("{ArrowRight}");

    // An entry that fails to unregister leaves a detached element in the travel
    // order, and the arrow lands on nothing at all.
    expect(screen.getByRole("link", { name: "Gamma" })).toHaveFocus();
  });

  it("does not treat links inside a panel as top-level entries", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("link", { name: "Changelog" })).toHaveFocus();
  });
});
