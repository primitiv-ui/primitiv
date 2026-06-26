import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render, screen } from "@testing-library/react";

import { Divider } from "../Divider";

/**
 * Auto-verification of the Divider styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/divider/contract.json` is *derived from
 * and asserted against the rendered headless component* so it can never drift
 * from what the component actually emits. Divider has **no** data-* surface — it
 * styles off `aria-orientation` — so the guard also pins that hook: the registry
 * stylesheet's `[aria-orientation="…"]` selectors depend on it.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/divider/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

/** Every `data-*` attribute name present on an element. */
function dataAttributeNames(element: Element): string[] {
  return [...element.attributes]
    .map((attribute) => attribute.name)
    .filter((name) => name.startsWith("data-"))
    .sort();
}

describe("Divider styling contract", () => {
  const autoAttributes = contract.dataAttributes.filter(
    (attribute: { source: string }) => attribute.source === "auto",
  );

  it("declares every data-* attribute as auto-verified against the component", () => {
    expect(autoAttributes).toHaveLength(contract.dataAttributes.length);
  });

  it("emits no data-* attributes in either orientation", () => {
    const { rerender } = render(<Divider />);
    const emitted = new Set(dataAttributeNames(screen.getByRole("separator")));

    rerender(<Divider orientation="vertical" />);
    for (const name of dataAttributeNames(screen.getByRole("separator"))) {
      emitted.add(name);
    }

    expect([...emitted]).toEqual([]);
  });

  it("exposes the orientation through aria-orientation — the styling hook", () => {
    const { rerender } = render(<Divider />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );

    rerender(<Divider orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });
});
