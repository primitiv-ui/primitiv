import { CONTENT_PAGES, type ContentBlock, type ContentPage } from "./content-pages";
import {
  ALL_DOCS,
  CATEGORY_ORDER,
  type ComponentDocs,
  type DocsDataAttribute,
  type DocsSubComponent,
} from "./docs-data";
import { humanName } from "./human-name";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

/*
 * The Markdown mirror of the site — what an agent loads instead of the HTML.
 *
 * Built from the same generated data the pages render from (docs-data and the
 * content-page JSON), never from scraped HTML, so the two cannot disagree about
 * a prop, a default or an install command. Doc strings are already Markdown
 * apart from JSDoc's `{@link}` tags, which become code spans the way
 * `renderDoc` renders them on the page.
 */

/** The served address of a page's Markdown, per the llms.txt convention. */
export const markdownPath = (path: string): string => `${path}index.html.md`;

/*
 * `{@link Target}` → `Target`, and the `{@link Target`Label`}` form some
 * comments use → `Label`, which is the name the reader actually knows.
 */
const resolveLinks = (text: string): string =>
  text.replace(/\{@link\s+([^}]+)\}/g, (_, body: string) => {
    const label = body.match(/`([^`]+)`/)?.[1];
    return `\`${label ?? body.trim().split(/[\s|]/)[0]}\``;
  });

/** One table cell: one line, and no bare `|` to split the row. */
const cell = (text: string): string =>
  resolveLinks(text).replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|").trim();

/*
 * A code span. A value that itself holds a backtick (a template-literal default
 * such as `(n) => \`${n} more\``) takes CommonMark's double-backtick delimiters,
 * padded so a leading or trailing backtick in the value is not read as one.
 */
const code = (text: string): string => {
  const escaped = text.replace(/\|/g, "\\|");
  return escaped.includes("`") ? `\`\` ${escaped} \`\`` : `\`${escaped}\``;
};

