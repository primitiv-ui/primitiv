"use client";

import type { ReactNode } from "react";

import { Stack } from "@/components/stack";

import "./docs-section.css";

/**
 * One section of a component page.
 *
 * The design's own recipe, read off the Figma "Component page — Button
 * (desktop) — system build" frame rather than invented: every section is a
 * `Stack column` with `gap: 16` (= `gap="md"`) holding
 *
 *   h2  (40px Khand SemiBold = heading/h2 at comfortable)
 *   ↳ an optional 12px muted META line
 *   ↳ the section's content
 *
 * The meta line is the bit I had missed entirely: Props carries "Extends
 * HTMLButtonElement · headless props", Styling contract carries "CSS custom
 * properties — mode-agnostic", and it is `content/muted` at 12px in both. It is
 * a `<p>`, not a heading — it annotates the section rather than dividing it.
 */
export const DocsSection = ({
  id,
  title,
  meta,
  children,
}: {
  id: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) => (
  <Stack asChild gap="md">
    <section aria-labelledby={id}>
      <h2 className="docs-section-title" id={id}>
        {title}
      </h2>
      {meta && <p className="docs-section-meta">{meta}</p>}
      {children}
    </section>
  </Stack>
);
