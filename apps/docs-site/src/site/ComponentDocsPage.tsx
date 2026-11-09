"use client";

import { CodeBlock } from "@/components/code-block";
import { InlineCode } from "@/components/inline-code";
import { List } from "@/components/list";
import { Stack } from "@/components/stack";

import {
  getDocs,
  type ComponentDocs,
  type ComponentId,
  type DocsSubComponent,
} from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";
import { contractControls, type PlaygroundControl } from "@/lib/playground";
import { Anatomy } from "@/site/Anatomy";
import { ComponentPageHeader } from "@/site/ComponentPageHeader";
import { DataAttributesTable } from "@/site/DataAttributesTable";
import { DocsSection } from "@/site/DocsSection";
import { SPECS } from "@/site/examples";
import type { ComponentSpec } from "@/site/examples/types";
import { InstallTabs } from "@/site/InstallTabs";
import { KeyboardTable } from "@/site/KeyboardTable";
import { Playground } from "@/site/Playground";
import { PropsTable } from "@/site/PropsTable";
import { Shell } from "@/site/Shell";
import {
  ElementsApiReference,
  ElementsClassReference,
  elementHeadingId,
} from "@/site/ElementsReference";
import { StylingContract } from "@/site/StylingContract";
import {
  ElementsSurfaceProvider,
  HeadlessAvailableProvider,
  type Mode,
  installCommand,
  useFramework,
  label,
  useView,
} from "@/site/preferences";
import type { TocEntry } from "@/site/PageToc";

import "./component-page.css";

/**
 * A React part's name as an Elements reader writes it: `Tabs.List` is
 * `<primitiv-tabs-list>`. An interactive part (a trigger, a link) decorates the
 * `<button>` or `<a>` the consumer puts inside it, which is where its state
 * attributes land, so it is named as that child. Undefined when the component
 * has no element for the part.
 */
const elementLabel = (docs: ComponentDocs, part: string): string | undefined => {
  const suffix = part.split(".")[1] ?? "Root";
  const tag =
    suffix === "Root"
      ? `primitiv-${docs.id}`
      : `primitiv-${docs.id}-${suffix.replace(/[A-Z]/g, (c, i) => (i ? "-" : "") + c.toLowerCase())}`;
  if (!docs.elements?.api.some((e) => e.tag === tag)) {
    /* No custom element: the root is the plain element the classes go on. */
    return suffix === "Root" && docs.elements?.element
      ? `<${docs.elements.element}>`
      : undefined;
  }
  const sub = docs.headless.subComponents.find((s) => s.name === part);
  const child = sub?.extends?.match(/^HTML(Button|Anchor)Element$/)?.[1];
  return child ? `<${child === "Button" ? "button" : "a"}> in <${tag}>` : `<${tag}>`;
};

