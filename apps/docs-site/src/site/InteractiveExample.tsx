"use client";

import { type ReactNode } from "react";

import { Card, CardContent } from "@/components/card";
import { Stack } from "@/components/stack";

import { DensityRadios } from "./DensityRadios";
import { ElementsPreview } from "./ElementsPreview";
import { ModeCodeBlock } from "./ModeCodeBlock";
import { DEFAULT_DENSITY, type Density } from "@/lib/playground";
import { renderDoc } from "@/lib/render-doc";
import { type Mode, useView } from "@/site/preferences";
import { useDensityGlide } from "@/site/use-density-glide";

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
  caption: reactCaption,
  elementsCaption,
  elementsPreview,
  wire,
  children,
  code,
}: {
  caption?: ReactNode;
  /**
   * The caption in Elements mode, where the React one names props, `asChild`
   * or hooks that plain markup doesn't have. Omit it when the caption reads
   * true for both.
   */
  elementsCaption?: ReactNode;
  /**
   * The markup the Elements preview renders, when the Elements code tab is not
   * complete markup on its own (it elides a repeated part, or shows an icon as
   * a placeholder). Defaults to that code. Written styled, and previewed
   * styled in both modes, as React mode's preview is. Receives the Elements code, so an
   * override can fill in a placeholder rather than restate the markup.
   */
  elementsPreview?: (density: Density, code: string) => string;
  /** Anything the Elements preview needs beyond its markup, e.g. a listener. */
  wire?: (root: HTMLElement) => (() => void) | void;
  children: (density: Density) => ReactNode;
  code: (density: Density, mode: Mode) => string;
}) => {
  const [density, setDensity, gliding] =
    useDensityGlide<Density>(DEFAULT_DENSITY);
  const { reading } = useView();
  const elementsHtml = () => {
    const markup = code(density, "elements");
    return elementsPreview ? elementsPreview(density, markup) : markup;
  };
  const caption =
    reading === "elements" && elementsCaption ? elementsCaption : reactCaption;

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
          <div
            className="docs-example-row"
            data-density={density}
            data-density-gliding={gliding || undefined}
          >
            {/* Elements mode renders the real custom elements, from the same
                markup as the Elements code tab (see ElementsPreview). */}
            {reading === "elements" ? (
              <ElementsPreview html={elementsHtml()} wire={wire} />
            ) : (
              children(density)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Both consumption modes, tabbed and bound to the nav switch — the same
          block the Playground uses, so a reader meets one rule per page rather
          than a mixture. `code` is called once per TAB (not once per render),
          which is why it takes the mode as an argument rather than reading the
          store itself. */}
      <ModeCodeBlock code={(m) => code(density, m)} />
    </Stack>
  );
};
