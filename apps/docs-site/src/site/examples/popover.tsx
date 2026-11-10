"use client";

import { useId, type CSSProperties, type ReactNode } from "react";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/popover";
import { Button } from "@/components/button";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "sm" | "md" | "lg" | "xl";
type Placement =
  | "top" | "top-start" | "top-end"
  | "right" | "right-start" | "right-end"
  | "bottom" | "bottom-start" | "bottom-end"
  | "left" | "left-start" | "left-end";

const PARTS = ["Trigger", "Content", "Title", "Description", "Close"] as const;

/** A registry Button as Elements markup, with the label span the React wrapper adds. */
const button = (label: string, variant: string, size = "md") =>
  `<button type="button" class="primitiv-button primitiv-button--${variant} primitiv-button--${size}"><span class="primitiv-button__label">${label}</span></button>`;

/**
 * One popover as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add popover --surface elements` prints. The
 * root holds the state in `open`; the trigger and close wrap real buttons, the
 * content element IS the panel (so the registry classes sit on it), and it
 * carries `popover="auto"` so it is hidden before the script loads. There is
 * no anchor wiring: the element shows the panel with its trigger as source,
 * which makes the trigger its implicit anchor.
 */
const elementsPopover = ({
  size = "md",
  placement = "bottom",
  trigger,
  triggerSize = "md",
  title,
  description,
  closeLabel = "Close",
  closeVariant = "ghost",
}: {
  size?: string;
  placement?: string;
  trigger: string;
  triggerSize?: string;
  title: string;
  description: string;
  closeLabel?: string;
  closeVariant?: string;
}) =>
  [
    `<primitiv-popover>`,
    `  <primitiv-popover-trigger>`,
    `    ${button(trigger, "secondary", triggerSize)}`,
    `  </primitiv-popover-trigger>`,
    `  <primitiv-popover-content class="primitiv-popover primitiv-popover--${size} primitiv-popover--${placement}" popover="auto">`,
    `    <primitiv-popover-title><h2 class="primitiv-popover__title">${title}</h2></primitiv-popover-title>`,
    `    <primitiv-popover-description><p class="primitiv-popover__description">${description}</p></primitiv-popover-description>`,
    `    <primitiv-popover-close>`,
    `      ${button(closeLabel, closeVariant, "sm")}`,
    `    </primitiv-popover-close>`,
    `  </primitiv-popover-content>`,
    `</primitiv-popover>`,
  ].join("\n");

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Popover", componentId: "popover", parts: PARTS });

/* Same anchor wiring as Tooltip — a unique anchor-name ↔ position-anchor pair.
   `useId()`'s colons are invalid in a CSS <dashed-ident>, so hyphenate them. */
