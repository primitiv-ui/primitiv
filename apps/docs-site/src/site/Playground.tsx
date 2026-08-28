"use client";

import { useId, useState, type ReactNode } from "react";

import { Card, CardContent } from "@/components/card";
import { CodeBlock } from "@/components/code-block";
import { Divider } from "@/components/divider";

import { DensityRadios } from "./DensityRadios";
import { ModeCodeBlock } from "./ModeCodeBlock";
import { Radio } from "@/components/radio";
import { Stack } from "@/components/stack";
import { Switch } from "@/components/switch";
import {
  DEFAULT_DENSITY,
  initialValues,
  toJsx,
  type Density,
  type PlaygroundControl,
} from "@/lib/playground";

import { useMode, type Mode } from "@/site/preferences";

import "./playground.css";

/*
 * Prop name -> control label. Splits camelCase, because a control's name IS the
 * prop name and a spec-declared one is often multi-word: `showDescription`
 * printed as "ShowDescription", which reads as a typo rather than a label. The
 * contract-derived names (`size`, `variant`, `tone`) are single words and come
 * through unchanged.
 */
const titleCase = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/ ([A-Z])(?=[a-z])/g, (_, c: string) => ` ${c.toLowerCase()}`);

/**
 * A labelled control column.
 *
 * A radio group — a `<fieldset>` + `<legend>` with one `Radio` per option,
 * matching `DensityRadios` exactly, so the density control and the prop controls
 * are the same control. It replaced a `SegmentedControl`: a six-option modifier
 * (Stack's `gap`, `justify`) made the segments wrap their labels on a narrow
 * viewport, and segments stop reading as a picker once they wrap. Radios wrap
 * per-item instead and never truncate a label.
 */
/**
 * True for a control whose only options are the two booleans.
 *
 * Both the contract-derived controls and a spec's own can be boolean —
 * Stepper's `compact` modifier and Accordion's `multiple` prop are the same
 * shape — so the test is on the OPTIONS rather than on where the control came
 * from.
 */
const isBoolean = (options: readonly string[]) =>
  options.length === 2 &&
  options.includes("true") &&
  options.includes("false");

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
  /* Per-instance so several controls on one page cannot share a native radio
     group — the same guarantee `DensityRadios` makes. */
  const name = `${useId()}-control`;

  /*
   * A boolean gets a Switch, not a two-option radio group. Asking the reader to
   * pick between two radios reading "false" and "true" is a worse way to express
   * an on/off than the component the library already ships for exactly that.
   *
   * The value stays a STRING either way, so nothing downstream changes: the
   * snippet builders and previews all read `values[name]` as before.
   */
  if (isBoolean(options)) {
    return (
      <div className="docs-playground-control">
        <Switch
          size="sm"
          checked={value === "true"}
          onCheckedChange={(next) => onChange(next ? "true" : "false")}
        >
          {label}
        </Switch>
      </div>
    );
  }

  return (
    <fieldset className="docs-fieldset">
      {/* The legend names the group to assistive tech — the same
          fieldset/legend shape as DensityRadios, not an aria-labelledby span. */}
      <legend className="docs-control-label">{label}</legend>
      <div className="docs-radio-row">
        {options.map((option) => (
          <Radio
            key={option}
            size="sm"
            name={name}
            value={option}
            checked={value === option}
            onCheckedChange={(checked) => {
              if (checked) onChange(option);
            }}
          >
            {option}
          </Radio>
        ))}
      </div>
    </fieldset>
  );
};

export type PlaygroundProps = {
  component: string;
  controls: readonly PlaygroundControl[];
  children: (values: Record<string, string>) => ReactNode;
  snippetChildren?: string;
  snippetPrefix?: string | ((mode: Mode) => string);
  /** Replaces the generated snippet — see `ComponentSpec.playground.snippet`. */
  snippet?: (values: Record<string, string>, mode: Mode) => string;
  /** Stretch the preview to its container's width — see `ComponentSpec`. */
  fill?: boolean;
};

/**
 * The interactive playground that leads every component page.
 *
 * Structure read off the Figma "Section · Playground" frame — one `Card`
 * (size `lg`) divided into three regions by hairline `Divider`s:
 *
 *   DENSITY   overline + a row of RADIOS          (Dense...Spacious)
 *   ─────
 *   PREVIEW   overline + the centred live preview
 *   ─────
 *   Variant / Size — labelled SEGMENTED CONTROLS, two-up
 *
 * then the snippet in a `CodeBlock` (size `sm`) below the card, and a 12px
 * muted note.
 *
 * Two control types, deliberately, because the design distinguishes them and
 * the distinction carries meaning:
 *
 * - **Density is radios.** It is not a component prop at all — it is a
 *   `data-density` ANCESTOR that re-points every Context token beneath it. A
 *   radio group says "pick one of four states of the environment", and keeping
 *   all four visible shows the scale it moves through.
 * - **Variant and size are segmented controls.** The Figma frame draws these as
 *   `Select` dropdowns; segmented controls were preferred on review, because
 *   every option stays visible and comparable in one glance, which is the point
 *   of a playground. The trade-off is real and worth remembering: a segmented
 *   control does not scale past roughly five options, so a component with a
 *   long variant list will need the select after all.
 *
 * Density sits at the TOP and the prop controls at the BOTTOM, per the design.
 * That ordering is also the robust one: the preview resizes when either
 * changes, and a control below a resizing preview gets pushed by its own click,
 * moving the option out from under the pointer.
 */
