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
 *         └ Stack gap="xl"                    ← 32
 *             ├ Stack gap="xs"                ← 4   overline + heading
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
  band = false,
  children,
}: {
  id: string;
  overline: string;
  heading: string;
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
          <Stack gap="xs">
            {/* Presentational: the accessible heading is the h2 below, so the
                overline must not be a heading of its own or it fragments the
                document outline into meaningless one-word sections. */}
            <p className="docs-section-overline">{overline}</p>
            <h2 className="docs-section-heading" id={id}>
              {heading}
            </h2>
          </Stack>
          {children}
        </Stack>
      </Container>
    </section>
  </Box>
);
