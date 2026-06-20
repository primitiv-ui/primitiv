import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render, screen } from "@testing-library/react";

import { Input } from "../Input";

/**
 * Auto-verification of the Input styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/input/contract.json` is *derived from and
 * asserted against the rendered headless component* so it can never drift from
 * what the component actually emits. Input's only data-* surface is
 * `data-disabled=""` when disabled — `invalid` is an `aria-invalid` concern, not
 * a data attribute. The authored half (root class, custom properties) is a
 * styling convention the headless layer does not emit and is checked by the
 * generator drift-guards instead.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/input/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("Input styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    // The Input has no authored data-* surface; the whole contract is derived.
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attribute names across its states", () => {
    const emitted = new Set<string>();
    for (const ui of [
      <Input key="default" aria-label="x" />,
      <Input key="disabled" aria-label="x" disabled />,
    ]) {
      const { unmount } = render(ui);
      for (const name of dataAttributeNames(screen.getByRole("textbox"))) {
        emitted.add(name);
      }
      unmount();
    }

    const contracted = new Set(
      autoAttributes.map((attribute: { name: string }) => attribute.name),
    );
    expect([...emitted].sort()).toEqual([...contracted].sort());
  });

  it("emits data-disabled exactly as the contract documents it", () => {
    const entry = autoAttributes.find(
      (attribute: { name: string }) => attribute.name === "data-disabled",
    );

    render(<Input aria-label="x" disabled />);
    expect(screen.getByRole("textbox")).toHaveAttribute(entry.name, entry.value);
  });

  it("omits data-disabled when the documented condition does not hold", () => {
    render(<Input aria-label="x" />);

    expect(screen.getByRole("textbox")).not.toHaveAttribute("data-disabled");
  });
});
