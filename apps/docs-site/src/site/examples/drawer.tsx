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
const Portal = ({ children, ...props }: ComponentProps<typeof DrawerPortal>) => {
  const host = useContext(PortalHostContext);
  return (
    <DrawerPortal container={host} {...props}>
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
    snippet: (values, mode) => {
      const p = partNamer(mode, "Drawer");
      const width = contractAttr({ mode, prop: "width", value: values.width });
      return [
        imports(mode, ["Trigger", "Portal", "Overlay", "Content", "Header", "Body", "Footer", "Title", "Description", "Close"], true),
        ``,
        `<${p("Root")}>`,
        ...(mode === "headless"
          ? [`  <${p("Trigger")}>Open drawer</${p("Trigger")}>`]
          : [`  <${p("Trigger")} asChild>`, `    <Button>Open drawer</Button>`, `  </${p("Trigger")}>`]),
        `  <${p("Portal")}>`,
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
          caption="`side` docks the drawer to an edge and slides it in from there: `right` (the default) and `left` for navigation and filters, `bottom` for a mobile action sheet, `top` for a notification tray. `width` sets the cross-axis extent — the width for left/right, the height for top/bottom. **Click a trigger** to open it."
          code={(_density, mode) => {
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

  accessibility: [
    "`Drawer.Content` is a native `<dialog>` opened as a modal, so the browser inerts the rest of the page for you — background controls cannot be focused or clicked while the drawer is open, no `aria-hidden` bookkeeping required.",
    "Focus is trapped inside the drawer and cycles at the boundaries (Tab/Shift+Tab), and returns to the trigger on close, so a keyboard user is never stranded on an inert page behind it.",
    "`Drawer.Title` names the dialog (`aria-labelledby`) and `Drawer.Description` describes it — always give a drawer a title, so a screen reader announces what opened rather than a bare panel.",
    "Escape and a backdrop click both dismiss it, matching the platform expectation for a dialog — the same escape hatches Modal provides.",
    "Reach for `Popover` instead when the content is optional and non-blocking: a drawer is modal and takes over, so use it for a focused task (filters, a form, navigation), not a passing hint.",
  ],
};
