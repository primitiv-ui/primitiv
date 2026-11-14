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
import { TOKEN_SECTIONS, type TokenGroup, type TokenSection, tokenGroupId } from "@/lib/token-reference";

import type { TocEntry } from "./PageToc";
import { Shell } from "./Shell";
import { TokenCollapse } from "./TokenCollapse";

import "../styles/primitiv/inline-code/styles.css";
import "../styles/primitiv/prose/styles.css";
import "../styles/primitiv/table/styles.css";
import "./content-page.css";
import "./token-reference.css";

/*
 * The token reference (/tokens/): every design token, by category, with its
 * value in each mode.
 *
 * A server component on purpose. The data is every token in the system, and it
 * belongs in the HTML, not in a script the browser downloads to draw it. That
 * is why it writes the registry's classes through the recipes rather than
 * rendering the Table, InlineCode and Prose wrappers: those import the React
 * package, whose barrel cannot load in a server component. The markup is the
 * same one an Elements page writes.
 * Generated (scripts/gen-token-reference.mjs) from the DTCG source and the
 * emitted token layer, so nothing here is hand-listed or converted.
 *
 * A colour row draws its swatch from the token itself, so the swatch follows
 * the site theme while the Light and Dark columns state both values.
 */

const Code = ({ children }: { children: ReactNode }) => (
  <code className={inlineCode({ size: "sm" })}>{children}</code>
);

/** Text with `backtick` spans, as the generated intros are written. */
const Inline = ({ text }: { text: string }) => (
  <>{text.split("`").map((part, i) => (i % 2 ? <Code key={i}>{part}</Code> : part))}</>
);

const Prose = ({ children }: { children: ReactNode }) => <div className={prose()}>{children}</div>;

export const TOC: readonly TocEntry[] = TOKEN_SECTIONS.map((s) => ({ id: s.id, title: s.title }));

const GroupTable = ({ group, section }: { group: TokenGroup; section: TokenSection }) => (
  <div className={tableScrollArea()} tabIndex={0} role="region" aria-label={`${group.title} tokens`}>
    <table className={table({ size: "sm" })}>
      <thead className={tableHead()}>
        <tr className={tableRow()}>
          <th className={tableHeader()} scope="col">
            Token
          </th>
          {section.modes.map((mode) => (
            <th key={mode} className={tableHeader()} scope="col">
              {mode}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={tableBody()}>
        {group.tokens.map((token) => (
          <tr key={token.name} className={tableRow()}>
            <td className={`${tableCell()} docs-token-name`}>
              {token.type === "color" && (
                <span className="docs-token-swatch" style={{ background: `var(${token.name})` }} aria-hidden="true" />
              )}
              <Code>{token.name}</Code>
            </td>
            {token.values.map((value, i) => (
              <td key={section.modes[i]} className={`${tableCell()} docs-token-value`}>
                <Code>{value}</Code>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Section = ({ section }: { section: TokenSection }) => {
  const collapsed = section.id === "component-tokens";
  return (
    <section className="docs-content-section" aria-labelledby={section.id}>
      <Prose>
        <h2 className="docs-content-h2" id={section.id}>
          {section.title}
        </h2>
        <p className="docs-content-p">
          <Inline text={section.intro} />
        </p>
      </Prose>
      <div className="docs-token-groups">
        {section.groups.map((group) =>
          collapsed ? (
            <TokenCollapse key={group.title} title={group.title} count={group.tokens.length}>
              <GroupTable group={group} section={section} />
            </TokenCollapse>
          ) : (
            <div key={group.title} className="docs-token-group">
              <h3 className="docs-content-h3 docs-token-group-title" id={tokenGroupId(section, group)}>
                {group.title}
              </h3>
              <GroupTable group={group} section={section} />
            </div>
          ),
        )}
      </div>
    </section>
  );
};

export const TokenReference = () => (
  <Shell toc={TOC}>
    <div className="docs-content-page">
      <header className="docs-content-head">
        <p className="docs-content-eyebrow">Foundations</p>
        <div className="docs-content-tight">
          <h1 className="docs-content-title">Token reference</h1>
          <p className="docs-content-lede">
            Every design token, by category, with the value it takes in each theme or
            density. Each is a CSS custom property your own styles can read.
          </p>
        </div>
      </header>
      <section className="docs-content-section" aria-labelledby="reading-a-token">
        <Prose>
          <h2 className="docs-content-h2" id="reading-a-token">
            Reading a token
          </h2>
          <p className="docs-content-p">
            Link <Code>tokens.css</Code>, then read any token with{" "}
            <Code>var()</Code>, as in{" "}
            <Code>padding: var(--primitiv-space-16)</Code>. A value shown as
            another <Code>var(--primitiv-…)</Code> is an alias: it follows
            that token. Colour roles change with <Code>data-theme</Code>, and
            type, layout and component tokens with <Code>data-density</Code>,
            set on any container.
          </p>
        </Prose>
      </section>
      {TOKEN_SECTIONS.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </div>
  </Shell>
);
