"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/components/collapsible";
import { InlineCode } from "@/components/inline-code";
import { Stack } from "@/components/stack";
import { ChevronDown } from "@primitiv-ui/icons";
import { useState } from "react";

import type { DocsCustomProperty } from "@/lib/docs-data";

/**
 * How tall the closed panel is, in px.
 *
 * `collapsedHeight` clamps the panel instead of hiding it, so the list is one
 * Collapsible showing a clipped preview rather than two lists either side of a
 * boundary. Sized to show roughly six chips, which is what the Figma frame
 * previews before its "... N in this group".
 */
const PREVIEW_HEIGHT = 200;

/**
 * Splits the flat contract list into the parts it dresses.
 *
 * Derived from the property NAMES rather than hand-listed, because the naming is
 * already systematic: every knob is `--primitiv-<root>-<part>-<what>`, so the
 * segment after the component's own name is the part. Hand-listing 58 names into
 * four buckets would be a second source of truth that drifts the moment a knob
 * is added.
 *
 * `order` fixes the reading order (frame before panel before row) rather than
 * letting first-appearance decide, because the stylesheet's declaration order is
 * an implementation detail. Anything unrecognised falls into the base group, so a
 * new part appears rather than vanishing — the failure mode of a name-driven
 * split has to be "shows up in the wrong group", never "silently dropped".
 */
const GROUPS = [
  { key: "base", title: "Control frame", match: () => true },
  {
    key: "content",
    title: "Panel",
    match: (rest: string) => rest.startsWith("content-"),
  },
  {
    key: "item",
    title: "Item",
    match: (rest: string) => rest.startsWith("item-") || rest === "item",
  },
  {
    key: "group",
    title: "Group label & separator",
    match: (rest: string) =>
      rest.startsWith("group-") || rest.startsWith("separator-"),
  },
] as const;

const groupFor = (name: string, rootClass: string): string => {
  // `.primitiv-select` → the `--primitiv-select-` prefix its knobs all share.
  const prefix = `--${rootClass.replace(/^\./, "")}-`;
  const rest = name.startsWith(prefix) ? name.slice(prefix.length) : name;
  // Later, more specific groups win over the catch-all base group.
  return (
    [...GROUPS].reverse().find((g) => g.match(rest))?.title ?? GROUPS[0].title
  );
};

export const StylingContract = ({
  properties,
  rootClass,
}: {
  properties: readonly DocsCustomProperty[];
  rootClass: string;
}) => {
  // Controlled, so the trigger label can say what it will do next.
  const [open, setOpen] = useState(false);

  const grouped = GROUPS.map((g) => ({
    title: g.title,
    properties: properties.filter((p) => groupFor(p.name, rootClass) === g.title),
  })).filter((g) => g.properties.length > 0);

  // One group is not a grouping — a lone "Control frame" overline above the only
  // list on the page labels nothing. Button (15 knobs, all on the frame) lands
  // here; Select (58 across four parts) does not.
  const showGroupLabels = grouped.length > 1;

  return (
    <Collapsible
      variant="inline"
      size="sm"
      open={open}
      onOpenChange={setOpen}
    >
      {/*
       * ONE Collapsible over the whole list, using `collapsedHeight` — the
       * clamped-preview dressing rather than the hide-everything default. The
       * closed panel shows a clipped preview with the component's own bottom
       * fade reading over the clamp, so the truncation is visibly a truncation
       * rather than a list that happens to stop.
       *
       * `variant="inline"` because this sits inside an existing section: the
       * `card` dressing would draw a second box around content the page frames.
       */}
      <CollapsibleContent collapsedHeight={PREVIEW_HEIGHT}>
        <Stack gap="lg" align="start">
          {grouped.map((group) => (
            <Stack key={group.title} gap="sm" align="start">
              {showGroupLabels && (
                <p className="docs-overline">{group.title}</p>
              )}
              {/* One chip per line, per the frame — a wrapping row would let a
                  short name and a 40-character one share a line and the column
                  of prefixes stops being scannable. */}
              <Stack gap="sm" align="start">
                {group.properties.map((prop) => (
                  <InlineCode key={prop.name} size="sm">
                    {prop.name}
                  </InlineCode>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CollapsibleContent>

      {/* The trigger follows the content, which is the read-more reading order —
          you meet the clipped list, then the way to see the rest. */}
      <CollapsibleTrigger>
        {open ? "Show fewer" : `Show all ${properties.length}`}
        {/* TriggerIcon is a slot for your own glyph — it supplies the
            open/closed rotation, not the artwork. `size="100%"` fills the
            wrapper the component sizes via
            `--primitiv-collapsible-trigger-icon-size`, rather than hardcoding a
            pixel value beside a token. */}
        <CollapsibleTriggerIcon>
          <ChevronDown size="100%" />
        </CollapsibleTriggerIcon>
      </CollapsibleTrigger>
    </Collapsible>
  );
};
