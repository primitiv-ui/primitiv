import { useId, useMemo, type KeyboardEvent, type ReactElement } from "react";

import { Dropdown } from "../Dropdown/index.ts";
import { useDropdownContext } from "../Dropdown/hooks/index.ts";
import type { DropdownRootProps } from "../Dropdown/types";
import { Slot, composeEventHandlers } from "../Slot/index.ts";
import { deriveId } from "../utils/index.ts";
import {
  SplitButtonProvider,
  useSplitButtonContext,
} from "./SplitButtonContext";
import {
  SplitButtonActionProps,
  SplitButtonFrameProps,
  SplitButtonItemProps,
  SplitButtonMenuProps,
  SplitButtonRootProps,
  SplitButtonSeparatorProps,
  SplitButtonTriggerProps,
} from "./types";

/**
 * The root of a SplitButton — renders the `role="group"` element that binds
 * the primary action and the menu trigger into one widget, and owns the
 * menu's open state by rendering a {@link Dropdown | `Dropdown.Root`} around
 * it.
 *
 * **Two controls, one widget.** A split button is *not* a `Select`: the left
 * half performs an action immediately, the right half opens a menu of related
 * alternatives. Both halves stay independently tabbable — that is correct for
 * two genuinely separate commands, and deliberately *not* a roving tabstop.
 *
 * **Open state.** Identical to `Dropdown.Root`'s: uncontrolled via
 * `defaultOpen`, or controlled via `open` + `onOpenChange`, statically
 * discriminated at the type level. `dir` is forwarded too, so submenus
 * composed from `Dropdown.Sub` invert their arrow keys in RTL.
 *
 * **Styling hooks.** `data-split-button=""`, `data-state="open" | "closed"`
 * tracking the menu, and `data-disabled=""` when the group is disabled.
 *
 * **`asChild` composition.** Pass `asChild` to render a consumer-supplied
 * element as the group instead of `<div>`.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled
 * ```tsx
 * <SplitButton>
 *   <SplitButton.Action onClick={squashAndMerge}>
 *     Squash and merge
 *   </SplitButton.Action>
 *   <SplitButton.Trigger>
 *     <ChevronDown aria-hidden="true" />
 *     <VisuallyHidden>More merge options</VisuallyHidden>
 *   </SplitButton.Trigger>
 *   <SplitButton.Menu>
 *     <SplitButton.Item onSelect={mergeCommit}>
 *       Create a merge commit
 *     </SplitButton.Item>
 *     <SplitButton.Item onSelect={rebase}>Rebase and merge</SplitButton.Item>
 *   </SplitButton.Menu>
 * </SplitButton>
 * ```
 *
 * @example Controlled menu, whole widget disabled
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <SplitButton open={open} onOpenChange={setOpen} disabled={saving}>
 *   ...
 * </SplitButton>
 * ```
 */
export function SplitButtonRoot({
  defaultOpen,
  open,
  onOpenChange,
  dir,
  disabled = false,
  children,
  ref,
  ...rest
}: SplitButtonRootProps): ReactElement {
  return (
    <Dropdown.Root
      {...({ defaultOpen, open, onOpenChange, dir } as DropdownRootProps)}
    >
      <SplitButtonFrame {...rest} ref={ref} disabled={disabled}>
        {children}
      </SplitButtonFrame>
    </Dropdown.Root>
  );
}

/** @internal */
// Stryker disable next-line StringLiteral: the compound is `Object.assign(SplitButtonRoot, ...)`,
// so `SplitButton.displayName = "SplitButton"` overwrites this value at load — it is never
// observable at runtime. The assignment itself must stay: it is what declares `displayName`
// on `typeof SplitButtonRoot`, which `TSplitButtonCompound` extends.
SplitButtonRoot.displayName = "SplitButtonRoot";

/**
 * The group element itself, split out of {@link SplitButtonRoot} so it can
 * read the open state of the `Dropdown.Root` that Root renders around it.
 *
 * @internal
 */
