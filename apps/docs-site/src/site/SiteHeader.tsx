"use client";

import Link from "next/link";

import { Container } from "@/components/container";
import { Input } from "@/components/input";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/segmented-control";
import { Stack } from "@/components/stack";
import { VisuallyHidden } from "@primitiv-ui/react";

import { BrandLockup } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { FRAMEWORKS, MODES, label, useFramework, useMode } from "./preferences";

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
  const [mode, setMode] = useMode();
  const [framework, setFramework] = useFramework();

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
            <div className="docs-header-control">
              <VisuallyHidden id="docs-framework-label">
                Framework
              </VisuallyHidden>
              <SegmentedControl
                size="xs"
                value={framework}
                onValueChange={(v) => setFramework(v as typeof framework)}
                aria-labelledby="docs-framework-label"
              >
                {FRAMEWORKS.map((f) => (
                  <SegmentedControlItem key={f} value={f}>
                    {label(f)}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </div>

            <div className="docs-header-control">
              <VisuallyHidden id="docs-mode-label">
                Consumption mode
              </VisuallyHidden>
              <SegmentedControl
                size="xs"
                value={mode}
                onValueChange={(v) => setMode(v as typeof mode)}
                aria-labelledby="docs-mode-label"
              >
                {MODES.map((m) => (
                  <SegmentedControlItem key={m} value={m}>
                    {label(m)}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </div>

            {/* type="search" gives the native clear affordance and the right
                on-screen keyboard; the label is hidden because the placeholder
                is the visible affordance, but a placeholder is NOT a label. */}
            <div className="docs-header-search">
              <VisuallyHidden id="docs-search-label">
                Search the docs
              </VisuallyHidden>
              <Input
                size="xs"
                type="search"
                placeholder="Search docs…"
                aria-labelledby="docs-search-label"
              />
            </div>

            <ThemeToggle />
          </div>
        </Stack>
      </Container>
    </header>
  );
};
