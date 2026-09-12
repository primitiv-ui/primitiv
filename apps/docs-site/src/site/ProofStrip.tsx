"use client";

import { Fragment } from "react";

import { Copy, File, Grid as GridGlyph, List, Success } from "@primitiv-ui/icons";

import { Box } from "@/components/box";
import { Container } from "@/components/container";
import { Divider } from "@/components/divider";

import "./proof-strip.css";

/*
 * Read off the Figma frame `02 — Proof strip` on `Home — desktop (v3)`, not
 * from the copy record — and the frame corrected the split at its root.
 *
 * THE FIGURE IS THE NUMBER ALONE. The copy record writes each row as
 * "**63 components** — in code and in Figma", and the bold there reads as the
 * figure; it is not. The frame puts only "63" at display/lg and moves the noun
 * into the caption: "components — in code and in Figma". That is why 56px
 * fits a 175px column, and why an earlier build that promoted the whole phrase
 * to the figure overflowed into the divider and had to be shrunk to 40px —
 * solving a problem it had created.
 *
 * Every figure is re-verified against the repository rather than copied from
 * any document, which the brief demands in bold. Checked 2026-09-12:
 *
 *   63   registry/registry.json            → 63 entries
 *   4    packages/tokens/src/context.json  → comfortable, compact, spacious, dense
 *   3    primitiv --format                 → css | scss | tailwind
 *   100% packages/react/vite.config.ts     → lines, branches, functions,
 *                                            statements all 100
 *   MIT  LICENSE                           → MIT License
 *
 * The captions are the frame's own wording, which tightens the record's in two
 * places ("changes all" for "changes all of them"; "lines, branches,
 * functions" for "...and functions") — demonstrably what fits 175px.
 *
 * `Grid`, not `GridIcon`: @primitiv-ui/icons@0.1.29 still exports `Grid`. The
 * workspace source has renamed it GridIcon so it cannot collide with the Grid
 * *layout* component, but that rename is unpublished and the docs site
 * consumes the published package. Aliased so the collision stays prevented.
 */
const PROOF = [
  { Glyph: GridGlyph, figure: "63", caption: "components — in code and in Figma" },
  { Glyph: List, figure: "4", caption: "density modes — one attribute changes all" },
  { Glyph: File, figure: "3", caption: "token formats — CSS, SCSS, Tailwind" },
  { Glyph: Success, figure: "100%", caption: "test coverage — lines, branches, functions" },
  { Glyph: Copy, figure: "MIT", caption: "engine and components both" },
] as const;

/** The Icon set's `lg` size, which is what the frame's instances carry. */
const GLYPH_SIZE = 32;

/**
 * The band directly beneath the hero — cheap credibility before the argument
 * starts.
 *
 * **One glyph per figure, and that was a reversal.** The brief originally read
 * "no illustration — the figures are the visual". Built both ways, the marks
 * won: at 175px per tile the row was five numbers floating in a band with
 * nothing to anchor the eye between the dividers. Each glyph names the thing
 * counted rather than decorating it.
 *
 * **The glyph sits above its figure**, in a centred column at the `sm` gap, so
 * it gives the tile a top edge without competing with the number.
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
                  {/* Decorative: the figure and caption carry the meaning. */}
                  <Glyph size={GLYPH_SIZE} />
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
