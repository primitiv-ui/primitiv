import "../styles/primitiv/select/styles.css";
/*
 * Select — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: in the rich (default) render path Select.Root is a context
 * boundary plus a visually-hidden form <select>, so it takes no className, and
 * the same `size` axis has to reach two separately-anchored elements — the
 * control and the popover panel. Icon / ItemLeading / ItemLabel / ItemTrailing /
 * GroupLabel are presentational spans with no headless counterpart, mirroring
 * the Figma `Select / Trigger` leading slot, the `Dropdown / Item` row slots,
 * and the `Dropdown / Label` heading.
 *
 * `native` picks the render path. Under `native` the root IS the control, so it
 * takes the frame classes (mode `native`, which keeps the platform popup and
 * arrow); in rich mode the frame goes on Trigger (mode `rich`) and the panel on
 * Content. Keep contract.json + the stylesheet + this file in sync by hand.
 *
 * Positioning is CSS anchor positioning, and `Select` derives its OWN
 * `anchor-name` — it does not ask the consumer to wire one. This mirrors the fix
 * `dropdown` (and `breadcrumb-overflow`, and `pagination`) already makes, for
 * the same reason: a page may hold more than one Select, so a static ident is
 * unusable, and every consumer ended up writing the same `useId`-derived
 * wrapper by hand. Left to the consumer it also fails in the worst possible
 * way — with no ident the panel's `anchor()` insets do not resolve, so instead
 * of landing near the trigger it pins to the viewport's top-left corner.
 *
 * It is an inline style rather than a custom property because `anchor-name:
 * var(--x)` does not work: the property is not var()-substitutable in this
 * position and computes to `none`. A consumer's own `style.anchorName` /
 * `style.positionAnchor` still wins (spread order), which is the escape hatch
 * for anchoring the panel to something other than its trigger.
 */
import { Select as SelectPrimitive } from "@primitiv-ui/react";
import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  select,
  selectValue,
  selectLeading,
  selectIcon,
  selectContent,
  selectItem,
  selectItemIndicator,
  selectItemLeading,
  selectItemLabel,
  selectItemTrailing,
  selectGroup,
  selectGroupLabel,
  selectSeparator,
} from "./select.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

type SelectSize = "xs" | "sm" | "md" | "lg" | "xl";

type SelectPlacement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

/* `useId()` returns something like ":r3:", and a CSS <custom-ident> may not
   contain a colon — so every character outside [A-Za-z0-9_-] becomes a hyphen.
   Same helper as NavigationMenu's `toAnchorIdentFragment` and dropdown's copy. */
const toAnchorIdent = (id: string) => `--primitiv-select-${id.replace(/[^A-Za-z0-9_-]/g, "-")}`;

/* Undefined outside a `Select`, which is what keeps the parts usable on their
   own — they simply set no ident, exactly as before this existed. */
const SelectAnchorContext = createContext<string | undefined>(undefined);

function useAnchorIdent(): string | undefined {
  return useContext(SelectAnchorContext);
}

function AnchorProvider({ children }: { children: ReactNode }) {
  const ident = toAnchorIdent(useId());
  return <SelectAnchorContext.Provider value={ident}>{children}</SelectAnchorContext.Provider>;
}

/**
 * A single-select control with two render paths behind one API — a rich
 * Popover-API listbox (the default) or a native `<select>`.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectProps = DistributiveOmit<
  ComponentPropsWithRef<typeof SelectPrimitive.Root>,
  "size"
> & {
  /**
   * Control scale; `data-density` scales the sizing within each size. Styles the
   * **native** control only — in rich mode the root renders no frame, so put
   * `size` on `SelectTrigger` and `SelectContent` instead.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/select
   */
  size?: SelectSize;
};

export function Select({ size, className, ...props }: SelectProps) {
  // Only the native path renders an element of its own; in rich mode the
  // primitive drops className, so applying the frame there would be a lie.
  const nativeClassName = props.native
    ? cx(select({ size, mode: "native" }), className)
    : className;
  const root = <SelectPrimitive.Root className={nativeClassName} {...props} />;
  // The native path has no panel to anchor — the platform owns the popup — so it
  // skips the provider rather than minting an ident nothing consumes.
  return props.native ? root : <AnchorProvider>{root}</AnchorProvider>;
}

export type SelectTriggerProps = DistributiveOmit<
  ComponentPropsWithRef<typeof SelectPrimitive.Trigger>,
  "size"
> & {
  /**
   * Control scale; `data-density` scales the sizing within each size. Match it
   * on the paired `SelectContent` so the panel's rows track the control.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/select
   */
  size?: SelectSize;
};

