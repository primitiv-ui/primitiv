// The sRGB / Display-P3 gamut toggle (RFC 0010 §4, §7) — composes the headless
// `ToggleGroup` (Principle 6) for its pressed state, roving tabindex and ARIA.
// It is a single-select group, but a gamut is always active: a press that would
// deselect the current option is ignored, so the value never falls to
// `undefined`. No registry sheet exists for ToggleGroup, so the chrome is styled
// against its contract with --primitiv-* tokens.

import { ToggleGroup } from "@primitiv-ui/react";

import type { Gamut } from "./types";

export type GamutToggleProps = {
  gamut: Gamut;
  onChange: (gamut: Gamut) => void;
};

export function GamutToggle({ gamut, onChange }: GamutToggleProps) {
  return (
    <ToggleGroup.Root
      className="gamut-toggle"
      type="single"
      value={gamut}
      onValueChange={(value) => {
        if (value) onChange(value as Gamut);
      }}
      aria-label="Display gamut"
    >
      <ToggleGroup.Item className="gamut-toggle__item" value="Srgb">
        sRGB
      </ToggleGroup.Item>
      <ToggleGroup.Item className="gamut-toggle__item" value="DisplayP3">
        P3
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
