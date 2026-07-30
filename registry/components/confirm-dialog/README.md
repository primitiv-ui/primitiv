# ConfirmDialog

The Primitiv **ConfirmDialog** — a pre-arranged [Modal](../modal/README.md) for
confirming or cancelling a single action: a title, an open body slot for the
message, and a right-aligned Cancel/Confirm footer. It composes Modal's own
`<dialog>` machinery and registry parts wholesale (focus trap, inert
background, top layer, `Esc`, click-outside, controlled/uncontrolled state,
the imperative open/close API, every visual token) and adds no new anatomy —
it just pre-arranges Modal's existing parts into the confirm/cancel shape and
exposes it as a handful of props.

There is **no headless `@primitiv-ui/react` primitive** for ConfirmDialog: the
headless `Modal`'s native-`<dialog>` focus and dismissal handling already
covers everything this component needs, so it ships as a registry-only
composition — like `alert` composing `button`, but here composing `modal`
*and* `button`.

`primitiv add confirm-dialog` copies this styled surface into your project.
The files are yours to edit; the stable contract is the
`.primitiv-confirm-dialog` class and the `data-state` hook (RFC 0006
Principle 2 — names are stable, values are not). Every other visual
declaration — surface, border, radius, padding, dividers, type, the size
scale, animations, focus ring — is Modal's own; see
[Modal's README](../modal/README.md) for that surface.

## Anatomy

`ConfirmDialogContent` renders Modal's own parts directly:

- **`ModalHeader`** — the title, plus an optional close (×) button
  (`showClose`, off by default).
- **`ModalBody`** — an open slot for the confirmation message or any richer
  content ("it is up to the consumer to put the content in there" — see the
  "Confirm / Alert Dialog — exploration" Figma page for the design record).
- **`ModalFooter`** — Cancel (always closes the dialog) then Confirm.

The Confirm button's variant follows `tone`: `default` → `primary`, `danger`
→ `danger` — the dialog itself has no separate colour scheme, only the
action's own tone.

## Usage

```tsx
import { ConfirmDialog, ConfirmDialogTrigger, ConfirmDialogContent } from "@/components/confirm-dialog";
import { ModalPortal, ModalOverlay } from "@/components/modal";
import { Button } from "@/components/button";

const [open, setOpen] = useState(false);

<ConfirmDialog open={open} onOpenChange={setOpen}>
  <ConfirmDialogTrigger asChild>
    <Button variant="danger">Remove member</Button>
  </ConfirmDialogTrigger>
  <ModalPortal>
    <ModalOverlay />
    <ConfirmDialogContent
      title="Remove member?"
      tone="danger"
      confirmLabel="Remove"
      onConfirm={() => {
        removeMember();
        setOpen(false);
      }}
    >
      This person will lose access immediately. This can't be undone.
    </ConfirmDialogContent>
  </ModalPortal>
</ConfirmDialog>;
```

`ConfirmDialogContent`'s `onConfirm` does **not** close the dialog itself —
call it from the callback (as above) or drive `open` however else fits the
flow (e.g. wait for an async action to resolve first).

`ConfirmDialog` and `ConfirmDialogTrigger` are the only new exports; `Portal`
and `Overlay` are deliberately not re-exported — they are visually and
behaviourally identical to a plain Modal's, so import them from
`@/components/modal` directly.

## Props

| Prop | Values | Default | Effect |
|---|---|---|---|
| `title` | `ReactNode` | — required | The dialog's title. |
| `children` | `ReactNode` | — required | The body content, rendered inside `ModalBody`'s slot. |
| `tone` | `default` · `danger` | `default` | Selects the Confirm button's variant (`primary` / `danger`). |
| `size` | `sm` · `md` · `lg` · `xl` | `sm` | Forwarded to `ModalContent`'s own `size` — a confirmation is a short, low-content surface, so it defaults smaller than a plain Modal's `md`. |
| `confirmLabel` | `string` | `"Confirm"` | Confirm button label. |
| `cancelLabel` | `string` | `"Cancel"` | Cancel button label. |
| `onConfirm` | `() => void` | — required | Called when Confirm is activated. |
| `showClose` | `boolean` | `false` | Shows a header close (×) button alongside the title, in addition to the footer actions. Off by default — the exploration found the footer's Cancel already covers "back out" for a short confirmation. |

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-confirm-dialog` class and the `data-state` hook. No modifiers or custom properties of its own: every visual knob is Modal's. |
| `styles.css` | **authored** | A minimal sheet declaring the layer order and a reserved (currently empty) `.primitiv-confirm-dialog` rule — the theme itself is Modal's. |
| `styles.scss` | **authored** | Byte-identical to `styles.css` (no custom properties to alias). |
| `confirm-dialog.recipe.ts` | **authored** | `cva("primitiv-confirm-dialog")` — no variants; `size` forwards to `ModalContent`, `tone` is pure prop logic. |
| `confirm-dialog.tsx` | **authored** | `ConfirmDialog` / `ConfirmDialogTrigger` / `ConfirmDialogContent` — composes the registry `modal` and `button` components. |

Because there is no headless primitive and no generator-emitted shape for
this composition, `confirm-dialog.tsx`/`confirm-dialog.recipe.ts` carry **no
drift-guard test** (contrast the generated wrappers, D53). It is still
type-checked in CI by `scripts/check-registry-types.mjs`.

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) —
  the headless `Modal` primitive (via the registry `modal` component).
- The registry [`modal`](../modal/README.md) and [`button`](../button/README.md)
  components — installed automatically as dependencies.
- [`class-variance-authority`](https://cva.style) — the recipe.
- The **token layer** (`primitiv tokens`) — resolved entirely through Modal's
  own `--primitiv-modal-*` custom properties; this component adds none of its
  own.
