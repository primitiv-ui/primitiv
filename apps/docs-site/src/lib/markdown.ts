import type { ComponentDocs, DocsDataAttribute, DocsSubComponent } from "./docs-data";
import { humanName } from "./human-name";
import { SITE_URL } from "./site";

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
