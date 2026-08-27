"use client";

import Link from "next/link";

import { Badge } from "@/components/badge";
import { InlineCode } from "@/components/inline-code";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumb";
import { Spacer } from "@/components/spacer";
import { Stack } from "@/components/stack";
import { ExternalLink } from "@primitiv-ui/icons";
import type { ComponentDocs } from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";

import "./component-page-header.css";
import { humanName } from "@/lib/human-name";

const FIGMA_FILE = "1Nh5ffky0lYEw0MzXoqQVy";
const REPO = "https://github.com/primitiv-ui/primitiv";

/**
 * The title block on a component page.
 *
 * Read off the Figma frame, and the part my first attempt was missing almost
 * entirely — it had a bare `<h1>` and a lede. The design is a `Stack column`
 * with `gap: 8` holding:
 *
 *   Breadcrumb (size sm, icon separators)  ·  Docs / Components / Button
 *   Stack row gap 8  ·  h1 (48px Khand SemiBold) + status Badge + Spacer + links
 *   description (20px Asta Sans, content/secondary)
 *
 * The `Spacer` is doing real work: it pushes the two external links to the
 * trailing edge while the heading and badge stay grouped at the start, which is
 * why the design uses one rather than `justify="between"` (that would also
 * separate the heading from its badge).
 *
 * Note the design's `Link` component has NO registry surface — RFC 0019 §4c
 * explicitly declined a standalone Link primitive, so these are plain anchors
 * with the site's own link class.
 */
export const ComponentPageHeader = ({ docs }: { docs: ComponentDocs }) => (
  <Stack gap="sm">
    <Breadcrumb size="sm">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Docs</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/components/">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {/* The current page is a BreadcrumbPage, not a link — it carries
              aria-current="page" and is deliberately not clickable. */}
          <BreadcrumbPage>{humanName(docs.displayName)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <Stack direction="row" gap="sm" align="center">
      <h1 className="docs-component-title">{humanName(docs.displayName)}</h1>
      <Badge tone="success" size="sm">
        {docs.status}
      </Badge>

      {/* Pushes the links to the trailing edge without separating the heading
          from its badge, which `justify="between"` would do. */}
      <Spacer />

      <a
        className="docs-meta-link"
        href={`${REPO}/tree/main/registry/components/${docs.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Source <ExternalLink size={14} />
      </a>
      {/* Omitted when the component has no Figma set of its own — `input-group`
          is the first. A link to the nearest other component would be worse
          than none: it lands a designer on something that is not this. */}
      {docs.figma.componentSetKey && (
        <a
          className="docs-meta-link"
          href={`https://www.figma.com/design/${FIGMA_FILE}/?node-id=${docs.figma.componentSetKey.replace(":", "-")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Figma <ExternalLink size={14} />
        </a>
      )}
    </Stack>

    {/* Generated JSDoc, so it carries backticks — Button's own description ends
        "...via `asChild`." `lg` matches the lede's own 20px type. */}
    <p className="docs-component-lede">{renderDoc(docs.description, "lg")}</p>

    {/* Registry-only: no `@primitiv-ui/react` primitive, so no Headless mode.
        Stated at the top because it changes what the rest of the page shows —
        the code blocks carry only a Styled tab and the props table drops its
        "From" column. */}
    {docs.kind === "registry-only" && (
      <p className="docs-registry-only-note">
        <span className="docs-registry-only-note__tag">Registry-only</span>
        No headless primitive — this component ships only as a copied styled
        file, so there is no Headless mode.{" "}
        <InlineCode size="sm">primitiv add {docs.id}</InlineCode> installs it
        whichever mode you are reading.
      </p>
    )}
  </Stack>
);
