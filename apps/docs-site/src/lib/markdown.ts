import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CONTENT_PAGES, type ContentBlock, type ContentPage } from "./content-pages";
import {
  ALL_DOCS,
  CATEGORY_ORDER,
  type ComponentDocs,
  type DocsDataAttribute,
  type DocsSubComponent,
} from "./docs-data";
import { humanName } from "./human-name";
import { withoutClasses } from "./playground";
import { WEB_RELEASE } from "./web-release";
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

/*
 * Glyphs, named rather than drawn. Path data is noise to a reader and most of
 * the bulk of the Elements markup, so each inline `<svg>` becomes a comment
 * naming the `@primitiv-ui/icons` glyph it draws — the same placeholder the
 * page's code tabs use. A glyph is recognised by the opening of each of its
 * paths, which tells apart the icons that share an outline (info, success and
 * error are one circle). `primitiv add` still prints the real SVG.
 */
const ICONS_DIR = join(process.cwd(), "../../packages/icons/icons/svg");

const pathKey = (svg: string): string =>
  [...svg.matchAll(/\sd="([^"]{0,16})/g)].map((m) => m[1]).join("|");

const ICONS: ReadonlyMap<string, string> = new Map(
  readdirSync(ICONS_DIR)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => [pathKey(readFileSync(join(ICONS_DIR, file), "utf8")), file.slice(0, -4)]),
);

const namedGlyphs = (markup: string): string =>
  markup.replace(
    /<svg[\s>][\s\S]*?<\/svg>/g,
    (svg) => `<svg aria-hidden="true"><!-- icon: ${ICONS.get(pathKey(svg)) ?? "glyph"} --></svg>`,
  );

const GLYPH_NOTE =
  "Each `<!-- icon: name -->` stands for that `@primitiv-ui/icons` glyph's inline `<svg>`, which `primitiv add` prints in full.";

/** The address the CDN serves an Elements module at, pinned to one version. */
const cdnScript = (pkg: string, version: string | null, module: string): string =>
  `<script type="module" src="https://cdn.jsdelivr.net/npm/${pkg}@${version ?? "latest"}/dist/cdn/${module}.js"></script>`;

const fenced = (language: string, body: string): string => `\`\`\`${language}\n${body.trimEnd()}\n\`\`\``;

/**
 * A component's Elements surface (RFC 0033) as Markdown: how to install and
 * load it, the markup — headless, then styled — and every element with what it
 * does and its attributes and events. Everything here comes from the registry
 * block and the elements' own JSDoc, the sources the page's Elements mode reads.
 */
