/*
 * The site's navigation model — the §1.4 top-level structure from
 * docs/docs-site-planning.md.
 *
 * Deliberately plain data, not components. Both presentations (the desktop
 * sidebar and the mobile drawer) read from this one source, which is the
 * duplication RFC 0019 §4a was worried about: the nav *data* stays
 * single-sourced even though the two presentations render different wrappers.
 */

import { getContentPage } from "@/lib/content-pages";
import { CATEGORY_ORDER, ROSTER } from "@/lib/docs-data";
import { humanName } from "@/lib/human-name";

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
  title: humanName(entry.displayName),
  href: `/components/${entry.id}/`,
}));

/** The same pages, grouped by category in CATEGORY_ORDER; empty ones dropped. */
export const COMPONENT_GROUPS: readonly NavGroup[] = CATEGORY_ORDER.map(
  (category) => ({
    title: category,
    links: ROSTER.filter((e) => e.documented && e.category === category).map(
      (e) => ({ title: humanName(e.displayName), href: `/components/${e.id}/` }),
    ),
  }),
).filter((group) => group.links.length > 0);

/**
 * Links derived from the content pages themselves, so the nav lists the
 * sections a page actually has.
 *
 * Every entry here used to be a dead `/#anchor` — the pages did not exist, and
 * the anchors pointed at nothing on the home page either (§4.6 of
 * docs-site-content-plan.md). Now that the eight routes are real, a section's
 * children are its page plus its own headings, taken from the generated data
 * rather than restated: a heading renamed in the page data renames its nav entry.
 */
const pageLinks = (key: string): readonly NavLink[] => {
  const page = getContentPage(key);
  return [
    { title: "Overview", href: page.route },
    ...page.sections.map((s) => ({ title: s.title, href: `${page.route}#${s.id}` })),
  ];
};

/*
 * Guides and Changelog are deliberately absent, and so is Harmoni.
 *
 * Guides and Changelog are deferred (docs-site-content-plan.md D3) and Harmoni
 * gets its own site (§3.9), so all three would be dead entries. A missing entry
 * is honest; a dead one is not.
 */
export const NAV: readonly NavSection[] = [
  {
    title: "Start Here",
    href: "/start-here/",
    children: pageLinks("start-here"),
  },
  {
    title: "Concepts",
    children: [
      { title: "What Primitiv is", href: "/concepts/what-primitiv-is/" },
      { title: "Tokens & theming", href: "/concepts/tokens/" },
      { title: "Density & Context", href: "/concepts/density/" },
      { title: "Composition patterns", href: "/concepts/composition/" },
      { title: "Accessibility", href: "/concepts/accessibility/" },
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
    href: "/registry-cli/",
    children: pageLinks("registry-cli"),
  },
  {
    title: "Design in Figma",
    href: "/figma/",
    children: pageLinks("figma"),
  },
];

/** The three consumption modes (§1.1). Scoped to the Components section. */
export const MODES = [
  { value: "styled", label: "Styled" },
  { value: "headless", label: "Headless" },
  { value: "figma", label: "Figma" },
] as const;

export type Mode = (typeof MODES)[number]["value"];
