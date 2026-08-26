"use client";

import { CodeBlock } from "@/components/code-block";
import { InlineCode } from "@/components/inline-code";
import { List } from "@/components/list";
import { Stack } from "@/components/stack";

import { getDocs, type ComponentId } from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";
import { contractControls } from "@/lib/playground";
import { Anatomy } from "@/site/Anatomy";
import { ComponentPageHeader } from "@/site/ComponentPageHeader";
import { DataAttributesTable } from "@/site/DataAttributesTable";
import { DocsSection } from "@/site/DocsSection";
import { SPECS } from "@/site/examples";
import { InstallTabs } from "@/site/InstallTabs";
import { KeyboardTable } from "@/site/KeyboardTable";
import { Playground } from "@/site/Playground";
import { PropsTable } from "@/site/PropsTable";
import { Shell } from "@/site/Shell";
import { StylingContract } from "@/site/StylingContract";
import { installCommand, label, useMode } from "@/site/preferences";
import type { TocEntry } from "@/site/PageToc";

import "./component-page.css";

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
     the contract cannot know about (see ComponentSpec.playground.controls). */
  const controls = [...contractControls(subs), ...(spec.playground.controls ?? [])];
  const [mode] = useMode();

  const cssVars = docs.styled.customProperties;
  /* One group per part that actually emits something — Button and Select have a
     single one, Tabs four. Built from the per-part rows rather than the flat
     union, so each table can say which part it belongs to; see
     DataAttributesTable for why they are not tabbed or collapsed. */
  /* No headless primitive at all: the mode switch cannot change how you install
     or import it, so Installation stops pretending it can. */
  const registryOnly = docs.kind === "registry-only";

  const dataAttrGroups = subs
    .filter((sub) => sub.dataAttributes.length > 0)
    .map((sub) => ({
      part: sub.name,
      className: sub.class,
      rows: sub.dataAttributes,
    }));

  /*
   * The TOC is built from the same three sources the sections render from
   * (`docs`, `spec`, and the presence tests below), in one pass — which is what
   * keeps it honest. Every conditional section is conditional in BOTH places
   * because it is the same expression, so a section cannot appear in the rail
   * without appearing on the page.
   */
  const toc: readonly TocEntry[] = [
    { id: "playground", title: "Playground" },
    { id: "installation", title: "Installation" },
    ...(spec.anatomy ? [{ id: "anatomy", title: "Anatomy" }] : []),
    {
      id: "props",
      title: "Props",
      // One nested entry per sub-component — this is why Select's TOC needs two
      // levels (9 parts) while Button's has one (§1.20).
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
      children: spec.examples.map((e) => ({ id: e.id, title: e.title })),
    },
  ];

  return (
    <Shell toc={toc}>
      {/* The page column is one Stack, so the 48px section rhythm is declared
          once rather than as a margin on every section. */}
      <Stack gap="none" className="docs-page-column">
        <ComponentPageHeader docs={docs} />

        <DocsSection id="playground" title="Playground">
          <Playground
            component={spec.playground.component}
            controls={controls}
            snippetChildren={spec.playground.snippetChildren}
            snippetPrefix={spec.playground.snippetPrefix}
            snippet={spec.playground.snippet}
            fill={spec.playground.fill}
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
          <div className="docs-install-grid">
            <InstallTabs
              kind={mode === "styled" || registryOnly ? "exec" : "install"}
              target={
                mode === "styled" || registryOnly
                  ? `primitiv add ${docs.id}`
                  : docs.headless.package
              }
            />

            <Stack gap="sm">
              <p className="docs-overline">
                {mode === "figma" ? "Figma library" : "Import"}
              </p>
              {/*
               * A whole import statement, not a bare module path — that is what
               * a reader copies, and it also shows WHICH symbol to import,
               * which a path alone does not. Same shape across modes so the
               * line reads identically wherever you are: only the specifier
               * changes.
               *
               * Figma is the exception, and honestly so: there is no import. It
               * shows the library → component path instead, in the same slot,
               * with the label changed rather than a fake import invented.
               *
               * And when the component has no Figma set at all, it says so
               * rather than naming a path that would not resolve — the same call
               * the header makes about the Figma link. `input-group` is the
               * first: it exists in code and in the kitchen-sink, but the Figma
               * file draws its adornment case as a note on Input rather than as
               * a set of its own.
               */}
              {mode === "figma" ? (
                /* Not code, so not a code chip: a library → component path,
                   which syntax highlighting would misrepresent. */
                <InlineCode size="sm">
                  {docs.figma.componentSetKey
                    ? `Primitiv / ${docs.displayName}`
                    : "Not in the Figma library yet"}
                </InlineCode>
              ) : (
                /* CodeBlock's inline variant: the chip shape this slot had all
                   along, now with the highlighting it was missing. Highlighting
                   lives in CodeBlock — with the Prism theme and the syntax
                   palette — so extending it beat teaching InlineCode to
                   highlight, which would have meant a second copy of both and a
                   highlighter dependency on an otherwise dependency-free chip. */
                <CodeBlock
                  variant="inline"
                  /* xs, not sm: this column is narrow and the statement is the
                     longest thing in it — `import { NavigationMenu } from
                     "@/components/ui/navigation-menu";` is 62 characters. A step
                     down keeps it on one line for most components, and the chip
                     wraps rather than overflowing for the rest. */
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
                {registryOnly ? (
                  <>
                    No headless primitive — this one ships only as a copied
                    styled surface, so <InlineCode size="sm">primitiv add</InlineCode>{" "}
                    is the only way in, whichever mode you are reading.
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
              <p className="docs-install-hint">
                {mode === "styled"
                  ? `Headless mode installs the npm package instead: ${docs.headless.package}`
                  : `Styled mode copies the surface instead: ${installCommand("styled", docs.id)}`}
              </p>
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
            meta={renderDoc(spec.anatomyMeta ?? "")}
          >
            <Anatomy paths={spec.anatomy} />
          </DocsSection>
        )}

        <DocsSection
          id="props"
          title="Props"
          meta={
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
          }
        >
          {subs.map((sub) => (
            <PropsTable
              key={sub.name}
              sub={sub}
              headingId={propsHeadingId(sub.name)}
            />
          ))}
        </DocsSection>

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
            meta={renderDoc(spec.keyboardMeta ?? "")}
          >
            <KeyboardTable rows={spec.keyboard} />
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
            meta="Emitted automatically by the headless primitive — style against these rather than adding your own state classes. Grouped by the part that emits them, since most are emitted by more than one."
          >
            <DataAttributesTable groups={dataAttrGroups} />
          </DocsSection>
        )}

        {/* The registry List with markers ON — unlike the nav lists, this IS
            prose, so the bullets and the base layer's reading rhythm are right. */}
        <DocsSection id="accessibility" title="Accessibility">
          <List indent={false}>
            {spec.accessibility.map((note) => (
              <List.Item key={note}>{renderDoc(note)}</List.Item>
            ))}
          </List>
        </DocsSection>

        <DocsSection
          id="examples"
          title="Examples"
          meta={`Every example below reacts to the density control. Currently showing ${label(mode)} mode.`}
        >
          <Stack gap="lg">
            {spec.examples.map((example) => (
              <Stack key={example.id} gap="sm">
                <h3 className="docs-example-title" id={example.id}>
                  {example.title}
                </h3>
                {example.render()}
              </Stack>
            ))}
          </Stack>
        </DocsSection>
      </Stack>
    </Shell>
  );
};
