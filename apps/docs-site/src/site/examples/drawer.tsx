"use client";

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { Close } from "@primitiv-ui/icons";

import { Button } from "@/components/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Width = "xs" | "sm" | "md" | "lg" | "xl";
type Side = "top" | "right" | "bottom" | "left";

/* Portal into the preview, not document.body, so the dialog stays under the
   density-scoped preview wrapper — same reason the Modal page does it. */
const PortalHostContext = createContext<HTMLElement | undefined>(undefined);
const PortalHost = ({ children }: { children: ReactNode }) => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <div ref={setHost} style={{ display: "contents" }}>
      <PortalHostContext.Provider value={host ?? undefined}>
        {children}
      </PortalHostContext.Provider>
    </div>
  );
};
/* Force-mounted so the drawer stays mounted while closed — what its slide-out
   needs; without it the dialog unmounts on close and snaps away. */
const Portal = ({ children, ...props }: ComponentProps<typeof DrawerPortal>) => {
  const host = useContext(PortalHostContext);
  return (
    <DrawerPortal container={host} forceMount {...props}>
      {children}
    </DrawerPortal>
  );
};

const imports = (mode: Mode, parts: readonly string[], button = false) =>
  [
    importBlock({ mode, component: "Drawer", componentId: "drawer", parts }),
    button && mode !== "headless"
      ? importBlock({ mode, component: "Button", componentId: "button" })
      : null,
  ]
    .filter(Boolean)
    .join("\n");

/* Header/Body/Footer are the copied file's layout regions — a plain <div> in
   headless mode, where `@primitiv-ui/react` exports no such part. */
const region = (mode: Mode, part: "Header" | "Body" | "Footer") =>
  mode === "headless" ? "div" : partNamer(mode, "Drawer")(part);

/** A registry Button as Elements markup, with the label span the React wrapper adds. */
const button = (label: string, variant: string, size = "md") =>
  `<button type="button" class="primitiv-button primitiv-button--${variant} primitiv-button--${size}"><span class="primitiv-button__label">${label}</span></button>`;

/**
 * One drawer as Elements markup (RFC 0033). A drawer has no element of its own
 * — React's Drawer delegates every part to Modal — so its markup is the
 * `<primitiv-modal>` elements around a `<dialog>` wearing the drawer classes,
 * in the shape `primitiv add drawer --surface elements` prints. `data-side` is
 * written on the dialog by hand: it is a styling hook the element never reads.
 */
const elementsDrawer = ({
  width = "md",
  side = "right",
  trigger = "Open drawer",
  triggerVariant = "primary",
  triggerSize = "md",
  title = "Filters",
  description = "Narrow the results — the drawer keeps the list behind it in view.",
  footer = true,
}: {
  width?: string;
  side?: Side;
  trigger?: string;
  triggerVariant?: string;
  triggerSize?: string;
  title?: string;
  description?: string;
  footer?: boolean;
} = {}) =>
  [
    `<primitiv-modal>`,
    `  <primitiv-modal-trigger>`,
    `    ${button(trigger, triggerVariant, triggerSize)}`,
    `  </primitiv-modal-trigger>`,
    `  <primitiv-modal-content>`,
    `    <dialog class="primitiv-drawer primitiv-drawer--${width}" data-side="${side}">`,
    `      <span class="primitiv-drawer__header">`,
    `        <primitiv-modal-title><h2 class="primitiv-drawer__title">${title}</h2></primitiv-modal-title>`,
    `        <primitiv-modal-close>`,
    `          <button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--sm primitiv-drawer__close" aria-label="Close">${glyph("close")}</button>`,
    `        </primitiv-modal-close>`,
    `      </span>`,
    `      <span class="primitiv-drawer__body">`,
    `        <primitiv-modal-description><p class="primitiv-drawer__description">${description}</p></primitiv-modal-description>`,
    `      </span>`,
    ...(footer
      ? [
          `      <span class="primitiv-drawer__footer">`,
          `        <primitiv-modal-close>`,
          `          ${button("Cancel", "secondary")}`,
          `        </primitiv-modal-close>`,
          `        <primitiv-modal-close>`,
          `          ${button("Apply", "primary")}`,
          `        </primitiv-modal-close>`,
          `      </span>`,
        ]
      : []),
    `    </dialog>`,
    `  </primitiv-modal-content>`,
    `</primitiv-modal>`,
  ].join("\n");

const SIDES = ["left", "right", "top", "bottom"] as const;

const CloseButton = () => (
  <DrawerClose asChild>
    <Button variant="ghost" size="sm" aria-label="Close">
      <Close size="100%" />
    </Button>
  </DrawerClose>
);

const PlaygroundPreview = ({ width, side }: { width: Width; side: Side }) => (
  <PortalHost>
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <Portal>
        <DrawerOverlay />
        <DrawerContent width={width} side={side}>
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <CloseButton />
          </DrawerHeader>
          <DrawerBody>
            <DrawerDescription>
              Narrow the results — the drawer keeps the list behind it in view.
            </DrawerDescription>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DrawerClose>
            <Button>Apply</Button>
          </DrawerFooter>
        </DrawerContent>
      </Portal>
    </Drawer>
  </PortalHost>
);

