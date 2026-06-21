import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render } from "@testing-library/react";

import { Switch } from "../Switch";

/**
 * Auto-verification of the Switch styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/switch/contract.json` is *derived from and
 * asserted against the rendered headless component* so it can never drift from
 * what the component actually emits. The switch's `data-*` surface lives on the
 * **track** (the styled root) — `data-state="checked" | "unchecked"` (always
 * present) plus `data-disabled=""` when disabled. The authored half (classes,
 * parts, custom properties) is a styling convention the headless layer does not
 * emit and is checked by the generator drift-guards instead.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/switch/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** The wrapper element is the contracted styling root. */
function rootOf(container: HTMLElement): HTMLElement {
  const root = container.querySelector("label");
  if (!root) throw new Error("expected a Switch wrapper element");
  return root;
}

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("Switch styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attribute names across its states", () => {
    const emitted = new Set<string>();
    for (const ui of [
      <Switch.Root key="checked" checked onCheckedChange={() => {}} aria-label="x">
        <Switch.Thumb />
      </Switch.Root>,
      <Switch.Root key="disabled" disabled aria-label="x">
        <Switch.Thumb />
      </Switch.Root>,
    ]) {
      const { container, unmount } = render(ui);
      for (const name of dataAttributeNames(rootOf(container))) {
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
      const { container, unmount } = render(
        <Switch.Root
          checked={entry.value === "checked"}
          onCheckedChange={() => {}}
          aria-label="x"
        >
          <Switch.Thumb />
        </Switch.Root>,
      );
      expect(rootOf(container)).toHaveAttribute("data-state", entry.value);
      unmount();
    }
  });

  it("emits data-disabled exactly as the contract documents it", () => {
    const entry = autoAttributes.find(
      (attribute: { name: string }) => attribute.name === "data-disabled",
    );

    const { container } = render(
      <Switch.Root disabled aria-label="x">
        <Switch.Thumb />
      </Switch.Root>,
    );
    expect(rootOf(container)).toHaveAttribute(entry.name, entry.value);
  });

  it("omits data-disabled when the documented condition does not hold", () => {
    const { container } = render(
      <Switch.Root aria-label="x">
        <Switch.Thumb />
      </Switch.Root>,
    );
    expect(rootOf(container)).not.toHaveAttribute("data-disabled");
  });
});
