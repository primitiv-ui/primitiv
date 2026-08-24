/*
 * The site's navigation model — the §1.4 top-level structure from
 * docs/docs-site-planning.md.
 *
 * Deliberately plain data, not components. Both presentations (the desktop
 * sidebar and the mobile drawer) read from this one source, which is the
 * duplication RFC 0019 §4a was worried about: the nav *data* stays
 * single-sourced even though the two presentations render different wrappers.
 */

import { CATEGORY_ORDER, ROSTER } from "@/lib/docs-data";

export type NavLink = {
  readonly title: string;
  readonly href: string;
};

/** A named run of links inside a section — the Components category groups. */
export type NavGroup = {
  readonly title: string;
  readonly links: readonly NavLink[];
};

export type NavSection = {
  readonly title: string;
  /**
   * Present when the section is a page in its own right as well as a group.
   * `Components` has one because it owns the consumption-mode switch — see
   * docs-site-planning.md §1.4 (`[MODE-SCOPED — the switch lives here]`).
   * A section with an href renders a link plus an independent disclosure
   * control; a section without one is a pure disclosure group.
   */
  readonly href?: string;
  readonly children: readonly NavLink[];
  /**
   * Sub-groups, when a flat list would be too long to scan. Only Components has
   * them: five pages today, sixty-three eventually, and an alphabetical run of
   * that length tells a reader nothing about what sits near what. The groups are
   * the same categories the /components index uses, so the two agree.
   *
   * `children` stays populated alongside — it is the flat list, which the mobile
   * drawer and anything else non-visual can keep using.
   */
  readonly groups?: readonly NavGroup[];
};

/**
 * Components with a docs page, derived from the generated roster.
 *
 * Was a hand-kept list, which meant a fourth registration step per page and a
 * list that could silently disagree with the pages that actually exist. The
 * roster already knows which components are documented and which category each
 * belongs to, so both the flat list and the groups below come from it.
 */
export const COMPONENT_PAGES: readonly NavLink[] = ROSTER.filter(
  (entry) => entry.documented,
).map((entry) => ({
  title: entry.displayName,
  href: `/components/${entry.id}/`,
}));

/** The same pages, grouped by category in CATEGORY_ORDER; empty ones dropped. */
export const COMPONENT_GROUPS: readonly NavGroup[] = CATEGORY_ORDER.map(
  (category) => ({
    title: category,
    links: ROSTER.filter((e) => e.documented && e.category === category).map(
      (e) => ({ title: e.displayName, href: `/components/${e.id}/` }),
    ),
  }),
).filter((group) => group.links.length > 0);

export const NAV: readonly NavSection[] = [
  {
    title: "Start Here",
    children: [
      { title: "Introduction", href: "/" },
      { title: "Installation", href: "/#installation" },
    ],
  },
  {
    title: "Concepts",
    children: [
      { title: "What Primitiv is", href: "/#what-primitiv-is" },
      { title: "Tokens & theming", href: "/#tokens" },
      { title: "Density & Context", href: "/#density" },
      { title: "Composition patterns", href: "/#composition" },
      { title: "Accessibility", href: "/#accessibility" },
    ],
  },
  {
    title: "Components",
    href: "/components",
    children: COMPONENT_PAGES,
    groups: COMPONENT_GROUPS,
  },
  {
    title: "Registry & CLI",
    children: [
      { title: "primitiv add", href: "/#cli-add" },
      { title: "Tokens & theme", href: "/#cli-tokens" },
    ],
  },
  {
    title: "Design in Figma",
    children: [{ title: "Harmoni", href: "/#harmoni" }],
  },
];

/** The three consumption modes (§1.1). Scoped to the Components section. */
export const MODES = [
  { value: "styled", label: "Styled" },
  { value: "headless", label: "Headless" },
  { value: "figma", label: "Figma" },
] as const;

export type Mode = (typeof MODES)[number]["value"];
