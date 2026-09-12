"use client";

import Link from "next/link";

import { Box } from "@/components/box";
import { Container } from "@/components/container";
import { Grid } from "@/components/grid";
import { List } from "@/components/list";
import { Stack } from "@/components/stack";

import { BrandLockup } from "./Brand";

import "./site-footer.css";

/*
 * Four columns, per the Figma landing v2 footer: brand + tagline, then Docs,
 * Build, Design. A Grid rather than the design's Stack row, because a row of
 * four fixed columns has nowhere to go on a narrow viewport.
 *
 * Every link here pointed at a `/#anchor` that did not exist — not a section of
 * the home page, not a page anywhere (docs-site-content-plan.md §4.6). Now that
 * the eight content routes are real, each one names its page. Three entries came
 * out rather than being re-pointed: Recipes and Icons have no page in any plan,
 * and Changelog is deferred (D3). A missing entry is honest; a dead one is not.
 */
const COLUMNS = [
  {
    heading: "Docs",
    links: [
      { title: "Start Here", href: "/start-here/" },
      { title: "What Primitiv is", href: "/concepts/what-primitiv-is/" },
      { title: "Components", href: "/components/" },
    ],
  },
  {
    heading: "Build",
    links: [
      { title: "Registry & CLI", href: "/registry-cli/" },
      { title: "Tokens & theming", href: "/concepts/tokens/" },
      { title: "GitHub", href: "https://github.com/primitiv-ui/primitiv" },
    ],
  },
  {
    heading: "Design",
    links: [
      { title: "Design in Figma", href: "/figma/" },
      { title: "Density", href: "/concepts/density/" },
      { title: "Accessibility", href: "/concepts/accessibility/" },
    ],
  },
] as const;

const isExternal = (href: string) => href.startsWith("http");

export const SiteFooter = () => (
  <Box asChild className="docs-site-footer">
    <footer>
      <Container size="xl">
        {/* `columns={4}` was a fixed four at every width, not the reflow the
            note above claimed: at 390 it made four 66px columns and every
            single link overflowed its own cell. `Grid` takes a mobile-first
            map, so this is the component's own responsive prop rather than a
            docs media query. */}
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="xl">
          <Stack gap="sm">
            <BrandLockup height={24} />
            <p className="docs-footer-tagline">
              Headless components · registry styling · Figma library
            </p>
          </Stack>

          {COLUMNS.map((column) => (
            <Stack key={column.heading} gap="sm">
              <h2 className="docs-footer-heading">{column.heading}</h2>
              {/* Registry List, for the same reasons as the documentation map:
                  it owns the item gap and cancels the base layer's prose
                  `li + li` margin, and stays a real <ul> with the marker off. */}
              <List marker={false} indent={false} size="sm">
                {column.links.map((link) => (
                  <List.Item key={`${column.heading}-${link.title}`}>
                    {isExternal(link.href) ? (
                      /* rel=noreferrer alongside noopener: noopener alone still
                         leaks the referrer. target=_blank without it is the
                         classic reverse-tabnabbing hole. */
                      <a
                        className="docs-footer-link"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.title}
                      </a>
                    ) : (
                      <Link className="docs-footer-link" href={link.href}>
                        {link.title}
                      </Link>
                    )}
                  </List.Item>
                ))}
              </List>
            </Stack>
          ))}
        </Grid>
      </Container>
    </footer>
  </Box>
);
