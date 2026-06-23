// Ported from apps/harmoni-figma-plugin/src/ui/Palette.tsx.

import { type Palette } from "harmoni-wasm";

import { PluginSwatch } from "./PluginSwatch";

export type PluginPaletteProps = {
  palette?: Palette;
  className?: string;
};

export function PluginPalette({ palette, className }: PluginPaletteProps) {
  return (
    <div
      className={
        className ? `pf-palette__steps ${className}` : "pf-palette__steps"
      }
    >
      {palette?.swatches?.map((step, index) => (
        <PluginSwatch
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
