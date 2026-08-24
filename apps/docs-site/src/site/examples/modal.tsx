"use client";

import { useState } from "react";

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

/** Every part the page's snippets name, so one import line covers them all. */
const ALL_PARTS = [
  "Trigger",
  "Portal",
  "Content",
  "Header",
  "Body",
  "Footer",
  "Title",
  "Description",
  "Close",
] as const;

const imports = (
  mode: Mode,
  parts: readonly string[] = ALL_PARTS,
  icons: readonly string[] = [],
) => importBlock({ mode, component: "Modal", componentId: "modal", parts, icons });

/**
 * The dismiss control the whole page reuses.
 *
 * A ghost `Button` inside `Modal.Close asChild`, one size below the dialog —
 * the registry README's own convention, and the reason `Close` is composed
 * rather than supplied: there is no `IconButton` in `packages/react`, so the
 * close affordance is always the consumer's button wearing the close
 * behaviour.
 */
const CloseButton = ({ size = "sm" }: { size?: "xs" | "sm" | "md" | "lg" }) => (
  <ModalClose asChild>
    <Button variant="ghost" size={size} aria-label="Close">
      <Close size="100%" />
    </Button>
  </ModalClose>
);

/**
 * Modal's page content.
 *
 * The first OVERLAY page, and the shape the template had not met: nothing
 * renders until the reader opens it. That decides two things. The playground's
 * preview is a TRIGGER, not the dialog — a modal that is open on arrival would
 * trap focus on a page the reader is still scrolling — and every example below
 * is likewise a button that opens its own dialog.
 *
 * Anatomy earns its section here more than anywhere: eleven parts, three of
 * which (`Header`, `Body`, `Footer`) exist only in the styled surface, and one
 * (`Overlay`) that most consumers should not render at all because the native
 * `::backdrop` already dims the page.
 */
