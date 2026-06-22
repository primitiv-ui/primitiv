// The OKLCH colour picker (RFC 0010 §5) — a self-contained, controlled
// component: `value` in, `onChange` out, no internal source of truth, so the
// directory lifts into the plugin unchanged (Principle 3). It owns the canvas
// refs and drives `useGamutPaint`, lays out the three reusable PlaneCharts and
// their Slider-backed AxisSliders, and composes the design system's Field/Input
// rows for the L/C/H numbers and the hex⇄oklch text field. Every colour
// conversion crosses into the one Rust engine (Principle 1); the chrome wears
// --primitiv-* tokens (Principle 4).

import { useEffect, useMemo, useRef, useState } from "react";
import { Field, Input } from "@primitiv-ui/react";

import { PlaneChart, type PlaneAxisSpec } from "./PlaneChart";
import { AxisSlider } from "./AxisSlider";
import { GamutToggle } from "./GamutToggle";
import { useGamutPaint } from "./useGamutPaint";
import { useElementSize } from "./useElementSize";
import { renderDimensions } from "./resolution";
import {
  boundaryPoints,
  chromaBoundaryPoints,
  hueBoundaryPoints,
} from "./boundary";
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

/** The charts' width:height ratio — a wide landscape plane, like oklch.com. */
const CHART_ASPECT = 2;

/** Samples taken across a boundary curve — smooth without overdraw. */
const BOUNDARY_SAMPLES = 64;

/** Lightness samples per hue used to locate the Hue chart's lightness limits. */
const HUE_BOUNDARY_LSTEPS = 32;

const SRGB_BOUNDARY_CLASS = "plane-chart__boundary plane-chart__boundary--srgb";
const EXTENDED_BOUNDARY_CLASS =
  "plane-chart__boundary plane-chart__boundary--extended";

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
const H_AXIS: PlaneAxisSpec = {
  channel: "h",
  name: "Hue",
  max: CHANNELS.h.max,
  step: 1,
  coarseStep: 10,
  precision: 0,
};

export type OklchPickerProps = {
  value: OklchValue;
  onChange: (value: OklchValue) => void;
};

