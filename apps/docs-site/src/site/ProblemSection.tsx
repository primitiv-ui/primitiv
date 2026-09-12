"use client";

import { Stack } from "@/components/stack";

import { LandingSection } from "./LandingSection";
import { TeamButtons } from "./TeamButtons";

import "./problem-section.css";

/**
 * Home page section 3 — "You are already paying for a design system." Copy
 * verbatim from `docs/docs-site-home-copy.md` §3.
 *
 * Written at team level rather than code level: four symptoms a lead recognises
 * from their own sprint board, and the deferred time-and-cost claim landing in
 * the closing line rather than the heading.
 *
 * PROBLEM-01 sits directly beneath the FIRST symptom and before the second,
 * which is the brief's placement and the reason it works — the image is the
 * evidence for that one sentence, not decoration for the section.
 */
const SYMPTOMS = [
  {
    title: "Three developers build three different buttons.",
    note: "Nobody meant to. There was no shared one on the day each was needed.",
  },
  {
    title: "The design file and the app drift apart.",
    note:
      "The mockup says 16px, the build says 14px, and by the third release " +
      "nobody trusts either.",
  },
  {
    title: "Accessibility becomes a panic before launch.",
    note:
      "Contrast and keyboard support get checked at the end, when fixing them " +
      "costs the most.",
  },
  {
    title: "A rebrand costs a quarter.",
    note:
      "Because the colours live in hundreds of files instead of being derived " +
      "from one.",
  },
] as const;

export const ProblemSection = () => (
  <LandingSection
    id="the-problem"
    overline="Why this exists"
    heading="You are already paying for a design system."
    lede={
      <p className="docs-lede">
        Most teams do not decide to build one. They build one by accident, a
        component at a time, and pay for it in ways that never show up on a
        roadmap.
      </p>
    }
    band
  >
    <Stack gap="xl">
      <Stack className="docs-problem-symptom">
        <h3 className="docs-problem-title">{SYMPTOMS[0].title}</h3>
        <p className="docs-problem-note">{SYMPTOMS[0].note}</p>
      </Stack>

      <TeamButtons />

      <Stack gap="xl">
        {SYMPTOMS.slice(1).map((symptom) => (
          <Stack className="docs-problem-symptom" key={symptom.title}>
            <h3 className="docs-problem-title">{symptom.title}</h3>
            <p className="docs-problem-note">{symptom.note}</p>
          </Stack>
        ))}
      </Stack>

      <p className="docs-problem-close">
        Building the layer that fixes all four takes a team the better part of a
        year. This is that layer.
      </p>
    </Stack>
  </LandingSection>
);