export function SelectTrigger({ size, className, style, ...props }: SelectTriggerProps) {
  const anchorName = useAnchorIdent();
  return (
    <SelectPrimitive.Trigger
      className={cx(select({ size, mode: "rich" }), className)}
      style={{ anchorName, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type SelectValueProps = ComponentPropsWithRef<typeof SelectPrimitive.Value>;

export function SelectValue({ className, ...props }: SelectValueProps) {
  return <SelectPrimitive.Value className={cx(selectValue(), className)} {...props} />;
}

/**
 * Optional standing glyph at the start of the trigger, independent of the
 * selection. Prefer putting an icon on the `SelectItem` — `SelectValue` mirrors
 * it into the trigger for free; this is for a mark that never changes.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectLeadingProps = ComponentPropsWithRef<"span">;

export function SelectLeading({ className, ...props }: SelectLeadingProps) {
  return <span className={cx(selectLeading(), className)} {...props} />;
}

/**
 * The trigger's trailing disclosure mark. Drop a chevron inside; it flips while
 * the listbox is open.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectIconProps = ComponentPropsWithRef<"span">;

export function SelectIcon({ className, ...props }: SelectIconProps) {
  return <span aria-hidden="true" className={cx(selectIcon(), className)} {...props} />;
}

export type SelectContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof SelectPrimitive.Content>,
  "size" | "placement"
> & {
  /**
   * Panel + row scale; `data-density` scales the sizing within each size. Match
   * it to the paired `SelectTrigger`.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/select
   */
  size?: SelectSize;
  /**
   * Which side of the trigger the panel opens on. The anchor wiring is automatic
   * — `Select` publishes an `anchor-name` on the trigger and this panel picks it
   * up; pass your own `style.positionAnchor` to anchor elsewhere.
   * @default "bottom-start"
   * @see https://primitiv-ui.dev/docs/components/select
   */
  placement?: SelectPlacement;
};

export function SelectContent({
  size,
  placement,
  className,
  style,
  ...props
}: SelectContentProps) {
  const anchorName = useAnchorIdent();
  return (
    <SelectPrimitive.Content
      className={cx(selectContent({ size, placement }), className)}
      style={{ positionAnchor: anchorName, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type SelectItemProps = ComponentPropsWithRef<typeof SelectPrimitive.Item>;

export function SelectItem({ className, ...props }: SelectItemProps) {
  return <SelectPrimitive.Item className={cx(selectItem(), className)} {...props} />;
}

export type SelectItemIndicatorProps = ComponentPropsWithRef<
  typeof SelectPrimitive.ItemIndicator
>;

export function SelectItemIndicator({ className, ...props }: SelectItemIndicatorProps) {
  return (
    <SelectPrimitive.ItemIndicator
      className={cx(selectItemIndicator(), className)}
      {...props}
    />
  );
}

/**
 * Optional leading slot inside an option — an icon (or any small glyph) placed
 * after the selected-mark gutter and before the label.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectItemLeadingProps = ComponentPropsWithRef<"span">;

export function SelectItemLeading({ className, ...props }: SelectItemLeadingProps) {
  return <span className={cx(selectItemLeading(), className)} {...props} />;
}

/**
 * The option's text label. Takes the row's free space, so pair it with
 * {@link SelectItemLeading} / {@link SelectItemTrailing} to keep a glyph hugging
 * the gutter and a trailing affordance on the inline-end edge.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectItemLabelProps = ComponentPropsWithRef<"span">;

export function SelectItemLabel({ className, ...props }: SelectItemLabelProps) {
  return <span className={cx(selectItemLabel(), className)} {...props} />;
}

/**
 * Optional trailing slot inside an option — a badge, shortcut, or icon on the
 * inline-end edge. Sized to the row's icon scale in the block axis but free to
 * grow inline, so non-icon content keeps its natural width.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectItemTrailingProps = ComponentPropsWithRef<"span">;

export function SelectItemTrailing({ className, ...props }: SelectItemTrailingProps) {
  return <span className={cx(selectItemTrailing(), className)} {...props} />;
}

export type SelectGroupProps = ComponentPropsWithRef<typeof SelectPrimitive.Group>;

export function SelectGroup({ className, ...props }: SelectGroupProps) {
  return <SelectPrimitive.Group className={cx(selectGroup(), className)} {...props} />;
}

/**
 * The visible heading for a `SelectGroup`. The headless group exposes its
 * `label` as the accessible name only, so render this inside the group (with the
 * same text) when the heading should also be seen. Rich mode only —
 * `<optgroup>` draws its own heading.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectGroupLabelProps = ComponentPropsWithRef<"span">;

export function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps) {
  return <span aria-hidden="true" className={cx(selectGroupLabel(), className)} {...props} />;
}

/**
 * A visual divider between groups of options, mirroring `Dropdown.Separator`'s
 * look via the shared `--primitiv-dropdown-*-separator-*` tokens. Rich mode
 * only — a native `<select>` can't hold anything but `<option>`/`<optgroup>`.
 *
 * @see https://primitiv-ui.dev/docs/components/select
 */
export type SelectSeparatorProps = ComponentPropsWithRef<typeof SelectPrimitive.Separator>;

export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator className={cx(selectSeparator(), className)} {...props} />
  );
}

export type SelectPlaceholderProps = ComponentPropsWithRef<typeof SelectPrimitive.Placeholder>;

export function SelectPlaceholder(props: SelectPlaceholderProps) {
  return <SelectPrimitive.Placeholder {...props} />;
}

/*
 * Root detects a native placeholder among its direct children by display name,
 * so it can infer `defaultValue=""` and show the hint first. A wrapper is opaque
 * to that test unless it borrows the name — without this the placeholder still
 * renders, but the browser selects the first real option instead of it.
 */
SelectPlaceholder.displayName = "SelectPlaceholder";
