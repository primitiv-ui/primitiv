import { type Palette } from "harmoni-wasm";
import { Swatch } from "./Swatch";

export type PaletteProps = {
  palette?: Palette;
  className?: string;
};

export function Palette({ palette, className }: PaletteProps) {
  return (
    <div
      className={className ? `palette__steps ${className}` : "palette__steps"}
    >
      {palette?.swatches?.map((step, index) => (
        <Swatch
          key={
            ("Number" in step.label
              ? `number-${step.label.Number}`
              : `name-${step.label.Name}`) + `-${index}`
          }
          step={step}
          index={index}
        />
      ))}
    </div>
  );
}
