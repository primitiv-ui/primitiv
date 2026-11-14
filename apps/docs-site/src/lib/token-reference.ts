import reference from "@/content/token-reference.generated.json";

/** One token: its custom property, its DTCG `$type`, and its value in each mode. */
export type TokenEntry = {
  readonly name: string;
  readonly type: string | null;
  /** One per entry in the section's `modes`, as the token layer emits it. */
  readonly values: readonly string[];
};

export type TokenGroup = { readonly title: string; readonly tokens: readonly TokenEntry[] };

export type TokenSection = {
  readonly id: string;
  readonly title: string;
  readonly intro: string;
  /** The column headings: `Value`, the two themes, or the four densities. */
  readonly modes: readonly string[];
  readonly groups: readonly TokenGroup[];
};

/** Every token, by category (scripts/gen-token-reference.mjs). */
export const TOKEN_SECTIONS = reference.sections as readonly TokenSection[];

export const tokenGroupId = (section: TokenSection, group: TokenGroup): string =>
  `${section.id}-${group.title}`;

const code = (text: string): string => `\`${text}\``;

/** The token reference as Markdown, for agents: one table per group. */
export const tokenReferenceMarkdown = (siteUrl: string): string =>
  [
    "# Token reference",
    "Every design token, by category, with the value it takes in each theme or density. Each is a CSS custom property your own styles can read.",
    `Link \`tokens.css\`, then read any token with \`var()\`, as in \`padding: var(--primitiv-space-16)\`. A value shown as another \`var(--primitiv-…)\` is an alias: it follows that token. Colour roles change with \`data-theme\`, and type, layout and component tokens with \`data-density\`, set on any container. How the tiers fit together: ${siteUrl}/concepts/tokens/index.html.md`,
    ...TOKEN_SECTIONS.flatMap((section) => [
      `## ${section.title}`,
      section.intro,
      ...section.groups.map((group) =>
        [
          `### ${group.title}`,
          `| Token | ${section.modes.join(" | ")} |`,
          `| --- | ${section.modes.map(() => "---").join(" | ")} |`,
          ...group.tokens.map((t) => `| ${code(t.name)} | ${t.values.map(code).join(" | ")} |`),
        ].join("\n"),
      ),
    ]),
  ]
    .join("\n\n")
    .concat("\n");
