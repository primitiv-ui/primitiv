import { ComponentProps, ReactNode, Ref } from "react";
import type { CheckedState } from "../Checkbox/types";

/**
 * Props for {@link CheckboxCardIndicator | `CheckboxCard.Indicator`} — the
 * decorative visual marker (typically a tick icon) shown while the card is
 * checked or indeterminate. All `HTMLSpanElement` attributes, plus the
 * `forceMount` and `asChild` escape hatches.
 */
export type CheckboxCardIndicatorProps = ComponentProps<"span"> & {
  /** The indicator content — typically an `<svg>` tick or check glyph. */
  children?: ReactNode;
  /**
   * Keep the indicator mounted while the card is **unchecked** so a CSS exit
   * animation can play against `data-state="unchecked"`. By default the
   * indicator unmounts as soon as the card is unchecked.
   * @default false
   */
  forceMount?: boolean;
  /**
   * When `true`, render the consumer's own element (typically an `<svg>`) as
   * the indicator instead of the default `<span>`, merging `aria-hidden` and
   * `data-state` onto it via the {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Shared base for both {@link CheckboxCardRootProps} variants — the native
 * `<button>` attributes (minus the ones the component owns: `type`, `role`,
 * `aria-checked`, and `defaultChecked`), plus the `asChild` escape hatch and a
 * typed `ref`.
 */
export type CheckboxCardRootBaseProps = Omit<
  ComponentProps<"button">,
  "type" | "role" | "aria-checked" | "defaultChecked"
> & {
  /**
   * When `true`, render the consumer's own element instead of the default
   * `<button type="button">`, merging `role`, `aria-checked`, `data-state`,
   * the composed `onClick`, `disabled`, and `ref` onto it via the
   * {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
  /** Forwarded to the rendered element (the `<button>` by default). */
  ref?: Ref<HTMLButtonElement>;
};

/**
 * Uncontrolled variant of {@link CheckboxCardRootProps}: the component owns the
 * checked state, seeded by an optional `defaultChecked`. Pass `defaultChecked`
 * (or omit it); `checked` is forbidden.
 */
export type CheckboxCardRootUncontrolledProps = CheckboxCardRootBaseProps & {
  /** Tri-state checked value on first render (`true` / `false` /
   * `"indeterminate"`). Defaults to `false` when omitted.
   * @default false */
  defaultChecked?: CheckedState;
  /** Forbidden in uncontrolled mode — use `defaultChecked` instead. */
  checked?: never;
  /** Called with the new **boolean** checked state whenever the card toggles.
   * An indeterminate card resolves to `true` on first click. Optional in
   * uncontrolled mode. */
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * Controlled variant of {@link CheckboxCardRootProps}: the caller owns the
 * checked state via `checked` and is notified through the required
 * `onCheckedChange`. Pass both together; `defaultChecked` is forbidden.
 */
export type CheckboxCardRootControlledProps = CheckboxCardRootBaseProps & {
  /** Forbidden in controlled mode — use `checked` instead. */
  defaultChecked?: never;
  /** The controlled tri-state checked value (`true` / `false` /
   * `"indeterminate"`). Must be kept in sync by the parent via
   * `onCheckedChange`. */
  checked: CheckedState;
  /** Called with the new **boolean** checked state when the user toggles. An
   * indeterminate card resolves to `true` on click. Required in controlled
   * mode. */
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Props for {@link CheckboxCardRoot | `CheckboxCard.Root`}.
 *
 * Resolves to either {@link CheckboxCardRootUncontrolledProps} or
 * {@link CheckboxCardRootControlledProps} — only one shape is accepted by
 * TypeScript at a time. Both accept the tri-state {@link CheckedState}
 * (`boolean | "indeterminate"`).
 */
export type CheckboxCardRootProps =
  | CheckboxCardRootUncontrolledProps
  | CheckboxCardRootControlledProps;
