"use client";

import { useState } from "react";

import { Button } from "@/components/button";
import { CodeBlock } from "@/components/code-block";
import { InlineCode } from "@/components/inline-code";
import { Prose } from "@/components/prose";
import { ICONS, type IconEntry, iconUrl } from "@/lib/icons";

import type { TocEntry } from "./PageToc";
import { Shell } from "./Shell";

import "./content-page.css";
import "./icon-gallery.css";

export const TOC: readonly TocEntry[] = [
  { id: "using-an-icon", title: "Using an icon" },
  { id: "the-icons", title: "The icons" },
];

/**
 * One icon: the glyph, its name, and a button that copies its SVG.
 *
 * The SVG is the file the package publishes, drawn from the generated data (our
 * own build output, never user input), so the copy is exactly what a CDN fetch
 * of the same name returns. Each icon's React export is in the data too, for a
 * Copy JSX button beside this one.
 */
const IconTile = ({ icon }: { icon: IconEntry }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(icon.svg).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <li className="docs-icon-tile">
      <span className="docs-icon-glyph" dangerouslySetInnerHTML={{ __html: icon.svg }} />
      <InlineCode size="sm">{icon.name}</InlineCode>
      <Button variant="secondary" size="xs" onClick={copy} aria-label={`Copy the ${icon.name} SVG`}>
        {copied ? "Copied" : "Copy SVG"}
      </Button>
    </li>
  );
};

const CLOSE = ICONS.find((icon) => icon.name === "close") as IconEntry;

/* The Close SVG in place of its slot, in an icon-only button. */
const HTML_USAGE = [
  `<button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--md" aria-label="Close">`,
  `  ${CLOSE.svg}`,
  `</button>`,
].join("\n");

const REACT_USAGE = [
  `import { Close } from "@primitiv-ui/icons";`,
  ``,
  `<Button variant="ghost" aria-label="Close">`,
  `  <Close aria-hidden="true" />`,
  `</Button>`,
].join("\n");

export const IconGallery = ({ version }: { version: string }) => (
  <Shell toc={TOC}>
    <div className="docs-content-page">
      <header className="docs-content-head">
        <p className="docs-content-eyebrow">Foundations</p>
        <div className="docs-content-tight">
          <h1 className="docs-content-title">Icons</h1>
          <p className="docs-content-lede">
            The {ICONS.length} icons in <InlineCode>@primitiv-ui/icons</InlineCode>. Each
            one is a 24px solid glyph that takes the colour of the text around it.
          </p>
        </div>
      </header>

      <section className="docs-content-section" aria-labelledby="using-an-icon">
        <Prose>
          <h2 className="docs-content-h2" id="using-an-icon">
            Using an icon
          </h2>
          <p className="docs-content-p">
            Elements markup marks each icon&apos;s place with a comment such as{" "}
            <InlineCode>{"<!-- Insert your SVG icon here: close -->"}</InlineCode>. Copy that
            icon&apos;s SVG below and paste it there.
          </p>
          <p className="docs-content-p">
            Every SVG is <InlineCode>aria-hidden=&quot;true&quot;</InlineCode>, because an
            icon beside a label adds nothing to it. When the icon is the only thing in a
            control, name the control instead, as in{" "}
            <InlineCode>{'<button aria-label="Close">'}</InlineCode>.
          </p>
        </Prose>
        <CodeBlock size="sm" language="html" code={HTML_USAGE} />
        <Prose>
          <p className="docs-content-p">
            Or link one from the CDN by name:{" "}
            <InlineCode>{iconUrl("<name>", version)}</InlineCode>. In React, import the
            component, named for the icon in PascalCase (<InlineCode>grid</InlineCode> is{" "}
            <InlineCode>GridIcon</InlineCode>):
          </p>
        </Prose>
        <CodeBlock size="sm" language="tsx" code={REACT_USAGE} />
      </section>

      <section className="docs-content-section" aria-labelledby="the-icons">
        <Prose>
          <h2 className="docs-content-h2" id="the-icons">
            The icons
          </h2>
        </Prose>
        <ul className="docs-icon-grid">
          {ICONS.map((icon) => (
            <IconTile key={icon.name} icon={icon} />
          ))}
        </ul>
      </section>
    </div>
  </Shell>
);
