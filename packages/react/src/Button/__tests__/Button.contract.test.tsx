import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render, screen } from "@testing-library/react";

import { Button } from "../Button";

/**
 * Auto-verification of the Button styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/button/contract.json` is *derived from and
 * asserted against the rendered headless component* so it can never drift from
 * what the component actually emits. The authored half (root class, modifiers,
 * custom properties) is checked for self-consistency only — it is a styling
 * convention the headless layer does not emit.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/button/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("Button styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    // The Button has no authored data-* surface; the whole contract is derived.
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attributes across its states", () => {
    const { rerender } = render(<Button disabled>Save</Button>);
    const emitted = new Set(dataAttributeNames(screen.getByRole("button")));

    rerender(<Button>Save</Button>);
    for (const name of dataAttributeNames(screen.getByRole("button"))) {
      emitted.add(name);
    }

    const contracted = autoAttributes
      .map((attribute: { name: string }) => attribute.name)
      .sort();
    expect([...emitted].sort()).toEqual(contracted);
  });

  it("emits data-disabled exactly as the contract documents it", () => {
    const entry = autoAttributes.find(
      (attribute: { name: string }) => attribute.name === "data-disabled",
    );

    render(<Button disabled>Save</Button>);
    // Present with the documented value when the documented condition holds…
    expect(screen.getByRole("button")).toHaveAttribute(entry.name, entry.value);
  });

  it("omits data-disabled when the documented condition does not hold", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button")).not.toHaveAttribute("data-disabled");
  });
});
