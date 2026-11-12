"use client";

import {
  createContext,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

import { Button } from "@/components/button";
import {
  ConfirmDialog,
  ConfirmDialogContent,
  ConfirmDialogTrigger,
} from "@/components/confirm-dialog";
import { ModalOverlay, ModalPortal } from "@/components/modal";
import { InteractiveExample } from "@/site/InteractiveExample";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "sm" | "md" | "lg" | "xl";
type Tone = "default" | "danger";

const SIZES: readonly Size[] = ["sm", "md", "lg", "xl"];

/* ------------------------------------------------------------------ *
 * Portal host — the same trick Modal's page uses.
 * ------------------------------------------------------------------ */

const PortalHostContext = createContext<HTMLElement | undefined>(undefined);

/**
 * A portal target INSIDE the preview.
 *
 * `ModalPortal` (which `ConfirmDialogContent` is dropped into) defaults to
 * `document.body`, which is right in an app and wrong in these previews: the
 * density control sets `data-density` on the preview wrapper, and a
 * body-portalled dialog would sit outside it and resolve every Context token at
 * the page's density instead. `display: contents` so the host adds no box of its
 * own — the previews lay several triggers out in a row.
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
const Portal = ({ children, ...props }: ComponentProps<typeof ModalPortal>) => {
  const host = useContext(PortalHostContext);

  return (
    <ModalPortal container={host} forceMount {...props}>
      {children}
    </ModalPortal>
  );
};

/* ------------------------------------------------------------------ *
 * Snippet imports
 * ------------------------------------------------------------------ */

/**
 * Imports for a snippet.
 *
 * ConfirmDialog is registry-only — it has no `@primitiv-ui/react` counterpart —
 * so the copied path is right in every mode. `ModalPortal`/`ModalOverlay` come
 * from the `modal` component directly: ConfirmDialog deliberately does not
 * re-export them, since they are identical to a plain Modal's.
 */
const imports = (
  { overlay = false, button = false }: { overlay?: boolean; button?: boolean } = {},
) =>
  [
    `import { ConfirmDialog, ConfirmDialogTrigger, ConfirmDialogContent } from "@/components/ui/confirm-dialog";`,
    overlay
      ? `import { ModalPortal, ModalOverlay } from "@/components/ui/modal";`
      : `import { ModalPortal } from "@/components/ui/modal";`,
    button ? `import { Button } from "@/components/ui/button";` : null,
  ]
    .filter(Boolean)
    .join("\n");

/* ------------------------------------------------------------------ *
 * Elements markup
 * ------------------------------------------------------------------ */

/** The close button steps down one size with the dialog, as `showClose` does. */
const CLOSE_SIZE: Record<Size, string> = { sm: "xs", md: "sm", lg: "md", xl: "lg" };

/** A registry Button as Elements markup, with the label span the React wrapper adds. */
const button = (label: string, variant: string, size: string, attrs = "") =>
  `<button type="button" class="primitiv-button primitiv-button--${variant} primitiv-button--${size}"${attrs}><span class="primitiv-button__label">${label}</span></button>`;

/**
 * A confirmation as Elements markup (RFC 0033): ConfirmDialog has no element of
 * its own — it is the `<primitiv-modal>` elements wearing the confirm-dialog
 * and Button classes, in the shape `primitiv add confirm-dialog --surface
 * elements` prints. Cancel and Confirm both sit in `<primitiv-modal-close>`, so
 * each closes it; the page listens for Confirm's click to act. The message is
 * the description, so it is announced as the dialog's `aria-describedby`.
 */
const elementsConfirm = ({
  tone = "default",
  size = "sm",
  showClose = false,
  trigger,
  triggerVariant,
  title,
  body,
  confirmLabel = "Confirm",
  confirmClose = true,
}: {
  tone?: Tone;
  size?: Size;
  showClose?: boolean;
  trigger: string;
  triggerVariant?: string;
  title: string;
  /** The description's text, then any further body lines. */
  body: readonly string[];
  confirmLabel?: string;
  /** Wrap Confirm in a close part; off for a confirm the page closes itself. */
  confirmClose?: boolean;
}) => {
  const variant = tone === "danger" ? "danger" : "primary";
  const [message, ...rest] = body;
  const confirm = button(confirmLabel, variant, size, " data-confirm");
  return [
    `<primitiv-modal>`,
    `  <primitiv-modal-trigger>`,
    `    ${button(trigger, triggerVariant ?? variant, "md")}`,
    `  </primitiv-modal-trigger>`,
    `  <primitiv-modal-content>`,
    `    <dialog class="primitiv-modal primitiv-modal--${size} primitiv-confirm-dialog">`,
    `      <span class="primitiv-modal__header">`,
    `        <primitiv-modal-title><h2 class="primitiv-modal__title">${title}</h2></primitiv-modal-title>`,
    ...(showClose
      ? [
          `        <primitiv-modal-close>`,
          `          <button type="button" class="primitiv-button primitiv-button--ghost primitiv-button--${CLOSE_SIZE[size]} primitiv-modal__close" aria-label="Close">${glyph("close")}</button>`,
          `        </primitiv-modal-close>`,
        ]
      : []),
    `      </span>`,
    `      <span class="primitiv-modal__body">`,
    `        <primitiv-modal-description><p class="primitiv-modal__description">${message}</p></primitiv-modal-description>`,
    ...rest.map((line) => `        ${line}`),
    `      </span>`,
    `      <span class="primitiv-modal__footer">`,
    `        <primitiv-modal-close>`,
    `          ${button("Cancel", "secondary", size)}`,
    `        </primitiv-modal-close>`,
    ...(confirmClose
      ? [`        <primitiv-modal-close>`, `          ${confirm}`, `        </primitiv-modal-close>`]
      : [`        ${confirm}`]),
    `      </span>`,
    `    </dialog>`,
    `  </primitiv-modal-content>`,
    `</primitiv-modal>`,
  ].join("\n");
};

/** The script a confirmation's code tab shows: act on Confirm's click. */
const confirmScript = (action: string) => [
  ``,
  `<script type="module">`,
  `  document.querySelector("[data-confirm]").addEventListener("click", () => {`,
  `    ${action}(); // the close part around the button closes the dialog`,
  `  });`,
  `</script>`,
];

/** The code tab's markup, then its script; the preview renders the markup alone. */
const withScript = (markup: string, action: string) => [markup, ...confirmScript(action)].join("\n");

/** The markup half of a code tab that ends in a script, glyphs filled in. */
const markupOnly = (_density: unknown, code: string) => {
  const script = code.indexOf("\n\n<script");
  return withGlyphs(script === -1 ? code : code.slice(0, script));
};

/* ------------------------------------------------------------------ *
 * Live previews
 * ------------------------------------------------------------------ */

/** The playground preview — a trigger and the confirmation it opens. */
const PlaygroundPreview = ({
  tone,
  size,
  showClose,
}: {
  tone: Tone;
  size: Size;
  showClose: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <PortalHost>
      <ConfirmDialog open={open} onOpenChange={setOpen}>
        <ConfirmDialogTrigger asChild>
          <Button variant={tone === "danger" ? "danger" : "primary"}>
            {tone === "danger" ? "Remove member" : "Publish release"}
          </Button>
        </ConfirmDialogTrigger>
        <Portal>
          <ConfirmDialogContent
            title={tone === "danger" ? "Remove member?" : "Publish release?"}
            tone={tone}
            size={size}
            showClose={showClose}
            confirmLabel={tone === "danger" ? "Remove" : "Publish"}
            onConfirm={() => setOpen(false)}
          >
            {tone === "danger"
              ? "This person will lose access immediately. This can't be undone."
              : "This makes v2.1 available to everyone."}
          </ConfirmDialogContent>
        </Portal>
      </ConfirmDialog>
    </PortalHost>
  );
};

/** A controlled confirm/cancel demo whose Confirm closes the dialog. */
const ActionExample = ({
  tone,
  triggerLabel,
  triggerVariant,
  title,
  confirmLabel,
  body,
}: {
  tone: Tone;
  triggerLabel: string;
  triggerVariant: "primary" | "danger";
  title: string;
  confirmLabel: string;
  body: ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <PortalHost>
      <ConfirmDialog open={open} onOpenChange={setOpen}>
        <ConfirmDialogTrigger asChild>
          <Button variant={triggerVariant}>{triggerLabel}</Button>
        </ConfirmDialogTrigger>
        <Portal>
          <ModalOverlay />
          <ConfirmDialogContent
            title={title}
            tone={tone}
            confirmLabel={confirmLabel}
            onConfirm={() => setOpen(false)}
          >
            {body}
          </ConfirmDialogContent>
        </Portal>
      </ConfirmDialog>
    </PortalHost>
  );
};

/* ------------------------------------------------------------------ *
 * The spec
 * ------------------------------------------------------------------ */

/**
 * ConfirmDialog's page content.
 *
 * A pre-arranged `Modal` (registry-only, hand-authored) that composes the
 * registry `modal` and `button` into a title + body-slot + Cancel/Confirm
 * footer, with the Confirm button's tone following the action. Like every
 * overlay page: nothing renders until the reader opens it, so the playground's
 * preview is a TRIGGER and every example is a button that opens its own dialog.
 *
 * Registry-only, so the page shows the Styled surface only (no Headless tab) —
 * `Modal`'s native-`<dialog>` machinery already covers the behaviour, so there
 * is no separate headless primitive.
 */
export const confirmDialogSpec: ComponentSpec = {
  playground: {
    component: "ConfirmDialog",
    controls: [
      {
        name: "tone",
        options: ["default", "danger"],
        defaultValue: "default",
        description:
          "Selects the Confirm button's variant — `default` → `primary`, `danger` → `danger` — so the action's own tone drives the dialog.",
      },
      {
        name: "size",
        options: ["sm", "md", "lg", "xl"],
        defaultValue: "sm",
        description:
          "Forwarded to `ModalContent`'s own `size`; a confirmation defaults to `sm` — smaller than a plain Modal's `md`.",
      },
      {
        name: "showClose",
        options: ["false", "true"],
        defaultValue: "false",
        description:
          "Shows a header close (×) button alongside the title, in addition to the footer actions.",
      },
    ],
    elementsPreview: (code) => withGlyphs(code),
    snippet: (values, mode) => {
      const tone = values.tone as Tone;
      const size = values.size as Size;
      const showClose = values.showClose === "true";
      const danger = tone === "danger";
      if (mode === "elements")
        return elementsConfirm({
          tone,
          size,
          showClose,
          trigger: danger ? "Remove member" : "Publish release",
          title: danger ? "Remove member?" : "Publish release?",
          body: [
            danger
              ? "This person will lose access immediately. This can't be undone."
              : "This makes v2.1 available to everyone.",
          ],
          confirmLabel: danger ? "Remove" : "Publish",
        });
      return [
        imports({ button: true }),
        ``,
        `const [open, setOpen] = useState(false);`,
        ``,
        `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
        `  <ConfirmDialogTrigger asChild>`,
        `    <Button variant="${danger ? "danger" : "primary"}">${danger ? "Remove member" : "Publish release"}</Button>`,
        `  </ConfirmDialogTrigger>`,
        `  <ModalPortal forceMount>`,
        `    <ConfirmDialogContent`,
        `      title="${danger ? "Remove member?" : "Publish release?"}"`,
        `      tone="${tone}"`,
        `      size="${size}"`,
        ...(showClose ? [`      showClose`] : []),
        `      confirmLabel="${danger ? "Remove" : "Publish"}"`,
        `      onConfirm={() => setOpen(false)}`,
        `    >`,
        `      ${danger ? "This person will lose access immediately. This can't be undone." : "This makes v2.1 available to everyone."}`,
        `    </ConfirmDialogContent>`,
        `  </ModalPortal>`,
        `</ConfirmDialog>`,
      ].join("\n");
    },
    render: (values) => (
      <PlaygroundPreview
        tone={values.tone as Tone}
        size={values.size as Size}
        showClose={values.showClose === "true"}
      />
    ),
  },

  anatomyMeta:
    "A pre-arranged `Modal`. `ConfirmDialog` and `ConfirmDialogTrigger` forward Modal's own `Root`/`Trigger`; `ConfirmDialogContent` renders the whole surface — a `ModalHeader` (title + optional close), a `ModalBody` slot for your message, and a `ModalFooter` with Cancel then Confirm. `ModalPortal` and `ModalOverlay` are not re-exported — compose them from the `modal` component, exactly as a plain Modal does.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) =>
        mode === "elements"
          ? [
              `<primitiv-modal>`,
              `  <primitiv-modal-trigger><button type="button"></button></primitiv-modal-trigger>`,
              `  <primitiv-modal-content>`,
              `    <dialog class="primitiv-modal primitiv-confirm-dialog">`,
              `      <primitiv-modal-title><h2></h2></primitiv-modal-title>`,
              `      <primitiv-modal-description><p></p></primitiv-modal-description>`,
              `      <primitiv-modal-close><button type="button">Cancel</button></primitiv-modal-close>`,
              `      <primitiv-modal-close><button type="button">Confirm</button></primitiv-modal-close>`,
              `    </dialog>`,
              `  </primitiv-modal-content>`,
              `</primitiv-modal>`,
            ].join("\n")
          : [
          `<ConfirmDialog>`,
          `  <ConfirmDialogTrigger />`,
          `  <ModalPortal>`,
          `    <ModalOverlay />        {/* optional */}`,
          `    <ConfirmDialogContent />`,
          `  </ModalPortal>`,
          `</ConfirmDialog>`,
        ].join("\n"),
    },
  ],

  keyboardMeta:
    "The keyboard model is `Modal`'s — it is a real `<dialog>` opened with `showModal()`, so the background is **inert**: everything behind it leaves the tab order and the accessibility tree.",

  keyboard: [
    {
      keys: ["Tab", "Shift+Tab"],
      behaviour:
        "Move between Cancel, Confirm and the optional close button, wrapping at each end.",
    },
    {
      keys: ["Escape"],
      behaviour:
        "Close the dialog and return focus to the trigger — the Cancel route, from the keyboard.",
    },
    {
      keys: ["Enter", "Space"],
      behaviour:
        "Activate the focused button. `onConfirm` does **not** close the dialog on its own.",
    },
  ],

  examples: [
    {
      id: "confirming-an-action",
      title: "Confirming an action",
      render: () => (
        <InteractiveExample
          elementsPreview={markupOnly}
          elementsCaption="The default shape: a title, a one-line message, and a `primary` Confirm beside Cancel. Both buttons sit in `<primitiv-modal-close>`, so either one closes the dialog and hands focus back to the trigger; the page listens for Confirm's click (`data-confirm` here is only a hook for the script) to do the work. The message is the description, so a screen reader announces it with the title on open."
          caption="The default shape: a title, a one-line body, and a `primary` Confirm beside Cancel. `onConfirm` fires when Confirm is pressed but does **not** close the dialog itself — drive `open`/`onOpenChange` from the callback (here `setOpen(false)`) so confirming dismisses it. Cancel always closes on its own; it is wrapped in `ModalClose`."
          code={(_density, mode) =>
            mode === "elements"
              ? withScript(
                  elementsConfirm({
                    trigger: "Publish release",
                    title: "Publish release?",
                    body: ["This makes v2.1 available to everyone."],
                    confirmLabel: "Publish",
                  }),
                  "publish",
                )
              : [
              imports({ button: true }),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button>Publish release</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal forceMount>`,
              `    <ConfirmDialogContent`,
              `      title="Publish release?"`,
              `      confirmLabel="Publish"`,
              `      onConfirm={() => {`,
              `        publish();`,
              `        setOpen(false);`,
              `      }}`,
              `    >`,
              `      This makes v2.1 available to everyone.`,
              `    </ConfirmDialogContent>`,
              `  </ModalPortal>`,
              `</ConfirmDialog>`,
            ].join("\n")
          }
        >
          {() => (
            <ActionExample
              tone="default"
              triggerLabel="Publish release"
              triggerVariant="primary"
              title="Publish release?"
              confirmLabel="Publish"
              body="This makes v2.1 available to everyone."
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "destructive-actions",
      title: "Destructive actions",
      render: () => (
        <InteractiveExample
          elementsPreview={markupOnly}
          elementsCaption="For a destructive confirmation, give Confirm the `primitiv-button--danger` class — the action's own tone drives the dialog, so there is no separate colour scheme. Match the trigger's tone too, and label the button with the verb (`Remove`, `Delete`), not `OK`, so the consequence is legible before the click."
          caption="Pass `tone=&quot;danger&quot;` for a destructive confirmation and the Confirm button turns `danger` — the action's own tone drives the dialog, so there is no separate colour scheme. Match the trigger's tone too, and label the button with the verb (`Remove`, `Delete`), not `OK`, so the consequence is legible before the click."
          code={(_density, mode) =>
            mode === "elements"
              ? withScript(
                  elementsConfirm({
                    tone: "danger",
                    trigger: "Remove member",
                    title: "Remove member?",
                    body: ["This person will lose access immediately. This can't be undone."],
                    confirmLabel: "Remove",
                  }),
                  "removeMember",
                )
              : [
              imports({ button: true }),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button variant="danger">Remove member</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal forceMount>`,
              `    <ConfirmDialogContent`,
              `      title="Remove member?"`,
              `      tone="danger"`,
              `      confirmLabel="Remove"`,
              `      onConfirm={() => {`,
              `        removeMember();`,
              `        setOpen(false);`,
              `      }}`,
              `    >`,
              `      This person will lose access immediately. This can't be undone.`,
              `    </ConfirmDialogContent>`,
              `  </ModalPortal>`,
              `</ConfirmDialog>`,
            ].join("\n")
          }
        >
          {() => (
            <ActionExample
              tone="danger"
              triggerLabel="Remove member"
              triggerVariant="danger"
              title="Remove member?"
              confirmLabel="Remove"
              body="This person will lose access immediately. This can't be undone."
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "rich-body",
      title: "A richer body",
      render: () => (
        <InteractiveExample
          elementsPreview={markupOnly}
          elementsCaption="The body region takes any markup, so it can carry more than a sentence when the decision needs it. Keep the lead sentence in `<primitiv-modal-description>` so it is announced, and the rest after it. Keep it short: a confirmation is a fork in the road, not a form."
          caption="`children` is a genuine `ModalBody` slot, not a `message` string — so the body can carry more than a sentence when the decision needs it. Keep it short: a confirmation is a fork in the road, not a form."
          code={(_density, mode) =>
            mode === "elements"
              ? withScript(
                  elementsConfirm({
                    tone: "danger",
                    trigger: "Delete project",
                    title: 'Delete "Harmoni"?',
                    body: [
                      "Deleting a project removes:",
                      `<ul class="primitiv-list primitiv-list--unordered primitiv-list--indent primitiv-list--sm">`,
                      `  <li class="primitiv-list__item"><span class="primitiv-list__item-content">all 42 palettes and their history</span></li>`,
                      `  <li class="primitiv-list__item"><span class="primitiv-list__item-content">every share link and export</span></li>`,
                      `</ul>`,
                    ],
                    confirmLabel: "Delete project",
                  }),
                  "deleteProject",
                )
              : [
              imports({ button: true }),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button variant="danger">Delete project</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal forceMount>`,
              `    <ConfirmDialogContent`,
              `      title='Delete "Harmoni"?'`,
              `      tone="danger"`,
              `      confirmLabel="Delete project"`,
              `      onConfirm={() => {`,
              `        deleteProject();`,
              `        setOpen(false);`,
              `      }}`,
              `    >`,
              `      <p>Deleting a project removes:</p>`,
              `      <ul>`,
              `        <li>all 42 palettes and their history</li>`,
              `        <li>every share link and export</li>`,
              `      </ul>`,
              `    </ConfirmDialogContent>`,
              `  </ModalPortal>`,
              `</ConfirmDialog>`,
            ].join("\n")
          }
        >
          {() => (
            <ActionExample
              tone="danger"
              triggerLabel="Delete project"
              triggerVariant="danger"
              title={'Delete "Harmoni"?'}
              confirmLabel="Delete project"
              body={
                <>
                  <p style={{ margin: 0 }}>Deleting a project removes:</p>
                  <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.25rem" }}>
                    <li>all 42 palettes and their history</li>
                    <li>every share link and export</li>
                  </ul>
                </>
              }
            />
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "sizes",
      title: "Sizes and density",
      render: () => (
        <InteractiveExample
          elementsPreview={() =>
            withGlyphs(
              [
                `<div class="docs-example-row">`,
                ...SIZES.map((size) =>
                  elementsConfirm({
                    size,
                    trigger: size,
                    triggerVariant: "secondary",
                    title: `Confirm at ${size}`,
                    body: ["Every size scales again with the nearest data-density ancestor."],
                  }),
                ),
                `</div>`,
              ].join("\n"),
            )
          }
          elementsCaption="The width is the `primitiv-modal--sm` to `--xl` class on the `<dialog>`; a confirmation is a short, low-content surface, so start at `sm`, and size the footer buttons with it. Each size rescales again with the nearest `data-density` ancestor — the dialog stays where you wrote it in the document, so it inherits one set on a section."
          caption="`size` forwards to `ModalContent` and defaults to `sm` — a confirmation is a short, low-content surface. Reach for a larger size only when the body genuinely needs the room, and each size rescales again with the nearest `data-density` ancestor. `ModalPortal` defaults to `document.body`, so pass `container` to keep a dialog under a `data-density` set on a section rather than the document — which is what these previews do."
          code={(density, mode) =>
            mode === "elements"
              ? [
                  `<div data-density="${density}">`,
                  ...SIZES.map(
                    (s) => `  <dialog class="primitiv-modal primitiv-modal--${s} primitiv-confirm-dialog">...</dialog>`,
                  ),
                  `</div>`,
                ].join("\n")
              : [
              imports(),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.map(
                (s) =>
                  `  <ConfirmDialogContent size="${s}" title="..." onConfirm={...}>...</ConfirmDialogContent>`,
              ),
              `</div>`,
            ].join("\n")
          }
        >
          {() => (
            <PortalHost>
              {SIZES.map((size) => (
                <ConfirmDialog key={size}>
                  <ConfirmDialogTrigger asChild>
                    <Button variant="secondary">{size}</Button>
                  </ConfirmDialogTrigger>
                  <Portal>
                    <ConfirmDialogContent
                      size={size}
                      title={`Confirm at ${size}`}
                      onConfirm={() => {}}
                    >
                      Every size scales again with the nearest data-density
                      ancestor.
                    </ConfirmDialogContent>
                  </Portal>
                </ConfirmDialog>
              ))}
            </PortalHost>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "header-close",
      title: "A header close button",
      render: () => (
        <InteractiveExample
          elementsPreview={markupOnly}
          elementsCaption="A third `<primitiv-modal-close>` in the header, around an icon-only ghost button with its own `aria-label`, adds a `×` beside the title. It is left out by default — the footer's Cancel already covers backing out of a short confirmation, so a second close reads as noise. Add it for a longer or richer surface where the escape hatch at the top-right is worth the extra target."
          caption="`showClose` adds a `×` button in the header, in addition to the footer's Cancel. It is **off by default** — the exploration found the footer's Cancel already covers the &quot;back out&quot; affordance for a short confirmation, so a second close reads as noise. Turn it on for a longer or richer surface where the escape hatch at the top-right is worth the extra target."
          code={(_density, mode) =>
            mode === "elements"
              ? withScript(
                  elementsConfirm({
                    showClose: true,
                    trigger: "Leave feedback",
                    title: "Send feedback?",
                    body: ["Your note goes to the team — thank you."],
                    confirmLabel: "Send",
                  }),
                  "send",
                )
              : [
              imports({ button: true }),
              ``,
              `<ConfirmDialog>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button>Leave feedback</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal forceMount>`,
              `    <ConfirmDialogContent showClose title="Send feedback?" onConfirm={send}>`,
              `      Your note goes to the team — thank you.`,
              `    </ConfirmDialogContent>`,
              `  </ModalPortal>`,
              `</ConfirmDialog>`,
            ].join("\n")
          }
        >
          {() => (
            <PortalHost>
              <ConfirmDialog>
                <ConfirmDialogTrigger asChild>
                  <Button>Leave feedback</Button>
                </ConfirmDialogTrigger>
                <Portal>
                  <ConfirmDialogContent
                    showClose
                    title="Send feedback?"
                    confirmLabel="Send"
                    onConfirm={() => {}}
                  >
                    Your note goes to the team — thank you.
                  </ConfirmDialogContent>
                </Portal>
              </ConfirmDialog>
            </PortalHost>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A pre-arranged Modal for confirming or cancelling a single action. In plain markup it is the `<primitiv-modal>` elements with the confirm-dialog and Button classes — a title, a message, and Cancel beside a Confirm whose tone follows the action — so it loads Modal's script and adds no element of its own.",
    anatomyMeta:
      "No elements of its own: the Modal elements, arranged. `<primitiv-modal>` holds the state in `open`; the trigger, title, description and the two closes each wrap the element you write, and the `<dialog>` carries `primitiv-confirm-dialog` beside the Modal classes. Its attributes and events are Modal's, listed below.",
    keyboardMeta:
      "The keyboard model is Modal's — a real `<dialog>` opened with `showModal()`, so the page behind it is **inert**.",
    keyboard: [
      {
        keys: ["Tab", "Shift+Tab"],
        behaviour: "Move between Cancel, Confirm and the optional close button, wrapping at each end.",
      },
      {
        keys: ["Escape"],
        behaviour: "Close the dialog and return focus to the trigger — the Cancel route, from the keyboard.",
      },
      {
        keys: ["Enter", "Space"],
        behaviour: "Activate the focused button. Inside `<primitiv-modal-close>`, Confirm closes the dialog too.",
      },
    ],
    accessibility: [
      "It is a real `<dialog>` opened with `showModal()` by `<primitiv-modal>`: the top layer, the **inert** page, the Tab wrap and Escape-to-close all come from Modal.",
      "The heading inside `<primitiv-modal-title>` is the dialog's accessible name and the paragraph inside `<primitiv-modal-description>` its description, so both are announced on open. Keep the title — an untitled confirmation is announced as an unnamed dialog.",
      "The danger class changes only Confirm's **colour**, never its name: label it with the verb (`Remove`, `Delete`), not `OK`, so a screen-reader user hears the consequence.",
      "Focus returns to the trigger on close, every route out included. If the trigger is gone by then — a row this dialog deleted — move focus somewhere deliberate yourself.",
      "A Confirm that waits for async work should say so: disable it (or mark it `aria-busy`) while the work runs, and close the dialog by setting `open = false` when it finishes.",
    ],
  },

  accessibility: [
    "It is a real `<dialog>` opened with `showModal()`, inherited wholesale from `Modal`: the top-layer stacking, the **inert** background, focus trapping and Escape-to-close all come for free, not from a `z-index` and an `aria-hidden` sweep.",
    "The `title` is the dialog's accessible name — it registers as `aria-labelledby`, and the body registers as `aria-describedby`, so both are announced on open. A confirmation with no title is announced as an unnamed dialog, so `title` is required.",
    "`tone` changes only the Confirm button's **colour**, never its accessible name. Colour is not a label, so the button text has to carry the meaning: prefer the verb (`Remove`, `Delete`) over `OK` so a screen-reader user hears the consequence.",
    "`onConfirm` does not close the dialog — that is deliberate, so you can await an async action first — but it means you own dismissal. Close it from the callback (`setOpen(false)`), or the reader is left in a dialog that looks like it did nothing.",
    "Focus returns to the trigger on close, every route out included (Cancel, Confirm-that-closes, Escape, the backdrop). If the trigger is gone by then — a row this dialog deleted — move focus somewhere deliberate yourself.",
    "The optional `showClose` button is icon-only and carries its own `aria-label=\"Close\"`; the footer's Cancel is the primary, always-present way out.",
  ],
};