export const elementsMarkdown = (docs: ComponentDocs): string => {
  const elements = docs.elements;
  if (!elements) return "";
  const name = humanName(docs.displayName);
  const { package: pkg, module, example, api } = elements;
  const borrowed = module !== docs.id;

  const intro = pkg
    ? (borrowed
        ? `${name} has no element of its own: it is the \`${module}\` elements in the markup below, so it loads the \`${module}\` module and its attributes and events are \`${module}\`'s. `
        : "") +
      `${name} ${borrowed ? "therefore works" : "is also a set of standard custom elements"} from \`${pkg}\`: no framework and no build step, ` +
      "so it works in any page a server renders. The element adds the behaviour and the accessibility; " +
      "the state lives in reflected attributes, so server-rendered markup is adopted as it is, and changes " +
      "are announced as bubbling DOM events."
    : `${name} has no behaviour, so it has no custom element: in a page without React it is ordinary HTML. Headless, with your own CSS, there is nothing of Primitiv to install or load. Its value there is the styled form, the registry classes on that HTML.`;

  const install = [
    "### Install",
    `The CLI ${pkg ? "prints the script tag and the markup to paste, and copies" : "copies"} the stylesheet when you want Primitiv's styling${pkg ? "" : ", and prints the classed markup"}. It needs Node only to run, not in your project: a project with no \`package.json\` works.`,
    ...(pkg
      ? ["Headless (the elements alone, with your own CSS): no setup is needed.", fenced("sh", `npx primitiv-ui@latest add ${docs.id}`)]
      : []),
    "Styled: run `init --styles` once per project. It writes `primitiv.json` and the token layer, and asks where your server serves static files from (a Maven or Gradle project is detected). Every `add` after it copies the stylesheet and prints the classed markup. `add --styled` styles a single run instead.",
    fenced("sh", ["npx primitiv-ui@latest init --styles", `npx primitiv-ui@latest add ${docs.id}`].join("\n")),
  ];

  const load = pkg
    ? [
        "### Load",
        "The module defines the elements when it loads, and only this component's. With no build step, add the script to the page:",
        fenced("html", cdnScript(pkg, WEB_RELEASE, module)),
        `With a bundler, \`npm i ${pkg}\` and import it once:`,
        fenced("js", `import "${pkg}/define/${module}";`),
      ]
    : [];

  const markup = example
    ? pkg
      ? [
          "### Markup",
          "Headless — the elements alone, no classes:",
          fenced("html", namedGlyphs(withoutClasses(example))),
          "Styled — the same markup with the registry classes, as `primitiv add` prints it:",
          fenced("html", namedGlyphs(example)),
          GLYPH_NOTE,
        ]
      : ["### Markup", fenced("html", namedGlyphs(example)), ...(example.includes("<svg") ? [GLYPH_NOTE] : [])]
    : [];

  const parts = api.flatMap((element) => [
    `### \`<${element.tag}>\``,
    resolveLinks(element.description),
    element.attributes.length
      ? `Attributes:\n\n${table(
          ["Attribute", "Type", "Description"],
          element.attributes.map((a) => [code(a.name), code(a.type), cell(a.description)]),
        )}`
      : "",
    element.events.length
      ? `Events:\n\n${table(
          ["Event", "Type", "Description"],
          element.events.map((e) => [code(e.name), code(e.type), cell(e.description)]),
        )}`
      : "",
  ]);

  // What a headless stylesheet keys off: the state attributes the component
  // writes, from its contract — the same ones Primitiv's own stylesheet uses.
  const hooks = docs.styled.dataAttributes.length
    ? [
        "### Styling hooks",
        "The attributes the elements write as their state changes, which your own CSS can select on. Primitiv's stylesheet uses the same ones.",
        dataAttributeTable(docs.styled.dataAttributes),
      ]
    : [];

  return ["## Elements", intro, ...install, ...load, ...markup, ...parts, ...hooks].filter(Boolean).join("\n\n");
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
    ...(docs.elements
      ? [
          "Two surfaces: React (Installation and API below) and standard custom elements for any server-rendered page (the Elements section at the end).",
        ]
      : []),
    "## Installation",
    // The CLI is the `primitiv-ui` package; a bare `npx primitiv` would fetch an
    // unrelated package called `primitiv`. `@latest` runs it with nothing installed.
    `Styled (copies the component's source and stylesheet into your project):\n\n\`\`\`sh\nnpx primitiv-ui@latest ${docs.styled.installCommand.replace(/^primitiv /, "")}\n\`\`\``,
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
    ...(docs.elements ? [elementsMarkdown(docs)] : []),
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
    "Primitiv's components come two ways over one set of design tokens: as React " +
      "components (`npm i @primitiv-ui/react`), and as standard custom elements " +
      "(`@primitiv-ui/web`) for pages a server renders, loaded by a script tag. Both are " +
      "headless — behaviour and accessibility, no styles — and the styled versions are " +
      "copied into your project as files you own by the CLI.",
    "The CLI is the npm package `primitiv-ui`, and the command it installs is " +
      "`primitiv`. `npx primitiv-ui@latest <command>` runs it with nothing installed, " +
      "which is the form every page here uses.",
    "Building with the custom elements, with no React? Everything about them is in one " +
      `file: ${SITE_URL}/llms-elements.txt. Each component page's Markdown also ends with ` +
      "its Elements section. Every link below is the Markdown version of a docs page.",
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
    "## Optional",
    `- [Everything above in one file](${SITE_URL}/llms-full.txt): every page's Markdown, concatenated, for loading the whole site at once.`,
    `- [The custom elements in one file](${SITE_URL}/llms-elements.txt): only the Elements — how to install and load them, then every component's markup, elements, attributes and events — for a project with no React.`,
  ]
    .join("\n\n")
    .concat("\n");

/**
 * `/llms-full.txt` — every page's Markdown in one file, in `llms.txt` order, for
 * an agent that would rather load the whole site once than follow links. Each
 * page is its mirror verbatim, so the two cannot disagree.
 */
