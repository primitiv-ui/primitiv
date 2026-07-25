import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("does not treat links inside a panel as top-level entries", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="concepts" />);

    screen.getByRole("button", { name: "Concepts" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("link", { name: "Changelog" })).toHaveFocus();
  });
});
