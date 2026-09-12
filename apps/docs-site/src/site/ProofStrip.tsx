"use client";

import { Fragment } from "react";

/* `Grid`, not `GridIcon`: the workspace source has renamed this glyph to
   GridIcon so it cannot collide with the Grid *layout* component, but that
   rename is not published — @primitiv-ui/icons@0.1.29 still exports `Grid`,
   and the docs site consumes the published package, not the workspace. It is
   aliased here so the collision the rename exists to prevent stays prevented. */
import { Copy, File, Grid as GridGlyph, List, Success } from "@primitiv-ui/icons";

import { Box } from "@/components/box";
import { Container } from "@/components/container";
import { Divider } from "@/components/divider";

import "./proof-strip.css";

/*
 * Every figure here is re-verified against the repository, never copied from
 * the copy document — that is the brief's own standing instruction, and the
 * numbers below were checked on 2026-09-11:
 *
 *   63 components   registry/registry.json                     → 63 entries
 *   4 density modes packages/tokens/src/context.json           → comfortable,
 *                                                                compact,
 *                                                                spacious, dense
 *   3 formats       primitiv --format                          → css|scss|tailwind
 *   100% coverage   packages/react/vite.config.ts              → lines, branches,
 *                                                                functions and
 *                                                                statements all 100
 *   MIT             LICENSE                                    → MIT License
 *
 */
const PROOF = [
  { Glyph: GridGlyph, figure: "63 components", caption: "in code and in Figma" },
  { Glyph: List, figure: "4 density modes", caption: "one attribute changes all of them" },
  { Glyph: File, figure: "CSS, SCSS or Tailwind", caption: "the tokens emit to all three" },
  { Glyph: Success, figure: "100% test coverage", caption: "lines, branches and functions" },
  { Glyph: Copy, figure: "MIT", caption: "engine and components both" },
] as const;

/**
 * The band directly beneath the hero — cheap credibility before the argument
 * starts.
 *
 * **One glyph per figure, and that was a reversal.** The brief originally read
 * "no illustration — the figures are the visual". Built both ways, the marks
 * won: at this tile width the row was five numbers floating in a band with
 * nothing to anchor the eye between the dividers. Each glyph names the thing
 * counted rather than decorating it.
 *
 * **The glyph binds to its number, not to the tile.** The tile is
 * `[stat, caption]` where `stat` is itself `[glyph, figure]` at the `sm` gap,
 * so the mark reads as part of the figure the way an icon binds to a label.
 * Dropping the glyph in as a sibling of the figure would make it `* + h2` and
 * put the heading-asymmetry gap between them instead.
 */
export const ProofStrip = () => (
  <Box asChild className="docs-proof-strip">
    <section aria-label="Primitiv in numbers">
      <Container size="xl">
        <div className="docs-proof-row">
          {PROOF.map(({ Glyph, figure, caption }, index) => (
            <Fragment key={figure}>
              {index > 0 && (
                <Divider orientation="vertical" className="docs-proof-divider" />
              )}
              <div className="docs-proof-tile">
                <div className="docs-proof-stat">
                  {/* Decorative: the figure beside it is the accessible text. */}
                  <Glyph size={20} />
                  <p className="docs-proof-figure">{figure}</p>
                </div>
                <p className="docs-proof-caption">{caption}</p>
              </div>
            </Fragment>
          ))}
        </div>
      </Container>
    </section>
  </Box>
);
