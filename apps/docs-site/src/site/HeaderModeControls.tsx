"use client";

import { useId } from "react";

import { VisuallyHidden } from "@primitiv-ui/react";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/segmented-control";

import { FRAMEWORKS, STYLES, label, useFramework, useStyle } from "./preferences";

/**
 * The framework + headless/styled segmented controls.
 *
 * Two choices, in the order a reader makes them: what they build with, then
 * whether they want Primitiv's styling. The second is remembered per framework
 * (see `useStyle`). Figma is not here: it is the design track, reached from
 * "Design in Figma" in the top bar, not a way of consuming the code.
 *
 * Extracted from `SiteHeader` so the header AND the mobile drawer can render the
 * same pair without colliding ids — the labels are `useId`-generated per
 * instance rather than the hardcoded ids the header used when it was the only
 * place they appeared. Both switches read the same `useLocalStorage` store, so
 * the header copy and the drawer copy stay in step automatically.
 */
export const HeaderModeControls = ({ size = "xs" }: { size?: "xs" | "sm" }) => {
  const [style, setStyle] = useStyle();
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
            <SegmentedControlItem key={f} value={f}>
              {label(f)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      <div className="docs-header-control">
        <VisuallyHidden id={modeLabel}>Styling</VisuallyHidden>
        <SegmentedControl
          size={size}
          value={style}
          onValueChange={(v) => setStyle(v as typeof style)}
          aria-labelledby={modeLabel}
        >
          {STYLES.map((m) => (
            <SegmentedControlItem key={m} value={m}>
              {label(m)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
    </>
  );
};
