/*
 * The landing page, built against the Figma frame
 * "Wireframes — Docs Site (v1 — landing) › Landing (desktop) — system build v2"
 * (node 1830:10331).
 *
 * `"use client"` for the same structural reason as every page here: every
 * registry component reaches `@primitiv-ui/react`, which is one hook-laden
 * barrel. It still prerenders to static HTML — see next.config.ts.
 */
"use client";

import { Hero } from "@/site/Hero";
import {
  AccessibleByDefault,
  ChooseYourPath,
  DesignAndBuild,
  ComponentBlock,
  DocumentationMap,
} from "@/site/LandingSections";
import { CloseSection } from "@/site/CloseSection";
import { ColourSection } from "@/site/ColourSection";
import { LandingShell } from "@/site/LandingShell";
import { ProblemSection } from "@/site/ProblemSection";
import { ProofStrip } from "@/site/ProofStrip";

export default function HomePage() {
  return (
    <LandingShell>
      <Hero />
      <ProofStrip />
      {/* Sections 3 and 5, in the v3 order of docs-site-content-plan.md §2.
          Section 4 (the live density demo) belongs between them and is not
          built yet. */}
      <ProblemSection />
      <ColourSection />
      <DesignAndBuild />
      <ChooseYourPath />
      <AccessibleByDefault />
      <DocumentationMap />
      <ComponentBlock />
      <CloseSection />
    </LandingShell>
  );
}
