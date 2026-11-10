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
import { glyph, withGlyphs } from "./glyphs";
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

/**
 * `ModalPortal`, aimed at the enclosing {@link PortalHost} and force-mounted:
 * the registry modal's exit animation needs the dialog to stay mounted while
 * closed, or it unmounts the instant it closes and snaps shut.
 */
const Portal = ({
  children,
  ...props
}: ComponentProps<typeof ModalPortal>) => {
  const host = useContext(PortalHostContext);

  return (
    <ModalPortal container={host} forceMount {...props}>
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
 * Elements markup
 * ------------------------------------------------------------------ */

/** A registry Button as Elements markup: classes, and the label span the React wrapper adds. */
const buttonMarkup = (label: string, { intent = "primary", size = "md", attrs = "" } = {}) =>
  `<button type="button" class="primitiv-button primitiv-button--${intent} primitiv-button--${size}"${attrs}><span class="primitiv-button__label">${label}</span></button>`;

/**
 * One modal as Elements markup (RFC 0033): the `@primitiv-ui/web` custom
 * elements, in the shape `primitiv add modal --surface elements` prints. The
 * root holds the state in `open`; the trigger and close wrap real `<button>`s,
 * the content wraps the native `<dialog>`, and the title and description wrap
 * the heading and paragraph whose ids name and describe it. The header, body
 * and footer are styling-only `<span>`s, so the headless tab drops them with
 * the classes. The buttons are the registry Button the React previews use.
 */
const elementsModal = ({
  size = "md",
  trigger = "Open dialog",
  triggerIntent = "primary",
  title = "Payment details",
  description = "We only charge the card once the order ships.",
  body = [] as readonly string[],
  footer,
  rootAttrs = "",
  noTrigger = false,
}: {
  size?: Size;
  trigger?: string;
  triggerIntent?: string;
  title?: string;
  description?: string;
  /** Extra lines in the body, after the description. */
  body?: readonly string[];
  /** The footer's lines; omit for Cancel + Confirm, pass [] for no footer. */
  footer?: readonly string[];
  rootAttrs?: string;
  /** Leave the trigger out, for a modal opened from script. */
  noTrigger?: boolean;
} = {}) => {
  const footerLines = footer ?? [
    `        <primitiv-modal-close>`,
    `          ${buttonMarkup("Cancel", { intent: "secondary" })}`,
    `        </primitiv-modal-close>`,
    `        ${buttonMarkup("Confirm")}`,
  ];
  return [
    `<primitiv-modal${rootAttrs}>`,
    ...(noTrigger
      ? []
      : [
          `  <primitiv-modal-trigger>`,
          `    ${buttonMarkup(trigger, { intent: triggerIntent })}`,
          `  </primitiv-modal-trigger>`,
        ]),
    `  <primitiv-modal-content>`,
    `    <dialog class="primitiv-modal primitiv-modal--${size}">`,
    `      <span class="primitiv-modal__header">`,
    `        <primitiv-modal-title><h2 class="primitiv-modal__title">${title}</h2></primitiv-modal-title>`,
    `        <primitiv-modal-close>`,
    `          <button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--${CLOSE_SIZE[size]} primitiv-modal__close" aria-label="Close">${glyph("close")}</button>`,
    `        </primitiv-modal-close>`,
    `      </span>`,
    `      <span class="primitiv-modal__body">`,
    `        <primitiv-modal-description><p class="primitiv-modal__description">${description}</p></primitiv-modal-description>`,
    ...body.map((line) => `        ${line}`),
    `      </span>`,
    ...(footerLines.length
      ? [`      <span class="primitiv-modal__footer">`, ...footerLines, `      </span>`]
      : []),
    `    </dialog>`,
    `  </primitiv-modal-content>`,
    `</primitiv-modal>`,
  ].join("\n");
};

/** A registry Field holding an Input, as Elements markup. */
const fieldMarkup = (id: string, label: string, value: string) => [
  `<div class="primitiv-field primitiv-field--md">`,
  `  <label class="primitiv-field__label" for="${id}">${label}</label>`,
  `  <input class="primitiv-input primitiv-input--md" id="${id}" value="${value}">`,
  `</div>`,
];

/** The Sizes example's four modals, in full for the preview. */
const sizesElements = () =>
  [
    `<div class="docs-example-row">`,
    ...SIZES.map((size) =>
      elementsModal({
        size,
        trigger: size,
        triggerIntent: "secondary",
        title: `Dialog at ${size}`,
        description: "Every size scales again with the nearest data-density ancestor.",
        footer: [],
      }),
    ),
    `</div>`,
  ].join("\n");

/** The Controlled example: a Publish button outside the modal, and the modal it opens from script. */
const controlledElements = () =>
  [
    buttonMarkup("Publish", { attrs: " data-publish" }),
    elementsModal({
      size: "sm",
      noTrigger: true,
      rootAttrs: ' id="publish"',
      title: "Publish release",
      description: "This makes v2.1 available to everyone.",
      footer: [
        `        <primitiv-modal-close>`,
        `          ${buttonMarkup("Cancel", { intent: "secondary" })}`,
        `        </primitiv-modal-close>`,
        `        ${buttonMarkup("Publish", { attrs: " data-confirm" })}`,
      ],
    }),
  ].join("\n");

/** Opens the controlled modal from the outside button, and closes it on confirm, as the code tab's script does. */
const wireControlled = (root: HTMLElement) => {
  const modal = root.querySelector<HTMLElement & { open: boolean }>("primitiv-modal");
  const publish = root.querySelector("[data-publish]");
  const confirm = root.querySelector("[data-confirm]");
  if (!modal || !publish || !confirm) return;
  const show = () => (modal.open = true);
  const done = () => (modal.open = false);
  publish.addEventListener("click", show);
  confirm.addEventListener("click", done);
  return () => {
    publish.removeEventListener("click", show);
    confirm.removeEventListener("click", done);
  };
};

/** The veto example: a form whose dismissal is refused once edited. */
const vetoElements = () =>
  elementsModal({
    size: "sm",
    trigger: "Open a form",
    title: "Rename project",
    description: "Type something, then try Escape or a click outside.",
    body: fieldMarkup("project-name", "Project name", "Harmoni"),
    footer: [
      `        ${buttonMarkup("Cancel", { intent: "secondary", attrs: " data-done" })}`,
      `        ${buttonMarkup("Save", { attrs: " data-done" })}`,
    ],
  });

/**
 * Vetoes every user-driven close once the field is edited, and closes from
 * the footer buttons by setting `open` — which is not announced, so it is
 * never vetoed. The same script the code tab shows.
 */
const wireVeto = (root: HTMLElement) => {
  const modal = root.querySelector<HTMLElement & { open: boolean }>("primitiv-modal");
  if (!modal) return;
  let dirty = false;
  const description = modal.querySelector("p");
  const onInput = () => {
    dirty = true;
    if (description)
      description.textContent =
        "Escape and backdrop clicks are vetoed while there are unsaved changes -- use Cancel or Save.";
  };
  const onChange = (event: Event) => {
    const { open } = (event as CustomEvent<{ open: boolean }>).detail;
    if (!open && dirty) event.preventDefault();
  };
  const onClick = (event: Event) => {
    if (!(event.target as Element).closest("[data-done]")) return;
    modal.open = false;
    dirty = false;
    if (description) description.textContent = "Type something, then try Escape or a click outside.";
  };
  modal.addEventListener("input", onInput);
  modal.addEventListener("primitiv-modal-change", onChange);
  modal.addEventListener("click", onClick);
  return () => {
    modal.removeEventListener("input", onInput);
    modal.removeEventListener("primitiv-modal-change", onChange);
    modal.removeEventListener("click", onClick);
  };
};

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
      if (mode === "elements") return elementsModal({ size: values.size as Size });
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
        `  <${p("Portal")} forceMount>`,
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
        if (mode === "elements")
          return [
            `<primitiv-modal>`,
            `  <primitiv-modal-trigger><button type="button"></button></primitiv-modal-trigger>`,
            `  <primitiv-modal-content>`,
            `    <dialog>`,
            `      <primitiv-modal-title><h2></h2></primitiv-modal-title>`,
            `      <primitiv-modal-description><p></p></primitiv-modal-description>`,
            `      <primitiv-modal-close><button type="button"></button></primitiv-modal-close>`,
            `    </dialog>`,
            `  </primitiv-modal-content>`,
            `</primitiv-modal>`,
          ].join("\n");
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
          elementsPreview={(_density, code) => withGlyphs(code)}
          elementsCaption="Three regions the **styled surface** supplies — `primitiv-modal__header` carrying the title and the close, `primitiv-modal__body`, and `primitiv-modal__footer` for the actions. They are classed `<span>`s, layout rather than behaviour, which is why the Headless tab drops them. `<primitiv-modal-title>` and `<primitiv-modal-description>` are not decoration: the heading and paragraph inside them get ids that become the dialog's `aria-labelledby` and `aria-describedby`, so what you write there is what a screen reader announces on open."
          caption="Three regions the **styled surface** supplies — a divided header carrying the title and the close, a scrolling body, and a right-aligned footer for the actions. They are layout, not behaviour, which is why the Headless tab shows plain elements in their place. Drop any you do not need: a confirmation has no body worth the name. `Modal.Title` and `Modal.Description` are not decoration either way — they register their generated ids as the dialog's `aria-labelledby` and `aria-describedby`, so what you write there is what a screen reader announces on open."
          code={(_density, mode) => {
            if (mode === "elements")
              return elementsModal({
                trigger: "Edit profile",
                title: "Edit profile",
                description: "Changes apply to every workspace.",
                body: fieldMarkup("display-name", "Display name", "Ada Lovelace"),
                footer: [
                  `        <primitiv-modal-close>`,
                  `          ${buttonMarkup("Cancel", { intent: "secondary" })}`,
                  `        </primitiv-modal-close>`,
                  `        ${buttonMarkup("Save changes")}`,
                ],
              });
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
              `  <${p("Portal")} forceMount>`,
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
          elementsPreview={() => withGlyphs(sizesElements())}
          elementsCaption="Four widths, set as a class on the `<dialog>`: `primitiv-modal--sm` to `--xl`. `sm` is a confirmation, `xl` is a work surface, and each rescales again with the nearest `data-density` ancestor. The dialog stays where you wrote it in the document — it is painted in the top layer, not moved there — so it inherits a `data-density` set on a section, with nothing to portal."
          caption="Four widths, set on `Modal.Content` rather than on the root — the root renders no element of its own, so there is nothing there to size. `sm` is a confirmation, `xl` is a work surface, and each rescales again with the nearest `data-density` ancestor. One trap worth knowing: `Modal.Portal` renders into `document.body` by default, so a dialog **escapes** a `data-density` set on a section rather than on the document. Pass `container` to portal it somewhere that inherits what you meant — which is exactly what these previews do, or the density control above would do nothing."
          code={(density, mode) => {
            if (mode === "elements")
              return [
                `<div data-density="${density}">`,
                ...SIZES.map(
                  (s) => `  <dialog class="primitiv-modal primitiv-modal--${s}">...</dialog>`,
                ),
                `</div>`,
              ].join("\n");
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
          elementsPreview={() => withGlyphs(controlledElements())}
          wire={wireControlled}
          elementsCaption="The `open` attribute is the state: set it, or the `open` property, from anywhere — a button outside the modal, a route change, a save that succeeded — and the dialog opens modally or closes. Setting it yourself is not announced. What the user does is: the trigger, a close button, Escape, a backdrop click and a `<form method=&quot;dialog&quot;>` each fire `primitiv-modal-change` first, with `detail.open` the state afterwards, so one listener follows every route out."
          caption="Pass `open` and `onOpenChange` and the parent owns the flag — needed whenever something other than the trigger decides: a route change, a save that succeeded, a queue of dialogs. `onOpenChange` fires for **every** route out — the trigger, `Modal.Close`, Escape and a backdrop click alike — so one handler is enough. The uncontrolled form (`defaultOpen`, or nothing at all) is the default, and is what every other example here uses."
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                buttonMarkup("Publish", { attrs: " data-publish" }),
                ``,
                `<!-- No trigger: the button above opens it from script. -->`,
                `<primitiv-modal id="publish">`,
                `  <!-- ... the content, title, description and footer ... -->`,
                `</primitiv-modal>`,
                ``,
                `<script type="module">`,
                `  const modal = document.getElementById("publish");`,
                `  document.querySelector("[data-publish]").addEventListener("click", () => {`,
                `    modal.open = true;`,
                `  });`,
                `  modal.addEventListener("primitiv-modal-change", (event) => {`,
                `    console.log(event.detail.open); // every route the user takes`,
                `  });`,
                `</script>`,
              ].join("\n");
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
              `  <${p("Portal")} forceMount>`,
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
          elementsPreview={() => withGlyphs(vetoElements())}
          wire={wireVeto}
          elementsCaption="`primitiv-modal-change` is cancelable and fires **before** the dialog closes, so `event.preventDefault()` keeps it open — the one veto for Escape, a backdrop click, a close button and the trigger alike. Use it for unsaved work. The footer buttons here are plain buttons that close it by setting `open = false`, which is not announced and so is never vetoed: that is the explicit way out a vetoing dialog owes the keyboard user."
          caption="`onEscapeKeyDown` and `onPointerDownOutside` fire on the two gestures the browser drives itself — the dialog's native `cancel` event, and a pointer landing on the `::backdrop`. Both hand you the **raw native event**, so `event.preventDefault()` keeps the dialog open. Use it for unsaved work, and keep an explicit way out on screen: a dialog that swallows Escape and offers no exit is a keyboard trap."
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                `<script type="module">`,
                `  const modal = document.querySelector("primitiv-modal");`,
                `  let dirty = false;`,
                `  modal.addEventListener("input", () => (dirty = true));`,
                `  modal.addEventListener("primitiv-modal-change", (event) => {`,
                `    if (!event.detail.open && dirty) event.preventDefault();`,
                `  });`,
                `  // Save and Cancel close it directly: not announced, never vetoed.`,
                `  for (const button of modal.querySelectorAll("[data-done]")) {`,
                `    button.addEventListener("click", () => {`,
                `      modal.open = false;`,
                `      dirty = false;`,
                `    });`,
                `  }`,
                `</script>`,
              ].join("\n");
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
          elementsPreview={() =>
            withGlyphs(
              elementsModal({
                size: "sm",
                trigger: "Open with a fading backdrop",
                title: "A fading backdrop",
                description: "The native backdrop fades in and out with the dialog.",
                footer: [],
              }),
            )
          }
          elementsCaption="There is no overlay element: the native `::backdrop` is the layer, and it is yours to style. The registry stylesheet already fades it with the dialog, both ways — the `<dialog>` is always in the document, so its `[open]` transitions play on close as well as open, with nothing to force-mount. Scroll-lock is deliberately not shipped: it is one line of your own CSS, `html:has(dialog[open]) { overflow: hidden; }`."
          caption="`Modal.Overlay` is **optional** — the native `::backdrop` already dims the page, and most dialogs should not render one. Add it only to animate or restyle that layer, since it is an ordinary element you can transition. Pair it with `forceMount` on both the portal and the overlay so the subtree survives the close long enough for an exit animation keyed off `data-state=&quot;closed&quot;` to play. Scroll-lock is deliberately not shipped: it is one line of your own CSS, `html:has(dialog[open]) { overflow: hidden; }`."
          code={(_density, mode) => {
            if (mode === "elements")
              return [
                `/* Your stylesheet: the dialog's own backdrop, keyed off [open]. */`,
                `.primitiv-modal::backdrop {`,
                `  opacity: 0;`,
                `  transition: opacity 200ms, display 200ms allow-discrete, overlay 200ms allow-discrete;`,
                `}`,
                `.primitiv-modal[open]::backdrop { opacity: 1; }`,
                `@starting-style {`,
                `  .primitiv-modal[open]::backdrop { opacity: 0; }`,
                `}`,
              ].join("\n");
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

  elements: {
    description:
      "An accessible modal dialog on the native `<dialog>` element: `<primitiv-modal>` opens it with `showModal()`, so the browser supplies the top layer, the `::backdrop` and the inert page behind it, and the element adds the rest of the WAI-ARIA Modal Dialog pattern — Tab wraps inside, Escape and a backdrop click close it, and focus returns to the button that opened it.",
    anatomyMeta:
      "Six elements. `<primitiv-modal>` holds the state in its `open` attribute. The other five each wrap one element you write: the trigger and close a `<button>`, the content a native `<dialog>`, the title a heading and the description a paragraph. A modal may have several triggers and several close buttons. There is no overlay element — the dialog's own `::backdrop` is the layer — and no portal: the dialog stays where you wrote it, painted in the top layer.",
    keyboardMeta:
      "While the dialog is open. The page behind it is **inert**: `showModal()` takes everything else out of the tab order and the accessibility tree, so no key reaches it.",
    keyboard: [
      {
        keys: ["Tab", "Shift+Tab"],
        behaviour: "Move through the dialog's focusable content, wrapping at each end.",
      },
      {
        keys: ["Escape"],
        behaviour:
          "Close the dialog and return focus to the trigger. A `primitiv-modal-change` listener can veto it.",
      },
      {
        keys: ["Enter", "Space"],
        behaviour: "Activate the focused control — the platform's, since every part wraps a real `<button>`.",
      },
    ],
    accessibility: [
      "It is a real `<dialog>`, opened with `showModal()`. That is what supplies the top-layer stacking and the **inert** background — everything behind it leaves the tab order and the accessibility tree — rather than a `z-index` and an `aria-hidden` sweep that has to be kept in step.",
      "Tab **wraps**, which the platform does not do on its own: a native modal dialog lets Tab walk out to the browser chrome. Only the two boundaries are intercepted, so the browser's inert-aware order governs everything in between.",
      "The trigger's `<button>` gets `aria-haspopup=\"dialog\"`, `aria-expanded` and `aria-controls`; the heading and paragraph inside the title and description get ids, generated from the root's `id` where you gave none, which become the dialog's `aria-labelledby` and `aria-describedby`. A dialog with no title is announced unnamed — keep the heading and hide it visually rather than dropping it.",
      "Focus returns to the trigger on close, every route out included. If the element that opened it is gone by then, move focus somewhere deliberate yourself.",
      "Leave `open` off the `<dialog>`: the root opens it, modally. A `<dialog open>` would show non-modally, so one that arrives that way — a history snapshot — is reopened modally, or closed if the root is.",
      "A veto is a promise to offer another way out, so keep a visible close button. An icon-only close needs its own `aria-label`: the glyph carries no accessible name.",
      "A part that does not wrap exactly one element is reported once in the console and left alone, rather than throwing on a server-rendered page.",
    ],
  },

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
