// A faithful, working replica of the Figma plugin's ColorEngine
// (apps/harmoni-figma-plugin/src/ui/ColorEngine.tsx), developed here in the
// workbench (RFC 0010 §9). Same engine, same palette rows, same tint flow — the
// three <input type=color> swatches are replaced with the OKLCH picker (brand,
// compact row layout) and the painted LightnessSlider (white/black anchors,
// lightness-only; colour comes from the tint). Export-to-Figma is omitted.

import { useEffect, useState } from "react";

import {
  OklchPicker,
  LightnessSlider,
  parseColor,
  formatColor,
  type OklchValue,
} from "../../OklchPicker";

import { usePluginColors } from "./usePluginColors";
import { PluginPalette } from "./PluginPalette";

export type PluginColorEngineProps = {
  /** Chart aspect forwarded to the brand picker (tuned in the sandbox header). */
  chartAspect: number;
};

export function PluginColorEngine({ chartAspect }: PluginColorEngineProps) {
  const {
    wasmReady,
    tintSource,
    tintStrength,
    neutralPalette,
    neutralDarkPalette,
    brand,
    setNeutralWhite,
    setNeutralBlack,
    setBrandHex,
    setTintStrength,
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

  return (
    <div className="pf-color-engine">
      <h1>Harmoni Color Engine</h1>

      {!wasmReady && <p>Starting engine…</p>}

      <section className="pf-color-engine__inputs">
        <div className="pf-anchors">
          <div className="pf-anchor">
            <span className="pf-anchor__label">White</span>
            <span
              className="pf-anchor__swatch"
              style={{ background: `oklch(${whiteL} 0 0)` }}
            />
            <LightnessSlider value={whiteL} onChange={handleWhitePick} label="White" />
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
          <button
            type="button"
            className="pf-btn"
            onClick={handleUseAsTint}
            disabled={!brand.lightPalette}
          >
            Use brand as neutral tint
          </button>
          {tintSource && (
            <div className="pf-neutral-tint">
              <span
                className="pf-neutral-tint__swatch"
                style={{ background: tintSource }}
              />
              <label>
                Tint strength
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={tintStrength * 100}
                  onChange={(e) => setTintStrength(e.target.valueAsNumber / 100)}
                />
              </label>
              <button type="button" className="pf-btn" onClick={handleRemoveTint}>
                Remove tint
              </button>
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
          <div className="pf-color-engine__padding-row">
            <label className="pf-color-engine__padding-label">
              <span className="pf-color-engine__padding-value">
                {((brand.lightRampPaddingLeft ?? 0) * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={0}
                max={(brand.lightPalette?.max_recommended_light_padding ?? 0) * 100}
                step={1}
                value={(brand.lightRampPaddingLeft ?? 0) * 100}
                onChange={(e) => setLightRampPaddingLeft(e.target.valueAsNumber / 100)}
              />
            </label>
            <label className="pf-color-engine__padding-label">
              <input
                type="range"
                min={0}
                max={(brand.lightPalette?.max_recommended_dark_padding ?? 0) * 100}
                step={1}
                value={(brand.lightRampPaddingRight ?? 0) * 100}
                onChange={(e) => setLightRampPaddingRight(e.target.valueAsNumber / 100)}
              />
              <span className="pf-color-engine__padding-value">
                {((brand.lightRampPaddingRight ?? 0) * 100).toFixed(0)}%
              </span>
            </label>
          </div>
        </div>

        <div>
          <p>Brand — dark</p>
          <PluginPalette palette={brand.darkPalette} />
          <div className="pf-color-engine__padding-row">
            <label className="pf-color-engine__padding-label">
              <span className="pf-color-engine__padding-value">
                {((brand.darkRampPaddingLeft ?? 0) * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={0}
                max={(brand.darkPalette?.max_recommended_light_padding ?? 0) * 100}
                step={1}
                value={(brand.darkRampPaddingLeft ?? 0) * 100}
                onChange={(e) => setDarkRampPaddingLeft(e.target.valueAsNumber / 100)}
              />
            </label>
            <label className="pf-color-engine__padding-label">
              <input
                type="range"
                min={0}
                max={(brand.darkPalette?.max_recommended_dark_padding ?? 0) * 100}
                step={1}
                value={(brand.darkRampPaddingRight ?? 0) * 100}
                onChange={(e) => setDarkRampPaddingRight(e.target.valueAsNumber / 100)}
              />
              <span className="pf-color-engine__padding-value">
                {((brand.darkRampPaddingRight ?? 0) * 100).toFixed(0)}%
              </span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
