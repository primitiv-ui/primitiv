import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render } from "@testing-library/react";

import { InputGroup } from "../InputGroup";

/**
 * Auto-verification of the InputGroup styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/input-group/contract.json` is *derived
 * from and asserted against the rendered headless `InputGroup.Root`* so it can
 * never drift. The root always carries `data-input-group`; the adornment slots
 * are styled through their part classes, not a contracted data attribute. The
 * authored half (part classes, custom properties) is a styling convention the
 * headless layer does not emit and is checked by the generator drift-guards.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/input-group/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("InputGroup styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    // The InputGroup root has no authored data-* surface; the contract is derived.
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits exactly the contracted data-* attribute names on the root", () => {
    const { container } = render(<InputGroup.Root />);
    const root = container.querySelector("[data-input-group]")!;

    const contracted = autoAttributes
      .map((attribute: { name: string }) => attribute.name)
      .sort();
    expect(dataAttributeNames(root)).toEqual(contracted);
  });

  it("always emits data-input-group", () => {
    const { container } = render(<InputGroup.Root />);
    expect(container.querySelector("[data-input-group]")).toHaveAttribute(
      "data-input-group",
      "",
    );
  });
});
