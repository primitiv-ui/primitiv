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
import { Field, FieldLabel } from "@/components/field";
import { Input } from "@/components/input";
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  ModalTrigger,
} from "@/components/modal";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: readonly Size[] = ["sm", "md", "lg", "xl"];

/** The close button steps down one size with the dialog. */
const CLOSE_SIZE: Record<Size, "xs" | "sm" | "md" | "lg"> = {
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

/* ------------------------------------------------------------------ *
 * Portal host
 * ------------------------------------------------------------------ */

const PortalHostContext = createContext<HTMLElement | undefined>(undefined);

/**
 * A portal target INSIDE the preview.
 *
 * `Modal.Portal` defaults to `document.body`, which is right in an app and
 * wrong in these previews: the density control puts `data-density` on the
 * preview wrapper, and a body-portalled dialog sits outside it, so every
 * Context token resolved at the page's density instead and the control looked
 * broken. Portalling into a div inside the preview puts the dialog back under
 * that ancestor — the tokens are custom properties, so they inherit down the
 * DOM tree regardless of the top layer the dialog is painted in.
 *
 * `display: contents` so the host adds no box of its own: the Sizes example
 * lays four triggers out in a row, and a wrapper element would collapse them
 * into one flex item.
 *
 * Consumers hit the same rule whenever `data-density` (or any token override)
 * is set on a section rather than the document — which is why `container` is a
 * documented prop, and why the Sizes caption says so.
 */
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

/** `ModalPortal`, aimed at the enclosing {@link PortalHost}. */
const Portal = ({
  children,
  ...props
}: ComponentProps<typeof ModalPortal>) => {
  const host = useContext(PortalHostContext);

  return (
    <ModalPortal container={host} {...props}>
      {children}
    </ModalPortal>
  );
};

/* ------------------------------------------------------------------ *
 * Snippet builders
 * ------------------------------------------------------------------ */

/**
 * Imports for a snippet.
 *
 * `Button` only in styled mode. The headless snippets deliberately use
 * `Modal.Trigger` and `Modal.Close` directly — they render real `<button>`s —
 * rather than a `Button` wearing `variant`/`size`, which are registry contract
 * modifiers that the headless primitive does not accept.
 */
const imports = (
  mode: Mode,
  parts: readonly string[],
  { icons = [], button = false }: { icons?: readonly string[]; button?: boolean } = {},
) =>
  [
    importBlock({ mode, component: "Modal", componentId: "modal", parts, icons }),
    button && mode !== "headless"
      ? importBlock({ mode, component: "Button", componentId: "button" })
      : null,
  ]
    .filter(Boolean)
    .join("\n");

/**
 * A region wrapper: a real part in the styled copy, a plain `<div>` in
 * headless.
 *
 * `Header`, `Body` and `Footer` exist ONLY in the registry surface — they are
 * layout the copied file adds, and `@primitiv-ui/react` exports no such parts.
 * Printing `Modal.Header` under the Headless tab named an import that does not
 * exist, which is the bug this fixes.
 */
const region = (mode: Mode, part: "Header" | "Body" | "Footer") =>
  mode === "headless" ? "div" : partNamer(mode, "Modal")(part);

/** The trigger — `asChild` around a `Button` when styled, bare when headless. */
const triggerLines = (mode: Mode, indent: string, label: string) => {
  const p = partNamer(mode, "Modal");
  if (mode === "headless") {
    return [`${indent}<${p("Trigger")}>${label}</${p("Trigger")}>`];
  }
  return [
    `${indent}<${p("Trigger")} asChild>`,
    `${indent}  <Button>${label}</Button>`,
    `${indent}</${p("Trigger")}>`,
  ];
};

/** A labelled dismiss action in the footer. */
const closeLines = (
  mode: Mode,
  indent: string,
  label: string,
  variant?: string,
) => {
  const p = partNamer(mode, "Modal");
  if (mode === "headless") {
    return [`${indent}<${p("Close")}>${label}</${p("Close")}>`];
  }
  return [
    `${indent}<${p("Close")} asChild>`,
    `${indent}  <Button${variant ? ` variant="${variant}"` : ""}>${label}</Button>`,
    `${indent}</${p("Close")}>`,
  ];
};

/** The icon-only dismiss in the header. */
const closeIconLines = (mode: Mode, indent: string, size = "sm") => {
  const p = partNamer(mode, "Modal");
  if (mode === "headless") {
    return [
      `${indent}<${p("Close")} aria-label="Close">`,
      `${indent}  <Close />`,
      `${indent}</${p("Close")}>`,
    ];
  }
  return [
    `${indent}<${p("Close")} asChild>`,
    `${indent}  <Button variant="ghost" size="${size}" aria-label="Close">`,
    `${indent}    <Close />`,
    `${indent}  </Button>`,
    `${indent}</${p("Close")}>`,
  ];
};

/** A confirm action — a `Button` when styled, the platform's own when not. */
const confirmLine = (mode: Mode, indent: string, label: string) =>
  mode === "headless"
    ? `${indent}<button>${label}</button>`
    : `${indent}<Button>${label}</Button>`;

/* ------------------------------------------------------------------ *
 * Live previews
 * ------------------------------------------------------------------ */

/**
 * The dismiss control the previews reuse.
 *
 * A ghost `Button` inside `Modal.Close asChild` — the registry README's own
 * convention, and the reason `Close` is composed rather than supplied: there is
 * no `IconButton` in `packages/react`, so the close affordance is always the
 * consumer's button wearing the close behaviour.
 */
const CloseButton = ({ size = "sm" }: { size?: "xs" | "sm" | "md" | "lg" }) => (
  <ModalClose asChild>
    <Button variant="ghost" size={size} aria-label="Close">
      <Close size="100%" />
    </Button>
  </ModalClose>
);

/** The playground's preview — a trigger, and the dialog it opens. */
const PlaygroundPreview = ({ size }: { size: Size }) => (
  <PortalHost>
    <Modal>
      <ModalTrigger asChild>
        <Button>Open dialog</Button>
      </ModalTrigger>
      <Portal>
        <ModalContent size={size}>
          <ModalHeader>
            <ModalTitle>Payment details</ModalTitle>
            <CloseButton size={CLOSE_SIZE[size]} />
          </ModalHeader>
          <ModalBody>
            <ModalDescription>
              We only charge the card once the order ships.
            </ModalDescription>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary">Cancel</Button>
            </ModalClose>
            <Button>Confirm</Button>
          </ModalFooter>
        </ModalContent>
      </Portal>
    </Modal>
  </PortalHost>
);

/**
 * The controlled example's live half.
 *
 * A component rather than inline JSX because `InteractiveExample`'s children
 * are a render function, and a hook cannot be called from one.
 */
const ControlledExample = () => {
  const [open, setOpen] = useState(false);

  return (
    <PortalHost>
      <Button onClick={() => setOpen(true)}>Publish</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <Portal>
          <ModalContent size="sm">
            <ModalHeader>
              <ModalTitle>Publish release</ModalTitle>
              <CloseButton size="xs" />
            </ModalHeader>
            <ModalBody>
              <ModalDescription>
                This makes v2.1 available to everyone.
              </ModalDescription>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Publish</Button>
            </ModalFooter>
          </ModalContent>
        </Portal>
      </Modal>
    </PortalHost>
  );
};

/**
 * The veto example's live half — a dialog that refuses Escape and backdrop
 * clicks once the field has been touched, and says so on screen.
 */
const VetoExample = () => {
  const [dirty, setDirty] = useState(false);

  const veto = (event: { preventDefault: () => void }) => {
    if (dirty) event.preventDefault();
  };

  return (
    <PortalHost>
      <Modal onOpenChange={(open) => !open && setDirty(false)}>
        <ModalTrigger asChild>
          <Button>Open a form</Button>
        </ModalTrigger>
        <Portal>
          <ModalContent
            size="sm"
            onEscapeKeyDown={veto}
            onPointerDownOutside={veto}
          >
            <ModalHeader>
              <ModalTitle>Rename project</ModalTitle>
              <CloseButton size="xs" />
            </ModalHeader>
            <ModalBody>
              <ModalDescription>
                {dirty
                  ? "Escape and backdrop clicks are vetoed while there are unsaved changes -- use Cancel or Save."
                  : "Type something, then try Escape or a click outside."}
              </ModalDescription>
              <Field>
                <FieldLabel>Project name</FieldLabel>
                <Input defaultValue="Harmoni" onChange={() => setDirty(true)} />
              </Field>
            </ModalBody>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="secondary">Cancel</Button>
              </ModalClose>
              <ModalClose asChild>
                <Button>Save</Button>
              </ModalClose>
            </ModalFooter>
          </ModalContent>
        </Portal>
      </Modal>
    </PortalHost>
  );
};

/* ------------------------------------------------------------------ *
 * The spec
 * ------------------------------------------------------------------ */

/**
 * Modal's page content.
 *
 * The first OVERLAY page, and the shape the template had not met: nothing
 * renders until the reader opens it. That decides two things. The playground's
 * preview is a TRIGGER, not the dialog — a modal that is open on arrival would
 * trap focus on a page the reader is still scrolling — and every example below
 * is likewise a button that opens its own dialog.
 *
 * It is also the first page whose STRUCTURE differs by mode, not just its part
 * names: `Header`, `Body` and `Footer` are the registry surface's own, so the
 * headless snippets show plain `<div>`s and use `Modal.Trigger`/`Modal.Close`
 * directly rather than a styled `Button` carrying contract modifiers the
 * headless primitive does not accept. See `region` and the line builders above.
 */
export const modalSpec: ComponentSpec = {
  playground: {
    component: "Modal",
    /* Hand-written: `size` is declared on `Modal.Content`, not on the root, so
       the generated `toJsx` would print `<Modal size="md" />` — a prop the root
       does not accept, on a component that renders no element of its own. */
    snippet: (values, mode) => {
      const p = partNamer(mode, "Modal");
      const size = values.size as Size;
      return [
        imports(
          mode,
          ["Trigger", "Portal", "Content", "Header", "Body", "Footer", "Title", "Description", "Close"],
          { icons: ["Close"], button: true },
        ),
        ``,
        `<${p("Root")}>`,
        ...triggerLines(mode, "  ", "Open dialog"),
        `  <${p("Portal")}>`,
        `    <${p("Content")}${contractAttr({ mode, prop: "size", value: size })}>`,
        `      <${region(mode, "Header")}>`,
        `        <${p("Title")}>Payment details</${p("Title")}>`,
        ...closeIconLines(mode, "        ", CLOSE_SIZE[size]),
        `      </${region(mode, "Header")}>`,
        `      <${region(mode, "Body")}>`,
        `        <${p("Description")}>`,
        `          We only charge the card once the order ships.`,
        `        </${p("Description")}>`,
        `      </${region(mode, "Body")}>`,
        `      <${region(mode, "Footer")}>`,
        ...closeLines(mode, "        ", "Cancel", "secondary"),
        confirmLine(mode, "        ", "Confirm"),
        `      </${region(mode, "Footer")}>`,
        `    </${p("Content")}>`,
        `  </${p("Portal")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => <PlaygroundPreview size={values.size as Size} />,
  },

  anatomyMeta:
    "Eight parts in `@primitiv-ui/react`. The styled copy adds three more — `Header`, `Body` and `Footer` — which are pure layout, so under the Headless tab they are your own elements. `Overlay` is absent from both trees on purpose: the native `<dialog>` paints its own `::backdrop`, and adding one is an opt-in for animating that layer.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Modal");
        const headless = mode === "headless";
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")} />`,
          `  <${p("Portal")}>`,
          `    <${p("Content")}>`,
          ...(headless
            ? [
                `      <${p("Title")} />`,
                `      <${p("Description")} />`,
                `      <${p("Close")} />`,
              ]
            : [
                `      <${p("Header")}>`,
                `        <${p("Title")} />`,
                `        <${p("Close")} />`,
                `      </${p("Header")}>`,
                `      <${p("Body")}>`,
                `        <${p("Description")} />`,
                `      </${p("Body")}>`,
                `      <${p("Footer")} />`,
              ]),
          `    </${p("Content")}>`,
          `  </${p("Portal")}>`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "While the dialog is open. The background is **inert** — not merely hidden: `showModal()` puts the dialog in the top layer and the browser removes everything behind it from the tab order and from the accessibility tree, so there is no key that reaches the page underneath.",

  keyboard: [
    {
      keys: ["Tab", "Shift+Tab"],
      behaviour:
        "Move through the dialog's focusable content, wrapping at each end.",
    },
    {
      keys: ["Escape"],
      behaviour:
        "Close the dialog and return focus to the trigger. `onEscapeKeyDown` can veto it.",
    },
    {
      keys: ["Enter", "Space"],
      behaviour:
        "Activate the focused control — the platform's, since every part is a real `<button>`.",
    },
  ],

  examples: [
    {
      id: "regions",
      title: "Header, body and footer",
      render: () => (
        <InteractiveExample
          caption="Three regions the **styled surface** supplies — a divided header carrying the title and the close, a scrolling body, and a right-aligned footer for the actions. They are layout, not behaviour, which is why the Headless tab shows plain elements in their place. Drop any you do not need: a confirmation has no body worth the name. `Modal.Title` and `Modal.Description` are not decoration either way — they register their generated ids as the dialog's `aria-labelledby` and `aria-describedby`, so what you write there is what a screen reader announces on open."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(
                mode,
                ["Trigger", "Portal", "Content", "Header", "Body", "Footer", "Title", "Description", "Close"],
                { icons: ["Close"], button: true },
              ),
              importBlock({
                mode,
                component: "Field",
                componentId: "field",
                parts: ["Label"],
              }),
              importBlock({ mode, component: "Input", componentId: "input" }),
              ``,
              `<${p("Root")}>`,
              ...triggerLines(mode, "  ", "Edit profile"),
              `  <${p("Portal")}>`,
              `    <${p("Content")}>`,
              `      <${region(mode, "Header")}>`,
              `        <${p("Title")}>Edit profile</${p("Title")}>`,
              ...closeIconLines(mode, "        "),
              `      </${region(mode, "Header")}>`,
              `      <${region(mode, "Body")}>`,
              `        <${p("Description")}>Changes apply to every workspace.</${p("Description")}>`,
              `        <Field>`,
              `          <${partNamer(mode, "Field")("Label")}>Display name</${partNamer(mode, "Field")("Label")}>`,
              `          <Input defaultValue="Ada Lovelace" />`,
              `        </Field>`,
              `      </${region(mode, "Body")}>`,
              `      <${region(mode, "Footer")}>`,
              ...closeLines(mode, "        ", "Cancel", "secondary"),
              confirmLine(mode, "        ", "Save changes"),
              `      </${region(mode, "Footer")}>`,
              `    </${p("Content")}>`,
              `  </${p("Portal")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <PortalHost>
              <Modal>
                <ModalTrigger asChild>
                  <Button>Edit profile</Button>
                </ModalTrigger>
                <Portal>
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>Edit profile</ModalTitle>
                      <CloseButton />
                    </ModalHeader>
                    <ModalBody>
                      <ModalDescription>
                        Changes apply to every workspace.
                      </ModalDescription>
                      <Field>
                        <FieldLabel>Display name</FieldLabel>
                        <Input defaultValue="Ada Lovelace" />
                      </Field>
                    </ModalBody>
                    <ModalFooter>
                      <ModalClose asChild>
                        <Button variant="secondary">Cancel</Button>
                      </ModalClose>
                      <Button>Save changes</Button>
                    </ModalFooter>
                  </ModalContent>
                </Portal>
              </Modal>
            </PortalHost>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          caption="Four widths, set on `Modal.Content` rather than on the root — the root renders no element of its own, so there is nothing there to size. `sm` is a confirmation, `xl` is a work surface, and each rescales again with the nearest `data-density` ancestor. One trap worth knowing: `Modal.Portal` renders into `document.body` by default, so a dialog **escapes** a `data-density` set on a section rather than on the document. Pass `container` to portal it somewhere that inherits what you meant — which is exactly what these previews do, or the density control above would do nothing."
          code={(density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ["Portal", "Content", "Title"]),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.map(
                (s) =>
                  `  <${p("Content")}${contractAttr({ mode, prop: "size", value: s })}>...</${p("Content")}>`,
              ),
              `</div>`,
            ].join("\n");
          }}
        >
          {() => (
            <PortalHost>
              {SIZES.map((size) => (
                <Modal key={size}>
                  <ModalTrigger asChild>
                    <Button variant="secondary">{size}</Button>
                  </ModalTrigger>
                  <Portal>
                    <ModalContent size={size}>
                      <ModalHeader>
                        <ModalTitle>Dialog at {size}</ModalTitle>
                        <CloseButton size={CLOSE_SIZE[size]} />
                      </ModalHeader>
                      <ModalBody>
                        <ModalDescription>
                          Every size scales again with the nearest data-density
                          ancestor.
                        </ModalDescription>
                      </ModalBody>
                    </ModalContent>
                  </Portal>
                </Modal>
              ))}
            </PortalHost>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `open` and `onOpenChange` and the parent owns the flag — needed whenever something other than the trigger decides: a route change, a save that succeeded, a queue of dialogs. `onOpenChange` fires for **every** route out — the trigger, `Modal.Close`, Escape and a backdrop click alike — so one handler is enough. The uncontrolled form (`defaultOpen`, or nothing at all) is the default, and is what every other example here uses."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(
                mode,
                ["Portal", "Content", "Header", "Body", "Footer", "Title", "Description"],
                { button: true },
              ),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              mode === "headless"
                ? `<button onClick={() => setOpen(true)}>Publish</button>`
                : `<Button onClick={() => setOpen(true)}>Publish</Button>`,
              ``,
              `<${p("Root")} open={open} onOpenChange={setOpen}>`,
              `  <${p("Portal")}>`,
              `    <${p("Content")} size="sm">`,
              `      <${region(mode, "Header")}>`,
              `        <${p("Title")}>Publish release</${p("Title")}>`,
              `      </${region(mode, "Header")}>`,
              `      <${region(mode, "Body")}>`,
              `        <${p("Description")}>This makes v2.1 available to everyone.</${p("Description")}>`,
              `      </${region(mode, "Body")}>`,
              `      <${region(mode, "Footer")}>`,
              mode === "headless"
                ? `        <button onClick={() => setOpen(false)}>Cancel</button>`
                : `        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>`,
              mode === "headless"
                ? `        <button onClick={() => { publish(); setOpen(false); }}>Publish</button>`
                : `        <Button onClick={() => { publish(); setOpen(false); }}>Publish</Button>`,
              `      </${region(mode, "Footer")}>`,
              `    </${p("Content")}>`,
              `  </${p("Portal")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "vetoing-dismissal",
      title: "Vetoing dismissal",
      render: () => (
        <InteractiveExample
          caption="`onEscapeKeyDown` and `onPointerDownOutside` fire on the two gestures the browser drives itself — the dialog's native `cancel` event, and a pointer landing on the `::backdrop`. Both hand you the **raw native event**, so `event.preventDefault()` keeps the dialog open. Use it for unsaved work, and keep an explicit way out on screen: a dialog that swallows Escape and offers no exit is a keyboard trap."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ["Content"]),
              ``,
              `<${p("Content")}`,
              `  onEscapeKeyDown={(event) => {`,
              `    if (isDirty) event.preventDefault();`,
              `  }}`,
              `  onPointerDownOutside={(event) => {`,
              `    if (isDirty) event.preventDefault();`,
              `  }}`,
              `>`,
              `  ...`,
              `</${p("Content")}>`,
            ].join("\n");
          }}
        >
          {() => <VetoExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "animated-backdrop",
      title: "Animating the backdrop",
      render: () => (
        <InteractiveExample
          caption="`Modal.Overlay` is **optional** — the native `::backdrop` already dims the page, and most dialogs should not render one. Add it only to animate or restyle that layer, since it is an ordinary element you can transition. Pair it with `forceMount` on both the portal and the overlay so the subtree survives the close long enough for an exit animation keyed off `data-state=&quot;closed&quot;` to play. Scroll-lock is deliberately not shipped: it is one line of your own CSS, `html:has(dialog[open]) { overflow: hidden; }`."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            const selector =
              mode === "headless" ? ".my-overlay" : ".primitiv-modal__overlay";
            return [
              imports(mode, ["Trigger", "Portal", "Overlay", "Content"], {
                button: true,
              }),
              ``,
              `<${p("Root")}>`,
              ...triggerLines(mode, "  ", "Open with a fading backdrop"),
              `  <${p("Portal")} forceMount>`,
              `    <${p("Overlay")} forceMount />`,
              `    <${p("Content")}>...</${p("Content")}>`,
              `  </${p("Portal")}>`,
              `</${p("Root")}>`,
              ``,
              `/* Your stylesheet -- the overlay publishes data-state. */`,
              `${selector}[data-state="open"] { opacity: 1; }`,
              `${selector}[data-state="closed"] { opacity: 0; }`,
            ].join("\n");
          }}
        >
          {() => (
            <PortalHost>
              <Modal>
                <ModalTrigger asChild>
                  <Button>Open with an overlay</Button>
                </ModalTrigger>
                <Portal>
                  <ModalOverlay />
                  <ModalContent size="sm">
                    <ModalHeader>
                      <ModalTitle>With an overlay</ModalTitle>
                      <CloseButton size="xs" />
                    </ModalHeader>
                    <ModalBody>
                      <ModalDescription>
                        The extra layer is yours to animate; the native backdrop
                        sits behind it.
                      </ModalDescription>
                    </ModalBody>
                  </ModalContent>
                </Portal>
              </Modal>
            </PortalHost>
          )}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "It is a real `<dialog>`, opened with `showModal()`. That is what supplies the top-layer stacking and the **inert** background — everything behind it leaves the tab order and the accessibility tree — rather than a `z-index` and an `aria-hidden` sweep that has to be kept in step.",
    "Tab **wraps**, which the platform does not do on its own. A native modal dialog stops Tab escaping to the page but lets it walk out to the browser chrome; a boundary-only handler sends the last element's Tab back to the first and the first's Shift+Tab to the last, which is what the WAI-ARIA APG Modal Dialog pattern requires. Only the two boundaries are intercepted, so the browser's own inert-aware order still governs everything in between.",
    "`Modal.Title` and `Modal.Description` register their ids as `aria-labelledby` and `aria-describedby`. A dialog with no title is announced as an unnamed dialog — if the visible design has no heading, keep the title and hide it visually rather than dropping the part.",
    "Focus returns to the trigger on close, every route out included. The one case to handle yourself: if the element that opened the dialog is gone by the time it closes — a row that the dialog deleted — move focus somewhere deliberate.",
    "Escape closes, and `onEscapeKeyDown` can veto it for unsaved work. A veto is a promise to offer another way out, so keep a visible Cancel or close button.",
    "`Modal.Close` is behaviour, not an icon: with `asChild` it wraps your own button, so an icon-only close needs its own `aria-label` — the glyph carries no accessible name.",
    "For the common confirm/cancel case, reach for `ConfirmDialog` instead. It composes this component with `Button` and settles the tone, the labels and the button order for you.",
  ],
};
