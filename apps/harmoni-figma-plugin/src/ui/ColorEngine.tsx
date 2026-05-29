import { useState } from "react";
import type { PairedRampData, SingleColorData, UiMessage } from "../shared/messages";
import { Palette } from "./Palette";
import { useColors } from "./useColors";

function postToSandbox(message: UiMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function oklchToRgba(oklch: string): { r: number; g: number; b: number; a: number } {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = oklch;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
}

function stepLabel(index: number): string {
  return String(index === 0 ? 50 : index * 100);
}

export function ColorEngine() {
  const [rampName, setRampName] = useState("brand");

  const {
    wasmReady,
    neutralWhite,
    neutralBlack,
    effectiveWhite,
    effectiveBlack,
    tintSource,
    tintStrength,
    neutralPalette,
    brand,
    handleNeutralWhiteChange,
    handleNeutralBlackChange,
    handleBrandChange,
    handleUseAsTint,
    handleTintStrengthChange,
    handleRemoveTint,
    handleLightRampPaddingLeft,
    handleLightRampPaddingRight,
    handleDarkRampPaddingLeft,
    handleDarkRampPaddingRight,
  } = useColors();

  function handleApply() {
    const singles: SingleColorData[] = [
      { name: "white", rgba: oklchToRgba(effectiveWhite) },
      { name: "black", rgba: oklchToRgba(effectiveBlack) },
    ];

    const ramps: PairedRampData[] = [];

    if (neutralPalette?.swatches) {
      ramps.push({
        name: "neutral",
        light: neutralPalette.swatches.map((s, i) => ({
          step: stepLabel(i),
          rgba: oklchToRgba(s.oklch),
        })),
        // dark neutral deferred — uses light values in dark mode until a dark ramp is generated
      });
    }

    if (brand.lightPalette?.swatches) {
      ramps.push({
        name: rampName,
        light: brand.lightPalette.swatches.map((s, i) => ({
          step: stepLabel(i),
          rgba: oklchToRgba(s.oklch),
        })),
        dark: brand.darkPalette?.swatches.map((s, i) => ({
          step: stepLabel(i),
          rgba: oklchToRgba(s.oklch),
        })),
      });
    }

    postToSandbox({ type: "apply-palette", ramps, singles });
  }

  return (
    <div className="color-engine">
      <h1>Harmoni Color Engine</h1>

      {!wasmReady && <p>Starting engine…</p>}

      <section className="color-engine__inputs">
        <label>
          White
          <input type="color" value={neutralWhite} onChange={handleNeutralWhiteChange} />
        </label>
        <label>
          Black
          <input type="color" value={neutralBlack} onChange={handleNeutralBlackChange} />
        </label>
        <label>
          Brand
          <input type="color" value={brand.hex} onChange={handleBrandChange} />
        </label>
        <button type="button" onClick={handleUseAsTint} disabled={!brand.lightPalette}>
          Use brand as neutral tint
        </button>
        {tintSource && (
          <div className="neutral-tint">
            <span className="neutral-tint__swatch" style={{ background: tintSource }} />
            <label>
              Tint strength
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={tintStrength * 100}
                onChange={handleTintStrengthChange}
              />
            </label>
            <button type="button" onClick={handleRemoveTint}>
              Remove tint
            </button>
          </div>
        )}
      </section>

      <section className="color-engine__palettes">
        <div>
          <p>Neutral</p>
          <Palette palette={neutralPalette} />
        </div>
        <div>
          <p>Brand — light</p>
          <Palette palette={brand.lightPalette} />
          <div className="color-engine__padding-row">
            <label className="color-engine__padding-label">
              <span className="color-engine__padding-value">
                {((brand.lightRampPaddingLeft ?? 0) * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={0}
                max={((brand.lightPalette?.max_recommended_light_padding ?? 0) * 100).toFixed(0)}
                step={1}
                value={(brand.lightRampPaddingLeft ?? 0) * 100}
                onChange={handleLightRampPaddingLeft}
              />
            </label>
            <label className="color-engine__padding-label">
              <input
                type="range"
                min={0}
                max={((brand.lightPalette?.max_recommended_dark_padding ?? 0) * 100).toFixed(0)}
                step={1}
                value={(brand.lightRampPaddingRight ?? 0) * 100}
                onChange={handleLightRampPaddingRight}
              />
              <span className="color-engine__padding-value">
                {((brand.lightRampPaddingRight ?? 0) * 100).toFixed(0)}%
              </span>
            </label>
          </div>
        </div>

        <div>
          <p>Brand — dark</p>
          <Palette palette={brand.darkPalette} />
          <div className="color-engine__padding-row">
            <label className="color-engine__padding-label">
              <span className="color-engine__padding-value">
                {((brand.darkRampPaddingLeft ?? 0) * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={0}
                max={((brand.darkPalette?.max_recommended_light_padding ?? 0) * 100).toFixed(0)}
                step={1}
                value={(brand.darkRampPaddingLeft ?? 0) * 100}
                onChange={handleDarkRampPaddingLeft}
              />
            </label>
            <label className="color-engine__padding-label">
              <input
                type="range"
                min={0}
                max={((brand.darkPalette?.max_recommended_dark_padding ?? 0) * 100).toFixed(0)}
                step={1}
                value={(brand.darkRampPaddingRight ?? 0) * 100}
                onChange={handleDarkRampPaddingRight}
              />
              <span className="color-engine__padding-value">
                {((brand.darkRampPaddingRight ?? 0) * 100).toFixed(0)}%
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="color-engine__actions">
        <label>
          Ramp name
          <input
            type="text"
            value={rampName}
            onChange={(e) => setRampName(e.target.value)}
          />
        </label>
        <button type="button" onClick={handleApply} disabled={!wasmReady}>
          Apply to Figma
        </button>
        <button type="button" onClick={() => postToSandbox({ type: "close" })}>
          Close
        </button>
      </section>
    </div>
  );
}
