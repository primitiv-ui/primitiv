"use client";

import type { ReactNode } from "react";

import { Box } from "@/components/box";
import { Container } from "@/components/container";
import { Stack } from "@/components/stack";

import "./landing-section.css";

/**
 * One full-bleed landing section.
 *
 * This is the design's own recipe, read off the Figma landing v2 frame rather
 * than invented: every section is
 *
 *   Box (full-bleed, padding-block, optional band fill)
 *     └ Container size="xl"
 *         └ Stack gap="xl"                    ← 32 (= flow/section)
 *             ├ Stack .docs-section-heading-block  ← 48 (= flow/region)
 *             └ (the section's content)
 *
 * Keeping it in one component means the rhythm cannot drift between sections,
 * and the `xl`/`xs` gaps come from the token scale rather than literals
 * (Stack's gap scale is xs 4 · sm 8 · md 16 · lg 24 · xl 32).
 */
export const LandingSection = ({
  id,
  overline,
  heading,
  lede,
  band = false,
  children,
}: {
  id: string;
  overline: string;
  heading: string;
  /**
   * The opening `body/lg` paragraph. Belongs here rather than in `children`
   * because the v3 frame nests it with the heading at `flow/tight` (12) — put
   * in `children` it lands a whole `flow/section` (32) away and reads as a
   * separate block rather than as the heading's own sentence.
   */
  lede?: ReactNode;
  /** Tints the section, producing the design's alternating bands. */
  band?: boolean;
  children: ReactNode;
}) => (
  <Box
    asChild
    className={`docs-landing-section${band ? " docs-landing-section--band" : ""}`}
  >
    <section aria-labelledby={id}>
      <Container size="xl">
        <Stack gap="xl">
          <Stack className="docs-section-heading-block">
            {/* Presentational: the accessible heading is the h2 below, so the
                overline must not be a heading of its own or it fragments the
                document outline into meaningless one-word sections. */}
            <p className="docs-section-overline">{overline}</p>
            {/* Heading and lede are one unit at `flow/tight`; the overline sits
                a `flow/region` rung above the pair. */}
            <Stack className="docs-section-title-group">
              <h2 className="docs-section-heading" id={id}>
                {heading}
              </h2>
              {lede}
            </Stack>
          </Stack>
          {children}
        </Stack>
      </Container>
    </section>
  </Box>
);