const toAnchorName = (id: string) => `--pop${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const anchorNameStyle = (n: string) => ({ anchorName: n }) as CSSProperties;
const positionAnchorStyle = (n: string) => ({ positionAnchor: n }) as CSSProperties;

/**
 * A docs popover that wires the anchor pair and is genuinely click-to-open. The
 * Popover opens via JS (not the native `popovertarget` invoker), so there is no
 * implicit anchor — the panel needs an explicit `anchor-name` on the trigger and
 * a matching `position-anchor` on the content, or it lands top-left.
 */
const DocsPopover = ({
  buttonLabel,
  title,
  description,
  size,
  placement,
  buttonSize,
  confirmLabel = "Close",
  confirmVariant = "ghost",
}: {
  buttonLabel: ReactNode;
  title: ReactNode;
  description: ReactNode;
  size?: Size;
  placement?: Placement;
  buttonSize?: "xs" | "sm" | "md" | "lg" | "xl";
  confirmLabel?: string;
  confirmVariant?: "ghost" | "primary";
}) => {
  const anchor = toAnchorName(useId());
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size={buttonSize} style={anchorNameStyle(anchor)}>
          {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent size={size} placement={placement} style={positionAnchorStyle(anchor)}>
        <PopoverTitle>{title}</PopoverTitle>
        <PopoverDescription>{description}</PopoverDescription>
        <PopoverClose asChild>
          <Button variant={confirmVariant} size="sm">
            {confirmLabel}
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Popover's page content.
 *
 * A non-modal floating panel on the native HTML Popover API — click to open,
 * click outside (light dismiss) or Escape to close. Genuinely interactive
 * (click the trigger); no tooltips-pinned-open here. Like Tooltip it needs a
 * unique `anchor-name` ↔ `position-anchor` pair, wired per instance.
 * `placement` (13 values) is shown in its own example.
 */
export const popoverSpec: ComponentSpec = {
  playground: {
    component: "Popover",
    excludeControls: ["placement"],
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsPopover({
          size: values.size,
          trigger: "Open popover",
          title: "Notifications",
          description: "You have 3 unread messages.",
        });
      const p = partNamer(mode, "Popover");
      const size = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode),
        ``,
        `<${p("Root")}>`,
        `  <${p("Trigger")} asChild>`,
        `    {/* wire a unique anchor-name ↔ position-anchor pair */}`,
        `    <button style={{ anchorName: "--pop" }}>Open popover</button>`,
        `  </${p("Trigger")}>`,
        `  <${p("Content")}${size} style={{ positionAnchor: "--pop" }}>`,
        `    <${p("Title")}>Notifications</${p("Title")}>`,
        `    <${p("Description")}>You have 3 unread messages.</${p("Description")}>`,
        `    <${p("Close")} asChild><button>Close</button></${p("Close")}>`,
        `  </${p("Content")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => (
      <DocsPopover
        buttonLabel="Open popover"
        title="Notifications"
        description="You have 3 unread messages."
        size={values.size as Size}
      />
    ),
  },

  anatomyMeta:
    "`Popover.Root` owns the open state; `Popover.Trigger` is the button that toggles it; `Popover.Content` is the panel, holding an optional `Popover.Title` + `Popover.Description` (wired to the panel as its accessible name/description) and a `Popover.Close`. Positioning is CSS anchor positioning, which you wire — a unique `anchor-name` on the trigger, a matching `position-anchor` on the content (`Popover.Anchor` lets you anchor to a different element than the trigger).",
  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-popover>`,
            `  <primitiv-popover-trigger><button type="button"></button></primitiv-popover-trigger>`,
            `  <primitiv-popover-content popover="auto">`,
            `    <primitiv-popover-title><h2></h2></primitiv-popover-title>`,
            `    <primitiv-popover-description><p></p></primitiv-popover-description>`,
            `    <primitiv-popover-close><button type="button"></button></primitiv-popover-close>`,
            `  </primitiv-popover-content>`,
            `</primitiv-popover>`,
          ].join("\n");
        const p = partNamer(mode, "Popover");
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")} />`,
          `  <${p("Content")}>`,
          `    <${p("Title")} />`,
          `    <${p("Description")} />`,
          `    <${p("Close")} />`,
          `  </${p("Content")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The trigger is a button, so Space/Enter open it. Once open, focus moves into the panel; Escape closes it and returns focus to the trigger. It is non-modal — Tab can leave the panel — and clicking outside light-dismisses it.",
  keyboard: [
    { keys: ["Enter", "Space"], behaviour: "Open the popover from the focused trigger." },
    { keys: ["Escape"], behaviour: "Close the popover and return focus to the trigger." },
    { keys: ["Tab"], behaviour: "Move through the panel's focusable content; leaving it does not force it closed (non-modal)." },
  ],

  examples: [
    {
      id: "basic",
      title: "A titled panel",
      render: () => (
        <InteractiveExample
          elementsCaption="**Click the trigger** to open a small panel of rich content — a form, a set of details, a menu of links. The heading and paragraph inside `<primitiv-popover-title>` and `<primitiv-popover-description>` become the panel's accessible name and description, and the button inside `<primitiv-popover-close>` dismisses it. Click outside or press Escape to close. Nothing places it by hand: the element shows the panel with its trigger as the source, which makes the trigger its implicit anchor, so the placement class does the rest."
          caption="**Click the trigger** to open a small panel of rich content — a form, a set of details, a menu of links. `Popover.Title` and `Popover.Description` become the panel's accessible name and description, and `Popover.Close` dismisses it. Click outside or press Escape to close. The anchor pair (a unique `anchor-name` on the trigger, matching `position-anchor` on the content) is what places it."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsPopover({
                trigger: "Share",
                title: "Share this page",
                description: "Anyone with the link can view it.",
                closeLabel: "Done",
                closeVariant: "primary",
              });
            const p = partNamer(mode, "Popover");
            return [
              imports(mode),
              ``,
              `<${p("Root")}>`,
              `  <${p("Trigger")} asChild>`,
              `    <button style={{ anchorName: "--share" }}>Share</button>`,
              `  </${p("Trigger")}>`,
              `  <${p("Content")} style={{ positionAnchor: "--share" }}>`,
              `    <${p("Title")}>Share this page</${p("Title")}>`,
              `    <${p("Description")}>Anyone with the link can view it.</${p("Description")}>`,
              `    <${p("Close")} asChild><button>Done</button></${p("Close")}>`,
              `  </${p("Content")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <DocsPopover
              buttonLabel="Share"
              title="Share this page"
              description="Anyone with the link can view it."
              confirmLabel="Done"
              confirmVariant="primary"
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "placement",
      title: "Placement",
      render: () => (
        <InteractiveExample
          elementsPreview={() =>
            [
              `<div class="docs-example-row">`,
              ...(["top", "right", "bottom", "left"] as const).map((placement) =>
                elementsPopover({
                  size: "sm",
                  placement,
                  trigger: placement,
                  triggerSize: "sm",
                  title: placement,
                  description: `Opens to the ${placement}.`,
                }),
              ),
              `</div>`,
            ].join("\n")
          }
          elementsCaption="The placement is a class on the panel — `primitiv-popover--top`, `--right-start`, `--bottom-end` and the rest of the twelve — that sets where it opens relative to the trigger. It flips to the opposite side when there is not room, so a bottom popover near the viewport floor opens upward instead. **Click each trigger** to see it."
          caption="`placement` sets where the panel opens relative to the trigger — the same 13 values as Tooltip (`top`/`right`/`bottom`/`left` × `-start`/`-end`). It flips to the opposite side when there is not room, so a `bottom` popover near the viewport floor opens upward instead. **Click each trigger** to see it."
          code={(_density, mode) => {
            if (mode === "elements")
              return `<primitiv-popover-content class="primitiv-popover primitiv-popover--sm primitiv-popover--right" popover="auto">…</primitiv-popover-content>`;
            const p = partNamer(mode, "Popover");
            return [
              imports(mode),
              ``,
              `<${p("Content")} placement="right" style={{ positionAnchor: "--pop" }}>`,
              `  …`,
              `</${p("Content")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              {(["top", "right", "bottom", "left"] as const).map((pl) => (
                <DocsPopover
                  key={pl}
                  buttonSize="sm"
                  buttonLabel={pl}
                  title={pl}
                  description={`Opens to the ${pl}.`}
                  placement={pl as Placement}
                  size="sm"
                />
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A non-modal floating panel anchored to a trigger, built on the native Popover API: `<primitiv-popover>` shows its panel in the top layer with the trigger as its anchor, moves focus in, closes it on Escape or a press outside, and hands focus back.",
    anatomyMeta:
      "Seven elements. `<primitiv-popover>` holds the state in its `open` attribute. The trigger and close wrap the `<button>` you write, the title and description wrap a heading and a paragraph, and the content element is the panel itself, so the registry classes go on it. `<primitiv-popover-anchor>` is optional: wrap another element in it to anchor the panel there instead of to the trigger.",
    keyboardMeta:
      "The trigger is a button, so Space and Enter open it. Once open, focus moves into the panel; Escape closes it and returns focus to the trigger. It is non-modal — Tab can leave the panel — and a press outside light-dismisses it.",
    keyboard: [
      { keys: ["Enter", "Space"], behaviour: "Open the popover from the focused trigger." },
      { keys: ["Escape"], behaviour: "Close the popover and return focus to the trigger. In a popover nested inside another, only the inner one closes." },
      { keys: ["Tab"], behaviour: "Move through the panel's focusable content; leaving it does not force it closed (non-modal)." },
    ],
    accessibility: [
      "The panel is a native `popover=\"auto\"` in the top layer, so it paints above the rest of the page whatever the `z-index` or `overflow: hidden` of its ancestors. Write `popover=\"auto\"` in your markup: the panel is then hidden before the script loads.",
      "The element gives the panel `role=\"dialog\"`, and the trigger's button `aria-haspopup=\"dialog\"`, `aria-expanded` and `aria-controls`. The heading and paragraph inside the title and description become the panel's `aria-labelledby` and `aria-describedby`, so a screen reader announces what opened.",
      "It is **non-modal**: it does not trap focus, and Tab can move back into the page. Focus moves into the panel on open and returns to the trigger on Escape, so a keyboard user is taken to the content and brought back.",
      "Every user-driven change fires a cancelable `primitiv-popover-change` first, a light dismiss included — `preventDefault()` keeps it open.",
      "Reach for Modal instead when the task must be completed or dismissed before anything else — a popover is for optional, in-context content, not a blocking decision.",
    ],
  },

  accessibility: [
    "`Popover.Content` is a native `[popover]` in the top layer, so it always paints above the rest of the page regardless of `z-index` or `overflow: hidden` ancestors — no stacking-context surprises.",
    "`Popover.Title` and `Popover.Description` are wired to the panel as its `aria-labelledby`/`aria-describedby`, so a screen reader announces what the popover is on open rather than reading a bare panel.",
    "It is **non-modal**: it does not trap focus, and Tab can move out of the panel back into the page. Escape closes it and returns focus to the trigger; clicking outside light-dismisses it.",
    "Focus moves into the panel on open and returns to the trigger on close, so a keyboard user is taken to the content and brought back — never stranded where the panel used to be.",
    "Reach for `Modal` instead when the task must be completed or dismissed before anything else — a popover is for optional, in-context content, not a blocking decision.",
  ],
};