function SplitButtonFrame({
  asChild = false,
  disabled,
  children,
  ref,
  ...rest
}: SplitButtonFrameProps): ReactElement {
  const { open } = useDropdownContext();
  const rootId = useId();
  const contextValue = useMemo(
    () => ({
      actionId: deriveId(rootId, "split-button", "action"),
      triggerId: deriveId(rootId, "split-button", "trigger"),
      disabled,
    }),
    [rootId, disabled],
  );

  const frameProps = {
    ...rest,
    ref,
    role: "group" as const,
    "data-split-button": "",
    "data-state": open ? ("open" as const) : ("closed" as const),
    "data-disabled": disabled ? "" : undefined,
  };

  return (
    <SplitButtonProvider value={contextValue}>
      {asChild ? (
        <Slot {...frameProps}>{children}</Slot>
      ) : (
        <div {...frameProps}>{children}</div>
      )}
    </SplitButtonProvider>
  );
}

/**
 * The primary half — a `<button type="button">` that performs the default
 * action immediately on click. It is **not** the menu trigger and carries no
 * `aria-haspopup`.
 *
 * **Keyboard.** `ArrowDown` opens the menu and moves focus to its first item,
 * the standard split-button affordance for reaching the alternatives without
 * tabbing past the action. Every other key falls through, and a consumer's own
 * `onKeyDown` runs first.
 *
 * **Accessible naming.** This element's `id` is component-owned (hence
 * `Omit`-ted from the props) because
 * {@link SplitButtonTrigger | `SplitButton.Trigger`} references it to build
 * its own accessible name — give the action a visible text label and the
 * chevron half is named for free.
 *
 * **Disabled.** Sets native `disabled` plus `data-disabled=""` when either
 * this prop or the group's `disabled` is set; the two are OR-ed, so the group
 * can never be overridden back to enabled.
 *
 * **`asChild` composition.** Renders the consumer's element instead of
 * `<button>` — e.g. a router link. `type="button"` is **not** forwarded in
 * this mode; the child owns its own type semantics.
 *
 * @extends HTMLButtonElement
 *
 * @example
 * ```tsx
 * <SplitButton.Action onClick={squashAndMerge}>
 *   Squash and merge
 * </SplitButton.Action>
 * ```
 *
 * @example asChild — the action navigates instead of firing a handler
 * ```tsx
 * <SplitButton.Action asChild>
 *   <a href="/merge">Squash and merge</a>
 * </SplitButton.Action>
 * ```
 */
export function SplitButtonAction({
  asChild = false,
  children,
  disabled,
  onKeyDown,
  ref,
  ...rest
}: SplitButtonActionProps): ReactElement {
  const { actionId, disabled: groupDisabled } = useSplitButtonContext();
  const { setOpen } = useDropdownContext();
  const isDisabled = groupDisabled || disabled === true;

  const openMenu = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setOpen(true);
  };

  const actionProps = {
    ...rest,
    ref,
    id: actionId,
    disabled: isDisabled,
    onKeyDown: composeEventHandlers(onKeyDown, openMenu),
    "data-disabled": isDisabled ? "" : undefined,
    "data-split-button-action": "",
  };

  if (asChild) {
    return <Slot {...actionProps}>{children}</Slot>;
  }

  return (
    <button type="button" {...actionProps}>
      {children}
    </button>
  );
}

SplitButtonAction.displayName = "SplitButtonAction";

