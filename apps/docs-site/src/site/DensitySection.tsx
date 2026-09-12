"use client";

import Link from "next/link";

import { Grid } from "@/components/grid";
import { Stack } from "@/components/stack";

import { DensityDemo } from "./DensityDemo";
import { LandingSection } from "./LandingSection";

import "./density-section.css";

/**
 * Home page section 4 — "The same components, from dense dashboard to editorial
 * page." Copy verbatim from `docs/docs-site-home-copy.md` §4.
 *
 * **Moved ahead of colour deliberately** (plan §2.4): it answers a more
 * fundamental adoption question — *will this fit what we build?* comes before
 * *is it any good?* — and it lands right after the problem section, where a
 * reader is most receptive to "here is a system that covers your case".
 *
 * **The claim is RANGE, not adjustability.** "Spacing is configurable" is what a
 * `size` prop does and impresses nobody. What Primitiv offers is that one system
 * covers products as different as a busy enterprise dashboard and a large
 * editorial page, with no fork, no theme and nothing to fight.
 *
 * Two of the section's diagrams are not here yet: DENSITY-03 (every size at
 * every density) and DENSITY-02 (the radius derivation, beside the third
 * block). Both are renderable live like the demo — neither needs artwork — and
 * the blocks they belong to ship with their argument stated meanwhile.
 */
export const DensitySection = () => (
  <LandingSection
    id="density"
    overline="Density"
    heading="The same components, from dense dashboard to editorial page."
    lede={
      <p className="docs-lede">
        Most component libraries are tuned for one kind of product. Use them for
        something denser and everything feels bloated. Use them for something
        roomier and it feels cramped.
      </p>
    }
  >
    <Stack gap="xl">
      <p className="docs-density-para">
        Primitiv has four density modes: Dense, Compact, Comfortable and
        Spacious. Changing one attribute reflows everything beneath it — spacing,
        control height, corner radius, even type size. An operations tool and a
        marketing page can run the same components and both look like they were
        designed for the job.
      </p>

      {/* Full content width, and early in the section on purpose: a reader who
          is not sure this fits their product has no reason to care about
          anything below it. */}
      <DensityDemo />

      <Stack gap="md">
        <h3 className="docs-density-subheading">
          Density and size are different questions
        </h3>
        <p className="docs-density-para">
          Density is set once, for a product or a region — how tight everything
          is. Size is set per component — how prominent that one thing should be.
          They are independent, and they compose.
        </p>
      </Stack>

      <p className="docs-density-para">
        It is not an all-or-nothing setting. Density is inherited, so you set it
        once for the whole application, or on any part of a page that needs to be
        different. A dense table inside a roomy article is one attribute on the
        table&rsquo;s container.
      </p>

      <Grid columns={{ base: 1, md: 2 }} gap="xl" align="center">
        <p className="docs-density-para">
          Corner radius is worth singling out, because it shows how the system
          thinks. It is not a value someone assigns per size. It is a fraction of
          the control&rsquo;s height, so when density changes the height, the
          radius follows on its own and stays in proportion.
        </p>
      </Grid>

      <p className="docs-density-links">
        <Link className="docs-density-link" href="/concepts/density/">
          How density works
        </Link>
      </p>
    </Stack>
  </LandingSection>
);
