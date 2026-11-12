"use client";

import { useId, type CSSProperties, type ReactNode } from "react";

import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";
import { Button } from "@/components/button";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Tone = "default" | "inverted";
type Size = "sm" | "md" | "lg" | "xl";
type Placement =
  | "top" | "top-start" | "top-end"
  | "right" | "right-start" | "right-end"
  | "bottom" | "bottom-start" | "bottom-end"
  | "left" | "left-start" | "left-end";

const PARTS = ["Provider", "Trigger", "Portal", "Content", "Arrow"] as const;

/** A registry Button as Elements markup, with the label span the React wrapper adds. */
const button = (label: string, size = "md") =>
  `<button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--${size}"><span class="primitiv-button__label">${label}</span></button>`;

/**
 * One tooltip as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add tooltip --surface elements` prints. The
 * root holds the state in `open`; the trigger wraps a real button, the content
 * element IS the bubble (so the registry classes sit on it), and it carries
 * `popover="manual"` so it is hidden before the script loads. There is no
 * anchor wiring: the element shows the bubble with its trigger as source,
 * which makes the trigger its implicit anchor.
 */
const elementsTooltip = ({
  tone = "default",
  size = "md",
  placement = "top",
  trigger,
  triggerSize = "md",
  label,
}: {
  tone?: string;
  size?: string;
  placement?: string;
  trigger: string;
  triggerSize?: string;
  label: string;
}) =>
  [
    `<primitiv-tooltip>`,
    `  <primitiv-tooltip-trigger>`,
    `    ${button(trigger, triggerSize)}`,
    `  </primitiv-tooltip-trigger>`,
    `  <primitiv-tooltip-content class="primitiv-tooltip primitiv-tooltip--${tone} primitiv-tooltip--${size} primitiv-tooltip--${placement}" popover="manual">`,
    `    ${label}`,
    `    <primitiv-tooltip-arrow class="primitiv-tooltip__arrow"></primitiv-tooltip-arrow>`,
    `  </primitiv-tooltip-content>`,
    `</primitiv-tooltip>`,
  ].join("\n");

/** Several tooltips side by side, in the row the React examples lay them out in. */
const elementsRow = (tooltips: string[]) => [`<div class="docs-example-row">`, ...tooltips, `</div>`].join("\n");

const imports = (mode: Mode) =>
  importBlock({ mode, component: "Tooltip", componentId: "tooltip", parts: PARTS });

/* `useId()` yields `:r0:`-style ids whose colons are invalid in a CSS
   <dashed-ident>, so map every non-ident char to a hyphen (the same fix
   NavigationMenu/BreadcrumbOverflow make). */