const propsHeadingId = (subName: string) =>
  `props-${subName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * A component's documentation page, rebuilt against the Figma
 * "Component page — Button (desktop) — system build" frame.
 *
 * Renders `Shell` itself (rather than being wrapped by the route) so it can hand
 * the shell a TOC derived from the same data it renders the sections from. That
 * is what keeps the TOC honest: a heading and its TOC entry cannot drift,
 * because both come from `docs` + `spec` in one pass.
 */
export const ComponentDocsPage = ({ id }: { id: ComponentId }) => {
  const docs = getDocs(id);
  const spec = SPECS[id];
  const subs = docs.headless.subComponents;
  /* Contract modifiers first, then anything the spec adds for a headless prop
     the contract cannot know about (see ComponentSpec.playground.controls) —
     minus any the spec drops as undemonstrable in a small preview
     (ComponentSpec.playground.excludeControls). */
  const excluded = spec.playground.excludeControls ?? [];
  const controls = [
    ...contractControls(subs),
    ...(spec.playground.controls ?? []),
  ].filter((c) => !excluded.includes(c.name));

  const registryOnly = docs.kind === "registry-only";
  const elements = docs.elements;

  const dataAttrGroups = subs
    .filter((sub) => sub.dataAttributes.length > 0)
    .map((sub) => ({
      part: sub.name,
      className: sub.class,
      headlessOnly: sub.headlessOnly,
      rows: sub.dataAttributes,
    }));

  /*
   * The TOC is built from the same three sources the sections render from
   * (`docs`, `spec`, and the presence tests below), in one pass — which is what
   * keeps it honest. Every conditional section is conditional in BOTH places
   * because it is the same expression, so a section cannot appear in the rail
   * without appearing on the page.
   */
  /* The same test `useView` makes inside the page's providers: Elements is
     shown only for a component that has an elements surface. */
  const [framework] = useFramework();
  const elementsShown = framework !== "react" && elements !== null;
  const toc: readonly TocEntry[] = [
    { id: "playground", title: "Playground" },
    { id: "installation", title: "Installation" },
    ...(spec.anatomy ? [{ id: "anatomy", title: "Anatomy" }] : []),
    elementsShown
      ? elements.api.length > 0
        ? {
            id: "props",
            title: "Attributes & events",
            children: elements.api.map((e) => ({
              id: elementHeadingId(e.tag),
              title: `<${e.tag}>`,
            })),
          }
        : { id: "props", title: "Classes" }
      : {
          id: "props",
          title: "Props",
          // One nested entry per sub-component — this is why Select's TOC needs
          // two levels (9 parts) while Button's has one (§1.20).
          children: subs.map((s) => ({
            id: propsHeadingId(s.name),
            title: s.name,
          })),
        },
    { id: "styling", title: "Styling contract" },
    ...(spec.keyboard ? [{ id: "keyboard", title: "Keyboard" }] : []),
    ...(dataAttrGroups.length > 0
      ? [{ id: "data-attributes", title: "Data attributes" }]
      : []),
    { id: "accessibility", title: "Accessibility" },
    {
      id: "examples",
      title: "Examples",
      children: spec.examples.map((e) => ({
        id: e.id,
        title: (elementsShown && e.elementsTitle) || e.title,
      })),
    },
  ];

  return (
    <Shell toc={toc}>
      {/* The page column is one Stack, so the 48px section rhythm is declared
          once rather than as a margin on every section. The provider tells every
          code block on the page whether a Headless tab belongs — registry-only
          components have no headless mode, so they show Styled alone. */}
      <HeadlessAvailableProvider value={!registryOnly}>
      <ElementsSurfaceProvider
        value={elements ? (elements.package ? "behaviour" : "markup") : null}
      >
        <ComponentDocsBody
          docs={docs}
          spec={spec}
          controls={controls}
          dataAttrGroups={dataAttrGroups}
        />
      </ElementsSurfaceProvider>
      </HeadlessAvailableProvider>
    </Shell>
  );
};

type DataAttrGroups = readonly {
  part: string;
  className: string | null;
  headlessOnly?: boolean;
  rows: DocsSubComponent["dataAttributes"];
}[];

/**
 * Everything below the shell, inside the page's providers, so it reads the page
 * through `useView`: the framework actually shown (a component with no
 * elements surface reads as React even when Elements is chosen), and headless
 * or styled where both mean something.
 */
const ComponentDocsBody = ({
  docs,
  spec,
  controls,
  dataAttrGroups,
}: {
  docs: ComponentDocs;
  spec: ComponentSpec;
  controls: readonly PlaygroundControl[];
  dataAttrGroups: DataAttrGroups;
}) => {
  const subs = docs.headless.subComponents;
  const cssVars = docs.styled.customProperties;
  const registryOnly = docs.kind === "registry-only";
  const elements = docs.elements;
  const { reading, style, chosen, fallback } = useView();
  const inElements = reading === "elements" && elements !== null;
  const mode: Mode = inElements ? "elements" : style;
  /* Headless was chosen but this component has none to give under Elements:
     with no behaviour, its headless form is plain HTML. */
  const noBehaviour = inElements && chosen === "headless" && style === "styled";
  const webPackage = elements?.package ?? null;
  /* The page's hand-written prose in Elements terms, where the spec gives it. */
  const prose = inElements ? spec.elements : undefined;

  return (
        <Stack gap="none" className="docs-page-column">
        <ComponentPageHeader
          docs={docs}
          notice={fallback ? "no-elements" : noBehaviour ? "no-behaviour" : undefined}
          description={prose?.description}
        />

        <DocsSection id="playground" title="Playground">
          <Playground
            component={spec.playground.component}
            controls={controls}
            snippetChildren={spec.playground.snippetChildren}
            snippetPrefix={spec.playground.snippetPrefix}
            snippet={spec.playground.snippet}
            fill={spec.playground.fill}
            elements={
              elements?.element
                ? {
                    element: elements.element,
                    rootClass: docs.styled.rootClass,
                    wrapText: elements.wrapText,
                  }
                : undefined
            }
          >
            {spec.playground.render}
          </Playground>
        </DocsSection>

        {/*
         * Two columns, per the design: the tabbed install block beside an
         * import-path panel. Not one stacked block — the panel is reference
         * material you read WHILE copying the command, not after it.
         */}
        <DocsSection id="installation" title="Installation">
          <div
            className={
              inElements && style === "styled"
                ? "docs-install-grid docs-install-grid--setup"
                : "docs-install-grid"
            }
          >
            <InstallTabs
              kind={
                inElements
                  ? style === "styled" || webPackage
                    ? "exec"
                    : "install"
                  : mode === "styled" || registryOnly
                    ? "exec"
                    : "install"
              }
              target={
                inElements
                  ? style === "styled"
                    ? [
                        "primitiv-ui@latest init --styles",
                        `primitiv-ui@latest add ${docs.id} --styled`,
                      ]
                    : webPackage
                      ? `primitiv-ui@latest add ${docs.id}`
                      : "@primitiv-ui/web"
                  : mode === "styled" || registryOnly
                    ? `primitiv-ui@latest add ${docs.id}`
                    : docs.headless.package
              }
            />

            <Stack gap="sm">
              <p className="docs-overline">{inElements ? "Load" : "Import"}</p>
              {inElements ? (
                webPackage ? (
                  /* The element registers itself when its module loads: the
                     bundler import, or the CDN file for a page with no build
                     step. Either line is the whole of the setup, and both
                     load this component only, not the whole library. */
                  <Stack gap="xs">
                    <CodeBlock
                      variant="inline"
                      size="xs"
                      language="tsx"
                      code={`import "${webPackage}/define/${docs.id}";`}
                    />
                    <CodeBlock
                      variant="inline"
                      size="xs"
                      language="html"
                      code={`<script type="module" src="https://cdn.jsdelivr.net/npm/${webPackage}@${elements?.version ?? "latest"}/dist/cdn/${docs.id}.js"></script>`}
                    />
                  </Stack>
                ) : (
                  <InlineCode size="sm">No script — markup and classes only</InlineCode>
                )
              ) : (
                /* A whole import statement, not a bare module path: that is what
                   a reader copies, and it shows WHICH symbol to import. Same
                   shape in both styles, only the specifier changes. xs, because
                   this column is narrow and the statement is the longest thing
                   in it. */
                <CodeBlock
                  variant="inline"
                  size="xs"
                  language="tsx"
                  code={`import { ${docs.displayName} } from "${
                    mode === "styled"
                      ? `@/components/ui/${docs.id}`
                      : docs.headless.importPath
                  }";`}
                />
              )}
              <p className="docs-install-note">
                {inElements ? (
                  style === "styled" ? (
                    <>
                      Copies the stylesheet and{" "}
                      <InlineCode size="sm">contract.json</InlineCode>, then prints
                      the markup to paste.{" "}
                      {webPackage
                        ? "The element adds the behaviour; the classes are the styling."
                        : "The classes on that markup are the whole component."}{" "}
                      Run <InlineCode size="sm">init</InlineCode> once per
                      project, first: it asks where your server serves static
                      files from and the URL it serves them at, and records both.
                      Maven and Gradle projects are detected, so{" "}
                      <InlineCode size="sm">--yes</InlineCode> takes those
                      answers. No Node project needed.
                    </>
                  ) : (
                    <>
                      Behaviour and accessibility only, no CSS: the element
                      works in plain HTML or any framework. Bring your own
                      styling. Prints the{" "}
                      <InlineCode size="sm">&lt;script&gt;</InlineCode> tag and
                      the bare markup to paste, with no Node project needed.
                      With a bundler, install the package instead:{" "}
                      <InlineCode size="sm">npm i @primitiv-ui/web</InlineCode>{" "}
                      and the import beside.
                    </>
                  )
                ) : registryOnly ? (
                  <>
                    No headless primitive — this one ships only as a copied
                    styled surface, so <InlineCode size="sm">primitiv add</InlineCode>{" "}
                    is the only way in.
                  </>
                ) : mode === "styled" ? (
                  <>
                    Copied into your project as{" "}
                    <InlineCode size="sm">.{docs.styled.rootClass}</InlineCode> —
                    you own the file afterwards, so upgrades are opt-in.
                  </>
                ) : (
                  <>
                    Behaviour and accessibility only — no CSS. Bring your own
                    styling.
                  </>
                )}
              </p>
              {/* The other style, where there is one: a registry-only React
                  component and a behaviourless element have only Styled. */}
              {inElements ? (
                webPackage && (
                  <p className="docs-install-hint">
                    {style === "styled"
                      ? `Headless prints the bare markup instead: ${installCommand("elements", docs.id, "headless")}`
                      : `Styled adds Primitiv's styling: ${installCommand("elements", docs.id, "styled")}`}
                  </p>
                )
              ) : (
                !registryOnly && (
                  <p className="docs-install-hint">
                    {mode === "styled"
                      ? `Headless installs the npm package instead: ${docs.headless.package}`
                      : `Styled copies the surface instead: ${installCommand("styled", docs.id)}`}
                  </p>
                )
              )}
            </Stack>
          </div>
        </DocsSection>

        {/*
         * Anatomy sits between Installation and Props, per the frame: you have
         * just installed it, so "what are the parts and what do they emit" is
         * the next question — and it is the context that makes nine props
         * tables legible rather than a wall.
         */}
        {spec.anatomy && (
          <DocsSection
            id="anatomy"
            title="Anatomy"
            meta={renderDoc(prose?.anatomyMeta ?? spec.anatomyMeta ?? "")}
          >
            <Anatomy paths={spec.anatomy} />
          </DocsSection>
        )}

        {inElements ? (
          elements.api.length > 0 ? (
            <DocsSection
              id="props"
              title="Attributes & events"
              meta={
                <>
                  Generated from each element&rsquo;s{" "}
                  <InlineCode size="sm">@attr</InlineCode> and{" "}
                  <InlineCode size="sm">@fires</InlineCode> JSDoc in{" "}
                  <InlineCode size="sm">{elements.package ?? "@primitiv-ui/web"}</InlineCode>,
                  the same source as its Custom Elements Manifest. State lives
                  in attributes, so set them from markup, a server render or{" "}
                  <InlineCode size="sm">setAttribute</InlineCode>.
                </>
              }
            >
              <ElementsApiReference api={elements.api} />
            </DocsSection>
          ) : (
            <DocsSection
              id="props"
              title="Classes"
              meta="No element and no behaviour: in plain markup, the registry classes are the whole component. Generated from contract.json."
            >
              <ElementsClassReference subs={subs} rootClass={docs.styled.rootClass} />
            </DocsSection>
          )
        ) : (
        <DocsSection
            id="props"
            title="Props"
            meta={
              registryOnly ? (
                /* No headless surface, so no "From" column and no split to explain:
                   every prop comes from the one copied file. */
                <>
                  Generated from the copied file&rsquo;s props type and{" "}
                  <InlineCode size="sm">contract.json</InlineCode>. Never
                  hand-maintained.
                </>
              ) : (
                <>
                  {/* Says "styled", matching the From column and the mode switch.
                      It still names `contract.json` as the source, which is useful
                      — but as the file a row comes FROM, not as the word for the
                      half of the API it belongs to. */}
                  Generated from source — headless rows from each{" "}
                  <InlineCode size="sm">*Props</InlineCode> type&rsquo;s JSDoc,
                  styled rows from{" "}
                  <InlineCode size="sm">contract.json</InlineCode>. Never
                  hand-maintained.
                </>
              )
            }
          >
            {subs.map((sub) => (
              <PropsTable
                key={sub.name}
                sub={sub}
                headingId={propsHeadingId(sub.name)}
                showFrom={!registryOnly}
              />
            ))}
          </DocsSection>
        )}

        {/*
         * A stack of code chips, clipped with a "show all" — the design shows a
         * handful per group rather than the full list, because the full list is
         * reference material the reader scrolls past. Grouped by the part each
         * knob dresses once there is more than one part: 58 undifferentiated
         * names is a wall, and the grouping is derived from the names rather
         * than listed (see StylingContract).
         */}
        <DocsSection
          id="styling"
          title="Styling contract"
          meta={`${cssVars.length} CSS custom properties on .${docs.styled.rootClass} — mode-agnostic. These names are the stable surface; the values are not.`}
        >
          <StylingContract
            properties={cssVars}
            rootClass={docs.styled.rootClass}
          />
        </DocsSection>

        {spec.keyboard && (
          <DocsSection
            id="keyboard"
            title="Keyboard"
            meta={renderDoc(prose?.keyboardMeta ?? spec.keyboardMeta ?? "")}
          >
            <KeyboardTable rows={prose?.keyboard ?? spec.keyboard} />
          </DocsSection>
        )}

        {/*
         * Generated from `contract.json`, so it is guarded on the data rather
         * than on the spec: a component that declares no data attributes gets no
         * section, and one that adds a declaration gets a row with no page edit.
         */}
        {dataAttrGroups.length > 0 && (
          <DocsSection
            id="data-attributes"
            title="Data attributes"
            meta={`Emitted automatically by the ${inElements && elements.package ? "element" : "headless primitive"} — style against these rather than adding your own state classes. Grouped by the part that emits them, since most are emitted by more than one.`}
          >
            <DataAttributesTable
              groups={
                inElements
                  ? dataAttrGroups.map((group) => ({
                      ...group,
                      element: elementLabel(docs, group.part),
                    }))
                  : dataAttrGroups
              }
            />
          </DocsSection>
        )}

        {/* The registry List with markers ON — unlike the nav lists, this IS
            prose, so the bullets and the base layer's reading rhythm are right. */}
        <DocsSection id="accessibility" title="Accessibility">
          <List indent={false}>
            {(prose?.accessibility ?? spec.accessibility).map((note) => (
              <List.Item key={note}>{renderDoc(note)}</List.Item>
            ))}
          </List>
        </DocsSection>

        <DocsSection
          id="examples"
          title="Examples"
          meta={`Every example below reacts to the density control. Currently showing ${label(inElements ? "elements" : "react")}, ${label(style).toLowerCase()}.`}
        >
          <Stack gap="lg">
            {spec.examples.map((example) => (
              <Stack key={example.id} gap="sm">
                <h3 className="docs-example-title" id={example.id}>
                  {(inElements && example.elementsTitle) || example.title}
                </h3>
                {example.render()}
              </Stack>
            ))}
          </Stack>
        </DocsSection>
        </Stack>
  );
};
