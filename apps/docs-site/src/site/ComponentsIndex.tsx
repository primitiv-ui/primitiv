"use client";

import Link from "next/link";

import { Badge } from "@/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { ALL_DOCS } from "@/lib/docs-data";
import { firstSentence, renderDoc } from "@/lib/render-doc";

import "./components-index.css";

/**
 * The `/components` index.
 *
 * This is a page in its own right, not just a nav group, because it owns the
 * consumption-mode switch (docs-site-planning.md §1.4 marks the Components
 * section `[MODE-SCOPED — the switch lives here]`). A reader picks
 * headless/styled/Figma here and then drills into a component.
 *
 * The grid is driven by `ALL_DOCS`, so a new component appears here as soon as
 * its generated docs-data lands — there is no list to maintain in parallel.
 */
export const ComponentsIndex = () => (
  <>
    <h1 className="docs-index-title">Components</h1>
    <p className="docs-index-lede">
      Every component ships three ways: a headless primitive, a styled registry
      surface you own outright, and a Figma component set. Pick a component to
      see all three.
    </p>

    <ul className="docs-index-grid">
      {ALL_DOCS.map((docs) => (
        <li key={docs.id}>
          {/* asChild makes the whole card the link, so the hit area is the card
              rather than just the title text — and it stays a single <a>, not a
              card containing a link, which would give screen-reader users two
              overlapping targets. */}
          <Card asChild>
            <Link className="docs-index-card" href={`/components/${docs.id}/`}>
              {/* Header inside Content — Content owns all the padding. */}
              <CardContent>
                <CardHeader>
                  <CardTitle>{docs.displayName}</CardTitle>
                  {/* Badge ships no neutral tone (success|warning|info|danger
                      only), so "stable" reads as success — accurate here. */}
                  <Badge tone="success" size="sm">
                    {docs.status}
                  </Badge>
                </CardHeader>
                <CardDescription>
                  {/* First sentence only — and rendered, not printed: the
                      generated description contains backticked code spans. */}
                  {renderDoc(firstSentence(docs.description), "sm")}
                </CardDescription>
              </CardContent>
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  </>
);
