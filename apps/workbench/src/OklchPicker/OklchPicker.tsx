// The OKLCH colour picker (RFC 0010 §5) — a self-contained, controlled
// component: `value` in, `onChange` out, no internal source of truth, so the
// directory lifts into the plugin unchanged (Principle 3). It owns the canvas
// refs and drives `useGamutPaint`, lays out the three reusable PlaneCharts and
// their Slider-backed AxisSliders, and composes the design system's Field/Input
// rows for the L/C/H numbers and the hex⇄oklch text field. Every colour
// conversion crosses into the one Rust engine (Principle 1); the chrome wears
// --primitiv-* tokens (Principle 4).

import { useEffect, useRef, useState } from "react";
import { Field, Input } from "@primitiv-ui/react";

import { PlaneChart, type PlaneAxisSpec } from "./PlaneChart";
import { AxisSlider } from "./AxisSlider";
import { GamutToggle } from "./GamutToggle";
import { useGamutPaint } from "./useGamutPaint";
import { boundaryPoints } from "./boundary";
import { formatColor, parseColor } from "./color";
import { CHANNELS, clampChannel, roundChannel } from "./channels";
import {
  C_MAX,
  LIGHTNESS_STEP,
  LIGHTNESS_COARSE_STEP,
  CHROMA_STEP,
  CHROMA_COARSE_STEP,
} from "./geometry";
import type { Gamut, OklchValue } from "./types";

import "./OklchPicker.css";

const PLANE_SIZE = 280;
const STRIP_WIDTH = 280;

/** Lightness samples taken across a boundary curve — smooth without overdraw. */
const BOUNDARY_SAMPLES = 64;

// Plotted-axis descriptors shared by the three charts (RFC 0010 §2): the Hue
// chart plots L×C, the Lightness chart H×C, the Chroma chart H×L.
const L_AXIS: PlaneAxisSpec = {
  channel: "l",
  name: "Lightness",
  max: CHANNELS.l.max,
  step: LIGHTNESS_STEP,
  coarseStep: LIGHTNESS_COARSE_STEP,
  precision: 2,
};
const C_AXIS: PlaneAxisSpec = {
  channel: "c",
  name: "Chroma",
  max: C_MAX,
  step: CHROMA_STEP,
  coarseStep: CHROMA_COARSE_STEP,
  precision: 3,
};

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

  // The Hue chart's gamut boundary: always the sRGB curve, plus the wider gamut's
  // curve in P3 mode so the band between them reads as the extended region.
  const hueBoundaries = [
    {
      className: "plane-chart__boundary plane-chart__boundary--srgb",
      points: boundaryPoints(value.h, PLANE_SIZE, PLANE_SIZE, C_MAX, BOUNDARY_SAMPLES, "Srgb"),
    },
    ...(gamut === "Srgb"
      ? []
      : [
          {
            className: "plane-chart__boundary plane-chart__boundary--extended",
            points: boundaryPoints(value.h, PLANE_SIZE, PLANE_SIZE, C_MAX, BOUNDARY_SAMPLES, gamut),
          },
        ]),
  ];

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
        <PlaneChart
          value={value}
          gamut={gamut}
          axes={{ x: L_AXIS, y: C_AXIS }}
          onChange={onChange}
          planeRef={planeRef}
          width={PLANE_SIZE}
          height={PLANE_SIZE}
          boundaries={hueBoundaries}
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
