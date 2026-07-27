import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { getTriggerAnchorName, toAnchorIdentFragment } from "../utils";

import { ThreeEntryNav } from "./NavigationMenu.fixtures";

describe("toAnchorIdentFragment", () => {
  it("replaces characters invalid in a CSS custom-ident with a hyphen", () => {
    expect(toAnchorIdentFragment(":r0:-trigger-concepts")).toBe(
      "-r0--trigger-concepts",
    );
  });

  it("leaves an already-safe id untouched", () => {
    expect(toAnchorIdentFragment("nav1-trigger-concepts")).toBe(
      "nav1-trigger-concepts",
    );
  });
});

describe("getTriggerAnchorName", () => {
  it("builds a namespaced anchor-name from the trigger id", () => {
    expect(getTriggerAnchorName(":r0:-trigger-concepts")).toBe(
      "--primitiv-navigation-menu-trigger--r0--trigger-concepts",
    );
  });
});

describe("NavigationMenu anchor positioning", () => {
  it("gives each trigger its own anchor-name, derived from its own id", () => {
    render(<ThreeEntryNav />);

    const concepts = screen.getByRole("button", { name: "Concepts" });
    const registry = screen.getByRole("button", { name: "Registry & CLI" });

    expect(concepts.style.getPropertyValue("anchor-name")).toBe(
      getTriggerAnchorName(concepts.id),
    );
    expect(registry.style.getPropertyValue("anchor-name")).toBe(
      getTriggerAnchorName(registry.id),
    );
    expect(concepts.style.getPropertyValue("anchor-name")).not.toBe(
      registry.style.getPropertyValue("anchor-name"),
    );
  });

  it("publishes the open trigger's anchor-name as the nav's active-trigger-anchor", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const concepts = screen.getByRole("button", { name: "Concepts" });
    await user.click(concepts);

    const nav = screen.getByRole("navigation");
    expect(
      nav.style.getPropertyValue(
        "--primitiv-navigation-menu-active-trigger-anchor",
      ),
    ).toBe(getTriggerAnchorName(concepts.id));
  });

  it("switches the active-trigger-anchor when a different trigger opens", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    await user.click(screen.getByRole("button", { name: "Concepts" }));
    const registry = screen.getByRole("button", { name: "Registry & CLI" });
    await user.click(registry);

    const nav = screen.getByRole("navigation");
    expect(
      nav.style.getPropertyValue(
        "--primitiv-navigation-menu-active-trigger-anchor",
      ),
    ).toBe(getTriggerAnchorName(registry.id));
  });

  it("clears the active-trigger-anchor once the panel closes", async () => {
    const user = userEvent.setup();
    render(<ThreeEntryNav />);

    const concepts = screen.getByRole("button", { name: "Concepts" });
    await user.click(concepts);
    await user.click(concepts);

    const nav = screen.getByRole("navigation");
    expect(
      nav.style.getPropertyValue(
        "--primitiv-navigation-menu-active-trigger-anchor",
      ),
    ).toBe("");
  });

  it("keeps anchor names distinct across two independent Root instances", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThreeEntryNav aria-label="First" />
        <ThreeEntryNav aria-label="Second" />
      </>,
    );

    const [firstConcepts, secondConcepts] = screen.getAllByRole("button", {
      name: "Concepts",
    });

    expect(firstConcepts.style.getPropertyValue("anchor-name")).not.toBe(
      secondConcepts.style.getPropertyValue("anchor-name"),
    );

    const [firstNav, secondNav] = screen.getAllByRole("navigation");

    // Opened one at a time: clicking the second nav's trigger moves focus out
    // of the first nav's subtree, which correctly closes its own panel — so
    // each nav's active-trigger-anchor is checked right after its own open,
    // rather than asserting both stay open together.
    await user.click(firstConcepts);
    expect(
      firstNav.style.getPropertyValue(
        "--primitiv-navigation-menu-active-trigger-anchor",
      ),
    ).toBe(getTriggerAnchorName(firstConcepts.id));

    await user.click(secondConcepts);
    expect(
      secondNav.style.getPropertyValue(
        "--primitiv-navigation-menu-active-trigger-anchor",
      ),
    ).toBe(getTriggerAnchorName(secondConcepts.id));
  });
});
