import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { SplitButton } from "../SplitButton";

describe("SplitButton — asChild", () => {
  it("renders the consumer's element as the group", () => {
    render(
      <SplitButton asChild>
        <section aria-label="Merge">
          <SplitButton.Action>Squash and merge</SplitButton.Action>
        </section>
      </SplitButton>,
    );

    const group = screen.getByRole("group", { name: "Merge" });

    expect(group.tagName).toBe("SECTION");
    expect(group).toHaveAttribute("data-split-button", "");
  });

  it("merges the action onto a consumer element, composing handlers and refs", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLAnchorElement>();

    render(
      <SplitButton>
        <SplitButton.Action asChild>
          <a href="/merge" ref={ref} onClick={onClick}>
            Squash and merge
          </a>
        </SplitButton.Action>
        <SplitButton.Trigger aria-label="More merge options" />
        <SplitButton.Menu />
      </SplitButton>,
    );

    const action = screen.getByRole("link", { name: "Squash and merge" });

    expect(ref.current).toBe(action);
    expect(action).toHaveAttribute("data-split-button-action", "");
    expect(action).not.toHaveAttribute("type");

    await user.click(action);

    expect(onClick).toHaveBeenCalledOnce();
  });
});
