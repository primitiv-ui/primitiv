// A faithful, working replica of the Figma plugin's ColorEngine
// (apps/harmoni-figma-plugin/src/ui/ColorEngine.tsx), developed here in the
// workbench (RFC 0010 §9). Same engine, same palette rows, same tint flow — the
// three <input type=color> swatches are replaced with the OKLCH picker (brand,
// compact row layout) and the painted LightnessSlider (white/black anchors,
// lightness-only; colour comes from the tint). Export-to-Figma is omitted.

import { useEffect, useState } from "react";

import { Button, Slider } from "@primitiv-ui/react";

import {
  OklchPicker,
  LightnessSlider,
  parseColor,
  formatColor,
  type OklchValue,
} from "../../OklchPicker";

import { usePluginColors } from "./usePluginColors";
import { PluginPalette } from "./PluginPalette";
import { CurveEditor } from "./CurveEditor";
import { RampPadding } from "./RampPadding";

// The canonical Button default theme from the registry (as `primitiv add button`
// copies it), resolving against the app token layer — styles the .primitiv-button
// contract classes used below.
import "../../../../../registry/components/button/styles.css";

const TINT_BUTTON_CLASS = "primitiv-button primitiv-button--secondary primitiv-button--sm";

// Below this lightness a "white" anchor stops reading as white, so the white
// slider is floored here (thumb + painted track clamp together). Black keeps
// the full 0..1 range.
const WHITE_LIGHTNESS_FLOOR = 0.8;

// A plain (unpainted) system Slider over a 0..1 fraction, shown as 0..100.
function FractionSlider({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider.Root
      className="pf-slider"
      aria-label={label}
      min={0}
      max={Math.max(1, max * 100)}
      step={1}
      value={[value * 100]}
      onValueChange={([next]) => onChange(next / 100)}
    >
      <Slider.Track className="pf-slider__track">
        <Slider.Range className="pf-slider__range" />
      </Slider.Track>
      <Slider.Thumb className="pf-slider__thumb" />
    </Slider.Root>
  );
}

// A bipolar degree slider centred on 0 — the Option B hue spread, fanning the
// one tint source into a warm highlight and a cool shadow anchor.
function SpreadSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider.Root
      className="pf-slider"
      aria-label="Spread"
      min={-30}
      max={30}
      step={1}
      value={[value]}
      onValueChange={([next]) => onChange(next)}
    >
      <Slider.Track className="pf-slider__track">
        <Slider.Range className="pf-slider__range" />
      </Slider.Track>
      <Slider.Thumb className="pf-slider__thumb" />
    </Slider.Root>
  );
}

export type PluginColorEngineProps = {
  /** Chart aspect forwarded to the brand picker (tuned in the sandbox header). */
  chartAspect: number;
};

