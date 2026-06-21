// The OKLCH colour picker (RFC 0010 §5) — a self-contained, controlled
// component: `value` in, `onChange` out, no internal source of truth, so the
// directory lifts into the plugin unchanged (Principle 3). It owns the two
// canvas refs and drives `useGamutPaint`, lays out the bespoke LcChart and the
// Slider-backed HueSlider, and composes the design system's Field/Input rows
// for the L/C/H numbers and the hex⇄oklch text field. Every colour conversion
// crosses into the one Rust engine (Principle 1); the chrome wears --primitiv-*
// tokens (Principle 4).

import { useEffect, useRef, useState } from "react";
import { Field, Input } from "@primitiv-ui/react";

import { LcChart } from "./LcChart";
import { HueSlider } from "./HueSlider";
import { useGamutPaint } from "./useGamutPaint";
import { formatColor, parseColor } from "./color";
import { C_MAX } from "./geometry";
import type { OklchValue } from "./types";

import "./OklchPicker.css";

const PLANE_SIZE = 280;
const STRIP_WIDTH = 280;

export type OklchPickerProps = {
  value: OklchValue;
  onChange: (value: OklchValue) => void;
};

export function OklchPicker({ value, onChange }: OklchPickerProps) {
  const planeRef = useRef<HTMLCanvasElement>(null);
  const stripRef = useRef<HTMLCanvasElement>(null);

  useGamutPaint({
    value,
    planeRef,
    stripRef,
    planeWidth: PLANE_SIZE,
    planeHeight: PLANE_SIZE,
    stripWidth: STRIP_WIDTH,
  });

  const formatted = formatColor(value);

  // The text field echoes the engine's canonical string and only resets when
  // the colour actually changes (a drag, a slider, or a numeric edit) — so an
  // in-progress, not-yet-valid entry isn't clobbered by a re-render.
  const [text, setText] = useState(formatted.oklch);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setText(formatted.oklch);
    setInvalid(false);
  }, [formatted.oklch]);

  const setChannel =
    (channel: keyof OklchValue) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.valueAsNumber;
      if (Number.isNaN(next)) return;
      onChange({ ...value, [channel]: next });
    };

  const handleText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setText(next);
    const parsed = parseColor(next);
    if (parsed) {
      setInvalid(false);
      onChange(parsed);
    } else {
      setInvalid(true);
    }
  };

  return (
    <div className="oklch-picker">
      <div className="oklch-picker__charts">
        <LcChart
          value={value}
          onChange={({ l, c }) => onChange({ ...value, l, c })}
          planeRef={planeRef}
          width={PLANE_SIZE}
          height={PLANE_SIZE}
        />
        <HueSlider
          hue={value.h}
          onChange={(h) => onChange({ ...value, h })}
          stripRef={stripRef}
          width={STRIP_WIDTH}
        />
      </div>

      <div className="oklch-picker__fields">
        <Field.Root className="oklch-picker__field">
          <Field.Label>Lightness</Field.Label>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.001}
            value={value.l}
            onChange={setChannel("l")}
          />
        </Field.Root>
        <Field.Root className="oklch-picker__field">
          <Field.Label>Chroma</Field.Label>
          <Input
            type="number"
            min={0}
            max={C_MAX}
            step={0.001}
            value={value.c}
            onChange={setChannel("c")}
          />
        </Field.Root>
        <Field.Root className="oklch-picker__field">
          <Field.Label>Hue</Field.Label>
          <Input
            type="number"
            min={0}
            max={360}
            step={0.1}
            value={value.h}
            onChange={setChannel("h")}
          />
        </Field.Root>
      </div>

      <Field.Root className="oklch-picker__text" invalid={invalid}>
        <Field.Label>Hex or OKLCH</Field.Label>
        <Input value={text} onChange={handleText} spellCheck={false} />
        <Field.ErrorText>Not a recognised colour</Field.ErrorText>
      </Field.Root>
    </div>
  );
}
