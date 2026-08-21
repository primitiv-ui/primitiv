"use client";

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
import type { DocsDataAttribute } from "@/lib/docs-data";

import "./props-table.css";

/**
 * The "Data attributes" section's body — Attribute / Value / When.
 *
 * GENERATED, like the props tables: every row comes from the registry
 * `contract.json`'s own `dataAttributes` declarations, so this cannot drift from
 * what the component emits. Nothing here is hand-listed.
 *
 * Two rows share the name `data-state` (`checked` / `unchecked`), which is why
 * the key is name + value and why the extractor had to start carrying `value` —
 * keyed on the name alone the second row silently disappears.
 *
 * Where the Figma frame merges the two `aria-expanded` rows into a single
 * `true / false` cell, this does not: that merge is a prose rewrite of two
 * separate contract declarations, and inventing a merge heuristic would put
 * hand-authorship back into a generated table. Six designed rows, seven real
 * ones.
 */
export const DataAttributesTable = ({
  rows,
}: {
  rows: readonly DocsDataAttribute[];
}) => (
  <TableScrollArea>
    <Table size="sm">
      <TableHead>
        <TableRow>
          <TableHeader scope="col">Attribute</TableHeader>
          <TableHeader scope="col">Value</TableHeader>
          <TableHeader scope="col">When</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.name}-${row.value}`}>
            <TableCell>
              <InlineCode size="sm">{row.name}</InlineCode>
            </TableCell>
            <TableCell>
              {/* An empty value is meaningful — a boolean data attribute is
                  present with no value — so it is shown as the empty string it
                  is, rather than the em dash that means "not applicable" in the
                  props tables. */}
              <InlineCode size="sm">{row.value === "" ? '""' : row.value}</InlineCode>
            </TableCell>
            <TableCell>
              <span className="docs-prop-description">{row.when}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableScrollArea>
);
