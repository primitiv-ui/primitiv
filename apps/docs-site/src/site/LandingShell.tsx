"use client";

import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

import "./shell.css";

/**
 * Shell for full-bleed pages.
 *
 * Distinct from `Shell` (the documentation layout) because the landing has no
 * sidebar and no on-this-page TOC, and its sections run edge to edge — each one
 * owns its own `Container`, so a shared max-width wrapper here would double the
 * gutters and stop the bands from bleeding.
 *
 * The header and footer are the same components both shells use, so the chrome
 * cannot drift between the landing and the docs.
 */
export const LandingShell = ({ children }: { children: ReactNode }) => (
  <div className="docs-shell">
    <a className="docs-skip-link" href="#main">
      Skip to content
    </a>

    <SiteHeader />

    <main id="main" tabIndex={-1}>
      {children}
    </main>

    <SiteFooter />
  </div>
);
