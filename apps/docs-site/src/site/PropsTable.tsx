"use client";

import { VisuallyHidden } from "@primitiv-ui/react";

import { InlineCode } from "@/components/inline-code";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/table";
import type {
  DocsContractProp,
  DocsProp,
  DocsSubComponent,
} from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";

import "./props-table.css";

const PropRows = ({
  rows,
  from,
  showFrom,
}: {
  rows: readonly (DocsProp | DocsContractProp)[];
  from: string;
  /** Registry-only components have a single source, so the column is dropped. */
  showFrom: boolean;
}) =>
  rows.map((prop) => {
    const required = "required" in prop && prop.required;
    return (
      <TableRow key={`${from}-${prop.name}`}>
        <TableCell>
          <span className="docs-prop-name">{prop.name}</span>
          {required && (
            <>
              <span className="docs-prop-required" aria-hidden="true">
                *
              </span>
              {/* The only accessible carrier of "required": the asterisk is
                  decorative, and colour alone is never a signal. Uses the
                  library's own VisuallyHidden rather than a local utility —
                  it applies the WCAG C7 clip styles inline, because for this
                  component the styles ARE the behaviour. */}
              <VisuallyHidden> (required)</VisuallyHidden>
            </>
          )}
        </TableCell>
        <TableCell>
          {/* The registry InlineCode, not a bare mono span: a type IS code, and
              this keeps it visually identical to the backticked fragments
              renderDoc() already emits in the Description column. `size="sm"`
              matches the table's own size so the chip does not inflate rows. */}
          <InlineCode size="sm">{prop.type}</InlineCode>
        </TableCell>
        <TableCell>
          {/* The em dash means "no default" — prose, not code, so it stays a
              plain string rather than an empty-looking code chip. */}
          {prop.default === null ? (
            "—"
          ) : (
            <InlineCode size="sm">{prop.default}</InlineCode>
          )}
        </TableCell>
        {showFrom && <TableCell>{from}</TableCell>}
        <TableCell>
          <span className="docs-prop-description">
            {renderDoc(prop.description, "sm")}
          </span>
        </TableCell>
      </TableRow>
    );
  });

export const PropsTable = ({
  sub,
  headingId,
  showFrom = true,
}: {
  sub: DocsSubComponent;
  headingId: string;
  /**
   * Show the "From" column (headless vs styled). Dropped for a registry-only
   * component: it has no headless surface, so every prop comes from the one
   * copied file and the column would say "styled" on every row — noise, and a
   * cell reading "headless" for a component that has no headless mode is simply
   * wrong.
   */
  showFrom?: boolean;
}) => {
  const headless = sub.props ?? [];
  const contract = sub.contractProps ?? [];

  return (
    <>
      <h3 className="docs-props-sub-heading" id={headingId}>
        {sub.name}
      </h3>

      {sub.styledOnly && (
        <p className="docs-prop-extends">
          Styled surface only — the copied file adds this region.{" "}
          <InlineCode size="sm">@primitiv-ui/react</InlineCode> exports no such
          part, so under Headless it is your own element.
        </p>
      )}

      {sub.headlessOnly && (
        <p className="docs-prop-extends">
          Headless only — the copied file renders this part for you and exports
          no separate component, so there is nothing to import under Styled.
        </p>
      )}

      {sub.extends && (
        <p className="docs-prop-extends">
          Extends <InlineCode size="sm">{sub.extends}</InlineCode> — every native
          attribute
          of that element is accepted and forwarded.
        </p>
      )}

      {headless.length + contract.length === 0 ? (
        <p className="docs-props-empty">No props of its own.</p>
      ) : (
        /* Scrolls inside its own box rather than widening the page — a
           five-column props table with long union types will always overflow a
           920px column eventually. */
        <TableScrollArea>
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeader scope="col">Prop</TableHeader>
                <TableHeader scope="col">Type</TableHeader>
                <TableHeader scope="col">Default</TableHeader>
                {showFrom && <TableHeader scope="col">From</TableHeader>}
                <TableHeader scope="col">Description</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <PropRows rows={headless} from="headless" showFrom={showFrom} />
              {/* "styled", not "contract". The value is read by a person, and
                  the site's own vocabulary for the two halves is Styled /
                  Headless — the label on the mode switch, the code-block tabs and
                  the Installation panel. "contract" is the name of the FILE the
                  row is generated from (`contract.json`), which is a maintainer's
                  word: a reader has no reason to connect it to the Styled tab. */}
              <PropRows rows={contract} from="styled" showFrom={showFrom} />
            </TableBody>
          </Table>
        </TableScrollArea>
      )}
    </>
  );
};
