"use client";

import Link from "next/link";

import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { Stack } from "@/components/stack";

import { BrandMark } from "./Brand";
import { ChevronDown } from "@primitiv-ui/icons";

import "./hero.css";

/**
 * The landing hero, per the Figma landing v2 frame.
 *
 * Structure is the design's: `Box` (padding-block 96) → `Container xl` →
 * `Stack gap="xl"` (32) centred, holding the stacked lockup, a two-line
 * headline, the lede, the CTA pair and the scroll hint.
 *
 * The design fills this section with a Figma SHADER (a blue wash) which exposes
 * no gradient stops through the plugin API, so it is left as a flat token
 * surface for now.
 */
export const Hero = () => (
  <Box asChild className="docs-hero">
    <section aria-labelledby="docs-hero-heading">
      <Container size="xl">
        <Stack gap="xl" align="center">
          <BrandMark size={72} />

          {/*
           * The line break is content, not styling: the design sets these as
           * two deliberate lines. A screen reader reads the run either way, so
           * the meaning is unaffected — but `text-wrap: balance` alone could not
           * guarantee this exact split.
           */}
          <h1 className="docs-hero-heading" id="docs-hero-heading">
            One design system.
            <br />
            Three ways to build.
          </h1>

          <p className="docs-hero-lede">
            Headless behaviour, an installable styling layer, or a Figma library
            — pick the surface that fits how you work. The same accessible
            components sit underneath every mode.
          </p>

          <Stack direction="row" gap="sm" justify="center">
            {/*
             * These used to wrap their label in a `.primitiv-button__label` span
             * by hand — reaching for a class `contract.json` does not even
             * declare — because `wrapTextNodes` only wrapped `string | number`
             * children, so under `asChild` the text sat one level deeper than
             * Button ever looked and silently lost `text-box-trim` and
             * `white-space: nowrap`. The generator now clones the `asChild` child
             * with its own children wrapped (registry-bugs §5), so a plain label
             * is correct again.
             */}
            <Button asChild>
              <Link href="/components/">Start Here</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/components/">Browse Components</Link>
            </Button>
          </Stack>

          {/* Decorative affordance, not a control: it names no destination and
              duplicates the scroll the page already affords. */}
          <p className="docs-hero-scroll" aria-hidden="true">
            Scroll to explore <ChevronDown />
          </p>
        </Stack>
      </Container>
    </section>
  </Box>
);
