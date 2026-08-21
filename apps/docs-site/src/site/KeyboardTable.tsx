"use client";

import { Kbd } from "@/components/kbd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/table";
import { renderDoc } from "@/lib/render-doc";

import "./props-table.css";

/**
 * The "Keyboard" section's body — a Key / Behaviour table, per the Figma frame.
 *
 * `Kbd` rather than `InlineCode` for the key names, which is the whole reason
 * this is not just another two-column prose table: a key cap is a distinct
 * semantic from a code span, and `<kbd>` is the element for it. The registry
 * `Kbd` is a zero-behaviour span-alike, so this is pure composition.
 *
 * `literal` rows opt out of the cap treatment. "printable character" describes a
 * CLASS of key, and drawing it as a cap would claim there is a key with that
 * legend on it — the Figma frame draws that row as plain text for the same
 * reason.
 */
export const KeyboardTable = ({
  rows,
}: {
  rows: readonly {
    readonly keys: readonly string[];
    readonly literal?: boolean;
    readonly behaviour: string;
  }[];
}) => (
  <TableScrollArea>
    <Table size="sm">
      <TableHead>
        <TableRow>
          <TableHeader scope="col">Key</TableHeader>
          <TableHeader scope="col">Behaviour</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.keys.join("/")}>
            <TableCell>
              {row.literal ? (
                row.keys.join(" ")
              ) : (
                /* A pair reads "ArrowDown / ArrowUp": two caps with a plain
                   separator between them, so the slash is not inside a cap. */
                row.keys.map((key, i) => (
                  <span key={key}>
                    {i > 0 && <span className="docs-key-sep"> / </span>}
                    <Kbd size="sm">{key}</Kbd>
                  </span>
                ))
              )}
            </TableCell>
            <TableCell>
              <span className="docs-prop-description">
                {renderDoc(row.behaviour, "sm")}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableScrollArea>
);
