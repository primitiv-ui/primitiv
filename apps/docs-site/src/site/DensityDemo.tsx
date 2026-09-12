"use client";

import { useId, useState } from "react";

import { Badge } from "@/components/badge";
import { Blockquote } from "@/components/blockquote";
import { Button } from "@/components/button";
import { Card, CardContent } from "@/components/card";
import { Divider } from "@/components/divider";
import { Prose } from "@/components/prose";
import { Radio } from "@/components/radio";
import { SegmentedControl, SegmentedControlItem } from "@/components/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";

import "./density-demo.css";

/**
 * DENSITY-01 — the live density demo (home copy §4).
 *
 * **The two regions are the design.** A single scene at four densities says
 * "the spacing is adjustable", which a `size` prop already does and which
 * impresses nobody. Two very different scenes driven by one dial says "this
 * system fits whatever you build" — and RANGE is the claim the section actually
 * makes. At Dense the composition reads like an operations tool; at Spacious it
 * reads like a marketing page; nothing about the markup changes.
 *
 * **Nothing is hardcoded per mode** — and, just as important, nothing inside the
 * stage resolves a PRIMITIVE spacing token either. The stage sets `data-density`
 * and the cascade does the rest: geometry, type *and* rhythm. The two are
 * different failures and only the first is obvious. A first pass had no per-mode
 * override anywhere (correct) but spaced each region with
 * `gap: var(--primitiv-space-space-12)` — a primitive, so 12px in every mode.
 * Type scaled 16 → 52 and control heights scaled with it while the space between
 * the blocks sat still, in the one demo whose entire job is to show them moving
 * together. The rule the brief implies but does not say: **inside a density
 * scope, every spacing value must resolve through the Context tier.** Both
 * regions are `<Prose asChild>` for exactly that reason — the `.primitiv-flow`
 * owl publishes the density-scaled `flow/*` family (`normal` 12/16/20/28,
 * `section` 16/24/32/40, `tight` 8/10/12/16) with RFC 0016's heading asymmetry
 * on top, so the h4 binds tighter to its own paragraph than to the overline
 * above it at every density. Measured across all four modes.
 *
 * The one deliberate exception is the stage's OWN frame — its padding and the
 * gap between the two columns are primitives, and stay put. They are the
 * enclosure, not the content: scaling them would narrow both columns at
 * Spacious and change what is being compared, on top of the stage's own fixed
 * height. Everything the columns contain scales.
 *
 * **The stage height is fixed across all four modes**, which the brief requires
 * and whose consequences it also accepts: Spacious must scroll internally and
 * Dense leaves real space below the table. A stage that resized would make the
 * page jump on every change and hide the very effect being demonstrated.
 *
 * The readout is not decoration — the brief calls it "the detail that converts a
 * developer", because it says *this is one attribute* more efficiently than a
 * paragraph can.
 */
const MODES = ["dense", "compact", "comfortable", "spacious"] as const;
type Mode = (typeof MODES)[number];

/* Eight body rows, not the brief's six: six left ~160px of dead stage below the
   table at Comfortable, which reads as a layout fault rather than as headroom.
   Carried over from the Figma build's own finding. */
const ROWS = [
  { name: "Acquisition funnel", owner: "R. Achebe", updated: "2m ago", status: "Live" },
  { name: "Billing reconciliation", owner: "M. Okonjo", updated: "14m ago", status: "Live" },
  { name: "Churn cohorts", owner: "S. Ferreira", updated: "1h ago", status: "Review" },
  { name: "Dunning retries", owner: "L. Haugen", updated: "3h ago", status: "Live" },
  { name: "Entitlement sync", owner: "J. Mwangi", updated: "Yesterday", status: "Paused" },
  { name: "Invoice exports", owner: "A. Dubois", updated: "Yesterday", status: "Live" },
  { name: "Seat reassignment", owner: "T. Nakamura", updated: "2d ago", status: "Review" },
  { name: "Usage rollups", owner: "K. Brennan", updated: "4d ago", status: "Live" },
] as const;

const TONES = {
  Live: "success",
  Review: "info",
  Paused: "warning",
} as const satisfies Record<string, "success" | "info" | "warning">;

