import { CSSProperties, useState } from "react";

import { Carousel, RadioGroup, Slider } from "@primitiv-ui/react";

import { carouselImages } from "../fixtures";
import "./coverFlow.css";

/**
 * Cover Flow — based on the Blossom carousel CSS technique.
 *
 * Each Carousel.Slide is a narrow snap unit. Inside it sits a card-sized
 * `__visual` div (the perspective + translateX container) that overflows the
 * snap unit on each side, and inside that a `__card` div that handles only the
 * rotateY. Both are driven by named `view-timeline`s defined on the snap unit.
 *
 * Every dimension of the effect is exposed as a `--cf-*` custom property in
 * `coverFlow.css`. The playground above the carousel maps a slider (or, for
 * the slide shape, a radio group) onto each knob and writes the live values as
 * an inline `style` on `Carousel.Root` — inline styles override the stylesheet
 * defaults, so the SCSS values are the starting point and the reader can tune
 * from there. See the "Cover Flow" recipe in `packages/react/src/Carousel`'s
 * README for the underlying technique.
 */

interface SliderControl {
  /** The CSS custom property this slider drives. */
  prop: string;
  label: string;
  /** CSS unit appended to the raw slider value (e.g. "px"). */
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Default matching the SCSS so the initial render is unchanged. */
  value: number;
}

// Ranges are kept to a sensible spread either side of the SCSS default — wide
// enough to feel the effect change, narrow enough to stay tasteful.
const GEOMETRY: SliderControl[] = [
  { prop: "--cf-viewport-w", label: "Viewport width", unit: "rem", min: 26, max: 50, step: 1, value: 38 },
  { prop: "--cf-card-w", label: "Card width", unit: "px", min: 120, max: 260, step: 5, value: 180 },
  { prop: "--cf-snap", label: "Snap spacing", unit: "px", min: 50, max: 160, step: 5, value: 90 },
  { prop: "--cf-track-pad", label: "Track padding", unit: "px", min: 0, max: 40, step: 2, value: 32 },
  { prop: "--cf-radius", label: "Corner radius", unit: "px", min: 0, max: 32, step: 1, value: 6 },
];

const MOTION: SliderControl[] = [
  { prop: "--cf-spread", label: "Tilt spread", unit: "", min: 0.8, max: 2.2, step: 0.1, value: 1.4 },
  { prop: "--cf-tilt", label: "Tilt angle", unit: "deg", min: 25, max: 75, step: 1, value: 55 },
  { prop: "--cf-perspective", label: "Perspective", unit: "px", min: 250, max: 900, step: 25, value: 500 },
  { prop: "--cf-shift", label: "Card shift", unit: "%", min: 0, max: 55, step: 1, value: 30 },
  { prop: "--cf-lift", label: "Lift (z-index)", unit: "", min: 4, max: 16, step: 1, value: 10 },
  { prop: "--cf-scale", label: "Active scale", unit: "", min: 1, max: 1.6, step: 0.05, value: 1 },
];

const ALL_SLIDERS = [...GEOMETRY, ...MOTION];

// "Photo" matches the SCSS default (the image aspect ratio, 1120 / 959).
const PHOTO_ASPECT = String(1120 / 959);
const SHAPES = [
  { label: "Square", value: "1" },
  { label: "Photo", value: PHOTO_ASPECT },
  { label: "Wide", value: String(16 / 9) },
  { label: "Portrait", value: String(3 / 4) },
];

// Decimal places to show for a given step (e.g. 0.05 → 2, 0.1 → 1, 1 → 0).
function decimalsFor(step: number): number {
  return Number.isInteger(step) ? 0 : (String(step).split(".")[1] ?? "").length;
}

function formatValue({ unit, step }: SliderControl, raw: number): string {
  const num = raw.toFixed(decimalsFor(step));
  const suffix = unit === "deg" ? "°" : unit;
  return `${num}${suffix}`;
}

export function CoverFlow() {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(ALL_SLIDERS.map((c) => [c.prop, c.value])),
  );
  const [aspect, setAspect] = useState(PHOTO_ASPECT);

  const setValue = (prop: string, next: number) =>
    setValues((prev) => ({ ...prev, [prop]: next }));

  const cssVars = {
    ...Object.fromEntries(
      ALL_SLIDERS.map((c) => [c.prop, `${values[c.prop]}${c.unit}`]),
    ),
    "--cf-aspect": aspect,
  } as CSSProperties;

  const renderSliders = (controls: SliderControl[]) =>
    controls.map((control) => (
      <div className="cf-playground__control" key={control.prop}>
        <span className="cf-playground__label">
          <span>{control.label}</span>
          <span className="cf-playground__value">
            {formatValue(control, values[control.prop])}
          </span>
        </span>
        <Slider.Root
          className="sl-root"
          value={[values[control.prop]]}
          min={control.min}
          max={control.max}
          step={control.step}
          onValueChange={([next]) => setValue(control.prop, next)}
          aria-label={control.label}
        >
          <Slider.Track className="sl-track">
            <Slider.Range className="sl-range" />
          </Slider.Track>
          <Slider.Thumb className="sl-thumb" />
        </Slider.Root>
      </div>
    ));

  return (
    <div className="cf-playground">
      <div className="cf-playground__panel">
        <div className="cf-playground__shape-control">
          <span className="cf-playground__group-title">Slide shape</span>
          <RadioGroup.Root
            className="cf-playground__shape"
            value={aspect}
            onValueChange={setAspect}
            aria-label="Slide shape"
          >
            {SHAPES.map((shape) => (
              <RadioGroup.Item
                key={shape.value}
                className="cf-playground__shape-option"
                value={shape.value}
              >
                {shape.label}
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </div>

        <div className="cf-playground__group">
          <span className="cf-playground__group-title">Geometry</span>
          {renderSliders(GEOMETRY)}
        </div>

        <div className="cf-playground__group">
          <span className="cf-playground__group-title">Motion</span>
          {renderSliders(MOTION)}
        </div>
      </div>

      <Carousel.Root
        className="cover-flow"
        style={cssVars}
        ariaLabel="Metal primitives — cover flow"
        snapAlign="center"
      >
        <Carousel.Viewport className="cover-flow__viewport">
          {carouselImages.map(({ src, description }) => (
            <Carousel.Slide key={src} className="cover-flow__slide">
              <div className="cover-flow__visual">
                <div className="cover-flow__card">
                  <img
                    className="cover-flow__image cx-image"
                    src={src}
                    alt={description}
                  />
                </div>
              </div>
            </Carousel.Slide>
          ))}
        </Carousel.Viewport>
        <div className="cover-flow__controls cx-controls">
          <Carousel.PreviousTrigger
            className="cover-flow__trigger cx-trigger"
            aria-label="Previous"
          >
            {"<"}
          </Carousel.PreviousTrigger>
          <Carousel.Indicators
            className="cover-flow__indicator-group cx-indicators"
            label="Choose slide"
          />
          <Carousel.NextTrigger
            className="cover-flow__trigger cx-trigger"
            aria-label="Next"
          >
            {">"}
          </Carousel.NextTrigger>
        </div>
      </Carousel.Root>
    </div>
  );
}