const toAnchorName = (id: string) => `--tip${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
/* `anchor-name` / `position-anchor` are newer than the CSSProperties typings. */
const anchorNameStyle = (n: string) => ({ anchorName: n }) as CSSProperties;
const positionAnchorStyle = (n: string) => ({ positionAnchor: n }) as CSSProperties;

/**
 * A docs tooltip that wires the anchor pair the Tooltip requires — a unique
 * `anchor-name` on the trigger and a matching `position-anchor` on the content,
 * per instance. The Tooltip leaves this wiring to the consumer (CSS anchor
 * positioning), so without it the bubble lands at the top-left of the viewport.
 * Genuinely interactive — it opens on hover / focus of the trigger, as a real
 * tooltip does.
 */
const DocsTooltip = ({
  buttonLabel,
  label,
  tone,
  size,
  placement,
  buttonSize,
}: {
  buttonLabel: ReactNode;
  label: ReactNode;
  tone?: Tone;
  size?: Size;
  placement?: Placement;
  buttonSize?: "xs" | "sm" | "md" | "lg" | "xl";
}) => {
  const anchor = toAnchorName(useId());
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="secondary" size={buttonSize} style={anchorNameStyle(anchor)}>
          {buttonLabel}
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          tone={tone}
          size={size}
          placement={placement}
          style={positionAnchorStyle(anchor)}
        >
          {label}
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

/**
 * Tooltip's page content.
 *
 * A deferred, non-modal label anchored to a trigger. Every tooltip here is
 * genuinely interactive — hover or focus the trigger to open it — because a
 * pinned-open tooltip misrepresents the component. The playground trigger scales
 * with `size`; `placement` (13 values) is excluded and shown in its own example.
 * Snippets are mode-aware and include the required anchor-name / position-anchor
 * wiring.
 */
export const tooltipSpec: ComponentSpec = {
  playground: {
    component: "Tooltip",
    excludeControls: ["placement"],
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsTooltip({
          tone: values.tone,
          size: values.size,
          trigger: "Hover me",
          triggerSize: values.size,
          label: "Save your changes",
        });
      const p = partNamer(mode, "Tooltip");
      const tone = contractAttr({ mode, prop: "tone", value: values.tone });
      const size = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode),
        ``,
        `<${p("Provider")}>`,
        `  <${p("Root")}>`,
        `    <${p("Trigger")} asChild>`,
        `      {/* wire a unique anchor-name ↔ position-anchor pair */}`,
        `      <button style={{ anchorName: "--tip" }}>Hover me</button>`,
        `    </${p("Trigger")}>`,
        `    <${p("Portal")}>`,
        `      <${p("Content")}${tone}${size} style={{ positionAnchor: "--tip" }}>`,
        `        Save your changes`,
        `        <${p("Arrow")} />`,
        `      </${p("Content")}>`,
        `    </${p("Portal")}>`,
        `  </${p("Root")}>`,
        `</${p("Provider")}>`,
      ].join("\n");
    },
    render: (values) => (
      <TooltipProvider>
        <DocsTooltip
          buttonLabel="Hover me"
          label="Save your changes"
          tone={values.tone as Tone}
          size={values.size as Size}
          buttonSize={values.size as Size}
        />
      </TooltipProvider>
    ),
  },

  anatomyMeta:
    "Wrap the app (or a group) in one `Tooltip.Provider` to share the open delay, then per tooltip: `Tooltip.Root` holds the open state, `Tooltip.Trigger` is the anchor (usually `asChild` over your own control), and `Tooltip.Portal` renders `Tooltip.Content` (with an optional `Tooltip.Arrow`) in the top layer. Positioning is CSS anchor positioning, which you wire — a unique `anchor-name` on the trigger, a matching `position-anchor` on the content.",
  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-tooltip-provider>`,
            `  <primitiv-tooltip>`,
            `    <primitiv-tooltip-trigger><button type="button"></button></primitiv-tooltip-trigger>`,
            `    <primitiv-tooltip-content popover="manual">`,
            `      <primitiv-tooltip-arrow></primitiv-tooltip-arrow>`,
            `    </primitiv-tooltip-content>`,
            `  </primitiv-tooltip>`,
            `</primitiv-tooltip-provider>`,
          ].join("\n");
        const p = partNamer(mode, "Tooltip");
        return [
          `<${p("Provider")}>`,
          `  <${p("Root")}>`,
          `    <${p("Trigger")} />`,
          `    <${p("Portal")}>`,
          `      <${p("Content")}>`,
          `        <${p("Arrow")} />`,
          `      </${p("Content")}>`,
          `    </${p("Portal")}>`,
          `  </${p("Root")}>`,
          `</${p("Provider")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "A tooltip is a label, not a menu — it has no keys of its own. What matters is that it opens on **focus** (immediately, no delay) as well as hover, so a keyboard user gets the same hint, and Escape dismisses it without moving focus.",
  keyboard: [
    { keys: ["Tab"], behaviour: "Move focus to the trigger — the tooltip opens immediately on focus." },
    { keys: ["Escape"], behaviour: "Dismiss the tooltip while keeping focus on the trigger." },
  ],

  examples: [
    {
      id: "basic",
      title: "On a control",
      render: () => (
        <InteractiveExample
          elementsCaption="The usual use: a `<primitiv-tooltip-trigger>` around a real control, with a short label in the content. **Hover or focus the button** to open it — on hover after a delay, on focus immediately. Nothing places it by hand: the element shows the bubble with its trigger as the source, which makes the trigger its implicit anchor, so the placement class does the rest."
          caption="The usual use: an `asChild` trigger over a real control, with a short label in the content. **Hover or focus the button** to open it — on hover after a delay, on focus immediately. Note the anchor pair: a unique `anchor-name` on the trigger and a matching `position-anchor` on the content is what places the bubble; the component leaves that CSS to you."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsTooltip({ trigger: "Hover or focus me", label: "Opens on hover and focus" });
            const p = partNamer(mode, "Tooltip");
            return [
              imports(mode),
              ``,
              `<${p("Provider")}>`,
              `  <${p("Root")}>`,
              `    <${p("Trigger")} asChild>`,
              `      <button aria-label="Settings" style={{ anchorName: "--settings" }}>⚙</button>`,
              `    </${p("Trigger")}>`,
              `    <${p("Portal")}>`,
              `      <${p("Content")} style={{ positionAnchor: "--settings" }}>`,
              `        Settings<${p("Arrow")} />`,
              `      </${p("Content")}>`,
              `    </${p("Root")}>`,
              `  </${p("Portal")}>`,
              `</${p("Provider")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <TooltipProvider>
              <DocsTooltip
                buttonLabel="Hover or focus me"
                label="Opens on hover and focus"
              />
            </TooltipProvider>
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
            elementsRow(
              (["top", "right", "bottom", "left"] as const).map((placement) =>
                elementsTooltip({ placement, trigger: placement, triggerSize: "sm", label: placement }),
              ),
            )
          }
          elementsCaption="The placement is a class on the bubble — `primitiv-tooltip--top`, `--right-start`, `--bottom-end` and the rest of the twelve — that sets where it sits relative to the trigger. The arrow follows. It is a preference: if there is not room on that side, the tooltip flips to the opposite edge. **Hover or focus** each trigger to see it."
          caption="`placement` sets where the content sits relative to the trigger — `top`/`right`/`bottom`/`left` plus `-start`/`-end` alignments (13 in all). The arrow follows. It is a preference: if there is not room on that side, the tooltip flips to the opposite edge automatically. **Hover or focus** each trigger to see it."
          code={(_density, mode) => {
            if (mode === "elements")
              return `<primitiv-tooltip-content class="primitiv-tooltip primitiv-tooltip--default primitiv-tooltip--md primitiv-tooltip--right" popover="manual">...</primitiv-tooltip-content>`;
            const p = partNamer(mode, "Tooltip");
            return [
              imports(mode),
              ``,
              `<${p("Content")} placement="right" style={{ positionAnchor: "--tip" }}>`,
              `  ...<${p("Arrow")} />`,
              `</${p("Content")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <TooltipProvider>
              <div
                style={{
                  display: "flex",
                  gap: "3.5rem",
                  padding: "2.5rem 1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {(["top", "right", "bottom", "left"] as const).map((pl) => (
                  <DocsTooltip
                    key={pl}
                    buttonSize="sm"
                    buttonLabel={pl}
                    label={pl}
                    placement={pl}
                  />
                ))}
              </div>
            </TooltipProvider>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "tones",
      title: "Tones",
      render: () => (
        <InteractiveExample
          elementsPreview={() =>
            elementsRow(
              (["default", "inverted"] as const).map((tone) =>
                elementsTooltip({ tone, trigger: tone, triggerSize: "sm", label: tone }),
              ),
            )
          }
          elementsCaption="Two tones, as a class on the bubble: `primitiv-tooltip--default` is a high-contrast chip that inverts with the theme, `primitiv-tooltip--inverted` a surface-coloured bubble for dark or busy backgrounds. Both carry the arrow. **Hover or focus** a trigger to see the tooltip."
          caption="Two tones: `default` is a surface-coloured bubble that sits quietly against the page, `inverted` is a high-contrast dark chip for when the tooltip needs to read over busy or image content. Both carry the arrow. **Hover or focus** a trigger to see the tooltip."
          code={(_density, mode) => {
            if (mode === "elements")
              return `<primitiv-tooltip-content class="primitiv-tooltip primitiv-tooltip--inverted primitiv-tooltip--md primitiv-tooltip--top" popover="manual">...</primitiv-tooltip-content>`;
            const p = partNamer(mode, "Tooltip");
            return [
              imports(mode),
              ``,
              `<${p("Content")}${contractAttr({ mode, prop: "tone", value: "inverted" })} style={{ positionAnchor: "--tip" }}>`,
              `  ...`,
              `</${p("Content")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <TooltipProvider>
              <div style={{ display: "flex", gap: "3.5rem", padding: "2rem 1rem", justifyContent: "center" }}>
                {(["default", "inverted"] as const).map((tone) => (
                  <DocsTooltip
                    key={tone}
                    buttonSize="sm"
                    buttonLabel={tone}
                    label={tone}
                    tone={tone}
                  />
                ))}
              </div>
            </TooltipProvider>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A short description of its trigger, shown on hover after a delay and on focus at once: `<primitiv-tooltip>` shows the bubble as a native `popover=\"manual\"` in the top layer with the trigger as its anchor, and closes it when the pointer leaves, on blur, on Escape and on a press outside.",
    anatomyMeta:
      "Five elements. `<primitiv-tooltip>` holds the state in its `open` attribute. The trigger wraps the `<button>` you write, the content element is the bubble itself, so the registry classes go on it, and `<primitiv-tooltip-arrow>` inside it is the pointer. `<primitiv-tooltip-provider>` is optional: the tooltips inside it share its `delay-duration` and one skip-delay window, and the tooltips outside any provider share a document-wide one.",
    keyboardMeta:
      "A tooltip is a label, not a menu — it has no keys of its own. It opens on **focus** (immediately, no delay) as well as hover, so a keyboard user gets the same hint, and Escape dismisses it without moving focus.",
    keyboard: [
      { keys: ["Tab"], behaviour: "Move focus to the trigger — the tooltip opens immediately on focus, and closes when focus leaves." },
      { keys: ["Escape"], behaviour: "Dismiss the tooltip while keeping focus on the trigger." },
    ],
    accessibility: [
      "The tooltip opens on **focus**, not only hover, so a keyboard user gets the same hint as a pointer user — a hover-only tooltip is invisible to anyone not using a mouse.",
      "The element gives the bubble `role=\"tooltip\"` and an id, and the trigger's button `aria-describedby` pointing at it, so the label is announced as a description of the control.",
      "The bubble is a native `popover=\"manual\"` in the top layer, so it paints above the rest of the page whatever the `z-index` or `overflow: hidden` of its ancestors. Write `popover=\"manual\"` in your markup: the bubble is then hidden before the script loads.",
      "The pointer can cross from the trigger onto the bubble without it closing, so its text can be read under a magnifier; set `disable-hoverable-content` to close it as soon as the pointer leaves the trigger.",
      "Every user-driven change fires a cancelable `primitiv-tooltip-change` first — `preventDefault()` keeps it as it was.",
      "A tooltip is a supplement, never the only source of a control's name: an icon-only button still needs its own `aria-label`, because the tooltip may never open for touch users.",
    ],
  },

  accessibility: [
    "The tooltip opens on **focus**, not only hover, so a keyboard user gets the same hint as a pointer user — a hover-only tooltip is invisible to anyone not using a mouse.",
    "`Tooltip.Content` is wired to the trigger by `aria-describedby`, so the label is announced as a description of the control rather than as loose text elsewhere on the page.",
    "It is non-modal and does not trap focus or steal it — the tooltip describes the focused control, so moving focus away closes it. Escape dismisses it while keeping focus put.",
    "A tooltip is a supplement, never the only source of a control's name: an icon-only button still needs its own `aria-label`, because the tooltip may never open for touch users.",
    "One `Tooltip.Provider` shares an open delay across a group, and once one tooltip is open the rest open instantly for a short window — so scanning a toolbar does not mean waiting out the delay on every button.",
  ],
};