export const modalSpec: ComponentSpec = {
  playground: {
    component: "Modal",
    /* Hand-written: `size` is declared on `Modal.Content`, not on the root, so
       the generated `toJsx` would print `<Modal size="md" />` — a prop the root
       does not accept, on a component that renders no element of its own. */
    snippet: (values, mode) => {
      const p = partNamer(mode, "Modal");
      return [
        imports(mode, ALL_PARTS, ["Close"]),
        ``,
        `<${p("Root")}>`,
        `  <${p("Trigger")} asChild>`,
        `    <Button>Open dialog</Button>`,
        `  </${p("Trigger")}>`,
        `  <${p("Portal")}>`,
        `    <${p("Content")}${contractAttr({ mode, prop: "size", value: values.size })}>`,
        `      <${p("Header")}>`,
        `        <${p("Title")}>Payment details</${p("Title")}>`,
        `        <${p("Close")} asChild>`,
        `          <Button variant="ghost" size="sm" aria-label="Close">`,
        `            <Close />`,
        `          </Button>`,
        `        </${p("Close")}>`,
        `      </${p("Header")}>`,
        `      <${p("Body")}>`,
        `        <${p("Description")}>`,
        `          We only charge the card once the order ships.`,
        `        </${p("Description")}>`,
        `      </${p("Body")}>`,
        `      <${p("Footer")}>`,
        `        <${p("Close")} asChild>`,
        `          <Button variant="secondary">Cancel</Button>`,
        `        </${p("Close")}>`,
        `        <Button>Confirm</Button>`,
        `      </${p("Footer")}>`,
        `    </${p("Content")}>`,
        `  </${p("Portal")}>`,
        `</${p("Root")}>`,
      ].join("\n");
    },
    render: (values) => (
      <Modal>
        <ModalTrigger asChild>
          <Button>Open dialog</Button>
        </ModalTrigger>
        <ModalPortal>
          <ModalContent size={values.size as Size}>
            <ModalHeader>
              <ModalTitle>Payment details</ModalTitle>
              <CloseButton />
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
        </ModalPortal>
      </Modal>
    ),
  },

  anatomyMeta:
    "Eleven parts, and three of them — `Header`, `Body` and `Footer` — are pure structure the styled surface adds, so they have no headless counterpart to import. `Overlay` is deliberately absent from the tree: the native `<dialog>` paints its own `::backdrop`, and adding one is an opt-in for animating the backdrop (see below).",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "Modal");
        return [
          `<${p("Root")}>`,
          `  <${p("Trigger")} />`,
          `  <${p("Portal")}>`,
          `    <${p("Content")}>`,
          `      <${p("Header")}>`,
          `        <${p("Title")} />`,
          `        <${p("Close")} />`,
          `      </${p("Header")}>`,
          `      <${p("Body")}>`,
          `        <${p("Description")} />`,
          `      </${p("Body")}>`,
          `      <${p("Footer")} />`,
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
          caption="The three regions are the styled surface's own — a divided header carrying the title and the close, a scrolling body, and a right-aligned footer for the actions. Drop any you do not need: a confirmation has no body worth the name. `Modal.Title` and `Modal.Description` are not decoration — they register their generated ids as the dialog's `aria-labelledby` and `aria-describedby`, so what you write here is what a screen reader announces on open."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ALL_PARTS, ["Close"]),
              ``,
              `<${p("Root")}>`,
              `  <${p("Trigger")} asChild>`,
              `    <Button>Edit profile</Button>`,
              `  </${p("Trigger")}>`,
              `  <${p("Portal")}>`,
              `    <${p("Content")}>`,
              `      <${p("Header")}>`,
              `        <${p("Title")}>Edit profile</${p("Title")}>`,
              `        <${p("Close")} asChild>`,
              `          <Button variant="ghost" size="sm" aria-label="Close">`,
              `            <Close />`,
              `          </Button>`,
              `        </${p("Close")}>`,
              `      </${p("Header")}>`,
              `      <${p("Body")}>`,
              `        <${p("Description")}>Changes apply to every workspace.</${p("Description")}>`,
              `        <Field>`,
              `          <Field.Label>Display name</Field.Label>`,
              `          <Input defaultValue="Ada Lovelace" />`,
              `        </Field>`,
              `      </${p("Body")}>`,
              `      <${p("Footer")}>`,
              `        <${p("Close")} asChild>`,
              `          <Button variant="secondary">Cancel</Button>`,
              `        </${p("Close")}>`,
              `        <Button>Save changes</Button>`,
              `      </${p("Footer")}>`,
              `    </${p("Content")}>`,
              `  </${p("Portal")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <Modal>
              <ModalTrigger asChild>
                <Button>Edit profile</Button>
              </ModalTrigger>
              <ModalPortal>
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
              </ModalPortal>
            </Modal>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes",
      render: () => (
        <InteractiveExample
          caption="Four widths, set on `Modal.Content` rather than on the root — the root renders no element of its own, so there is nothing there to size. `sm` is a confirmation, `xl` is a work surface. The close button steps down one size with the dialog (`sm → xs`, `md → sm`, `lg → md`, `xl → lg`) so it stays subordinate to the title."
          code={(density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ["Trigger", "Portal", "Content", "Title"]),
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
          {() =>
            SIZES.map((size) => (
              <Modal key={size}>
                <ModalTrigger asChild>
                  <Button variant="secondary">{size}</Button>
                </ModalTrigger>
                <ModalPortal>
                  <ModalContent size={size}>
                    <ModalHeader>
                      <ModalTitle>Dialog at {size}</ModalTitle>
                      <CloseButton
                        size={
                          { sm: "xs", md: "sm", lg: "md", xl: "lg" }[size] as
                            | "xs"
                            | "sm"
                            | "md"
                            | "lg"
                        }
                      />
                    </ModalHeader>
                    <ModalBody>
                      <ModalDescription>
                        Every size scales again with the nearest data-density
                        ancestor.
                      </ModalDescription>
                    </ModalBody>
                  </ModalContent>
                </ModalPortal>
              </Modal>
            ))
          }
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          caption="Pass `open` and `onOpenChange` and the parent owns the flag — needed whenever something other than the trigger decides: a route change, a save that succeeded, a queue of dialogs. `onOpenChange` fires for **every** route out, the trigger, `Modal.Close`, Escape and a backdrop click alike, so one handler is enough. The uncontrolled form (`defaultOpen`, or nothing at all) is the default and is what every other example here uses."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ["Portal", "Content", "Header", "Body", "Title", "Description", "Footer"]),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<Button onClick={() => setOpen(true)}>Publish</Button>`,
              ``,
              `<${p("Root")} open={open} onOpenChange={setOpen}>`,
              `  <${p("Portal")}>`,
              `    <${p("Content")} size="sm">`,
              `      <${p("Header")}>`,
              `        <${p("Title")}>Publish release</${p("Title")}>`,
              `      </${p("Header")}>`,
              `      <${p("Body")}>`,
              `        <${p("Description")}>This makes v2.1 available to everyone.</${p("Description")}>`,
              `      </${p("Body")}>`,
              `      <${p("Footer")}>`,
              `        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>`,
              `        <Button onClick={() => { publish(); setOpen(false); }}>Publish</Button>`,
              `      </${p("Footer")}>`,
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
          caption="`onEscapeKeyDown` and `onPointerDownOutside` fire on the two gestures the browser drives itself — the dialog's native `cancel` event, and a pointer landing on the `::backdrop`. Both hand you the **raw native event**, so `event.preventDefault()` keeps the dialog open. Use it for unsaved work, and keep an explicit way out on screen: a dialog that cannot be dismissed at all is a trap."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ["Trigger", "Portal", "Content", "Header", "Body", "Title", "Description", "Footer", "Close"]),
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
          caption="`Modal.Overlay` is **optional** — the native `::backdrop` already dims the page, and most dialogs should not render one. Add it only to animate or restyle that layer, since it is an ordinary element you can transition. Pair it with `forceMount` on both the overlay and the portal so the subtree survives the close long enough for an exit animation keyed off `data-state=&quot;closed&quot;` to play. Scroll-lock is deliberately not shipped: it is one line of your own CSS, `html:has(dialog[open]) { overflow: hidden; }`."
          code={(_density, mode) => {
            const p = partNamer(mode, "Modal");
            return [
              imports(mode, ["Trigger", "Portal", "Overlay", "Content", "Title"]),
              ``,
              `<${p("Root")}>`,
              `  <${p("Trigger")} asChild>`,
              `    <Button>Open with a fading backdrop</Button>`,
              `  </${p("Trigger")}>`,
              `  <${p("Portal")} forceMount>`,
              `    <${p("Overlay")} forceMount />`,
              `    <${p("Content")}>...</${p("Content")}>`,
              `  </${p("Portal")}>`,
              `</${p("Root")}>`,
              ``,
              `/* Your stylesheet — both parts publish data-state. */`,
              `.primitiv-modal__overlay[data-state="open"] { opacity: 1; }`,
              `.primitiv-modal__overlay[data-state="closed"] { opacity: 0; }`,
            ].join("\n");
          }}
        >
          {() => (
            <Modal>
              <ModalTrigger asChild>
                <Button>Open with an overlay</Button>
              </ModalTrigger>
              <ModalPortal>
                <ModalOverlay />
                <ModalContent size="sm">
                  <ModalHeader>
                    <ModalTitle>With an overlay</ModalTitle>
                    <CloseButton />
                  </ModalHeader>
                  <ModalBody>
                    <ModalDescription>
                      The extra layer is yours to animate; the native backdrop
                      sits behind it.
                    </ModalDescription>
                  </ModalBody>
                </ModalContent>
              </ModalPortal>
            </Modal>
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
    "Escape closes, and `onEscapeKeyDown` can veto it for unsaved work. A veto is a promise to offer another way out, so keep a visible Cancel or close button; a dialog that swallows Escape and shows no exit is a keyboard trap.",
    "`Modal.Close` is behaviour, not an icon: with `asChild` it wraps your own button, so an icon-only close needs its own `aria-label` — the glyph carries no accessible name.",
    "For the common confirm/cancel case, reach for `ConfirmDialog` instead. It composes this component with `Button` and settles the tone, the labels and the button order for you.",
  ],
};

/**
 * The controlled example's live half.
 *
 * A component rather than inline JSX because `InteractiveExample`'s children are
 * a render function, and a hook cannot be called from one.
 */
const ControlledExample = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Publish</Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalPortal>
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
        </ModalPortal>
      </Modal>
    </>
  );
};

/**
 * The veto example's live half — a dialog that refuses Escape and backdrop
 * clicks while the field has been touched, and says so on screen.
 */
const VetoExample = () => {
  const [dirty, setDirty] = useState(false);

  const veto = (event: { preventDefault: () => void }) => {
    if (dirty) event.preventDefault();
  };

  return (
    <Modal onOpenChange={(open) => !open && setDirty(false)}>
      <ModalTrigger asChild>
        <Button>Open a form</Button>
      </ModalTrigger>
      <ModalPortal>
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
              <Input
                defaultValue="Harmoni"
                onChange={() => setDirty(true)}
              />
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
      </ModalPortal>
    </Modal>
  );
};
