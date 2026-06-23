// A living mock of the Harmoni Figma plugin window — a fixed 640×800 frame (the
// real plugin size, set in apps/harmoni-figma-plugin/src/code/code.ts) that the
// plugin layout is iterated in, here in the workbench where we already have the
// tokens and headless components. RFC 0010 §9: the OKLCH picker has to fit this
// narrow surface, so the brand colour uses the picker's compact `layout="row"`
// (three charts side by side) and the white/black anchors collapse to a single
// lightness control (chroma fixed at 0; colour comes from the brand-hue tint).
//
// Everything except the brand picker is a faithful static stand-in for the
// current plugin chrome — enough to judge composition and height at a glance.
// The frame width is adjustable to feel out whether a slightly wider window
// helps the row charts. This page is a design sandbox, not a gated component.

import { useEffect, useMemo, useState } from "react";
import init from "harmoni-wasm";

import {
  OklchPicker,
  parseColor,
  formatColor,
  type OklchValue,
} from "../../OklchPicker";

import "./PluginFrameExample.css";

const FRAME_WIDTHS = [600, 640, 720, 800] as const;
const FRAME_HEIGHT = 800;

const DEFAULT_BRAND = "oklch(0.65 0.18 30)";

// The plugin's 11 ramp steps (see stepLabel in the plugin's ColorEngine).
const STEP_LABELS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

// A static stand-in ramp: 11 cells mixed between two endpoints in OKLCH, so the
// placeholder reads like a real generated ramp without running the engine.
function PlaceholderRamp({ light, dark }: { light: string; dark: string }) {
  return (
    <div className="pf-ramp" role="img" aria-label="Example ramp">
      {STEP_LABELS.map((label, i) => {
        const t = (i / (STEP_LABELS.length - 1)) * 100;
        return (
          <span
            key={label}
            className="pf-ramp__step"
            style={{
              background: `color-mix(in oklch, ${light}, ${dark} ${t}%)`,
            }}
          />
        );
      })}
    </div>
  );
}

// The white/black anchor control — a single lightness slider with a grey swatch
// (chroma fixed at 0). The painted lightness track is a follow-up; a plain range
// conveys the control and its height for the layout mock.
function LightnessAnchor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (l: number) => void;
}) {
  return (
    <label className="pf-anchor">
      <span className="pf-anchor__label">{label}</span>
      <span
        className="pf-anchor__swatch"
        style={{ background: `oklch(${value} 0 0)` }}
      />
      <input
        className="pf-anchor__slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
      <span className="pf-anchor__value">{value.toFixed(2)}</span>
    </label>
  );
}

export function PluginFrameExample() {
  const [frameWidth, setFrameWidth] = useState<number>(640);
  const [ready, setReady] = useState(false);

  const [brand, setBrand] = useState<OklchValue>();
  const [whiteL, setWhiteL] = useState(0.99);
  const [blackL, setBlackL] = useState(0.18);

  useEffect(() => {
    init().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    setBrand((prev) => prev ?? parseColor(DEFAULT_BRAND) ?? undefined);
  }, [ready]);

  const brandHex = useMemo(
    () => (brand ? formatColor(brand).hex : "#000000"),
    [brand],
  );

  return (
    <div className="pf-page">
      <header className="pf-page__head">
        <h1>Plugin frame sandbox</h1>
        <p>
          The Harmoni plugin window at its real {FRAME_WIDTHS[1]}×{FRAME_HEIGHT}.
          The brand colour uses the OKLCH picker&rsquo;s compact{" "}
          <code>layout=&quot;row&quot;</code>; white and black are
          lightness-only anchors (the tint adds colour). Adjust the frame width
          to feel out the row charts.
        </p>
        <div className="pf-width-control" role="group" aria-label="Frame width">
          {FRAME_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              className={
                w === frameWidth
                  ? "pf-width-control__btn pf-width-control__btn--active"
                  : "pf-width-control__btn"
              }
              aria-pressed={w === frameWidth}
              onClick={() => setFrameWidth(w)}
            >
              {w}px
            </button>
          ))}
        </div>
      </header>

      <div
        className="pf-frame"
        style={{ width: frameWidth, height: FRAME_HEIGHT }}
      >
        <div className="pf-frame__body">
          <h2 className="pf-frame__title">Harmoni Color Engine</h2>

          <section className="pf-section">
            <div className="pf-anchors">
              <LightnessAnchor label="White" value={whiteL} onChange={setWhiteL} />
              <LightnessAnchor label="Black" value={blackL} onChange={setBlackL} />
            </div>
          </section>

          <section className="pf-section">
            <div className="pf-section__head">
              <span className="pf-section__title">Brand</span>
              <span
                className="pf-brand-swatch"
                style={{ background: brandHex }}
                aria-hidden="true"
              />
              <code className="pf-brand-hex">{brandHex}</code>
            </div>
            {brand ? (
              <OklchPicker value={brand} onChange={setBrand} layout="row" />
            ) : (
              <p className="pf-loading">Starting engine…</p>
            )}
            <button type="button" className="pf-btn pf-btn--ghost">
              Use brand as neutral tint
            </button>
          </section>

          <section className="pf-section">
            <span className="pf-section__title">Neutral</span>
            <div className="pf-ramp-row">
              <span className="pf-ramp-row__label">Light</span>
              <PlaceholderRamp light="oklch(0.99 0 0)" dark="oklch(0.18 0 0)" />
            </div>
            <div className="pf-ramp-row">
              <span className="pf-ramp-row__label">Dark</span>
              <PlaceholderRamp light="oklch(0.22 0 0)" dark="oklch(0.95 0 0)" />
            </div>
          </section>

          <section className="pf-section">
            <span className="pf-section__title">Brand ramp</span>
            <div className="pf-ramp-row">
              <span className="pf-ramp-row__label">Light</span>
              <PlaceholderRamp
                light="oklch(0.97 0.03 30)"
                dark={`oklch(0.25 0.08 ${brand?.h ?? 30})`}
              />
            </div>
            <div className="pf-ramp-row">
              <span className="pf-ramp-row__label">Dark</span>
              <PlaceholderRamp
                light={`oklch(0.3 0.08 ${brand?.h ?? 30})`}
                dark="oklch(0.95 0.03 30)"
              />
            </div>
          </section>

          <section className="pf-section pf-actions">
            <label className="pf-field">
              Ramp name
              <input className="pf-text-input" type="text" defaultValue="brand" />
            </label>
            <label className="pf-check">
              <input type="checkbox" /> Write white &amp; black
            </label>
            <label className="pf-check">
              <input type="checkbox" /> Write neutral ramp
            </label>
            <div className="pf-actions__buttons">
              <button type="button" className="pf-btn pf-btn--primary">
                Apply to Figma
              </button>
              <button type="button" className="pf-btn pf-btn--ghost">
                Close
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
