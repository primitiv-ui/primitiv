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
 * ONE TABLE PER PART, each under the part's name. Not a stylistic choice: the
 * same attribute is usually emitted by several parts — Tabs puts
 * `data-orientation` on all four — so a single combined table showed
 * `data-orientation | horizontal` four times with nothing to distinguish the
 * rows, which read as a rendering bug rather than as four parts. (It also gave
 * four React children the same key.)
 *
 * Deliberately NOT collapsed behind a Collapsible per part. The parts that emit
 * anything are few — one for Button and Select, four for Tabs — and their tables
 * are two to five rows, so collapsing would trade a glance for a click and hide
 * the comparison that makes the grouping worth having. The tabbed-by-part idiom
 * the Props section uses (§1.24) was rejected here for the same reason: this
 * data is short enough to read all at once, and a reader wants to see that
 * `data-orientation` is on every part, not click through four tabs to infer it.
 *
 * Two rows share the name `data-state` (`active` / `inactive`), which is why
 * the key is part + name + value and why the extractor had to start carrying
 * `value` — keyed on the name alone the second row silently disappears.
 *
 * Where the Figma frame merges the two `aria-expanded` rows into a single
 * `true / false` cell, this does not: that merge is a prose rewrite of two
 * separate contract declarations, and inventing a merge heuristic would put
 * hand-authorship back into a generated table. Six designed rows, seven real
 * ones.
 */
export type DataAttributeGroup = {
  /** The part that emits these, e.g. `"Tabs.Trigger"`. */
  readonly part: string;
  readonly rows: readonly DocsDataAttribute[];
};

export const DataAttributesTable = ({
  groups,
}: {
  groups: readonly DataAttributeGroup[];
}) => (
  <>
    {groups.map((group) => (
      <section className="docs-data-attributes-group" key={group.part}>
        {/* h3 to match the other sub-headings on the page. The part name is the
            table's accessible name too, via aria-labelledby below. */}
        <h3 className="docs-example-title" id={`data-attributes-${group.part}`}>
          {group.part}
        </h3>

        <TableScrollArea>
          <Table size="sm" aria-labelledby={`data-attributes-${group.part}`}>
            <TableHead>
              <TableRow>
                <TableHeader scope="col">Attribute</TableHeader>
                <TableHeader scope="col">Value</TableHeader>
                <TableHeader scope="col">When</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {group.rows.map((row) => (
                <TableRow key={`${group.part}-${row.name}-${row.value}`}>
                  <TableCell>
                    <InlineCode size="sm">{row.name}</InlineCode>
                  </TableCell>
                  <TableCell>
                    {/* An empty value is meaningful — a boolean data attribute
                        is present with no value — so it is shown as the empty
                        string it is, rather than the em dash that means "not
                        applicable" in the props tables. */}
                    <InlineCode size="sm">
                      {row.value === "" ? '""' : row.value}
                    </InlineCode>
                  </TableCell>
                  <TableCell>
                    <span className="docs-prop-description">{row.when}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
      </section>
    ))}
  </>
);