export const llmsFull = (): string =>
  [
    ...CONTENT_PAGES.map(contentMarkdown),
    ...CATEGORY_ORDER.flatMap((category) =>
      ALL_DOCS.filter((d) => d.category === category).map(componentMarkdown),
    ),
  ].join("\n---\n\n");

/** A Markdown route's response, typed so a browser shows it as text. */
export const markdownResponse = (body: string): Response =>
  new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });

/**
 * `/llms-elements.txt` — the custom elements alone, for an agent building a page
 * a server renders, with no React: how they work, then every component that has
 * them — its description, its Elements section verbatim from the mirror, and
 * the custom properties that restyle it. Nothing React-specific, so the file is
 * small enough to load whole.
 */
export const llmsElements = (): string =>
  [
    [
      `# ${SITE_NAME} — custom elements`,
      "> Primitiv's components as standard custom elements: behaviour and accessibility from a script tag, styling from plain CSS classes, in any page a server renders.",
      [
        "How they work, for every component below:",
        "",
        "- **Install with the CLI**, which needs Node only to run (the npm package is `primitiv-ui`; the command it installs is `primitiv`). Headless, with your own CSS: `npx primitiv-ui@latest add <component>` prints the `<script>` tag and the markup, and needs no setup. Styled: `npx primitiv-ui@latest init --styles` once per project (it writes `primitiv.json` and the token layer, and asks where static files are served from — a Maven or Gradle project is detected); every `add` after it also copies the stylesheet and prints the `<link>` lines and the classed markup. `add --styled` styles a single run. `add --no-styles` and `add --styles-only` are for React projects.",
        "- **Place every panel yourself when headless.** A panel that opens from a trigger (Select, Combobox, Dropdown, Popover, Tooltip) is shown in the top layer with the trigger as its implicit CSS anchor; Primitiv's stylesheets place it, and headless nothing does. `position: fixed; inset: auto; margin: 0; position-anchor: auto; top: anchor(bottom); left: anchor(left); min-width: anchor-size(width);` on the panel element while `:popover-open` puts it under its trigger with no `anchor-name` to write. A Context Menu has no anchor: place it from `--primitiv-context-menu-x` / `-y`, which it sets as it opens.",
        "- **Pin one version.** Load every component from the same `@primitiv-ui/web` version, the one `add` prints: they share code, and one version downloads it once.",
        "- **Load** a component with its one `<script type=\"module\">` from the CDN (each component's section names it), or `import \"@primitiv-ui/web/define/<component>\"` with a bundler. Components marked \"no script\" are markup and classes only.",
        "- **Write the markup the server renders.** An element adopts server-rendered markup as it is and writes only the ARIA it owns. Parts that arrive later, leave, or move (a fragment swapped in) are picked up with no script call.",
        "- **State lives in reflected attributes** (`value`, `open` …), so a server re-render or a history snapshot sees the user's choice. Set an attribute or property to change it from code.",
        "- **Changes are announced as bubbling events** named `primitiv-<component>-<what>`, with the new state in `event.detail`. A user-driven change fires before it applies and is cancelable: `preventDefault()` vetoes it.",
        "- **Interactive parts decorate the element you write** — a `<button>`, `<a href>` or `<input>` inside the part — so links and native form controls keep working. A component with a `name` submits its value with its form.",
      ].join("\n"),
      `The same, at length, for people: ${SITE_URL}/elements/ (Markdown: ${SITE_URL}${markdownPath("/elements/")}). Every page's documentation, React included: ${SITE_URL}/llms.txt`,
    ].join("\n\n"),
    ...CATEGORY_ORDER.flatMap((category) =>
      ALL_DOCS.filter((d) => d.category === category && d.elements).map((docs) =>
        [
          `# ${humanName(docs.displayName)}`,
          resolveLinks(docs.description),
          `Documentation: ${SITE_URL}/components/${docs.id}/`,
          elementsMarkdown(docs),
          ...(docs.styled.customProperties.length
            ? [
                "### CSS custom properties",
                `Set these on ${code(`.${docs.styled.rootClass}`)} (or an ancestor) to restyle the styled component.`,
                table(
                  ["Property", "Default"],
                  docs.styled.customProperties.map((p) => [code(p.name), code(p.defaultsTo)]),
                ),
              ]
            : []),
        ].join("\n\n"),
      ),
    ),
  ]
    .join("\n\n---\n\n")
    .concat("\n");
