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
             * The label span is wrapped by hand here, which a plain
             * `<Button>Text</Button>` never needs.
             *
             * `text-box-trim`/`text-box-edge` live on `.primitiv-button__label`,
             * because trimming has to sit on the element DIRECTLY wrapping the
             * text node — not the flex container. Button's generated
             * `wrapTextNodes` only wraps `string | number` children, so under
             * `asChild` the single child is the consumer's <Link> ELEMENT and its
             * text sits one level deeper than Button ever looks. Result: no trim,
             * and no `white-space: nowrap` either.
             *
             * This is a gap in the wrapper generator
             * (crates/primitiv-emit/src/wrapper.rs), not in this call site — see
             * docs/registry-bugs.md §5. Remove these spans once it is fixed.
             */}
            <Button asChild>
              <Link href="/components/">
                <span className="primitiv-button__label">Start Here</span>
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/components/">
                <span className="primitiv-button__label">Browse Components</span>
              </Link>
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
