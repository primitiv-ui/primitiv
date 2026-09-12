"use client";

import Link from "next/link";

import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { Stack } from "@/components/stack";

import "./close-section.css";

/**
 * The page's last word.
 *
 * **Deliberately not a `LandingSection`.** Every other section is an overline
 * plus a left-aligned heading; this one has no overline at all and is centred,
 * so reusing that shell would mean adding an "optional overline" and an
 * alignment switch to a component whose value is that every section looks the
 * same. The copy record is explicit that the close carries **no illustration**
 * — after nine sections of images, an unillustrated ending reads as confidence
 * and gives the call to action the whole frame.
 */
export const CloseSection = () => (
  <Box asChild className="docs-close-section">
    <section aria-labelledby="close">
      <Container size="xl">
        <Stack gap="lg" align="center">
          <h2 className="docs-close-heading" id="close">
            Start with one component.
          </h2>
          <p className="docs-close-lede">
            You do not have to adopt a system to get value from it. Install one
            component, see whether it fits, and go from there.
          </p>
          <Stack direction="row" gap="md" wrap="wrap" justify="center">
            <Button asChild size="lg">
              <Link href="/start-here/">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/components/">Browse components</Link>
            </Button>
          </Stack>
        </Stack>
      </Container>
    </section>
  </Box>
);