export const Playground = ({
  component,
  controls,
  children,
  fill = false,
  snippetChildren,
  snippetPrefix,
  snippet,
}: PlaygroundProps) => {
  const [values, setValues] = useState(() => initialValues(controls));
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);
  const [mode, setMode] = useMode();

  /* The snippet has to know the mode: a compound's part names differ between
     headless (`Select.Trigger`) and styled (`SelectTrigger`), and only one of
     the two is importable at a time. Read here rather than threaded from the
     page, because `useMode` is a shared store — every caller subscribes to the
     same key (see preferences.ts). */

  /*
   * The snippet is rendered for BOTH consumption modes at once and tabbed,
   * rather than following the switch and showing one — see the tablist below
   * for why. So this builds either, and the tab decides which is on top.
   *
   * Contract props are dropped from the headless snippet: every control comes
   * from a `contract.json` modifier, i.e. from the styled layer, so printing
   * one under Headless names a prop the reader cannot pass (`contractAttr`'s
   * note in lib/playground.ts). Passing no controls to `toJsx` does that, since
   * it builds the attribute list from this same array. A spec with its own
   * `snippet` handles the same thing per-attribute.
   */
  const codeFor = (m: Mode) => {
    /* `snippet` writes the WHOLE snippet by definition — imports included — so
       `snippetPrefix` belongs only to the generated path. Applying both printed
       Input's import line twice, and would have done so for every spec that
       supplied the pair. */
    if (snippet) return snippet(values, m);

    const jsx = toJsx({
      component,
      values,
      controls: m === "headless" ? [] : controls,
      children: snippetChildren,
    });
    const prefix =
      typeof snippetPrefix === "function" ? snippetPrefix(m) : snippetPrefix;
    return prefix ? `${prefix}\n\n${jsx}` : jsx;
  };

  return (
    <Stack gap="md">
      <Card size="lg">
        <CardContent>
          <Stack gap="md">
            <DensityRadios value={density} onChange={setDensity} />

            <Divider />

            <Stack gap="sm">
              <p className="docs-overline">Preview</p>
              {/* data-density on the wrapper, not the component: that IS the
                  mechanism the control above is demonstrating. */}
              <div
                className={
                  fill
                    ? "docs-playground-preview docs-playground-preview--fill"
                    : "docs-playground-preview"
                }
                data-density={density}
              >
                {children(values)}
              </div>
            </Stack>

            {controls.length > 0 && (
              <>
                <Divider />
                {/*
                 * An auto-fit grid, not `Grid columns={2}`. A fixed two-up
                 * cannot work here: Button has five variants AND five sizes, and
                 * two equal-width 5-segment controls need ~840px of segment
                 * width alone — more than the 824px content column. So a fixed
                 * pair overflows, and `Grid`'s knob is a column COUNT, which
                 * cannot express "as many as fit".
                 *
                 * Shrinking them with a denser `data-density` on the container
                 * would also fit, but was rejected: these controls are chrome,
                 * and making chrome smaller to dodge a layout problem trades a
                 * real hit-area for tidiness. Reflowing costs nothing.
                 */}
                <div className="docs-control-grid">
                  {controls.map((control) => (
                    <ControlGroup
                      key={control.name}
                      label={titleCase(control.name)}
                      options={control.options}
                      value={values[control.name]}
                      onChange={(next) =>
                        setValues((v) => ({ ...v, [control.name]: next }))
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Both modes, tabbed, two-way bound to the nav switch — the same block
          every example on the page uses. See ModeCodeBlock for why both are
          shown rather than following the switch.

          It also closes a hole that appeared the moment contract props stopped
          being printed under Headless: a single mode-following snippet left a
          headless reader with controls that changed the preview and nothing in
          the code, which reads as broken. With both tabs present the controls
          always drive the preview and the Styled tab. */}
      <ModeCodeBlock code={codeFor} />

      <p className="docs-playground-note">
        Density is set by a <code>data-density</code> ancestor — the Context
        system, not a {component} prop.
      </p>
    </Stack>
  );
};