/**
 * The menu half — a `<button type="button">` carrying `aria-haspopup="menu"`,
 * `aria-expanded` and `aria-controls`, all inherited from
 * {@link Dropdown | `Dropdown.Trigger`}.
 *
 * **Accessible name, derived.** A chevron-only control has no text of its own,
 * so unless you pass `aria-label` or `aria-labelledby` the trigger defaults to
 * `aria-labelledby="<its own id> <the action's id>"`. Self-reference is valid
 * in `aria-labelledby` and resolves to the element's own contents, so a
 * visually-hidden "More options" inside the trigger yields
 * *"More options, Squash and merge"* rather than an unlabelled button or a
 * second control with the same name as the action. Passing either ARIA
 * attribute yourself opts out entirely.
 *
 * **Disabled.** OR-ed with the group's `disabled`, exactly like
 * {@link SplitButtonAction | `SplitButton.Action`}.
 *
 * **Styling hooks.** `data-split-button-trigger=""`, plus `data-disabled=""`.
 * Its `id` is component-owned (`Omit`-ted from the props) because the derived
 * name references it.
 *
 * @extends HTMLButtonElement
 *
 * @example Derived name — chevron plus hidden text
 * ```tsx
 * <SplitButton.Trigger>
 *   <ChevronDown aria-hidden="true" />
 *   <VisuallyHidden>More merge options</VisuallyHidden>
 * </SplitButton.Trigger>
 * ```
 *
 * @example Explicit name — opts out of the derivation
 * ```tsx
 * <SplitButton.Trigger aria-label="More merge options">
 *   <ChevronDown aria-hidden="true" />
 * </SplitButton.Trigger>
 * ```
 */
export function SplitButtonTrigger({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  disabled,
  ...rest
}: SplitButtonTriggerProps): ReactElement {
  const {
    actionId,
    triggerId,
    disabled: groupDisabled,
  } = useSplitButtonContext();
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  const isDisabled = groupDisabled || disabled === true;

  return (
    <Dropdown.Trigger
      {...rest}
      id={triggerId}
      aria-label={ariaLabel}
      aria-labelledby={named ? ariaLabelledBy : `${triggerId} ${actionId}`}
      disabled={isDisabled}
      data-disabled={isDisabled ? "" : undefined}
      data-split-button-trigger=""
    />
  );
}

SplitButtonTrigger.displayName = "SplitButtonTrigger";

/**
 * The menu panel of alternative actions — a `role="menu"` native
 * `popover="auto"` element delegating wholly to
 * {@link Dropdown | `Dropdown.Content`}: arrow-key navigation, Home/End,
 * typeahead, Escape-to-close-and-restore-focus, and light dismiss all come
 * from there.
 *
 * Anything valid inside a `Dropdown.Content` is valid here — `Dropdown.Group`,
 * `Dropdown.Label`, `Dropdown.CheckboxItem`, `Dropdown.Sub` — because Root
 * provides the same Dropdown context. `SplitButton` re-exports only the two
 * parts a split button's menu almost always needs
 * ({@link SplitButtonItem | `Item`} and
 * {@link SplitButtonSeparator | `Separator`}); reach for `Dropdown.*` directly
 * for the rest.
 *
 * **Styling hook.** `data-split-button-menu=""`, alongside Dropdown's own.
 *
 * @extends HTMLMenuElement
 *
 * @example
 * ```tsx
 * <SplitButton.Menu>
 *   <SplitButton.Item onSelect={mergeCommit}>Create a merge commit</SplitButton.Item>
 *   <SplitButton.Separator />
 *   <SplitButton.Item disabled>Rebase and merge</SplitButton.Item>
 * </SplitButton.Menu>
 * ```
 */
export function SplitButtonMenu(props: SplitButtonMenuProps): ReactElement {
  return <Dropdown.Content {...props} data-split-button-menu="" />;
}

SplitButtonMenu.displayName = "SplitButtonMenu";

/**
 * One alternative action in the menu — a `role="menuitem"` row, delegating
 * wholly to {@link Dropdown | `Dropdown.Item`}. Fires `onSelect` with a
 * cancellable event and auto-closes the menu; call `event.preventDefault()`
 * to keep it open. `disabled` rows get `aria-disabled` and are skipped by
 * arrow navigation and typeahead.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <SplitButton.Item onSelect={() => merge("rebase")}>
 *   Rebase and merge
 * </SplitButton.Item>
 * ```
 */
export function SplitButtonItem(props: SplitButtonItemProps): ReactElement {
  return <Dropdown.Item {...props} />;
}

SplitButtonItem.displayName = "SplitButtonItem";

/**
 * A `role="separator"` divider between groups of alternatives, delegating
 * wholly to {@link Dropdown | `Dropdown.Separator`}. Skipped by focus and
 * typeahead.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <SplitButton.Separator />
 * ```
 */
