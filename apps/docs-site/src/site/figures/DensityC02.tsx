"use client";

import { Field, FieldLabel } from "@/components/field";
import { Input } from "@/components/input";

import "./figure-chrome.css";
import "./density-figures.css";

/**
 * DENSITY-C02 — density is scoped by containment.
 *
 * A `spacious` region holding a `dense` one, each with a real control, the
 * inner one visibly smaller. Like DENSITY-C01 this is the DOM doing the thing
 * rather than a drawing of it: the nesting **is** the proof, because the inner
 * region sets one attribute and everything under it re-resolves.
 *
 * Built against the frame `DENSITY-C02 — desktop`, which stays the design
 * record (plan §6.0.29).
 *
 * The `data-density="…"` strings are drawn as visible labels, exactly as the
 * frame does, and they are `InlineCode`-styled rather than real `InlineCode`
 * instances: they label the box they sit in rather than appearing in a
 * sentence, so they carry no chip background of their own.
 */
export const DensityC02 = () => (
  <figure className="docs-figure docs-density-nest">
    <div className="docs-density-nest__outer" data-density="spacious">
      <p className="docs-density-nest__attr">data-density=&quot;spacious&quot;</p>
      <p className="docs-figure__heading">Workspace</p>
      <Input placeholder="Acme" aria-label="Workspace name" />

      <div className="docs-density-nest__inner" data-density="dense">
        <p className="docs-density-nest__attr">data-density=&quot;dense&quot;</p>
        <Field>
          <FieldLabel>Filter</FieldLabel>
          <Input placeholder="status:open" aria-label="Filter" />
        </Field>
      </div>
    </div>
    <figcaption className="docs-figure__caption">The nearest setting wins.</figcaption>
  </figure>
);