export const DensityDemo = () => {
  const [mode, setMode] = useState<Mode>("comfortable");
  const name = useId();

  return (
    <Card className="docs-density-panel">
      <CardContent className="docs-density-card">
        {/* A real fieldset with a visually hidden legend: four radios sharing a
            name ARE a group, and naming it is what makes the control
            comprehensible without a visible label. */}
        <div className="docs-density-strip">
          <fieldset className="docs-density-fieldset">
            <legend className="docs-visually-hidden">Density</legend>
            {MODES.map((m) => (
              <Radio
                key={m}
                size="sm"
                name={name}
                value={m}
                checked={mode === m}
                /* `onCheckedChange`, not `onChange` — the controlled contract
                   the headless Radio publishes. Guarded on the value so
                   unchecking (which a radio group never does on its own) cannot
                   clear the dial. */
                onCheckedChange={(next) => {
                  if (next) setMode(m);
                }}
              >
                {m[0].toUpperCase() + m.slice(1)}
              </Radio>
            ))}
          </fieldset>

          {/* The live attribute, exactly as it would appear in the markup. */}
          <code className="docs-density-readout">data-density=&quot;{mode}&quot;</code>
        </div>

        <Divider />

        {/*
         * The one attribute. Everything below reflows from it — and it is on the
         * stage rather than the panel so the control strip itself stays put,
         * which is what lets a reader see that only the content moved.
         */}
        <div className="docs-density-stage" data-density={mode}>
          {/*
           * `Prose` — i.e. the `.primitiv-flow` context — is what spaces the
           * blocks inside each region, NOT a gap on the region itself. A first
           * pass used `gap: space-12`, a PRIMITIVE token, so it was 12px in every
           * mode: the type and the control geometry reflowed while the rhythm
           * between them sat still, in the one demo whose whole job is to show
           * them moving together. The `flow/*` family is the density-scaled one
           * (`flow/normal` runs 12/16/20/28 across the four modes) and Prose is
           * how the system publishes it — heading asymmetry included, which is
           * why the h4 binds tighter to its first paragraph than to the overline
           * above it, at every density.
           */}
          <Prose asChild>
            <section className="docs-density-region" aria-label="Operations">
              <p className="docs-density-region-label">Operations</p>

              <div className="docs-density-toolbar">
                <SegmentedControl size="sm" defaultValue="all" aria-label="Filter">
                  <SegmentedControlItem value="all">All</SegmentedControlItem>
                  <SegmentedControlItem value="active">Active</SegmentedControlItem>
                  <SegmentedControlItem value="archived">Archived</SegmentedControlItem>
                </SegmentedControl>
                <Button size="sm" variant="secondary">
                  Export
                </Button>
              </div>

              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    {/* Dropped below 36rem by the stylesheet — the brief's own
                        three-column reduction, done in CSS so the markup stays
                        one thing at every width. */}
                    <TableHeader className="docs-density-col-updated">Updated</TableHeader>
                    <TableHeader>Status</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell className="docs-density-col-updated">{row.updated}</TableCell>
                      <TableCell>
                        <Badge size="sm" tone={TONES[row.status]}>
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </Prose>

          <Divider orientation="vertical" className="docs-density-seam" />

          <Prose asChild>
            <section className="docs-density-region" aria-label="Editorial">
              <p className="docs-density-region-label">Editorial</p>
              <p className="docs-density-overline">Field notes</p>
              <h4 className="docs-density-heading">What a quarter of drift costs</h4>
              <p className="docs-density-body">
                The team shipped four variants of the same control in a single
                release, each correct against a different mockup. None of them
                was wrong on the day it was written.
              </p>
              <p className="docs-density-body docs-density-second-para">
                What it cost was not the building. It was the six weeks
                afterwards, spent deciding which one was right.
              </p>
              <Blockquote size="sm">
                Consistency is cheaper to keep than to recover.
              </Blockquote>
              <Button size="sm">Read more</Button>
            </section>
          </Prose>
        </div>
      </CardContent>
    </Card>
  );
};
