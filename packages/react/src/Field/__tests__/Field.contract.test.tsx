import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render } from "@testing-library/react";

import { Field } from "../Field";

/**
 * Auto-verification of the Field styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/field/contract.json` is *derived from and
 * asserted against the rendered headless `Field.Root`* so it can never drift from
 * what the component emits. The root always carries `data-field`, plus
 * `data-field-invalid` / `data-field-disabled` / `data-field-required` when the
 * matching flag is set. The authored half (part classes, custom properties) is a
 * styling convention the headless layer does not emit and is checked by the
 * generator drift-guards instead.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/field/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

/** Render a `Field.Root` with the given flags and return its `[data-field]` element. */
function renderRoot(props: Record<string, boolean>): Element {
  const { container } = render(<Field.Root {...props} />);
  return container.querySelector("[data-field]")!;
}

describe("Field styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    // The Field has no authored data-* surface; the whole contract is derived.
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attribute names across its states", () => {
    const emitted = new Set<string>();
    const states: Record<string, boolean>[] = [
      {},
      { invalid: true, disabled: true, required: true },
    ];
    for (const props of states) {
      for (const name of dataAttributeNames(renderRoot(props))) {
        emitted.add(name);
      }
    }

    const contracted = new Set(
      autoAttributes.map((attribute: { name: string }) => attribute.name),
    );
    expect([...emitted].sort()).toEqual([...contracted].sort());
  });

  it("always emits data-field regardless of state", () => {
    expect(renderRoot({})).toHaveAttribute("data-field", "");
  });

  it("emits each conditional attribute exactly as the contract documents it", () => {
    const conditional = autoAttributes.filter(
      (attribute: { when: string }) => attribute.when !== "always",
    );

    for (const entry of conditional) {
      const root = renderRoot({ [entry.when]: true });
      expect(root).toHaveAttribute(entry.name, entry.value);
    }
  });

  it("omits each conditional attribute when its flag is not set", () => {
    const root = renderRoot({});
    for (const entry of autoAttributes.filter(
      (attribute: { when: string }) => attribute.when !== "always",
    )) {
      expect(root).not.toHaveAttribute(entry.name);
    }
  });
});
