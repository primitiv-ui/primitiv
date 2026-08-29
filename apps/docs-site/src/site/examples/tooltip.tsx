"use client";

import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

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
 * per instance — and can be pinned open for the page. The Tooltip leaves this
 * wiring to the consumer (CSS anchor positioning), so without it the bubble
 * lands at the top-left of the viewport.
 */
const DocsTooltip = ({
  buttonLabel,
  label,
  tone,
  size,
  placement,
  buttonSize,
  pinned = false,
}: {
  buttonLabel: ReactNode;
  label: ReactNode;
  tone?: Tone;
  size?: Size;
  placement?: Placement;
  buttonSize?: "xs" | "sm" | "md" | "lg" | "xl";
  pinned?: boolean;
}) => {
  const anchor = toAnchorName(useId());
  // Open AFTER mount so the static prerender never renders the portal (an open
  // tooltip renders `createPortal(document.body)`, which throws on the server).
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (pinned) setOpen(true);
  }, [pinned]);

  return (
    <Tooltip {...(pinned ? { open, onOpenChange: () => {} } : {})}>
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
 * A deferred, non-modal label anchored to a trigger (hover / focus). The
 * playground pins the tooltip open so `tone`/`size` are visible without
 * hovering, and the trigger scales with `size`; `placement` (13 values) is
 * excluded and shown in its own example. Snippets are mode-aware and include the
 * required anchor-name / position-anchor wiring.
 */
export const tooltipSpec: ComponentSpec = {
  playground: {
    component: "Tooltip",
    excludeControls: ["placement"],
    snippet: (values, mode) => {
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
          pinned
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
          caption="The usual use: an `asChild` trigger over a real control, with a short label in the content. **Hover or focus the button** to open it — on hover after a delay, on focus immediately. Note the anchor pair: a unique `anchor-name` on the trigger and a matching `position-anchor` on the content is what places the bubble; the component leaves that CSS to you."
          code={(_density, mode) => {
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
          caption="`placement` sets where the content sits relative to the trigger — `top`/`right`/`bottom`/`left` plus `-start`/`-end` alignments (13 in all). The arrow follows. It is a preference: if there is not room on that side, the tooltip flips to the opposite edge automatically."
          code={(_density, mode) => {
            const p = partNamer(mode, "Tooltip");
            return [
              imports(mode),
              ``,
              `<${p("Content")} placement="right" style={{ positionAnchor: "--tip" }}>`,
              `  …<${p("Arrow")} />`,
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
                    pinned
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
          caption="Two tones: `default` is a surface-coloured bubble that sits quietly against the page, `inverted` is a high-contrast dark chip for when the tooltip needs to read over busy or image content. Both carry the arrow."
          code={(_density, mode) => {
            const p = partNamer(mode, "Tooltip");
            return [
              imports(mode),
              ``,
              `<${p("Content")}${contractAttr({ mode, prop: "tone", value: "inverted" })} style={{ positionAnchor: "--tip" }}>`,
              `  …`,
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
                    pinned
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

  accessibility: [
    "The tooltip opens on **focus**, not only hover, so a keyboard user gets the same hint as a pointer user — a hover-only tooltip is invisible to anyone not using a mouse.",
    "`Tooltip.Content` is wired to the trigger by `aria-describedby`, so the label is announced as a description of the control rather than as loose text elsewhere on the page.",
    "It is non-modal and does not trap focus or steal it — the tooltip describes the focused control, so moving focus away closes it. Escape dismisses it while keeping focus put.",
    "A tooltip is a supplement, never the only source of a control's name: an icon-only button still needs its own `aria-label`, because the tooltip may never open for touch users.",
    "One `Tooltip.Provider` shares an open delay across a group, and once one tooltip is open the rest open instantly for a short window — so scanning a toolbar does not mean waiting out the delay on every button.",
  ],
};
