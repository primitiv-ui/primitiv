import { type Swatch as SwatchData } from "harmoni-wasm";

export type SwatchProps = {
  step: SwatchData;
  index: number;
};

export function Swatch({ step, index }: SwatchProps) {
  return (
    <div className="palette__swatch">
      <div
        key={
          ("Number" in step.label
            ? `number-${step.label.Number}`
            : `name-${step.label.Name}`) + `-${index}`
        }
        className="palette__swatch-inner"
        style={{
          background: `oklch(${step.l} ${step.c} ${step.h})`,
          color: `oklch(${step.best_foreground.l} ${step.best_foreground.c} ${step.best_foreground.h})`,
        }}
      >
        <p className="palette__swatch-step">
          {"Number" in step.best_foreground.label
            ? step.best_foreground.label.Number
            : step.best_foreground.label.Name}
        </p>
        <p>{step.contrast_result.display_ratio}</p>
        <p className="palette__swatch--rating">{step.contrast_result.rating}</p>
      </div>
      <p className="palette__swatch--step">{index === 0 ? 50 : index * 100}</p>
    </div>
  );
}
