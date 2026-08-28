"use client";

import { useId } from "react";

import { VisuallyHidden } from "@primitiv-ui/react";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/segmented-control";

import { FRAMEWORKS, MODES, label, useFramework, useMode } from "./preferences";

/**
 * The framework + consumption-mode segmented controls.
 *
 * Extracted from `SiteHeader` so the header AND the mobile drawer can render the
 * same pair without colliding ids — the labels are `useId`-generated per
 * instance rather than the hardcoded ids the header used when it was the only
 * place they appeared. Both switches read the same `useLocalStorage` store, so
 * the header copy and the drawer copy stay in step automatically.
 */
export const HeaderModeControls = ({ size = "xs" }: { size?: "xs" | "sm" }) => {
  const [mode, setMode] = useMode();
  const [framework, setFramework] = useFramework();
  const frameworkLabel = useId();
  const modeLabel = useId();

  return (
    <>
      <div className="docs-header-control">
        <VisuallyHidden id={frameworkLabel}>Framework</VisuallyHidden>
        <SegmentedControl
          size={size}
          value={framework}
          onValueChange={(v) => setFramework(v as typeof framework)}
          aria-labelledby={frameworkLabel}
        >
          {FRAMEWORKS.map((f) => (
            <SegmentedControlItem
              key={f}
              value={f}
              disabled={f === "vue" || f === "svelte"}
            >
              {label(f)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      <div className="docs-header-control">
        <VisuallyHidden id={modeLabel}>Consumption mode</VisuallyHidden>
        <SegmentedControl
          size={size}
          value={mode}
          onValueChange={(v) => setMode(v as typeof mode)}
          aria-labelledby={modeLabel}
        >
          {MODES.map((m) => (
            <SegmentedControlItem key={m} value={m}>
              {label(m)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
    </>
  );
};