export function SplitButtonSeparator(
  props: SplitButtonSeparatorProps,
): ReactElement {
  return <Dropdown.Separator {...props} />;
}

SplitButtonSeparator.displayName = "SplitButtonSeparator";

/** Type of the {@link SplitButton} compound: the root callable plus its
 * attached sub-components. */
export type TSplitButtonCompound = typeof SplitButtonRoot & {
  Root: typeof SplitButtonRoot;
  Action: typeof SplitButtonAction;
  Trigger: typeof SplitButtonTrigger;
  Menu: typeof SplitButtonMenu;
  Item: typeof SplitButtonItem;
  Separator: typeof SplitButtonSeparator;
};

/**
 * Headless, accessible **SplitButton** — one primary action paired with a menu
 * of related alternatives, bound into a single `role="group"` widget. Zero
 * styles ship.
 *
 * A split button is an **actions** control, not a value control: clicking the
 * left half runs the default action immediately, and the right half opens a
 * menu of alternatives (which may run their own action, or re-point what the
 * primary half does). If what you need is "which option is currently
 * selected?", reach for {@link Select} instead.
 *
 * `SplitButton` is a composition over {@link Dropdown} — Root renders a
 * `Dropdown.Root` and every menu part delegates to Dropdown's, so all the menu
 * keyboard/focus/light-dismiss behaviour is Dropdown's, tested once. What this
 * component adds on top is the coordination between the two halves that
 * Dropdown alone cannot provide:
 *
 * - the `role="group"` boundary that makes them read as one widget;
 * - the trigger's accessible name, derived from the primary action;
 * - `disabled` propagating from the group to both halves;
 * - `ArrowDown` on the action opening the menu.
 *
 * `SplitButton` is both callable (an alias of `SplitButton.Root`) and carries
 * its sub-components as static properties:
 *
 * - {@link SplitButtonRoot | `SplitButton.Root`} — the `role="group"` element
 *   and the menu's state owner.
 * - {@link SplitButtonAction | `SplitButton.Action`} — the primary half.
 * - {@link SplitButtonTrigger | `SplitButton.Trigger`} — the menu half.
 * - {@link SplitButtonMenu | `SplitButton.Menu`} — the menu panel.
 * - {@link SplitButtonItem | `SplitButton.Item`} — one alternative action.
 * - {@link SplitButtonSeparator | `SplitButton.Separator`} — a divider.
 *
 * **Both halves are tabbable.** They are two separate commands, so each is its
 * own tab stop — this is not a roving-tabindex widget, and should not become
 * one.
 *
 * @example
 * ```tsx
 * import { SplitButton, VisuallyHidden } from "@primitiv-ui/react";
 *
 * <SplitButton>
 *   <SplitButton.Action onClick={squashAndMerge}>
 *     Squash and merge
 *   </SplitButton.Action>
 *   <SplitButton.Trigger>
 *     <ChevronDown aria-hidden="true" />
 *     <VisuallyHidden>More merge options</VisuallyHidden>
 *   </SplitButton.Trigger>
 *   <SplitButton.Menu>
 *     <SplitButton.Item onSelect={mergeCommit}>
 *       Create a merge commit
 *     </SplitButton.Item>
 *     <SplitButton.Item onSelect={rebase}>Rebase and merge</SplitButton.Item>
 *   </SplitButton.Menu>
 * </SplitButton>
 * ```
 *
 * @see {@link SplitButtonRoot} for open-state modes and the group anatomy.
 * @see {@link SplitButtonTrigger} for how the derived accessible name works.
 * @see {@link Dropdown} for everything the menu itself does.
 */
const SplitButtonCompound: TSplitButtonCompound = Object.assign(
  SplitButtonRoot,
  {
    Root: SplitButtonRoot,
    Action: SplitButtonAction,
    Trigger: SplitButtonTrigger,
    Menu: SplitButtonMenu,
    Item: SplitButtonItem,
    Separator: SplitButtonSeparator,
  },
);

SplitButtonCompound.displayName = "SplitButton";

export { SplitButtonCompound as SplitButton };
