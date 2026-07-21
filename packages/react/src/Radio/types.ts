import { ChangeEventHandler, ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Radio.Indicator} — the decorative dot. All `<span>`
 * attributes plus the `asChild` escape hatch. The indicator is always mounted;
 * its visibility is a CSS concern, driven off the input's native `:checked`
 * state, so it stays correct even when the browser silently deselects a
 * grouped sibling (which fires no React event).
 */
export type RadioIndicatorProps = ComponentProps<"span"> & {
  /** Custom dot content. Omit to let the shipped CSS draw the dot off the
   * input's native `:checked` state; provide your own (an icon, glyph, or
   * nested element) to override it. */
  children?: ReactNode;
  /**
   * When `true`, render `children` as the indicator element itself (via the
   * {@link Slot} pattern) instead of wrapping them in a `<span>`. `data-state`
   * and `aria-hidden` are merged onto that element.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Shared base for both {@link RadioRootProps} variants — the native
 * `<input type="radio">` attributes (minus the ones the component owns) plus
 * the `onCheckedChange` convenience callback. `className` / `style` here style
 * the **wrapper** (the visible control), not the hidden input; everything
 * else spreads onto the input, because semantically the Root *is* the radio.
 */
export type RadioRootBaseProps = Omit<
  ComponentProps<"input">,
  "type" | "checked" | "defaultChecked"
> & {
  /**
   * Fired with the new checked value whenever this radio becomes selected.
   * A native radio only ever fires `change` when it moves *into* the checked
   * state, so this is always called with `true`.
   */
  onCheckedChange?: (checked: boolean) => void;
  children?: ReactNode;
  /** Forwarded to the underlying native `<input type="radio">`. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * Uncontrolled variant of {@link RadioRootProps}: the **browser** owns the
 * checked value (the input is rendered with `defaultChecked` and no `checked`
 * prop), so native `name`-grouping — including the silent deselection of
 * siblings — works for free. Pass `defaultChecked` (or omit it); `checked` is
 * forbidden.
 */
export type RadioRootUncontrolledProps = RadioRootBaseProps & {
  /** Whether this radio is selected on first render; the **browser** owns it
   * thereafter, so native `name`-grouping (including silent deselection of
   * siblings) works for free. Omit for an initially unselected radio. */
  defaultChecked?: boolean;
  /** Forbidden in uncontrolled mode — use `defaultChecked` instead. */
  checked?: never;
};

/**
 * Controlled variant of {@link RadioRootProps}: the parent owns the checked
 * value. Pass `checked` and `onCheckedChange` together; `defaultChecked` is
 * forbidden. The consumer owns grouping in this mode.
 */
export type RadioRootControlledProps = RadioRootBaseProps & {
  /** Forbidden in controlled mode — use `checked` instead. */
  defaultChecked?: never;
  /** Whether this radio is currently selected, owned by the parent. The
   * consumer owns grouping in this mode (typically deriving each radio's
   * `checked` from a single shared value). Keep it in sync via
   * `onCheckedChange`. */
  checked: boolean;
  /** Called (always with `true`) whenever this radio becomes selected —
   * required in controlled mode so the parent can update its shared value. */
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Props for {@link Radio.Root}. A discriminated union of
 * {@link RadioRootUncontrolledProps} and {@link RadioRootControlledProps},
 * so TypeScript accepts exactly one state mode.
 */
export type RadioRootProps =
  | RadioRootUncontrolledProps
  | RadioRootControlledProps;

/** Internal: the native `onChange` shape the Root composes with its own. */
export type RadioChangeHandler = ChangeEventHandler<HTMLInputElement>;
