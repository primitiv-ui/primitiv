"use client";

import { ChevronDown } from "@primitiv-ui/icons";
import { useState } from "react";

import { CodeBlock } from "@/components/code-block";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/components/collapsible";
import { InlineCode } from "@/components/inline-code";
import { Prose } from "@/components/prose";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/table";

import library from "@/content/colour-library.generated.json";

import type { TocEntry } from "./PageToc";
import { Shell } from "./Shell";
import { useDocsTheme } from "./use-docs-theme";

import "./colour-proof.css";
import "./content-page.css";
import "./colour-library.css";

/**
 * The colour library page (/colours/).
 *
 * Every value here comes from the engine via `swatch-sheet`'s
 * `write_colour_library`: the swatch, the token the engine pairs text with on
 * it, the contrast that pairing reaches and its WCAG grade. This file computes
 * no colour and no ratio — a threshold here would produce a page that looks the
 * same and is a second opinion about the exact thing it promises.
 *
 * It follows `useDocsTheme`, like the home page's proof sheet, because the
 * library ramps genuinely change between themes and the pairing changes with
 * them: what reads on violet-300 in light mode is not what reads on it in dark.
 */

type Foreground = {
  readonly token: string;
  readonly hex: string;
  readonly contrast: number;
  readonly grade: string;
};

type Step = {
  readonly step: string;
  readonly value: string;
  readonly hex: string;
  readonly foreground: Foreground;
};

type Ramp = {
  readonly ramp: string;
  readonly sameAs: string | null;
  readonly light: readonly Step[];
  readonly dark: readonly Step[];
};

const RAMPS: readonly Ramp[] = library.ramps;

const tokenOf = (name: string) => `--primitiv-color-${name}`;

const USAGE = `.tag-violet {
  background: var(--primitiv-color-violet-100);
  /* The text token the table below pairs with violet-100. */
  color: var(--primitiv-color-violet-900);
}`;

export const TOC: readonly TocEntry[] = [
  { id: "how-it-is-built", title: "How it is built" },
  { id: "using-a-colour", title: "Using a colour" },
  {
    id: "the-hues",
    title: "The hues",
    children: RAMPS.map((r) => ({ id: `hue-${r.ramp}`, title: r.ramp })),
  },
];

/* The step alone in the first column (the hue is the section's), short token
   names, and the shared prefix stated once above the table: full custom
   property names wrapped onto four lines per cell at phone width and pushed the
   contrast column off-screen. */
const HueTable = ({ ramp, steps }: { ramp: string; steps: readonly Step[] }) => (
  <div className="docs-library-table">
    <p className="docs-library-table-note">
      Background <InlineCode size="sm">{tokenOf(`${ramp}-<step>`)}</InlineCode>; each
      text name is a <InlineCode size="sm">{tokenOf("…")}</InlineCode> token.
    </p>
    <TableScrollArea>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeader>Step</TableHeader>
            <TableHeader>Text</TableHeader>
            <TableHeader align="end">Contrast</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {steps.map((s) => (
            <TableRow key={s.step}>
              <TableCell className="docs-library-step">{s.step}</TableCell>
              <TableCell>
                <InlineCode size="sm">{s.foreground.token}</InlineCode>
              </TableCell>
              <TableCell align="end" className="docs-library-contrast">
                {s.foreground.contrast.toFixed(1)}:1
                <span className="docs-library-grade">{s.foreground.grade}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableScrollArea>
  </div>
);

const Hue = ({ ramp, steps }: { ramp: Ramp; steps: readonly Step[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="docs-library-hue" aria-labelledby={`hue-${ramp.ramp}`}>
      <div className="docs-library-hue-head">
        <h3 className="docs-content-h3 docs-library-hue-name" id={`hue-${ramp.ramp}`}>
          {ramp.ramp}
        </h3>
        {ramp.sameAs && (
          <p className="docs-library-same-as">
            Same colours as <InlineCode size="sm">{ramp.sameAs}</InlineCode>
          </p>
        )}
      </div>

      {/* Each swatch's "Ag", step number and WCAG grade are painted in the text
          colour the engine paired with it, so the strip is the pairing itself,
          not a picture of a ramp with the advice somewhere else. */}
      <div
        className="docs-colour-steps"
        role="img"
        aria-label={`${ramp.ramp}, steps 50 to 900, each labelled in its recommended text colour with its WCAG grade.`}
      >
        {steps.map((s) => (
          <div
            className="docs-colour-swatch"
            key={s.step}
            style={{ background: s.hex, color: s.foreground.hex }}
          >
            <span className="docs-colour-sample">Ag</span>
            <span className="docs-colour-step">{s.step}</span>
            <span className="docs-library-swatch-grade">{s.foreground.grade}</span>
          </div>
        ))}
      </div>

      <Collapsible variant="inline" size="sm" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>
          {open ? "Hide text colours" : `Text colours for ${ramp.ramp}`}
          <CollapsibleTriggerIcon>
            <ChevronDown size="100%" />
          </CollapsibleTriggerIcon>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <HueTable ramp={ramp.ramp} steps={steps} />
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
};

export const ColourLibrary = () => {
  const [theme] = useDocsTheme();

  return (
    <Shell toc={TOC}>
      <div className="docs-content-page">
        <header className="docs-content-head">
          <p className="docs-content-eyebrow">Foundations</p>
          <div className="docs-content-tight">
            <h1 className="docs-content-title">Colour library</h1>
            <p className="docs-content-lede">
              Seventeen hue ramps, each ten steps from 50 to 900, generated by Harmoni
              and shipped in the token layer for you to build with. Every swatch below
              shows the text colour that reads best on it.
            </p>
          </div>
        </header>

        <section className="docs-content-section" aria-labelledby="how-it-is-built">
          <Prose>
            <h2 className="docs-content-h2" id="how-it-is-built">
              How it is built
            </h2>
            <p className="docs-content-p">
              Five of the hues are Primitiv&apos;s own semantic colours. Red is the
              danger ramp, amber is warning, green is success, cyan is info, and blue is
              the default brand, so the library never holds two reds that are almost the
              same.
            </p>
            <p className="docs-content-p">
              The other twelve sit evenly between those five on the OkLCH hue wheel. Each
              takes its lightness and colourfulness from its two neighbours, so the whole
              library reads as one family. Yellow and lime are the exception: they sit
              lighter, because a yellow only looks yellow when it is light. Every ramp
              holds its hue from 50 to 900 and has a light and a dark version: the tokens
              switch with the theme, just like brand.
            </p>
          </Prose>
        </section>

        <section className="docs-content-section" aria-labelledby="using-a-colour">
          <Prose>
            <h2 className="docs-content-h2" id="using-a-colour">
              Using a colour
            </h2>
            <p className="docs-content-p">
              Every step is a custom property named{" "}
              <InlineCode>--primitiv-color-&lt;hue&gt;-&lt;step&gt;</InlineCode>. For text
              on a step, use the token in that hue&apos;s table: it is the one Harmoni
              picked for the best contrast, and every pairing passes WCAG AA for body
              text.
            </p>
          </Prose>
          <CodeBlock size="sm" language="css" code={USAGE} />
        </section>

        <section className="docs-content-section" aria-labelledby="the-hues">
          <Prose>
            <h2 className="docs-content-h2" id="the-hues">
              The hues
            </h2>
            <p className="docs-content-p">
              Showing the {theme} theme. Switch the site theme to see the other set.
            </p>
          </Prose>
          <div className="docs-library-hues">
            {RAMPS.map((r) => (
              <Hue key={r.ramp} ramp={r} steps={theme === "dark" ? r.dark : r.light} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
};