/**
 * Drawer's page content.
 *
 * A Modal dialog that slides in from a screen edge — a native `<dialog>`, so it
 * traps focus and inerts the background like Modal, but docks to an edge instead
 * of centring. Click-to-open. `width` is the cross-axis extent; `side` is the
 * edge it docks to. Header/Body/Footer are styled-copy regions (plain `<div>`s
 * in headless mode).
 */
export const drawerSpec: ComponentSpec = {
  playground: {
    component: "Drawer",
    /* `side` is a headless prop on Content, added as a spec control so the
       playground can move the drawer around the edges. */
    controls: [
      {
        name: "side",
        options: ["right", "left", "top", "bottom"],
        defaultValue: "right",
        description: "Screen edge the drawer docks to and slides in from.",
      },
    ],
    elementsPreview: (code) => withGlyphs(code),
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsDrawer({ width: values.width, side: values.side as Side });
      const p = partNamer(mode, "Drawer");
      const width = contractAttr({ mode, prop: "width", value: values.width });
      return [
        imports(mode, ["Trigger", "Portal", "Overlay", "Content", "Header", "Body", "Footer", "Title", "Description", "Close"], true),
        ``,
        `<${p("Root")}>`,
        ...(mode === "headless"
          ? [`  <${p("Trigger")}>Open drawer</${p("Trigger")}>`]
          : [`  <${p("Trigger")} asChild>`, `    <Button>Open drawer</Button>`, `  </${p("Trigger")}>`]),
        `  <${p("Portal")} forceMount>`,
        `    <${p("Overlay")} />`,
        `    <${p("Content")}${width} side="${values.side}">`,
        `      <${region(mode, "Header")}>`,
        `        <${p("Title")}>Filters</${p("Title")}>`,
        `      </${region(mode, "Header")}>`,
        `      <${region(mode, "Body")}>{/* ... */}</${region(mode, "Body")}>`,
        `      <${region(mode, "Footer")}>{/* ... */}</${region(mode, "Footer")}>`,
        `    </${p("Content")}>`,
        `  </${p("Portal")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => (
      <PlaygroundPreview width={values.width as Width} side={values.side as Side} />
    ),
  },

  anatomyMeta:
    "`Drawer.Root` owns the open state; `Drawer.Trigger` opens it; `Drawer.Portal` holds the `Drawer.Overlay` (backdrop) and the `Drawer.Content` (the sliding `<dialog>`, taking `width` + `side`). Inside, `Drawer.Header` / `Drawer.Body` / `Drawer.Footer` are the copied file's layout regions — `Drawer.Header` pairs a `Drawer.Title` with the close, `Drawer.Body` scrolls, `Drawer.Footer` holds the actions.",
  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-modal>`,
            `  <primitiv-modal-trigger><button type="button"></button></primitiv-modal-trigger>`,
            `  <primitiv-modal-content>`,
            `    <dialog class="primitiv-drawer" data-side="right">`,
            `      <primitiv-modal-title><h2></h2></primitiv-modal-title>`,
            `      <primitiv-modal-description><p></p></primitiv-modal-description>`,
            `      <primitiv-modal-close><button type="button"></button></primitiv-modal-close>`,
            `    </dialog>`,
            `  </primitiv-modal-content>`,
            `</primitiv-modal>`,
          ].join("\n");
        const p = partNamer(mode, "Drawer");
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")} />`,
          `  <${p("Portal")}>`,
          `    <${p("Overlay")} />`,
          `    <${p("Content")}>`,
          `      <${region(mode, "Header")}>`,
          `        <${p("Title")} />`,
          `        <${p("Close")} />`,
          `      </${region(mode, "Header")}>`,
          `      <${region(mode, "Body")} />`,
          `      <${region(mode, "Footer")} />`,
          `    </${p("Content")}>`,
          `  </${p("Portal")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "A drawer is a modal dialog, so it traps focus: Tab and Shift+Tab cycle within the panel and never reach the inert page behind it. Escape closes it and returns focus to the trigger; clicking the backdrop dismisses it too.",
  keyboard: [
    { keys: ["Enter", "Space"], behaviour: "Open the drawer from the focused trigger." },
    { keys: ["Escape"], behaviour: "Close the drawer and return focus to the trigger." },
    { keys: ["Tab"], behaviour: "Cycle focus within the drawer — the background is inert, so focus cannot leave it." },
  ],

  examples: [
    {
      id: "sides",
      title: "Sides",
      render: () => (
        <InteractiveExample
          elementsPreview={() =>
            withGlyphs(
              [
                `<div class="docs-example-row">`,
                ...SIDES.map((side) =>
                  elementsDrawer({
                    side,
                    width: "sm",
                    trigger: side,
                    triggerVariant: "secondary",
                    triggerSize: "sm",
                    title: `From the ${side}`,
                    description: `This drawer docks to the ${side} edge.`,
                    footer: false,
                  }),
                ),
                `</div>`,
              ].join("\n"),
            )
          }
          elementsCaption="`data-side` on the `<dialog>` docks it to an edge and slides it in from there: `right` and `left` for navigation and filters, `bottom` for a mobile action sheet, `top` for a notification tray. It is a styling hook you write — the element never reads it. The `primitiv-drawer--xs` to `--xl` class sets the cross-axis extent: the width for left and right, the height for top and bottom. **Click a trigger** to open it."
          caption="`side` docks the drawer to an edge and slides it in from there: `right` (the default) and `left` for navigation and filters, `bottom` for a mobile action sheet, `top` for a notification tray. `width` sets the cross-axis extent — the width for left/right, the height for top/bottom. **Click a trigger** to open it."
          code={(_density, mode) => {
            if (mode === "elements")
              return `<dialog class="primitiv-drawer primitiv-drawer--sm" data-side="left">…</dialog>`;
            const p = partNamer(mode, "Drawer");
            return [
              imports(mode, ["Content"], false),
              ``,
              `<${p("Content")} side="left" width="sm">…</${p("Content")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              {(["left", "right", "top", "bottom"] as const).map((side) => (
                <PortalHost key={side}>
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="secondary" size="sm">
                        {side}
                      </Button>
                    </DrawerTrigger>
                    <Portal>
                      <DrawerOverlay />
                      <DrawerContent side={side} width="sm">
                        <DrawerHeader>
                          <DrawerTitle>From the {side}</DrawerTitle>
                          <CloseButton />
                        </DrawerHeader>
                        <DrawerBody>
                          <DrawerDescription>
                            This drawer docks to the {side} edge.
                          </DrawerDescription>
                        </DrawerBody>
                      </DrawerContent>
                    </Portal>
                  </Drawer>
                </PortalHost>
              ))}
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "An accessible drawer: a modal dialog on the native `<dialog>` element that slides in from a screen edge. In plain markup it is the `<primitiv-modal>` elements around a `<dialog>` wearing the drawer classes and a `data-side`, so it loads Modal's script and adds no element of its own.",
    anatomyMeta:
      "No elements of its own: the Modal elements, docked to an edge. `<primitiv-modal>` holds the state in `open`; the trigger, title, description and closes each wrap the element you write, and the `<dialog>` carries `primitiv-drawer`, a width class and `data-side`. There is no overlay element — the dialog's own `::backdrop` dims the page. Its attributes and events are Modal's, listed below.",
    keyboardMeta:
      "A drawer is a modal dialog, so it traps focus: Tab and Shift+Tab cycle within the panel and never reach the inert page behind it. Escape closes it and returns focus to the trigger; a press on the backdrop dismisses it too.",
    keyboard: [
      { keys: ["Enter", "Space"], behaviour: "Open the drawer from the focused trigger." },
      { keys: ["Escape"], behaviour: "Close the drawer and return focus to the trigger." },
      { keys: ["Tab"], behaviour: "Cycle focus within the drawer — the background is inert, so focus cannot leave it." },
    ],
    accessibility: [
      "The `<dialog>` is opened with `showModal()` by `<primitiv-modal>`, so the browser inerts the rest of the page — background controls cannot be focused or clicked while the drawer is open.",
      "Focus is trapped inside the drawer and cycles at the boundaries, and returns to the trigger on close, so a keyboard user is never stranded on the inert page behind it.",
      "The heading inside `<primitiv-modal-title>` names the dialog (`aria-labelledby`) and the paragraph inside `<primitiv-modal-description>` describes it — always give a drawer a title, so a screen reader announces what opened rather than a bare panel.",
      "Escape and a backdrop press both dismiss it, and a cancelable `primitiv-modal-change` lets a listener veto either, as on Modal.",
      "Reach for Popover instead when the content is optional and non-blocking: a drawer is modal and takes over, so use it for a focused task (filters, a form, navigation), not a passing hint.",
    ],
  },

  accessibility: [
    "`Drawer.Content` is a native `<dialog>` opened as a modal, so the browser inerts the rest of the page for you — background controls cannot be focused or clicked while the drawer is open, no `aria-hidden` bookkeeping required.",
    "Focus is trapped inside the drawer and cycles at the boundaries (Tab/Shift+Tab), and returns to the trigger on close, so a keyboard user is never stranded on an inert page behind it.",
    "`Drawer.Title` names the dialog (`aria-labelledby`) and `Drawer.Description` describes it — always give a drawer a title, so a screen reader announces what opened rather than a bare panel.",
    "Escape and a backdrop click both dismiss it, matching the platform expectation for a dialog — the same escape hatches Modal provides.",
    "Reach for `Popover` instead when the content is optional and non-blocking: a drawer is modal and takes over, so use it for a focused task (filters, a form, navigation), not a passing hint.",
  ],
};
