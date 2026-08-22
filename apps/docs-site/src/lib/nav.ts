/*
 * The site's navigation model — the §1.4 top-level structure from
 * docs/docs-site-planning.md.
 *
 * Deliberately plain data, not components. Both presentations (the desktop
 * sidebar and the mobile drawer) read from this one source, which is the
 * duplication RFC 0019 §4a was worried about: the nav *data* stays
 * single-sourced even though the two presentations render different wrappers.
 */

export type NavLink = {
  readonly title: string;
  readonly href: string;
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
};

/** Components with a docs page built so far. */
export const COMPONENT_PAGES: readonly NavLink[] = [
  { title: "Button", href: "/components/button" },
  { title: "Select", href: "/components/select" },
  { title: "Tabs", href: "/components/tabs" },
];

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
