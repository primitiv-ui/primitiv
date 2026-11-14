import type { ReactNode } from "react";

import { inlineCode } from "@/components/inline-code.recipe";
import { prose } from "@/components/prose.recipe";
import {
  table,
  tableBody,
  tableCell,
  tableHead,
  tableHeader,
  tableRow,
  tableScrollArea,
} from "@/components/table.recipe";
import {
  RESPONSIVE_COUNT,
  UTILITIES_EXAMPLE,
  UTILITIES_LINKS,
  UTILITIES_SETUP,
  UTILITY_BREAKPOINTS,
  UTILITY_COUNT,
  UTILITY_SECTIONS,
  type UtilitySection,
} from "@/lib/utilities";

import { CodeSample } from "./CodeSample";
import type { TocEntry } from "./PageToc";
import { Shell } from "./Shell";

import "../styles/primitiv/inline-code/styles.css";
import "../styles/primitiv/prose/styles.css";
import "../styles/primitiv/table/styles.css";
import "./content-page.css";
import "./token-reference.css";

/*
 * The utility classes (/utilities/, RFC 0034): every class and what it sets.
 *
 * A server component, like the token reference, and for the same reason: the
 * list belongs in the HTML. Generated (scripts/gen-utilities.mjs) from the
 * `utilities.css` the CLI emits, so it cannot list a class the file lacks.
 */

export const TOC: readonly TocEntry[] = [
  { id: "install", title: "Install" },
  { id: "responsive-variants", title: "Responsive variants" },
  ...UTILITY_SECTIONS.map((s) => ({ id: s.id, title: s.title })),
];

const Code = ({ children }: { children: ReactNode }) => (
  <code className={inlineCode({ size: "sm" })}>{children}</code>
);

const Prose = ({ children }: { children: ReactNode }) => <div className={prose()}>{children}</div>;

const SectionTable = ({ section }: { section: UtilitySection }) => (
  <div className={tableScrollArea()} tabIndex={0} role="region" aria-label={`${section.title} classes`}>
    <table className={table({ size: "sm" })}>
      <thead className={tableHead()}>
        <tr className={tableRow()}>
          <th className={tableHeader()} scope="col">
            Class
          </th>
          <th className={tableHeader()} scope="col">
            CSS
          </th>
          <th className={tableHeader()} scope="col">
            Responsive
          </th>
        </tr>
      </thead>
      <tbody className={tableBody()}>
        {section.classes.map((c) => (
          <tr key={c.name} className={tableRow()}>
            <td className={`${tableCell()} docs-token-name`}>
              <Code>.{c.name}</Code>
            </td>
            <td className={`${tableCell()} docs-utility-css`}>
              {c.declarations.map((d) => (
                <Code key={d}>{d};</Code>
              ))}
            </td>
            <td className={tableCell()}>{c.responsive ? "Yes" : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const UtilityReference = () => (
  <Shell toc={TOC}>
    <div className="docs-content-page">
      <header className="docs-content-head">
        <p className="docs-content-eyebrow">Foundations</p>
        <div className="docs-content-tight">
          <h1 className="docs-content-title">Utility classes</h1>
          <p className="docs-content-lede">
            {UTILITY_COUNT} small classes over the design tokens, for your own layout and the
            odd adjustment, in plain CSS, SCSS or a page of Primitiv Elements.
          </p>
        </div>
      </header>

      <section className="docs-content-section" aria-labelledby="install">
        <Prose>
          <h2 className="docs-content-h2" id="install">
            Install
          </h2>
          <p className="docs-content-p">
            Every value is a token, so the classes follow <Code>data-theme</Code> and{" "}
            <Code>data-density</Code> as the components do. They sit in a last cascade layer,{" "}
            <Code>primitiv.utilities</Code>, so they beat a component&apos;s own styles without{" "}
            <Code>!important</Code>, and your own CSS still beats them. Tailwind projects don&apos;t
            need them: <Code>--format tailwind</Code> already gives Tailwind Primitiv&apos;s tokens.
          </p>
        </Prose>
        <CodeSample language="sh" code={UTILITIES_SETUP} />
        <Prose>
          <p className="docs-content-p">Then link the file after the token layer:</p>
        </Prose>
        <CodeSample language="html" code={UTILITIES_LINKS} />
        <CodeSample language="html" code={UTILITIES_EXAMPLE} />
      </section>

      <section className="docs-content-section" aria-labelledby="responsive-variants">
        <Prose>
          <h2 className="docs-content-h2" id="responsive-variants">
            Responsive variants
          </h2>
          <p className="docs-content-p">
            The {RESPONSIVE_COUNT} layout classes marked Yes below also come with a breakpoint
            prefix, applying from that width up:{" "}
            {UTILITY_BREAKPOINTS.map((b, i) => (
              <span key={b.name}>
                {i > 0 && ", "}
                <Code>{b.name}:</Code> from {b.min}
              </span>
            ))}
            . Write them as in <Code>md:flex-row</Code>.
          </p>
        </Prose>
      </section>

      {UTILITY_SECTIONS.map((section) => (
        <section key={section.id} className="docs-content-section" aria-labelledby={section.id}>
          <Prose>
            <h2 className="docs-content-h2" id={section.id}>
              {section.title}
            </h2>
          </Prose>
          <SectionTable section={section} />
        </section>
      ))}
    </div>
  </Shell>
);
