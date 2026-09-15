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

/** `ModalPortal`, aimed at the enclosing {@link PortalHost}. */
const Portal = ({ children, ...props }: ComponentProps<typeof ModalPortal>) => {
  const host = useContext(PortalHostContext);

  return (
    <ModalPortal container={host} {...props}>
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
    snippet: (values) => {
      const tone = values.tone as Tone;
      const size = values.size as Size;
      const showClose = values.showClose === "true";
      const danger = tone === "danger";
      return [
        imports({ button: true }),
        ``,
        `const [open, setOpen] = useState(false);`,
        ``,
        `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
        `  <ConfirmDialogTrigger asChild>`,
        `    <Button variant="${danger ? "danger" : "primary"}">${danger ? "Remove member" : "Publish release"}</Button>`,
        `  </ConfirmDialogTrigger>`,
        `  <ModalPortal>`,
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
      code: () =>
        [
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
          caption="The default shape: a title, a one-line body, and a `primary` Confirm beside Cancel. `onConfirm` fires when Confirm is pressed but does **not** close the dialog itself — drive `open`/`onOpenChange` from the callback (here `setOpen(false)`) so confirming dismisses it. Cancel always closes on its own; it is wrapped in `ModalClose`."
          code={() =>
            [
              imports({ button: true }),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button>Publish release</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal>`,
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
          caption="Pass `tone=&quot;danger&quot;` for a destructive confirmation and the Confirm button turns `danger` — the action's own tone drives the dialog, so there is no separate colour scheme. Match the trigger's tone too, and label the button with the verb (`Remove`, `Delete`), not `OK`, so the consequence is legible before the click."
          code={() =>
            [
              imports({ button: true }),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button variant="danger">Remove member</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal>`,
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
          caption="`children` is a genuine `ModalBody` slot, not a `message` string — so the body can carry more than a sentence when the decision needs it. Keep it short: a confirmation is a fork in the road, not a form."
          code={() =>
            [
              imports({ button: true }),
              ``,
              `const [open, setOpen] = useState(false);`,
              ``,
              `<ConfirmDialog open={open} onOpenChange={setOpen}>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button variant="danger">Delete project</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal>`,
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
          caption="`size` forwards to `ModalContent` and defaults to `sm` — a confirmation is a short, low-content surface. Reach for a larger size only when the body genuinely needs the room, and each size rescales again with the nearest `data-density` ancestor. `ModalPortal` defaults to `document.body`, so pass `container` to keep a dialog under a `data-density` set on a section rather than the document — which is what these previews do."
          code={(density) =>
            [
              imports(),
              ``,
              `<div data-density="${density}">`,
              ...SIZES.map(
                (s) =>
                  `  <ConfirmDialogContent size="${s}" title="…" onConfirm={…}>…</ConfirmDialogContent>`,
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
          caption="`showClose` adds a `×` button in the header, in addition to the footer's Cancel. It is **off by default** — the exploration found the footer's Cancel already covers the &quot;back out&quot; affordance for a short confirmation, so a second close reads as noise. Turn it on for a longer or richer surface where the escape hatch at the top-right is worth the extra target."
          code={() =>
            [
              imports({ button: true }),
              ``,
              `<ConfirmDialog>`,
              `  <ConfirmDialogTrigger asChild>`,
              `    <Button>Leave feedback</Button>`,
              `  </ConfirmDialogTrigger>`,
              `  <ModalPortal>`,
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

  accessibility: [
    "It is a real `<dialog>` opened with `showModal()`, inherited wholesale from `Modal`: the top-layer stacking, the **inert** background, focus trapping and Escape-to-close all come for free, not from a `z-index` and an `aria-hidden` sweep.",
    "The `title` is the dialog's accessible name — it registers as `aria-labelledby`, and the body registers as `aria-describedby`, so both are announced on open. A confirmation with no title is announced as an unnamed dialog, so `title` is required.",
    "`tone` changes only the Confirm button's **colour**, never its accessible name. Colour is not a label, so the button text has to carry the meaning: prefer the verb (`Remove`, `Delete`) over `OK` so a screen-reader user hears the consequence.",
    "`onConfirm` does not close the dialog — that is deliberate, so you can await an async action first — but it means you own dismissal. Close it from the callback (`setOpen(false)`), or the reader is left in a dialog that looks like it did nothing.",
    "Focus returns to the trigger on close, every route out included (Cancel, Confirm-that-closes, Escape, the backdrop). If the trigger is gone by then — a row this dialog deleted — move focus somewhere deliberate yourself.",
    "The optional `showClose` button is icon-only and carries its own `aria-label=\"Close\"`; the footer's Cancel is the primary, always-present way out.",
  ],
};
