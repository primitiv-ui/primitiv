// Ported from apps/harmoni-figma-plugin/src/ui/Swatch.tsx.

import { type Swatch as SwatchData } from "harmoni-wasm";

export type PluginSwatchProps = {
  step: SwatchData;
  index: number;
};

export function PluginSwatch({ step, index }: PluginSwatchProps) {
  return (
    <div className="pf-palette__swatch">
      <div
        className="pf-palette__swatch-inner"
        style={{
          background: step.oklch,
          color: step.best_foreground.oklch,
        }}
      >
        <p className="pf-palette__swatch-step">
          {"Number" in step.best_foreground.label
            ? step.best_foreground.label.Number
            : step.best_foreground.label.Name}
        </p>
        <p>{step.contrast_result.display_ratio}</p>
        <p className="pf-palette__swatch--rating">{step.contrast_result.rating}</p>
      </div>
      <p className="pf-palette__swatch--step">{index === 0 ? 50 : index * 100}</p>
    </div>
  );
}
