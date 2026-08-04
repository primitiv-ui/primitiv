import { ComponentProps, ReactNode, Ref } from "react";

import type { Direction } from "../DirectionProvider/index.ts";
import type {
  DropdownContentProps,
  DropdownItemProps,
  DropdownSeparatorProps,
  DropdownTriggerProps,
} from "../Dropdown/types";

/**
 * Shared base for both {@link SplitButtonRootProps} variants — the native
 * `<div>` attributes (minus the component-owned `role` and the narrowed
 * `dir`) plus the `asChild` escape hatch, reading direction, and the
 * group-level `disabled`.
 */
export type SplitButtonRootBaseProps = Omit<
  ComponentProps<"div">,
  "role" | "dir"
> & {
  /**
   * The widget's parts — typically one
   * {@link SplitButtonActionProps | `SplitButton.Action`}, one
   * {@link SplitButtonTriggerProps | `SplitButton.Trigger`}, and one
   * {@link SplitButtonMenuProps | `SplitButton.Menu`}.
   */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLDivElement` (or to the `asChild`
   * element). */
  ref?: Ref<HTMLDivElement>;
  /**
   * When `true`, Root delegates rendering to a single consumer-supplied
   * element via the {@link Slot} pattern instead of the default `<div>`;
   * `role="group"`, `data-state`, `data-disabled` and the remaining props are
   * merged onto it.
   * @default false
   */
  asChild?: boolean;
  /**
   * Reading direction for the menu. Only affects which arrow key opens or
   * closes a submenu composed from `Dropdown.Sub` — `ArrowRight` opens in
   * `"ltr"`, `ArrowLeft` in `"rtl"`. When omitted it is inherited from the
   * nearest {@link DirectionProvider}, falling back to `"ltr"`.
   */
  dir?: Direction;
  /**
   * Disables the whole widget — both the primary action and the menu trigger
   * become non-interactive, and `data-disabled=""` is set on the group. OR-ed
   * with each half's own `disabled`, so a disabled group can never be
   * overridden back to enabled by a part.
   * @default false
   */
  disabled?: boolean;
};

/**
 * Uncontrolled variant of {@link SplitButtonRootProps}: the component owns the
 * menu's open state. Pass `defaultOpen` (or omit it); `onOpenChange` is
 * optional and `open` is forbidden.
 */
export type SplitButtonRootUncontrolledProps = SplitButtonRootBaseProps & {
  /**
   * Whether the menu is open on first render. Omit to start closed. The
   * component owns the state thereafter.
   * @default false
   */
  defaultOpen?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultOpen` instead. */
  open?: never;
  /**
   * Called whenever a user-driven transition opens or closes the menu
   * (trigger click, `ArrowDown` on the action, Escape, outside click,
   * selection). Optional in uncontrolled mode.
   */
  onOpenChange?: (open: boolean) => void;
};

/**
 * Controlled variant of {@link SplitButtonRootProps}: the parent owns the
 * menu's open state. Pass `open` and `onOpenChange` together; `defaultOpen` is
 * forbidden.
 */
export type SplitButtonRootControlledProps = SplitButtonRootBaseProps & {
  /** Forbidden in controlled mode — use `open` instead. */
  defaultOpen?: never;
  /**
   * Whether the menu is currently open. Must be kept in sync by the parent via
   * `onOpenChange`; the component never mutates it internally.
   */
  open: boolean;
  /**
   * Called whenever a user-driven transition would open or close the menu. The
   * parent is responsible for reflecting the new value back into `open`.
   * Required in controlled mode.
   */
  onOpenChange: (open: boolean) => void;
};

/**
 * Props for {@link SplitButtonRoot | `SplitButton.Root`} — the
 * controlled/uncontrolled discriminated union pairing
 * {@link SplitButtonRootUncontrolledProps} with
 * {@link SplitButtonRootControlledProps}, plus the shared group props.
 */
export type SplitButtonRootProps =
  | SplitButtonRootUncontrolledProps
  | SplitButtonRootControlledProps;

/**
 * Props for the internal frame component that renders the group element. Root
 * splits it out so the frame sits *inside* the `Dropdown.Root` it renders and
 * can therefore read the menu's open state.
 *
 * @internal
 */
export type SplitButtonFrameProps = Omit<
  SplitButtonRootBaseProps,
  "dir" | "disabled"
> & {
  /** Already defaulted by Root, so the frame receives a definite boolean. */
  disabled: boolean;
};

/**
 * Value published by `SplitButtonContext` — the derived ids that wire the
 * trigger's accessible name to the action, plus the group's disabled flag.
 *
 * @internal
 */
export type SplitButtonContextValue = {
  /** DOM id applied to {@link SplitButtonActionProps | `SplitButton.Action`};
   * referenced by the trigger's derived `aria-labelledby`. */
  actionId: string;
  /** DOM id applied to {@link SplitButtonTriggerProps | `SplitButton.Trigger`};
   * the self-reference half of its derived `aria-labelledby`. */
  triggerId: string;
  /** Whether the whole widget is disabled (Root's `disabled` prop). */
  disabled: boolean;
};

/**
 * Props for {@link SplitButtonAction | `SplitButton.Action`} — the native
 * `<button>` attributes minus `id`, which the component owns because the menu
 * trigger's accessible name references it.
 */
export type SplitButtonActionProps = Omit<ComponentProps<"button">, "id"> & {
  /** The action's visible label. Keep it real text — the menu trigger borrows
   * it for its own accessible name. */
  children?: ReactNode;
  /** Forwarded to the underlying `HTMLButtonElement` (or to the `asChild`
   * element). */
  ref?: Ref<HTMLButtonElement>;
  /**
   * When `true`, renders the consumer's element instead of `<button>` via the
   * {@link Slot} pattern. `type="button"` is **not** forwarded in this mode —
   * the child owns its own type semantics.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link SplitButtonTrigger | `SplitButton.Trigger`} —
 * {@link DropdownTriggerProps} minus `id`, which the component owns because
 * its derived `aria-labelledby` self-references it. Supply `aria-label` or
 * `aria-labelledby` to opt out of the derived name.
 */
export type SplitButtonTriggerProps = Omit<DropdownTriggerProps, "id">;

/**
 * Props for {@link SplitButtonMenu | `SplitButton.Menu`} — identical to
 * {@link DropdownContentProps}; the menu *is* a `Dropdown.Content`.
 */
export type SplitButtonMenuProps = DropdownContentProps;

/**
 * Props for {@link SplitButtonItem | `SplitButton.Item`} — identical to
 * {@link DropdownItemProps}.
 */
export type SplitButtonItemProps = DropdownItemProps;

/**
 * Props for {@link SplitButtonSeparator | `SplitButton.Separator`} — identical
 * to {@link DropdownSeparatorProps}.
 */
export type SplitButtonSeparatorProps = DropdownSeparatorProps;
