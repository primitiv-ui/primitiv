import { ChangeEvent, useState } from "react";
import { Switch, Tabs } from "@primitiv/react";

import { Palette as ColorPalette } from "./Palette";
import { useColors } from "./useColors";
import { Fragment } from "react/jsx-runtime";

type CurveEditorProps = {
  curve?: number[];
  onCurveChange: (index: number) => (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

function CurveEditor({ curve, onCurveChange, className }: CurveEditorProps) {
  return (
    <div
      className={
        className
          ? `palette__curve-editor ${className}`
          : "palette__curve-editor"
      }
    >
      <Tabs.Root className="palette__curve-editor-tabs" defaultValue="a">
        <Tabs.List label="Demo tabs">
          <Tabs.Trigger value="a">Sliders</Tabs.Trigger>
          <Tabs.Trigger value="b">Curve</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="palette__sliders" value="a">
          {curve?.map((lightnessValue, index) => (
            <input
              key={index}
              className="palette__slider palette__slider--curve"
              type="range"
              role="slider"
              min={0}
              max={1}
              step={0.01}
              value={lightnessValue}
              onChange={onCurveChange(index)}
            />
          ))}
        </Tabs.Content>
        <Tabs.Content className="palette__curve" value="b">
          Second panel
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export function ColorEngine() {
  const {
    greyscalePalette,
    neutralWhite,
    neutralBlack,
    tintSource,
    tintStrength,
    handleNeutralWhiteChange,
    handleNeutralBlackChange,
    handleUseAsTint,
    handleTintStrengthChange,
    handleRemoveTint,
    handleColorChange,
    colors,
    handleLightPaddingChange,
    handleDarkPaddingChange,
    handleLightnessCurveChange,
    handleDarkLightnessCurveChange,
    STANDARD_KEYS,
    handleShiftLeft,
    handleShiftRight,
  } = useColors();

  const [darkHidden, setDarkHidden] = useState<Set<string>>(new Set());

  const toggleDark = (key: string) => (checked: boolean) => {
    setDarkHidden((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <>
      <h1>Harmoni Color Engine</h1>
      <div className="palettes-grid">
        <p className="palette__label">Neutral</p>
        <div className="neutral-pickers">
          <label>
            White
            <input
              type="color"
              value={neutralWhite}
              onChange={handleNeutralWhiteChange}
            />
          </label>
          <label>
            Black
            <input
              type="color"
              value={neutralBlack}
              onChange={handleNeutralBlackChange}
            />
          </label>
          {tintSource && (
            <div className="neutral-tint">
              <span
                className="neutral-tint__swatch"
                style={{ background: tintSource }}
              />
              <label>
                Tint
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
        </div>
        <div className="palette-container">
          <div className="palette">
            <ColorPalette palette={greyscalePalette} />
          </div>
        </div>

        {STANDARD_KEYS.map((key) => {
          const { hex, palette, darkPalette, lightPadding, darkPadding } =
            colors[key];

          return (
            <Fragment key={key}>
              <p className="palette__label">{key}</p>
              <div className="palette__input">
                <input
                  type="color"
                  onChange={handleColorChange(key)}
                  value={hex}
                />
                <button type="button" onClick={() => handleUseAsTint(key)}>
                  Use as neutral tint
                </button>
                <div className="dark-mode-toggle">
                  <Switch.Root
                    checked={!darkHidden.has(key)}
                    onCheckedChange={toggleDark(key)}
                    aria-label={`Show ${key} dark mode`}
                  >
                    <Switch.Thumb />
                  </Switch.Root>
                  <span>Show dark mode</span>
                </div>
              </div>
              <div className="palette-container">
                <div
                  className={
                    darkHidden.has(key)
                      ? "palette palette--color palette--dark-collapsed"
                      : "palette palette--color"
                  }
                >
                  <ColorPalette palette={palette} />
                  <CurveEditor
                    curve={palette?.lightness_curve}
                    onCurveChange={(index) =>
                      handleLightnessCurveChange(key, index)
                    }
                  />
                  <div className="palette-padding">
                    <div className="palette__slider-container palette__slider-container--light-padding">
                      <input
                        type="range"
                        role="slider"
                        min={0}
                        max={
                          (palette?.max_recommended_light_padding ?? 0) * 100
                        }
                        step={1}
                        value={(lightPadding ?? 0) * 100}
                        onChange={handleLightPaddingChange(key)}
                      />
                      <span className="slider-label">
                        {((lightPadding ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleShiftLeft(key, palette?.swatches[6])}
                    >
                      {"< Shift"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleShiftRight(key, palette?.swatches[4])
                      }
                    >
                      {"Shift >"}
                    </button>
                    <div className="palette__slider-container palette__slider-container--dark-padding">
                      <input
                        type="range"
                        role="slider"
                        min={0}
                        max={
                          (palette?.max_recommended_dark_padding ?? 0) * 100
                        }
                        step={1}
                        value={(darkPadding ?? 0) * 100}
                        onChange={handleDarkPaddingChange(key)}
                      />
                      <span className="slider-label">
                        {((darkPadding ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <ColorPalette
                    palette={darkPalette}
                    className="palette__steps--dark"
                  />
                  <CurveEditor
                    className="palette__curve-editor--dark"
                    curve={darkPalette?.lightness_curve}
                    onCurveChange={(index) =>
                      handleDarkLightnessCurveChange(key, index)
                    }
                  />
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
