import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render, screen } from "@testing-library/react";

import { Radio } from "../Radio";

/**
 * Auto-verification of the Radio styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/radio/contract.json` is *derived from
 * and asserted against the rendered headless component* so it can never drift
 * from what the component actually emits. Radio is binary: its surface is
 * `data-state="checked" | "unchecked"` (always present) plus `data-disabled=""`
 * when disabled. The authored half (root class, parts, custom properties) is a
 * styling convention the headless layer does not emit and is checked by the
 * generator drift-guards instead.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/radio/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("Radio styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    // The Radio has no authored data-* surface; the whole contract is derived.
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attribute names across its states", () => {
    const emitted = new Set<string>();
    for (const ui of [
      <Radio.Root key="checked" checked onCheckedChange={() => {}} aria-label="x">
        <Radio.Indicator />
      </Radio.Root>,
      <Radio.Root key="unchecked" checked={false} onCheckedChange={() => {}} aria-label="x">
        <Radio.Indicator />
      </Radio.Root>,
      <Radio.Root key="disabled" disabled aria-label="x">
        <Radio.Indicator />
      </Radio.Root>,
    ]) {
      const { unmount } = render(ui);
      for (const name of dataAttributeNames(screen.getByRole("radio"))) {
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
      const { unmount } = render(
        <Radio.Root
          checked={entry.value === "checked"}
          onCheckedChange={() => {}}
          aria-label="x"
        >
          <Radio.Indicator />
        </Radio.Root>,
      );
      expect(screen.getByRole("radio")).toHaveAttribute("data-state", entry.value);
      unmount();
    }
  });

  it("emits data-disabled exactly as the contract documents it", () => {
    const entry = autoAttributes.find(
      (attribute: { name: string }) => attribute.name === "data-disabled",
    );

    render(
      <Radio.Root disabled aria-label="x">
        <Radio.Indicator />
      </Radio.Root>,
    );
    expect(screen.getByRole("radio")).toHaveAttribute(entry.name, entry.value);
  });

  it("omits data-disabled when the documented condition does not hold", () => {
    render(
      <Radio.Root aria-label="x">
        <Radio.Indicator />
      </Radio.Root>,
    );

    expect(screen.getByRole("radio")).not.toHaveAttribute("data-disabled");
  });
});
