"use client";

import { useId, useState, type ReactNode } from "react";

import { CodeBlock } from "@/components/code-block";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/segmented-control";
import { DEFAULT_DENSITY, DENSITIES, type Density } from "@/lib/playground";

import "./playground.css";

/**
 * An example that reacts to input, with a code sample that tracks it.
 *
 * Every example on the site is this rather than a static screenshot-in-code,
 * because the two things worth demonstrating — the size ramp and the density
 * ancestor — only mean anything if you can change them and watch both the
 * rendering AND the snippet move together. A static block would let the code
 * drift from the picture, which is the failure mode hand-maintained docs have.
 */
export const InteractiveExample = ({
  caption,
  children,
  code,
}: {
  caption?: ReactNode;
  /** Renders the example at the chosen density. */
  children: (density: Density) => ReactNode;
  /** Produces the snippet for the chosen density. */
  code: (density: Density) => string;
}) => {
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);
  const labelId = `${useId()}-density`;

  return (
    <>
      {caption && <p className="docs-example-caption">{caption}</p>}

      <div className="docs-playground">
        <div className="docs-example-row" data-density={density}>
          {children(density)}
        </div>

        <div className="docs-playground-controls">
          <div className="docs-playground-control">
            <span className="docs-playground-control-label" id={labelId}>
              density
            </span>
            <SegmentedControl
              size="sm"
              value={density}
              onValueChange={(next) => setDensity(next as Density)}
              aria-labelledby={labelId}
            >
              {DENSITIES.map((d) => (
                <SegmentedControlItem key={d} value={d}>
                  {d}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
        </div>

        <div className="docs-playground-code">
          <CodeBlock code={code(density)} language="tsx" size="sm" />
        </div>
      </div>
    </>
  );
};
