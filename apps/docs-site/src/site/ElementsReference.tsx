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
import type { DocsElementApi, DocsSubComponent } from "@/lib/docs-data";
import { renderDoc } from "@/lib/render-doc";

import "./props-table.css";

/** The heading id for one element's reference block, for the page's TOC. */
export const elementHeadingId = (tag: string) => `api-${tag}`;

/**
 * Elements mode's API reference: each custom element's attributes and events,
 * in place of the React props tables.
 *
 * Generated, like the props tables: the rows come from the `@attr` and
 * `@fires` JSDoc on each element class in `packages/web`, the same tags the
 * Custom Elements Manifest is built from, so the table cannot drift from the
 * element. One block per element, root first, under the tag a reader writes.
 */
export const ElementsApiReference = ({ api }: { api: readonly DocsElementApi[] }) => (
  <>
    {api.map((element) => (
      <section key={element.tag}>
        <h3 className="docs-props-sub-heading" id={elementHeadingId(element.tag)}>
          {`<${element.tag}>`}
        </h3>
        {element.attributes.length === 0 && element.events.length === 0 ? (
          <p className="docs-props-empty">No attributes of its own.</p>
        ) : (
          <TableScrollArea>
            <Table size="sm" aria-labelledby={elementHeadingId(element.tag)}>
              <TableHead>
                <TableRow>
                  <TableHeader scope="col">Attribute or event</TableHeader>
                  <TableHeader scope="col">Type</TableHeader>
                  <TableHeader scope="col">Description</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {element.attributes.map((attr) => (
                  <TableRow key={`attr-${attr.name}`}>
                    <TableCell>
                      <span className="docs-prop-name">{attr.name}</span>
                    </TableCell>
                    <TableCell>
                      <InlineCode size="sm">{attr.type}</InlineCode>
                    </TableCell>
                    <TableCell>
                      <span className="docs-prop-description">
                        {renderDoc(attr.description, "sm")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Events after attributes, named as a listener is written
                    (`addEventListener("primitiv-tabs-change", ...)`), with the
                    event type in the type column. */}
                {element.events.map((event) => (
                  <TableRow key={`event-${event.name}`}>
                    <TableCell>
                      <span className="docs-prop-name">{event.name}</span> (event)
                    </TableCell>
                    <TableCell>
                      <InlineCode size="sm">{event.type}</InlineCode>
                    </TableCell>
                    <TableCell>
                      <span className="docs-prop-description">
                        {renderDoc(event.description, "sm")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableScrollArea>
        )}
      </section>
    ))}
  </>
);

/**
 * Elements mode's reference for a component with no element: the registry
 * classes that select each option, since in plain markup the classes ARE the
 * component's API. Read from the contract, the same source as the props
 * tables' styled rows.
 */
export const ElementsClassReference = ({
  subs,
  rootClass,
}: {
  subs: readonly DocsSubComponent[];
  rootClass: string;
}) => {
  const rows = subs.flatMap((sub) =>
    (sub.contractProps ?? []).flatMap((prop) =>
      Object.entries(prop.classes ?? {}).map(([option, className]) => ({
        modifier: prop.name,
        option,
        className,
        isDefault: prop.default === option,
      })),
    ),
  );
  return (
    <>
      <p className="docs-prop-extends">
        Every element carries <InlineCode size="sm">{`.${rootClass}`}</InlineCode>
        , plus one class from each row group below. The defaults are what the
        printed markup uses.
      </p>
      {rows.length > 0 && (
        <TableScrollArea>
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeader scope="col">Modifier</TableHeader>
                <TableHeader scope="col">Option</TableHeader>
                <TableHeader scope="col">Class</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.className}>
                  <TableCell>
                    <span className="docs-prop-name">{row.modifier}</span>
                  </TableCell>
                  <TableCell>
                    {row.option}
                    {row.isDefault ? " (default)" : ""}
                  </TableCell>
                  <TableCell>
                    <InlineCode size="sm">{`.${row.className}`}</InlineCode>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollArea>
      )}
    </>
  );
};
