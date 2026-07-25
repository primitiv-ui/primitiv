import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("NavigationMenu — controlled state", () => {
  it("reflects the value prop without owning it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(onValueChange).toHaveBeenCalledWith("concepts");
    expect(screen.getByTestId("concepts-panel")).not.toBeVisible();
  });

  it("requests a close with the empty string", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThreeEntryNav value="concepts" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("opens the panel once the parent commits the new value", async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState("");
      return <ThreeEntryNav value={open} onValueChange={setOpen} />;
    }

    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Registry & CLI" }));

    expect(screen.getByTestId("registry-panel")).toBeVisible();
  });
});