export function OklchPicker({ value, onChange }: OklchPickerProps) {
  const planeRef = useRef<HTMLCanvasElement>(null);
  const lightnessPlaneRef = useRef<HTMLCanvasElement>(null);
  const chromaPlaneRef = useRef<HTMLCanvasElement>(null);
  const hueStripRef = useRef<HTMLCanvasElement>(null);
  const lightnessStripRef = useRef<HTMLCanvasElement>(null);
  const chromaStripRef = useRef<HTMLCanvasElement>(null);

  // The gamut is the picker's own view state, not part of the controlled colour
  // value (Harmoni's model is opaque OkLCH) — so it stays internal and the
  // value/onChange contract is unchanged, keeping the picker portable.
  const [gamut, setGamut] = useState<Gamut>("Srgb");

  // The charts fill their container at a fixed aspect ratio; measure that width
  // and paint the canvases at the measured size scaled by devicePixelRatio, so
  // they stay sharp on HiDPI displays and re-render when the container resizes.
  const axesRef = useRef<HTMLDivElement>(null);
  const { width: measuredWidth } = useElementSize(axesRef);
  const dpr = window.devicePixelRatio || 1;
  const render = renderDimensions(
    measuredWidth,
    measuredWidth / CHART_ASPECT,
    dpr,
  );

  useGamutPaint({
    value,
    gamut,
    planeRef,
    lightnessPlaneRef,
    chromaPlaneRef,
    hueStripRef,
    lightnessStripRef,
    chromaStripRef,
    planeWidth: render.width,
    planeHeight: render.height,
    stripWidth: render.width,
  });

  const formatted = formatColor(value);

  // Each chart draws its gamut boundary as a clean curve — always the sRGB curve,
  // plus the wider gamut's curve in P3 mode so the band between them reads as the
  // extended region. The Hue chart has two limits (upper/lower lightness) per
  // gamut; its sweep is the heaviest, so it is memoised on its inputs.
  const lightnessBoundaries = [
    {
      className: SRGB_BOUNDARY_CLASS,
      points: boundaryPoints(value.h, render.width, render.height, C_MAX, BOUNDARY_SAMPLES, "Srgb"),
    },
    ...(gamut === "Srgb"
      ? []
      : [
          {
            className: EXTENDED_BOUNDARY_CLASS,
            points: boundaryPoints(value.h, render.width, render.height, C_MAX, BOUNDARY_SAMPLES, gamut),
          },
        ]),
  ];

  const chromaBoundaries = [
    {
      className: SRGB_BOUNDARY_CLASS,
      points: chromaBoundaryPoints(value.l, render.width, render.height, C_MAX, BOUNDARY_SAMPLES, "Srgb"),
    },
    ...(gamut === "Srgb"
      ? []
      : [
          {
            className: EXTENDED_BOUNDARY_CLASS,
            points: chromaBoundaryPoints(value.l, render.width, render.height, C_MAX, BOUNDARY_SAMPLES, gamut),
          },
        ]),
  ];

  const hueBoundaries = useMemo(() => {
    const curves = (g: Gamut, className: string) => {
      const { upper, lower } = hueBoundaryPoints(
        value.c,
        render.width,
        render.height,
        BOUNDARY_SAMPLES,
        g,
        HUE_BOUNDARY_LSTEPS,
      );
      return [
        { className, points: upper },
        { className, points: lower },
      ];
    };
    return [
      ...curves("Srgb", SRGB_BOUNDARY_CLASS),
      ...(gamut === "Srgb" ? [] : curves(gamut, EXTENDED_BOUNDARY_CLASS)),
    ];
  }, [value.c, render.width, render.height, gamut]);

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
        {/* The three-chart net, top→bottom Lightness, Chroma, Hue (oklch.com's
            order). Each column carries its channel's title + number field above
            the chart it pins (RFC 0010 §2, §5) and its painted slider below. */}
        <div className="oklch-picker__axes" ref={axesRef}>
          <div className="oklch-picker__axis">
            <Field.Root className="oklch-picker__axis-field">
              <Field.Label className="oklch-picker__axis-title">
                Lightness
              </Field.Label>
              <Input
                type="number"
                min={CHANNELS.l.min}
                max={CHANNELS.l.max}
                step={CHANNELS.l.step}
                value={roundChannel("l", value.l)}
                onChange={setChannel("l")}
              />
            </Field.Root>
            <PlaneChart
              value={value}
              gamut={gamut}
              axes={{ x: L_AXIS, y: C_AXIS }}
              onChange={onChange}
              planeRef={planeRef}
              width={render.width}
              height={render.height}
              boundaries={lightnessBoundaries}
            />
            <AxisSlider
              label="Lightness"
              modifier="lightness"
              value={value.l}
              min={CHANNELS.l.min}
              max={CHANNELS.l.max}
              step={CHANNELS.l.step}
              onChange={(l) => onChange({ ...value, l })}
              stripRef={lightnessStripRef}
              width={render.width}
            />
          </div>
          <div className="oklch-picker__axis">
            <Field.Root className="oklch-picker__axis-field">
              <Field.Label className="oklch-picker__axis-title">
                Chroma
              </Field.Label>
              <Input
                type="number"
                min={CHANNELS.c.min}
                max={CHANNELS.c.max}
                step={CHANNELS.c.step}
                value={roundChannel("c", value.c)}
                onChange={setChannel("c")}
              />
            </Field.Root>
            <PlaneChart
              value={value}
              gamut={gamut}
              axes={{ x: H_AXIS, y: C_AXIS }}
              onChange={onChange}
              planeRef={lightnessPlaneRef}
              width={render.width}
              height={render.height}
              boundaries={chromaBoundaries}
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
              width={render.width}
            />
          </div>
          <div className="oklch-picker__axis">
            <Field.Root className="oklch-picker__axis-field">
              <Field.Label className="oklch-picker__axis-title">
                Hue
              </Field.Label>
              <Input
                type="number"
                min={CHANNELS.h.min}
                max={CHANNELS.h.max}
                step={CHANNELS.h.step}
                value={roundChannel("h", value.h)}
                onChange={setChannel("h")}
              />
            </Field.Root>
            <PlaneChart
              value={value}
              gamut={gamut}
              axes={{ x: H_AXIS, y: L_AXIS }}
              onChange={onChange}
              planeRef={chromaPlaneRef}
              width={render.width}
              height={render.height}
              boundaries={hueBoundaries}
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
              width={render.width}
            />
          </div>
        </div>
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