export function PluginColorEngine({ chartAspect }: PluginColorEngineProps) {
  const {
    wasmReady,
    tintSource,
    tintSourceLch,
    tintStrength,
    tintSpread,
    bow,
    neutralPalette,
    neutralDarkPalette,
    brand,
    setNeutralWhite,
    setNeutralBlack,
    setBrandHex,
    setLightCurve,
    setDarkCurve,
    setTintStrength,
    setTintSpread,
    setBow,
    handleUseAsTint,
    handleRemoveTint,
    setLightRampPaddingLeft,
    setLightRampPaddingRight,
    setDarkRampPaddingLeft,
    setDarkRampPaddingRight,
  } = usePluginColors();

  // The picker and the lightness sliders are controlled, so this view owns the
  // brand { l, c, h } and the white/black lightnesses, bridging them into the
  // engine via the picker's own colour conversions (as the workbench's other
  // ColorEngine does). Anchors are lightness-only; chroma fixed at 0.
  const [brandValue, setBrandValue] = useState<OklchValue>();
  const [whiteL, setWhiteL] = useState(1);
  const [blackL, setBlackL] = useState(0);

  useEffect(() => {
    if (!wasmReady) return;
    setBrandValue((prev) => prev ?? parseColor(brand.hex) ?? undefined);
  }, [wasmReady, brand.hex]);

  const handleBrandPick = (value: OklchValue) => {
    setBrandValue(value);
    setBrandHex(formatColor(value).hex);
  };

  const handleWhitePick = (l: number) => {
    setWhiteL(l);
    setNeutralWhite(`oklch(${l} 0 0)`);
  };

  const handleBlackPick = (l: number) => {
    setBlackL(l);
    setNeutralBlack(`oklch(${l} 0 0)`);
  };

  // Live preview of the two anchors the spread fans the one source into: the
  // highlight (light end) and shadow (dark end), the source hue ± spread.
  const highlightPreview = tintSourceLch
    ? `oklch(${tintSourceLch.l} ${tintSourceLch.c} ${tintSourceLch.h + tintSpread})`
    : undefined;
  const shadowPreview = tintSourceLch
    ? `oklch(${tintSourceLch.l} ${tintSourceLch.c} ${tintSourceLch.h - tintSpread})`
    : undefined;

  return (
    <div className="pf-color-engine">
      <h1>Harmoni Color Engine</h1>

      {!wasmReady && <p>Starting engine…</p>}

      {/* Gate the engine body on wasmReady: the painted LightnessSliders call
          into wasm on mount, so rendering them before init() resolves throws
          and blanks the page (this is now the cold-load home route). */}
      {wasmReady && (
        <>
          <section className="pf-color-engine__inputs">
        <div className="pf-anchors">
          <div className="pf-anchor">
            <span className="pf-anchor__label">White</span>
            <span
              className="pf-anchor__swatch"
              style={{ background: `oklch(${whiteL} 0 0)` }}
            />
            <LightnessSlider
              value={whiteL}
              onChange={handleWhitePick}
              min={WHITE_LIGHTNESS_FLOOR}
              label="White"
            />
            <span className="pf-anchor__value">{whiteL.toFixed(2)}</span>
          </div>
          <div className="pf-anchor">
            <span className="pf-anchor__label">Black</span>
            <span
              className="pf-anchor__swatch"
              style={{ background: `oklch(${blackL} 0 0)` }}
            />
            <LightnessSlider value={blackL} onChange={handleBlackPick} label="Black" />
            <span className="pf-anchor__value">{blackL.toFixed(2)}</span>
          </div>
        </div>

        <div className="pf-brand">
          <div className="pf-brand__head">
            <span className="pf-brand__label">Brand</span>
            <span
              className="pf-brand__swatch"
              style={{ background: brand.hex }}
            />
            <code className="pf-brand__hex">{brand.hex}</code>
          </div>
          {brandValue && (
            <OklchPicker
              value={brandValue}
              onChange={handleBrandPick}
              layout="row"
              chartAspect={chartAspect}
            />
          )}
          <Button
            type="button"
            className={TINT_BUTTON_CLASS}
            onClick={handleUseAsTint}
            disabled={!brand.lightPalette}
          >
            Use brand as neutral tint
          </Button>
          {tintSource && (
            <div className="pf-neutral-tint">
              <div className="pf-neutral-tint__head">
                <span
                  className="pf-neutral-tint__swatch"
                  style={{ background: tintSource }}
                />
                <span className="pf-neutral-tint__title">Neutral tint</span>
                <Button
                  type="button"
                  className={TINT_BUTTON_CLASS}
                  onClick={handleRemoveTint}
                >
                  Remove tint
                </Button>
              </div>

              <div className="pf-tint-controls">
                <div className="pf-tint-control">
                  <div className="pf-tint-control__row">
                    <span
                      className="pf-tint-control__label"
                      title="How strongly the brand hue colours the neutrals."
                    >
                      Strength
                    </span>
                    <span className="pf-tint-control__value">
                      {Math.round(tintStrength * 100)}%
                    </span>
                  </div>
                  <FractionSlider
                    label="Tint strength"
                    value={tintStrength}
                    max={1}
                    onChange={setTintStrength}
                  />
                </div>

                <div className="pf-tint-control">
                  <div className="pf-tint-control__row">
                    <span
                      className="pf-tint-control__label"
                      title="Fans the tint into two hues — a highlight for the light end and a shadow for the dark (e.g. warm highlights, cool shadows). 0° keeps a single hue."
                    >
                      Spread
                    </span>
                    <span className="pf-tint-control__value">
                      {tintSpread > 0 ? `+${tintSpread}` : tintSpread}°
                    </span>
                  </div>
                  <div className="pf-tint-control__spread">
                    <span
                      className="pf-tint-control__chip"
                      style={{ background: highlightPreview }}
                      title="Highlight — the light end"
                    />
                    <SpreadSlider value={tintSpread} onChange={setTintSpread} />
                    <span
                      className="pf-tint-control__chip"
                      style={{ background: shadowPreview }}
                      title="Shadow — the dark end"
                    />
                  </div>
                </div>

                <div className="pf-tint-control">
                  <div className="pf-tint-control__row">
                    <span
                      className="pf-tint-control__label"
                      title="Crests the tint through the mid-tones; the light and dark ends stay put."
                    >
                      Bow
                    </span>
                    <span className="pf-tint-control__value">
                      {Math.round(bow * 100)}%
                    </span>
                  </div>
                  <FractionSlider
                    label="Bow"
                    value={bow}
                    max={1}
                    onChange={setBow}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="pf-color-engine__palettes">
        <div>
          <p>Neutral — light</p>
          <PluginPalette palette={neutralPalette} />
        </div>
        <div>
          <p>Neutral — dark</p>
          <PluginPalette palette={neutralDarkPalette} />
        </div>
        <div>
          <p>Brand — light</p>
          <PluginPalette palette={brand.lightPalette} />
          <div className="pf-curve-wrap">
            <CurveEditor
              palette={brand.lightPalette}
              curve={brand.lightnessArray}
              onChange={setLightCurve}
              label="Brand light"
            />
            {brand.lightPalette && (
              <RampPadding
                label="Brand light"
                lightPadding={brand.lightRampPaddingLeft ?? 0}
                darkPadding={brand.lightRampPaddingRight ?? 0}
                maxLight={brand.lightPalette.max_recommended_light_padding ?? 0}
                maxDark={brand.lightPalette.max_recommended_dark_padding ?? 0}
                onLightChange={setLightRampPaddingLeft}
                onDarkChange={setLightRampPaddingRight}
              />
            )}
          </div>
        </div>

        <div>
          <p>Brand — dark</p>
          <PluginPalette palette={brand.darkPalette} />
          <div className="pf-curve-wrap">
            <CurveEditor
              palette={brand.darkPalette}
              curve={brand.darkLightnessArray}
              onChange={setDarkCurve}
              label="Brand dark"
            />
            {brand.darkPalette && (
              <RampPadding
                label="Brand dark"
                lightPadding={brand.darkRampPaddingLeft ?? 0}
                darkPadding={brand.darkRampPaddingRight ?? 0}
                maxLight={brand.darkPalette.max_recommended_light_padding ?? 0}
                maxDark={brand.darkPalette.max_recommended_dark_padding ?? 0}
                onLightChange={setDarkRampPaddingLeft}
                onDarkChange={setDarkRampPaddingRight}
              />
            )}
          </div>
        </div>
          </section>
        </>
      )}
    </div>
  );
}
