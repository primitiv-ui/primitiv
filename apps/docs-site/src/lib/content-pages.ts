/*
 * The eight prose pages — Start Here, the five Concepts pages, Registry & CLI,
 * and Design in Figma.
 *
 * The copy is NEVER hand-authored here, the same constraint the props tables
 * carry (docs-site-planning.md §1.5) and for the same reason. `scripts/figma/
 * docs-content-pages.js` holds every page as a `PAGES` object of block tuples,
 * `scripts/figma/verify-docs-content-pages.mjs` proves that object matches the
 * sixteen settled Figma frames, and `scripts/gen-content-pages.mjs` turns it
 * into `src/content/pages.generated.json`. Editing a page means editing the
 * builder's entry and regenerating — a paragraph typed into this app would be a
 * third copy, free to drift from both the canvas and the markdown it came from.
 *
 * Regenerate with:
 *   pnpm gen:content
 *
 * `pnpm check:content` fails if the committed JSON is stale, so the two cannot
 * quietly disagree.
 */

import pages from "@/content/pages.generated.json";

import type { TocEntry } from "@/site/PageToc";

/** A run of source to highlight. `language` is a Prism id, or `text` for none. */
export type CodeBlockData = {
  readonly kind: "code";
  readonly code: string;
  readonly language: string;
  /** Figma's `Show Header` — here it is what carries the copy control. */
  readonly header: boolean;
  readonly lineNumbers: boolean;
};

/**
 * One block of a page.
 *
 * Mirrors the builder's tuple forms one-for-one, with the two that needed
 * resolving already resolved by the generator: link labels carry real hrefs,
 * and a `gap` keeps only its illustration id and the brief that describes it.
 */
export type ContentBlock =
  | { readonly kind: "h2" | "h3" | "h4"; readonly text: string }
  | { readonly kind: "p"; readonly text: string; readonly code: readonly string[] }
  | {
      readonly kind: "block";
      readonly heading: string;
      readonly text: string;
      readonly code: readonly string[];
    }
  | CodeBlockData
  | { readonly kind: "alert"; readonly tone: string; readonly text: string }
  | {
      readonly kind: "defs";
      readonly defs: readonly { readonly term: string; readonly description: string }[];
    }
  | {
      readonly kind: "flags";
      readonly flags: readonly { readonly flag: string; readonly description: string }[];
    }
  | {
      readonly kind: "links";
      readonly links: readonly { readonly label: string; readonly href: string }[];
    }
  | {
      readonly kind: "doors";
      readonly doors: readonly {
        readonly label: string;
        readonly href: string;
        readonly description: string;
      }[];
    }
  | { readonly kind: "group"; readonly gap: string; readonly blocks: readonly ContentBlock[] }
  | { readonly kind: "gap"; readonly id: string; readonly job: string };

export type ContentSection = {
  /** Slugified heading — the anchor, the `aria-labelledby`, and the TOC id. */
  readonly id: string;
  readonly title: string;
  /** The section's blocks, with its opening `h2` already hoisted out. */
  readonly blocks: readonly ContentBlock[];
};

export type ContentPage = {
  readonly key: string;
  readonly route: string;
  /** The sidebar/nav name, which is shorter than the title on some pages. */
  readonly name: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly head: readonly ContentBlock[];
  readonly sections: readonly ContentSection[];
  /**
   * Desktop-only two-column rows: an illustration beside the `count` blocks
   * immediately above it. Three briefs ask for half the content width
   * (DENSITY-C02, COMPOSE-01, FIGMA-P02); below 64rem they stack, which is
   * what those briefs' own `below-48rem` notes ask for.
   */
  readonly pairs: readonly { readonly id: string; readonly count: number }[];
};

export const CONTENT_PAGES = pages as readonly ContentPage[];

export type ContentPageKey = (typeof CONTENT_PAGES)[number]["key"];

export const getContentPage = (key: string): ContentPage => {
  const page = CONTENT_PAGES.find((p) => p.key === key);
  if (!page) throw new Error(`No content page ${JSON.stringify(key)}`);
  return page;
};

/**
 * The page's table of contents.
 *
 * Flat by construction: a section's heading IS its TOC entry (the generator
 * asserts the two agree on all eight pages), and no page nests below h2 in a
 * way a reader would navigate to. So this is derived rather than authored — the
 * TOC cannot list a section that is not there, or miss one that is.
 */
export const tocFor = (page: ContentPage): readonly TocEntry[] =>
  page.sections.map((s) => ({ id: s.id, title: s.title }));
