"use client";

import { CodeBlock } from "@/components/code-block";
import { InlineCode } from "@/components/inline-code";
import { getDocs, type ComponentId } from "@/lib/docs-data";
import { toControls } from "@/lib/playground";
import { SPECS } from "@/site/examples";
import { Playground } from "@/site/Playground";
import { PropsTable } from "@/site/PropsTable";
import { Shell } from "@/site/Shell";
import type { TocEntry } from "@/site/PageToc";

import "./component-page.css";

const propsHeadingId = (subName: string) =>
  `props-${subName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * A component's documentation page.
 *
 * Renders `Shell` itself (rather than being wrapped by the route) so it can hand
 * the shell a TOC derived from the very same data it renders the sections from.
 * That is what keeps the TOC honest: a heading and its TOC entry cannot drift,
 * because both come from `docs` + `spec` in one pass.
 */
export const ComponentDocsPage = ({ id }: { id: ComponentId }) => {
  const docs = getDocs(id);
  const spec = SPECS[id];
  const subs = docs.headless.subComponents;
  const controls = toControls(subs[0]?.contractProps);

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
      <h1 className="docs-page-title">{docs.displayName}</h1>
      <p className="docs-page-lede">{docs.description}</p>

      <section className="docs-section" aria-labelledby="playground">
        <h2 className="docs-section-heading" id="playground">
          Playground
        </h2>
        <Playground
          component={spec.playground.component}
          controls={controls}
          snippetChildren={spec.playground.snippetChildren}
          snippetPrefix={spec.playground.snippetPrefix}
        >
          {spec.playground.render}
        </Playground>
      </section>

      <section className="docs-section" aria-labelledby="installation">
        <h2 className="docs-section-heading" id="installation">
          Installation
        </h2>
        <p className="docs-prose">
          The styled surface is copied into your repo — you own the files
          afterwards, and upgrades are opt-in.
        </p>
        <CodeBlock
          code={docs.styled.installCommand}
          language="bash"
          size="sm"
        />
        <p className="docs-prose">
          Headless only? Install{" "}
          <InlineCode>{docs.headless.package}</InlineCode> and bring your own
          CSS — the primitive ships behaviour and accessibility, no styling.
        </p>
      </section>

      <section className="docs-section" aria-labelledby="props">
        <h2 className="docs-section-heading" id="props">
          Props
        </h2>
        <p className="docs-prose">
          Generated from source: the headless rows come from each{" "}
          <InlineCode>*Props</InlineCode> type&rsquo;s JSDoc, the contract rows
          from the registry&rsquo;s <InlineCode>contract.json</InlineCode>. This
          table is never hand-maintained.
        </p>
        {subs.map((sub) => (
          <PropsTable
            key={sub.name}
            sub={sub}
            headingId={propsHeadingId(sub.name)}
          />
        ))}
      </section>

      <section className="docs-section" aria-labelledby="styling">
        <h2 className="docs-section-heading" id="styling">
          Styling contract
        </h2>
        <p className="docs-prose">
          Custom properties on <InlineCode>.{docs.styled.rootClass}</InlineCode>.
          These names are the stable surface — the values are not (RFC 0006
          Principle 2), so re-point them freely.
        </p>
        <ul className="docs-css-vars">
          {docs.styled.customProperties.map((prop) => (
            <li key={prop.name}>
              {prop.name}: {prop.defaultsTo}
            </li>
          ))}
        </ul>
      </section>

      <section className="docs-section" aria-labelledby="accessibility">
        <h2 className="docs-section-heading" id="accessibility">
          Accessibility
        </h2>
        <ul className="docs-list">
          {spec.accessibility.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="docs-section" aria-labelledby="examples">
        <h2 className="docs-section-heading" id="examples">
          Examples
        </h2>
        {spec.examples.map((example) => (
          <div key={example.id}>
            <h3 className="docs-subsection-heading" id={example.id}>
              {example.title}
            </h3>
            {example.render()}
          </div>
        ))}
      </section>
    </Shell>
  );
};
