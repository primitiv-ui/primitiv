import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Listbox } from "../Listbox";

/**
 * APG's grouped-options example names each group with `aria-labelledby`
 * pointing at a *visible* heading inside the group, not an invisible
 * `aria-label`. `Listbox.GroupLabel` renders that heading and wires the id.
 */
describe("Listbox group label", () => {
  it("names the group from a visible heading", () => {
    render(
      <Listbox.Root type="single" aria-label="Animals">
        <Listbox.Group>
          <Listbox.GroupLabel>Land</Listbox.GroupLabel>
          <Listbox.Option value="cat">Cat</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    const group = screen.getByRole("group", { name: "Land" });
    const heading = screen.getByText("Land");
    expect(group).toHaveAttribute("aria-labelledby", heading.id);
    expect(heading).toBeVisible();
    // Only one naming attribute: emitting both would be misleading, since
    // aria-labelledby silently outranks aria-label.
    expect(group).not.toHaveAttribute("aria-label");
  });

  it("keeps the heading out of the option list", () => {
    render(
      <Listbox.Root type="single" aria-label="Animals">
        <Listbox.Group>
          <Listbox.GroupLabel>Land</Listbox.GroupLabel>
          <Listbox.Option value="cat">Cat</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    expect(screen.getByText("Land")).toHaveAttribute("role", "presentation");
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("still supports the invisible label prop", () => {
    render(
      <Listbox.Root type="single" aria-label="Animals">
        <Listbox.Group label="Water">
          <Listbox.Option value="cod">Cod</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    const group = screen.getByRole("group", { name: "Water" });
    expect(group).toHaveAttribute("aria-label", "Water");
    expect(group).not.toHaveAttribute("aria-labelledby");
  });

  it("gives each group its own heading id", () => {
    render(
      <Listbox.Root type="single" aria-label="Animals">
        <Listbox.Group>
          <Listbox.GroupLabel>Land</Listbox.GroupLabel>
          <Listbox.Option value="cat">Cat</Listbox.Option>
        </Listbox.Group>
        <Listbox.Group>
          <Listbox.GroupLabel>Water</Listbox.GroupLabel>
          <Listbox.Option value="cod">Cod</Listbox.Option>
        </Listbox.Group>
      </Listbox.Root>,
    );

    expect(screen.getByText("Land").id).not.toBe(screen.getByText("Water").id);
    expect(screen.getByRole("group", { name: "Land" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Water" })).toBeInTheDocument();
  });
});
