import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu — uncontrolled state", () => {
  it("starts with everything closed when no defaultValue is given", () => {
    render(<ThreeEntryNav />);

    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
    expect(screen.getByTestId("registry-panel")).not.toBeVisible();
  });

  it("opens the defaultValue entry's panel on first render", () => {
    render(<ThreeEntryNav defaultValue="registry" />);

    expect(screen.getByTestId("registry-panel")).toBeVisible();
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("still owns the open value after a defaultValue seed", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav defaultValue="registry" />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(screen.getByTestId("concepts-panel")).toBeVisible();
    expect(screen.getByTestId("registry-panel")).not.toBeVisible();
  });
});
