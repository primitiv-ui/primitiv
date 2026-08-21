"use client";

import { useState, type ReactNode } from "react";

import { Card, CardContent } from "@/components/card";
import { CodeBlock } from "@/components/code-block";
import { Stack } from "@/components/stack";

import { DensityRadios } from "./DensityRadios";
import { DEFAULT_DENSITY, type Density } from "@/lib/playground";
import { renderDoc } from "@/lib/render-doc";

import "./playground.css";

/**
 * An example that reacts to input, with a code sample that tracks it.
 *
 * Same frame as the Playground — a registry `Card` (size lg) as the surface,
 * rather than a bespoke bordered box — so every demo on the page sits in the
 * same container, with the same `DensityRadios` control the Playground uses,
 * anchored above it (a control below a resizing preview gets pushed by its own
 * click). Every example is interactive rather than a static snippet,
 * because the two things worth demonstrating (the size ramp and the density
 * ancestor) only mean anything if you can change them and watch the rendering
 * AND the snippet move together. A static block lets the code drift from the
 * picture, which is the failure mode of hand-maintained docs.
 */
export const InteractiveExample = ({
  caption,
  children,
  code,
}: {
  caption?: ReactNode;
  children: (density: Density) => ReactNode;
  code: (density: Density) => string;
}) => {
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);

  return (
    <Stack gap="md">
      {caption && (
        <p className="docs-example-caption">
          {/* A STRING caption is authored with the same backtick convention as
              the generated JSDoc, so `asChild`, `<button>` and `data-density`
              become real code chips. A ReactNode caption is rendered as-is, for
              the cases that need more than code spans. */}
          {typeof caption === "string" ? renderDoc(caption, "md") : caption}
        </p>
      )}

      <DensityRadios value={density} onChange={setDensity} />

      <Card size="lg">
        <CardContent>
          <div className="docs-example-row" data-density={density}>
            {children(density)}
          </div>
        </CardContent>
      </Card>

      <CodeBlock code={code(density)} language="tsx" size="sm" />
    </Stack>
  );
};
