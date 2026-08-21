"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/components/collapsible";
import { InlineCode } from "@/components/inline-code";
import { List } from "@/components/list";
import { Stack } from "@/components/stack";
import { ChevronDown } from "@primitiv-ui/icons";
import { useState } from "react";

import { getDocs, type ComponentId } from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";
import { contractControls } from "@/lib/playground";
import { ComponentPageHeader } from "@/site/ComponentPageHeader";
import { DocsSection } from "@/site/DocsSection";
import { SPECS } from "@/site/examples";
import { InstallTabs } from "@/site/InstallTabs";
import { Playground } from "@/site/Playground";
import { PropsTable } from "@/site/PropsTable";
import { Shell } from "@/site/Shell";
import { installCommand, label, useMode } from "@/site/preferences";
import type { TocEntry } from "@/site/PageToc";

import "./component-page.css";

const propsHeadingId = (subName: string) =>
  `props-${subName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * How tall the closed styling-contract panel is, in px.
 *
 * `collapsedHeight` clamps the panel instead of hiding it, so the list is one
 * Collapsible showing a clipped preview rather than two lists either side of a
 * boundary. Sized to show roughly six chips (a ~28px row plus an 8px gap), which
 * is what the Figma frame previews before its "… 14 total".
 */
const CONTRACT_PREVIEW_HEIGHT = 200;

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
  const controls = contractControls(subs);
  const [mode] = useMode();

  const cssVars = docs.styled.customProperties;
  // Controlled, so the trigger label can say what it will do next.
  const [contractOpen, setContractOpen] = useState(false);

  const toc: readonly TocEntry[] = [
    { id: "playground", title: "Playground" },
    { id: "installation", title: "Installation" },
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
              kind={mode === "styled" ? "exec" : "install"}
              target={
                mode === "styled" ? `primitiv add ${docs.id}` : docs.headless.package
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
               */}
              <InlineCode size="sm">
                {mode === "figma"
                  ? `Primitiv / ${docs.displayName}`
                  : `import { ${docs.displayName} } from "${
                      mode === "styled"
                        ? `@/components/ui/${docs.id}`
                        : docs.headless.importPath
                    }";`}
              </InlineCode>
              <p className="docs-install-note">
                {mode === "styled" ? (
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

        <DocsSection
          id="props"
          title="Props"
          meta={
            <>
              Generated from source — headless rows from each{" "}
              <InlineCode size="sm">*Props</InlineCode> type&rsquo;s JSDoc,
              contract rows from{" "}
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
         * A stack of code chips, truncated with a count — the design shows six
         * and then "... 14 total" rather than the full list, because the full
         * list is reference material the reader scrolls past.
         */}
        <DocsSection
          id="styling"
          title="Styling contract"
          meta={`CSS custom properties on .${docs.styled.rootClass} — mode-agnostic. These names are the stable surface; the values are not (RFC 0006 Principle 2).`}
        >
          {/*
           * ONE Collapsible over the whole list, using `collapsedHeight` — the
           * clamped-preview dressing rather than the hide-everything default.
           * The closed panel shows a clipped preview with the component's own
           * bottom fade reading over the clamp, so the truncation is visibly a
           * truncation rather than a list that happens to stop.
           *
           * `variant="inline"` because this sits inside an existing section: the
           * `card` dressing would draw a second box around content the page
           * already frames.
           *
           * The trigger follows the content, which is the read-more reading
           * order — you meet the clipped list, then the way to see the rest.
           */}
          <Collapsible
            variant="inline"
            size="sm"
            open={contractOpen}
            onOpenChange={setContractOpen}
          >
            <CollapsibleContent collapsedHeight={CONTRACT_PREVIEW_HEIGHT}>
              <Stack gap="sm" align="start">
                {cssVars.map((prop) => (
                  <InlineCode key={prop.name} size="sm">
                    {prop.name}
                  </InlineCode>
                ))}
              </Stack>
            </CollapsibleContent>

            <CollapsibleTrigger>
              {contractOpen ? "Show fewer" : `Show all ${cssVars.length}`}
              {/* TriggerIcon is a slot for your own glyph — it supplies the
                  open/closed rotation, not the artwork. `size="100%"` fills the
                  wrapper the component sizes via
                  `--primitiv-collapsible-trigger-icon-size`, rather than
                  hardcoding a pixel value beside a token. */}
              <CollapsibleTriggerIcon>
                <ChevronDown size="100%" />
              </CollapsibleTriggerIcon>
            </CollapsibleTrigger>
          </Collapsible>
        </DocsSection>

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
