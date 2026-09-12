"use client";

import Link from "next/link";

import { Stack } from "@/components/stack";

import { ColourProof } from "./ColourProof";
import { LandingSection } from "./LandingSection";

import "./colour-section.css";

/**
 * Home page section 5 — "Every swatch already knows what text colour goes on
 * it." Copy verbatim from `docs/docs-site-home-copy.md` §5.
 *
 * The plan calls this the most differentiated section on the page, and it was
 * revised early from an interactive Harmoni demo to the real shipped palette as
 * a proof sheet — on the grounds that Harmoni is a separate commercial product
 * this page is not selling, and that a demo of a tool is weaker evidence than
 * the tool's output. That revision is why the section needs no wasm, no engine
 * in the browser and no interaction.
 *
 * Three deliberate departures from the copy document, all recorded in
 * docs-site-content-plan.md §6.0.20:
 *
 * - **The "standard ramps" sentence is cut.** The copy marks it PENDING —
 *   planned, not shipped — and says to cut it if this section publishes first.
 *   It does. The paragraph reads correctly without it, which the copy also says.
 * - **Harmoni is named, not linked.** The copy asks for a `Harmoni →` link to
 *   its own site; that site does not exist yet (§3.9), and a dead link is worse
 *   than a missing one — the same call the footer and the documentation map got.
 * - **COLOUR-02, the hue-drift diagram, is not here yet.** It is the one claim
 *   in this section a reader cannot verify from the sheet, so the "harmonious"
 *   paragraphs ship with their argument stated and CI-gated but not yet drawn.
 */
export const ColourSection = () => (
  <LandingSection
    id="colour"
    overline="Colour"
    heading="Every swatch already knows what text colour goes on it."
    lede={
      <p className="docs-lede">
        The letters on each colour below are not a design flourish. They are the
        actual text colour the engine chose for that swatch, and every one of
        them clears its contrast minimum.
      </p>
    }
  >
    <Stack gap="xl">
      <p className="docs-colour-body">
        That is not a promise we check occasionally. It is a test that runs on
        every change, across all 100 generated colours in both themes. If a
        single pairing dropped below the line, the build would stop.
      </p>

      {/* The centrepiece and the largest single object on the page. Everything
          after it is explanation of what the reader is looking at. */}
      <ColourProof />

      <Stack gap="md">
        <h3 className="docs-colour-subheading">Harmonious, not just legible</h3>
        <p className="docs-colour-body">
          Legible is the low bar. The harder problem is that a colour scale
          should look like one family, and most do not. Ramps tend to wander in
          hue from one step to the next, a little at a time, which is easy to
          miss on any single swatch and plain once you lay the whole scale out.
          Or they lose their colour and fade toward grey.
        </p>
        <p className="docs-colour-body">
          Neither happens here, and neither is left to judgement. The hue is held
          fixed by construction, the steps are checked to stay visibly distinct
          from one another, and a ramp that started greying out would fail its
          test rather than ship.
        </p>
      </Stack>

      <Stack gap="md">
        <h3 className="docs-colour-subheading">Where the colour comes from</h3>
        <p className="docs-colour-body">
          The palette is generated rather than picked. A colour engine called
          Harmoni takes one seed colour per ramp and builds the ten steps around
          it, deciding the foreground pairings as it goes. Primitiv ships the
          result, so you get an accessible palette without running anything.
        </p>
        <p className="docs-colour-body">
          Harmoni is a Figma plugin and a product in its own right, for teams who
          want to generate their own palettes this way. You do not need it to use
          Primitiv.
        </p>
        <p className="docs-colour-links">
          <Link className="docs-colour-link" href="/concepts/tokens/">
            How tokens and theming work
          </Link>
        </p>
      </Stack>

      {/* The proof line states exactly what the tests in
          `crates/harmoni-core/tests/ramp_regression.rs` assert, and nothing
          more — `every_ramp_keeps_an_accessible_foreground_on_every_step`,
          `every_ramp_holds_its_hue_by_construction`, `no_ramp_greys_out` and
          `no_ramp_collapses_two_steps_onto_one_colour`. "100 generated
          swatches" is the five generated ramps across both themes; neutral is
          shown in the sheet and deliberately outside this claim. */}
      <p className="docs-colour-proof-line">
        100 generated swatches. Every one has a foreground that clears its
        contrast minimum, every ramp holds its hue, and no two steps collapse
        onto the same colour — all checked on every change.
      </p>
    </Stack>
  </LandingSection>
);
