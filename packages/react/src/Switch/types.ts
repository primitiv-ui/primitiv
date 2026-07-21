import { ChangeEventHandler, ComponentProps, ReactNode, Ref } from "react";

/**
 * Shared base for both {@link SwitchRootProps} variants — the native
 * `<input type="checkbox">` attributes (minus the ones the component owns:
 * `type`, `role`, `checked`, and `defaultChecked`), plus `children` and a
 * typed `ref`.
 *
 * Prop routing: `className` / `style` style the **track** (the visible
 * `<label>`, since the input is visually hidden); every other prop — `name`,
 * `value`, `id`, `aria-*`, `required`, `disabled`, `ref`, … — spreads onto the
 * hidden `<input>`, because semantically the Root *is* the switch.
 */
export type SwitchRootBaseProps = Omit<
  ComponentProps<"input">,
  "type" | "role" | "checked" | "defaultChecked"
> & {
  /** Content of the switch — typically a single
   * {@link SwitchThumbProps | `Switch.Thumb`}. */
  children?: ReactNode;
  /** Forwarded to the underlying native `HTMLInputElement` (the real,
   * visually-hidden checkbox), not the visible track. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * Uncontrolled variant of {@link SwitchRootProps}: the **browser** owns the
 * checked state, so the switch participates in native form submission and
 * reset. Pass `defaultChecked` (or omit it); `checked` is forbidden.
 */
export type SwitchRootUncontrolledProps = SwitchRootBaseProps & {
  /** Checked state on first render. Defaults to `false` when omitted.
   * @default false */
  defaultChecked?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultChecked` instead. */
  checked?: never;
  /** Called with the new boolean state whenever the switch toggles. Optional
   * in uncontrolled mode. */
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * Controlled variant of {@link SwitchRootProps}: the parent owns the checked
 * value. Pass `checked` and `onCheckedChange` together; `defaultChecked` is
 * forbidden.
 */
export type SwitchRootControlledProps = SwitchRootBaseProps & {
  /** Forbidden in controlled mode — use `checked` instead. */
  defaultChecked?: never;
  /** The controlled checked state. Must be kept in sync by the parent via
   * `onCheckedChange`. */
  checked: boolean;
  /** Called with the new boolean state whenever the user requests a toggle.
   * Required in controlled mode. */
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Props for {@link SwitchRoot | `Switch.Root`}.
 *
 * Resolves to either {@link SwitchRootUncontrolledProps} or
 * {@link SwitchRootControlledProps} — only one shape is accepted by TypeScript
 * at a time.
 */
export type SwitchRootProps =
  | SwitchRootUncontrolledProps
  | SwitchRootControlledProps;

/**
 * The Switch's props, named to the `<Component>Props` convention the generated
 * styled wrapper imports (mirrors {@link ButtonProps}). An alias of the Root's
 * props, since `Switch` is callable as {@link SwitchRootProps | `Switch.Root`}.
 */
export type SwitchProps = SwitchRootProps;

/**
 * Props for {@link SwitchThumb | `Switch.Thumb`} — the decorative sliding
 * indicator inside the track. All `HTMLSpanElement` attributes, plus the
 * `asChild` escape hatch.
 */
export type SwitchThumbProps = ComponentProps<"span"> & {
  /** Optional thumb content (rarely needed — the thumb is usually styled
   * purely with CSS). */
  children?: ReactNode;
  /**
   * When `true`, render the consumer's own element as the thumb instead of the
   * default `<span>`, merging `aria-hidden` and `data-state` onto it via the
   * {@link Slot} pattern.
   * @default false
   */
  asChild?: boolean;
};

/** Internal: the native `onChange` shape the Root composes with its own. */
export type SwitchChangeHandler = ChangeEventHandler<HTMLInputElement>;
