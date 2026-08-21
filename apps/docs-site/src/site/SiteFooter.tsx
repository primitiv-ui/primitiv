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
 * four fixed columns has nowhere to go on a narrow viewport — the grid reflows.
 */
const COLUMNS = [
  {
    heading: "Docs",
    links: [
      { title: "Start Here", href: "/" },
      { title: "Concepts", href: "/#what-primitiv-is" },
      { title: "Components", href: "/components/" },
      { title: "Registry & CLI", href: "/#cli" },
    ],
  },
  {
    heading: "Build",
    links: [
      { title: "Registry & CLI", href: "/#cli" },
      { title: "Recipes", href: "/#recipes" },
      { title: "Changelog", href: "/#changelog" },
      { title: "GitHub", href: "https://github.com/primitiv-ui/primitiv" },
    ],
  },
  {
    heading: "Design",
    links: [
      { title: "Design in Figma", href: "/#harmoni" },
      { title: "Harmoni", href: "/#harmoni" },
      { title: "Tokens", href: "/#tokens" },
      { title: "Icons", href: "/#icons" },
    ],
  },
] as const;

const isExternal = (href: string) => href.startsWith("http");

export const SiteFooter = () => (
  <Box asChild className="docs-site-footer">
    <footer>
      <Container size="xl">
        <Grid columns={4} gap="xl">
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
