"use client";

import type { ReactNode } from "react";

import { PageToc, type TocEntry } from "./PageToc";
import { SideNav } from "./SideNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

import "./shell.css";

export const Shell = ({
  children,
  toc = [],
}: {
  children: ReactNode;
  toc?: readonly TocEntry[];
}) => {
  return (
    <div className="docs-shell">
      {/* First focusable thing on the page, so a keyboard user can jump both
          nav landmarks instead of tabbing through every sidebar link. */}
      <a className="docs-skip-link" href="#main">
        Skip to content
      </a>

      <SiteHeader />

      <div className="docs-grid">
        <div className="docs-sidebar docs-rail">
          <SideNav />
        </div>

        {/* tabIndex -1 so the skip link can move focus here — not every browser
            will focus a non-focusable target. */}
        <main className="docs-main" id="main" tabIndex={-1}>
          {children}
        </main>

        <div className="docs-toc docs-rail">
          <PageToc entries={toc} />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};
