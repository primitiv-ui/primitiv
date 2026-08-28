"use client";

import Link from "next/link";

import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Stack } from "@/components/stack";
import { VisuallyHidden } from "@primitiv-ui/react";

import { BrandLockup } from "./Brand";
import { HeaderModeControls } from "./HeaderModeControls";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

import "./site-header.css";

/**
 * The persistent top bar, per the Figma landing v2 frame.
 *
 * Composed from the registry primitives the design itself uses — `Container`
 * (size `xl`) for the content width and `Stack` for the rows — rather than
 * hand-rolled flex, so the gutters and gaps track the token scale.
 *
 * Two segmented controls, not one: framework flavour (which language the code
 * samples are in) is orthogonal to consumption mode (headless / styled / Figma).
 * Both persist via `useLocalStorage`, so the choice survives navigation and is
 * shared with anything else reading the same key.
 */
export const SiteHeader = () => {
  return (
    <header className="docs-site-header">
      <Container size="xl">
        <Stack direction="row" align="center" gap="lg">
          <Link className="docs-brand" href="/">
            {/* Decorative: the accessible name comes from the hidden text below,
                so the artwork itself is hidden rather than announced twice. */}
            <BrandLockup height={24} />
            <VisuallyHidden>Primitiv home</VisuallyHidden>
          </Link>

          <nav className="docs-header-nav" aria-label="Site">
            <ul className="docs-header-nav-list">
              <li>
                <Link
                  className="docs-header-link docs-header-link--accent"
                  href="/components/"
                >
                  Build with code
                </Link>
              </li>
              <li>
                <Link className="docs-header-link" href="/#harmoni">
                  Design in Figma
                </Link>
              </li>
            </ul>
          </nav>

          <div className="docs-header-controls">
            {/* The two switches — hidden below 48rem, where they move into the
                mobile drawer (which renders this same component). */}
            <HeaderModeControls />

            {/* type="search" gives the native clear affordance and the right
                on-screen keyboard; the label is hidden because the placeholder
                is the visible affordance, but a placeholder is NOT a label. */}
            <div className="docs-header-search">
              <VisuallyHidden id="docs-search-label">
                Search the docs
              </VisuallyHidden>
              <Input
                size="sm"
                type="search"
                placeholder="Search docs..."
                aria-labelledby="docs-search-label"
              />
            </div>

            <ThemeToggle />

            {/* The burger — only visible below 64rem, where the sidebar is
                gone. Opens a drawer with the switches above plus the full nav. */}
            <MobileMenu />
          </div>
        </Stack>
      </Container>
    </header>
  );
};
