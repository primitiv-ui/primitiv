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
import { LandingShell } from "@/site/LandingShell";
import { ProofStrip } from "@/site/ProofStrip";

export default function HomePage() {
  return (
    <LandingShell>
      <Hero />
      <ProofStrip />
      <DesignAndBuild />
      <ChooseYourPath />
      <AccessibleByDefault />
      <DocumentationMap />
      <ComponentBlock />
      <CloseSection />
    </LandingShell>
  );
}
