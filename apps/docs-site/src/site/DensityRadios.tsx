"use client";

import { useId } from "react";

import { Radio } from "@/components/radio";
import { DENSITIES, type Density } from "@/lib/playground";

import "./playground.css";

const titleCase = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * The density control, shared by the Playground and every example.
 *
 * Extracted so the two cannot diverge — an example that switched density with a
 * different control than the playground would read as a different mechanism,
 * when it is exactly the same one.
 *
 * A real `<fieldset>` + `<legend>`. `Radio` wraps a native
 * `<input type="radio">`, so sharing a `name` gives grouping and arrow-key
 * navigation for free (no `RadioGroup` needed), and the legend is what names the
 * group to a screen reader. The `name` is per-instance, so several density
 * controls on one page cannot end up in the same native group.
 */
export const DensityRadios = ({
  value,
  onChange,
}: {
  value: Density;
  onChange: (next: Density) => void;
}) => {
  const name = `${useId()}-density`;

  return (
    <fieldset className="docs-fieldset">
      <legend className="docs-overline">Density</legend>
      <div className="docs-radio-row">
        {DENSITIES.map((d) => (
          <Radio
            key={d}
            size="sm"
            name={name}
            value={d}
            checked={value === d}
            onCheckedChange={(checked) => {
              if (checked) onChange(d);
            }}
          >
            {titleCase(d)}
          </Radio>
        ))}
      </div>
    </fieldset>
  );
};
