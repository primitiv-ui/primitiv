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
import { AxisSlider } from "./AxisSlider";
import { GamutToggle } from "./GamutToggle";
import { useGamutPaint } from "./useGamutPaint";
import { formatColor, parseColor } from "./color";
import { CHANNELS, clampChannel, roundChannel } from "./channels";
import type { Gamut, OklchValue } from "./types";

import "./OklchPicker.css";

const PLANE_SIZE = 280;
const STRIP_WIDTH = 280;

export type OklchPickerProps = {
  value: OklchValue;
  onChange: (value: OklchValue) => void;
};

export function OklchPicker({ value, onChange }: OklchPickerProps) {
  const planeRef = useRef<HTMLCanvasElement>(null);
  const hueStripRef = useRef<HTMLCanvasElement>(null);
  const lightnessStripRef = useRef<HTMLCanvasElement>(null);
  const chromaStripRef = useRef<HTMLCanvasElement>(null);

  // The gamut is the picker's own view state, not part of the controlled colour
  // value (Harmoni's model is opaque OkLCH) — so it stays internal and the
  // value/onChange contract is unchanged, keeping the picker portable.
  const [gamut, setGamut] = useState<Gamut>("Srgb");

  useGamutPaint({
    value,
    gamut,
    planeRef,
    hueStripRef,
    lightnessStripRef,
    chromaStripRef,
    planeWidth: PLANE_SIZE,
    planeHeight: PLANE_SIZE,
    stripWidth: STRIP_WIDTH,
  });

  const formatted = formatColor(value);

  // The text field echoes the engine's canonical string, but never clobbers an
  // edit in progress: while the field is focused the user's text stands (even as
  // a valid entry flows back through `onChange` and changes the value), and it
  // only resyncs to the canonical form on blur or when the value changes from
  // elsewhere (a drag, a slider, a numeric edit). oklch.com behaves the same —
  // the representation you are typing into is not rewritten under your cursor.
  const [text, setText] = useState(formatted.oklch);
  const [invalid, setInvalid] = useState(false);
  const focused = useRef(false);
  useEffect(() => {
    if (focused.current) return;
    setText(formatted.oklch);
    setInvalid(false);
  }, [formatted.oklch]);

  const handleFocus = () => {
    focused.current = true;
  };

  const handleBlur = () => {
    focused.current = false;
    setText(formatted.oklch);
    setInvalid(false);
  };

  const setChannel =
    (channel: keyof OklchValue) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.valueAsNumber;
      if (Number.isNaN(next)) return;
      onChange({ ...value, [channel]: clampChannel(channel, next) });
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
        <div className="oklch-picker__toolbar">
          <GamutToggle gamut={gamut} onChange={setGamut} />
        </div>
        <LcChart
          value={value}
          gamut={gamut}
          onChange={({ l, c }) => onChange({ ...value, l, c })}
          planeRef={planeRef}
          width={PLANE_SIZE}
          height={PLANE_SIZE}
        />
        <div className="oklch-picker__sliders">
          <AxisSlider
            label="Lightness"
            modifier="lightness"
            value={value.l}
            min={CHANNELS.l.min}
            max={CHANNELS.l.max}
            step={CHANNELS.l.step}
            onChange={(l) => onChange({ ...value, l })}
            stripRef={lightnessStripRef}
            width={STRIP_WIDTH}
          />
          <AxisSlider
            label="Chroma"
            modifier="chroma"
            value={value.c}
            min={CHANNELS.c.min}
            max={CHANNELS.c.max}
            step={CHANNELS.c.step}
            onChange={(c) => onChange({ ...value, c })}
            stripRef={chromaStripRef}
            width={STRIP_WIDTH}
          />
          <AxisSlider
            label="Hue"
            modifier="hue"
            value={value.h}
            min={CHANNELS.h.min}
            max={CHANNELS.h.max}
            step={CHANNELS.h.step}
            onChange={(h) => onChange({ ...value, h })}
            stripRef={hueStripRef}
            width={STRIP_WIDTH}
          />
        </div>
      </div>

      <div className="oklch-picker__fields">
        <Field.Root className="oklch-picker__field">
          <Field.Label>Lightness</Field.Label>
          <Input
            type="number"
            min={CHANNELS.l.min}
            max={CHANNELS.l.max}
            step={CHANNELS.l.step}
            value={roundChannel("l", value.l)}
            onChange={setChannel("l")}
          />
        </Field.Root>
        <Field.Root className="oklch-picker__field">
          <Field.Label>Chroma</Field.Label>
          <Input
            type="number"
            min={CHANNELS.c.min}
            max={CHANNELS.c.max}
            step={CHANNELS.c.step}
            value={roundChannel("c", value.c)}
            onChange={setChannel("c")}
          />
        </Field.Root>
        <Field.Root className="oklch-picker__field">
          <Field.Label>Hue</Field.Label>
          <Input
            type="number"
            min={CHANNELS.h.min}
            max={CHANNELS.h.max}
            step={CHANNELS.h.step}
            value={roundChannel("h", value.h)}
            onChange={setChannel("h")}
          />
        </Field.Root>
      </div>

      <Field.Root className="oklch-picker__text" invalid={invalid}>
        <Field.Label>Hex or OKLCH</Field.Label>
        <Input
          value={text}
          onChange={handleText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          spellCheck={false}
        />
        <Field.ErrorText>Not a recognised colour</Field.ErrorText>
      </Field.Root>
    </div>
  );
}
