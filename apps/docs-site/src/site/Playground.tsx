"use client";

import { useId, useState, type ReactNode } from "react";

import { CodeBlock } from "@/components/code-block";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/segmented-control";
import {
  DEFAULT_DENSITY,
  DENSITIES,
  initialValues,
  toJsx,
  type Density,
  type PlaygroundControl,
} from "@/lib/playground";

import "./playground.css";

/**
 * One labelled segmented control.
 *
 * `SegmentedControl` is built on RadioGroup semantics (single-select), which is
 * the correct model for "pick one variant" — a ToggleGroup would allow none or
 * many. The visible label is tied to the group with `aria-labelledby` rather
 * than a `<label>`, because a radiogroup is labelled by reference, not wrapped.
 */
const ControlGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) => {
  const labelId = `${useId()}-label`;
  return (
    <div className="docs-playground-control">
      <span className="docs-playground-control-label" id={labelId}>
        {label}
      </span>
      <SegmentedControl
        size="sm"
        value={value}
        onValueChange={onChange}
        aria-labelledby={labelId}
      >
        {options.map((option) => (
          <SegmentedControlItem key={option} value={option}>
            {option}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  );
};

export type PlaygroundProps = {
  /** Component name used in the generated snippet, e.g. `"Button"`. */
  component: string;
  /** Controls derived from the registry contract via `toControls`. */
  controls: readonly PlaygroundControl[];
  /** Renders the live preview for the current prop values. */
  children: (values: Record<string, string>) => ReactNode;
  /** Literal children to place inside the generated snippet. */
  snippetChildren?: string;
  /** Extra lines appended to the snippet, e.g. an import. */
  snippetPrefix?: string;
};

/**
 * The interactive playground that leads every component page.
 *
 * State lives here and nowhere else, which is what keeps the preview and the
 * code sample honest: the snippet is derived from the same values that render
 * the preview, so it cannot drift from what is on screen.
 */
export const Playground = ({
  component,
  controls,
  children,
  snippetChildren,
  snippetPrefix,
}: PlaygroundProps) => {
  const [values, setValues] = useState(() => initialValues(controls));
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);

  const jsx = toJsx({ component, values, controls, children: snippetChildren });
  const code = snippetPrefix ? `${snippetPrefix}\n\n${jsx}` : jsx;

  return (
    <div className="docs-playground">
      {/*
       * Density is applied as an ANCESTOR attribute, not a prop: `data-density`
       * re-points every Context token beneath it. That is the whole mechanism,
       * so the playground demonstrates it by scoping it to the preview box.
       */}
      <div className="docs-playground-preview" data-density={density}>
        {children(values)}
      </div>

      <div className="docs-playground-controls">
        {controls.map((control) => (
          <ControlGroup
            key={control.name}
            label={control.name}
            options={control.options}
            value={values[control.name]}
            onChange={(next) =>
              setValues((v) => ({ ...v, [control.name]: next }))
            }
          />
        ))}

        <ControlGroup
          label="density"
          options={DENSITIES}
          value={density}
          onChange={(next) => setDensity(next as Density)}
        />
      </div>

      <div className="docs-playground-code">
        <CodeBlock code={code} language="tsx" size="sm" />
      </div>
    </div>
  );
};