const table = (head: readonly string[], rows: readonly (readonly string[])[]): string =>
  [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

const dataAttributeTable = (attributes: readonly DocsDataAttribute[]): string =>
  table(
    ["Attribute", "Value", "When"],
    // An empty value is a presence attribute (`data-disabled`), set bare.
    attributes.map((a) => [code(a.name), a.value === "" ? "(present)" : code(a.value), cell(a.when)]),
  );

const part = (sub: DocsSubComponent): string => {
  const notes = [
    sub.extends ? `Extends ${code(sub.extends)}.` : "",
    sub.styledOnly ? "Exported by the styled registry component only." : "",
    sub.headlessOnly ? "Exported by the headless package only." : "",
    sub.class ? `Registry class: ${code(sub.class)}.` : "",
  ].filter(Boolean);

  const props = sub.props.map((p) => [
    code(p.name),
    code(p.type),
    p.default === null ? "—" : code(p.default),
    cell(`${p.required ? "**Required.** " : ""}${p.description}`),
  ]);
  const styling = (sub.contractProps ?? []).map((p) => [
    code(p.name),
    code(p.type),
    p.default === null ? "—" : code(p.default),
    cell(p.description),
  ]);

  return [
    `### ${sub.name}`,
    notes.join(" "),
    props.length ? table(["Prop", "Type", "Default", "Description"], props) : "",
    styling.length
      ? `Styling props (styled registry component):\n\n${table(["Prop", "Type", "Default", "Description"], styling)}`
      : "",
    sub.dataAttributes.length ? `Data attributes:\n\n${dataAttributeTable(sub.dataAttributes)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};

/** A component page's Markdown: description, installation, then the API. */
export const componentMarkdown = (docs: ComponentDocs): string => {
  const name = humanName(docs.displayName);
  const installation =
    docs.kind === "registry-only"
      ? `${name} has no headless primitive: it ships only as a styled registry component, copied into your project.`
      : `Headless (behaviour and accessibility, no styles):\n\n\`\`\`sh\nnpm i ${docs.headless.package}\n\`\`\``;

  return [
    `# ${name}`,
    resolveLinks(docs.description),
    `Documentation: ${SITE_URL}/components/${docs.id}/`,
    "## Installation",
    // The CLI is the `primitiv-ui` package; a bare `npx primitiv` would fetch an
    // unrelated package called `primitiv`.
    `Styled (copies the component's source and stylesheet into your project):\n\n\`\`\`sh\nnpm i -D primitiv-ui\nnpx ${docs.styled.installCommand}\n\`\`\``,
    installation,
    "## API",
    ...docs.headless.subComponents.map(part),
    ...(docs.styled.customProperties.length
      ? [
          "## CSS custom properties",
          `Set these on ${code(`.${docs.styled.rootClass}`)} (or an ancestor) to restyle the component.`,
          table(
            ["Property", "Default"],
            docs.styled.customProperties.map((p) => [code(p.name), code(p.defaultsTo)]),
          ),
        ]
      : []),
  ].join("\n\n").concat("\n");
};

/*
 * Content-page prose carries its inline code as a separate list of fragments
 * (Figma has no inline markup), so they are wrapped here the way `ContentPage`'s
 * `renderText` chips them — longest first, so `primitiv add button` is not cut
 * in half by `button`.
 */
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const withCode = (text: string, fragments: readonly string[]): string =>
  fragments.length === 0
    ? text
    : text.replace(
        new RegExp(
          [...fragments].sort((a, b) => b.length - a.length).map(escapeRegExp).join("|"),
          "g",
        ),
        (fragment) => code(fragment),
      );

const absolute = (href: string): string => (href.startsWith("/") ? `${SITE_URL}${href}` : href);

const block = (b: ContentBlock): string => {
  switch (b.kind) {
    case "h2":
      return `## ${b.text}`;
    case "h3":
      return `### ${b.text}`;
    case "h4":
      return `#### ${b.text}`;
    case "p":
      return withCode(b.text, b.code);
    // The builder's heading-plus-body pair; the page renders it as an h4 and a p.
    case "block":
      return `#### ${b.heading}\n\n${withCode(b.text, b.code)}`;
    case "code":
      return `\`\`\`${b.language === "text" ? "" : b.language}\n${b.code}\n\`\`\``;
    case "alert":
      return `> ${b.text}`;
    case "defs":
      return b.defs.map((d) => `- **${d.term}**: ${d.description}`).join("\n");
    case "flags":
      return `Useful flags:\n\n${b.flags.map((f) => `- ${code(f.flag)}: ${f.description}`).join("\n")}`;
    case "links":
      return b.links.map((l) => `- [${l.label}](${absolute(l.href)})`).join("\n");
    case "doors":
      return b.doors.map((d) => `- [${d.label}](${absolute(d.href)}): ${d.description}`).join("\n");
    case "group":
      return b.blocks.map(block).filter(Boolean).join("\n\n");
    // An illustration slot. The picture carries no text an agent could use.
    case "gap":
      return "";
  }
};

/** A content page's Markdown: the same blocks the page renders, in order. */
export const contentMarkdown = (page: ContentPage): string =>
  [
    `# ${page.title}`,
    page.lede,
    `Documentation: ${SITE_URL}${page.route}`,
    ...page.head.map(block),
    ...page.sections.flatMap((section) => [`## ${section.title}`, ...section.blocks.map(block)]),
  ]
    .filter(Boolean)
    .join("\n\n")
    .concat("\n");

const indexEntry = (title: string, path: string, description: string): string =>
  `- [${title}](${SITE_URL}${markdownPath(path)}): ${resolveLinks(description)}`;

const firstSentence = (text: string): string => text.split(/(?<=\.)\s/)[0];

/**
 * `/llms.txt` — the index an agent reads first (llmstxt.org): what Primitiv is,
 * how to install it, then a link to the Markdown of every page. Built from the
 * same lists as the sitemap, so a new page is indexed without editing this.
 */
export const llmsIndex = (): string =>
  [
    `# ${SITE_NAME}`,
    `> ${SITE_DESCRIPTION}`,
    "Primitiv ships in two layers over one set of design tokens. The headless " +
      "components (`npm i @primitiv-ui/react`) provide behaviour and accessibility " +
      "with no styles. The styled registry components are copied into your project " +
      "as source files you own, by the `primitiv` CLI: `npm i -D primitiv-ui`, then " +
      "`npx primitiv add <component>`. Every link below is the Markdown version of a " +
      "docs page.",
    // Content ledes are one or two sentences and read as a unit; component
    // descriptions run long, so those are cut to their first sentence.
    "## Docs",
    CONTENT_PAGES.map((page) => indexEntry(page.title, page.route, page.lede)).join("\n"),
    ...CATEGORY_ORDER.flatMap((category) => {
      const docs = ALL_DOCS.filter((d) => d.category === category);
      return docs.length === 0
        ? []
        : [
            `## Components: ${category}`,
            docs
              .map((d) =>
                indexEntry(humanName(d.displayName), `/components/${d.id}/`, firstSentence(d.description)),
              )
              .join("\n"),
          ];
    }),
  ]
    .join("\n\n")
    .concat("\n");

/** A Markdown route's response, typed so a browser shows it as text. */
export const markdownResponse = (body: string): Response =>
  new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
