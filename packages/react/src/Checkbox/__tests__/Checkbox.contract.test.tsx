import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render, screen } from "@testing-library/react";

import { Checkbox } from "../Checkbox";

/**
 * Auto-verification of the Checkbox styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/checkbox/contract.json` is *derived from
 * and asserted against the rendered headless component* so it can never drift
 * from what the component actually emits. Checkbox is tri-state: its surface is
 * `data-state="checked" | "unchecked" | "indeterminate"` (always present) plus
 * `data-disabled=""` when disabled. The authored half (root class, parts, custom
 * properties) is a styling convention the headless layer does not emit and is
 * checked by the generator drift-guards instead.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/checkbox/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("Checkbox styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    // The Checkbox has no authored data-* surface; the whole contract is derived.
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attribute names across its states", () => {
    const emitted = new Set<string>();
    for (const ui of [
      <Checkbox.Root key="checked" checked onCheckedChange={() => {}} aria-label="x">
        <Checkbox.Indicator />
      </Checkbox.Root>,
      <Checkbox.Root
        key="indeterminate"
        checked="indeterminate"
        onCheckedChange={() => {}}
        aria-label="x"
      >
        <Checkbox.Indicator />
      </Checkbox.Root>,
      <Checkbox.Root key="disabled" disabled aria-label="x">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    ]) {
      const { unmount } = render(ui);
      for (const name of dataAttributeNames(screen.getByRole("checkbox"))) {
        emitted.add(name);
      }
      unmount();
    }

    const contracted = new Set(
      autoAttributes.map((attribute: { name: string }) => attribute.name),
    );
    expect([...emitted].sort()).toEqual([...contracted].sort());
  });

  it("emits data-state with the documented value for each state", () => {
    const stateEntries = autoAttributes.filter(
      (attribute: { name: string }) => attribute.name === "data-state",
    );

    for (const entry of stateEntries) {
      const checked =
        entry.value === "indeterminate"
          ? ("indeterminate" as const)
          : entry.value === "checked";
      const { unmount } = render(
        <Checkbox.Root checked={checked} onCheckedChange={() => {}} aria-label="x">
          <Checkbox.Indicator />
        </Checkbox.Root>,
      );
      expect(screen.getByRole("checkbox")).toHaveAttribute("data-state", entry.value);
      unmount();
    }
  });

  it("emits data-disabled exactly as the contract documents it", () => {
    const entry = autoAttributes.find(
      (attribute: { name: string }) => attribute.name === "data-disabled",
    );

    render(
      <Checkbox.Root disabled aria-label="x">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute(entry.name, entry.value);
  });

  it("omits data-disabled when the documented condition does not hold", () => {
    render(
      <Checkbox.Root aria-label="x">
        <Checkbox.Indicator />
      </Checkbox.Root>,
    );

    expect(screen.getByRole("checkbox")).not.toHaveAttribute("data-disabled");
  });
});
