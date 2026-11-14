import data from "@/content/utilities.generated.json";

/** One utility class and the declarations it sets (scripts/gen-utilities.mjs). */
export type UtilityClass = {
  readonly name: string;
  readonly declarations: readonly string[];
  /** Whether `sm:`, `md:` and `lg:` variants exist. */
  readonly responsive: boolean;
};

export type UtilitySection = {
  readonly id: string;
  readonly title: string;
  readonly classes: readonly UtilityClass[];
};

export type UtilityBreakpoint = { readonly name: string; readonly min: string };

export const UTILITY_SECTIONS = data.sections as readonly UtilitySection[];
export const UTILITY_BREAKPOINTS = data.breakpoints as readonly UtilityBreakpoint[];

export const UTILITY_COUNT = UTILITY_SECTIONS.reduce((n, s) => n + s.classes.length, 0);
export const RESPONSIVE_COUNT = UTILITY_SECTIONS.reduce(
  (n, s) => n + s.classes.filter((c) => c.responsive).length,
  0,
);

/** What a page with the classes needs, in the order it needs it. */
export const UTILITIES_SETUP = [
  "$ npx primitiv-ui@latest init --styles --utilities",
  "",
  "# or, in a project that already has its token layer:",
  "$ npx primitiv-ui@latest utilities",
].join("\n");

export const UTILITIES_LINKS = [
  `<link rel="stylesheet" href="/primitiv/tokens.css">`,
  `<link rel="stylesheet" href="/primitiv/utilities.css">`,
].join("\n");

export const UTILITIES_EXAMPLE = [
  `<div class="flex flex-col md:flex-row items-center justify-between gap-16 p-24 bg-subtle rounded-8">`,
  `  <h2 class="heading-4 m-0">Workshops</h2>`,
  `  <p class="body-sm text-muted m-0">Four sessions, one afternoon.</p>`,
  `</div>`,
].join("\n");

const code = (text: string): string => `\`${text}\``;

/** The Utilities page as Markdown, for agents: every class and what it sets. */
export const utilitiesMarkdown = (): string =>
  [
    "# Utility classes",
    `${UTILITY_COUNT} small classes over Primitiv's design tokens, for your own layout and the odd adjustment, in plain CSS, SCSS or a page of Primitiv Elements. Every value is a token, so the classes follow \`data-theme\` and \`data-density\` as the components do. They sit in a last cascade layer, \`primitiv.utilities\`, so they beat a component's own styles without \`!important\`, and your own CSS still beats them. Tailwind projects don't need them: \`--format tailwind\` already gives Tailwind Primitiv's tokens.`,
    "## Install",
    ["```sh", UTILITIES_SETUP, "```"].join("\n"),
    "Then link the file after the token layer:",
    ["```html", UTILITIES_LINKS, "```"].join("\n"),
    ["```html", UTILITIES_EXAMPLE, "```"].join("\n"),
    "## Responsive variants",
    `The ${RESPONSIVE_COUNT} layout classes marked "responsive" below also come as ${UTILITY_BREAKPOINTS.map((b) => code(`${b.name}:`)).join(", ")} variants, applying from that width up: ${UTILITY_BREAKPOINTS.map((b) => `${code(b.name)} from ${b.min}`).join(", ")}. Write them as in \`md:flex-row\`.`,
    ...UTILITY_SECTIONS.flatMap((section) => [
      `## ${section.title}`,
      [
        "| Class | CSS | Responsive |",
        "| --- | --- | --- |",
        ...section.classes.map(
          (c) => `| ${code(`.${c.name}`)} | ${c.declarations.map((d) => code(`${d};`)).join(" ")} | ${c.responsive ? "yes" : ""} |`,
        ),
      ].join("\n"),
    ]),
  ]
    .join("\n\n")
    .concat("\n");
