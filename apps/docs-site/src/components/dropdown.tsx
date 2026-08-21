import "../styles/primitiv/dropdown/styles.css";
/*
 * Dropdown — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: Dropdown.Root / Sub are context providers with no DOM, and
 * Trigger is a pass-through button — so they take no className. The styled parts
 * (Content, Item, CheckboxItem, RadioItem, ItemIndicator, Label, Separator,
 * Group, RadioGroup, SubTrigger, SubContent) follow the generated shape against
 * dropdown.recipe.ts. ItemLeading / ItemLabel / ItemTrailing are presentational
 * row slots with no headless counterpart — plain spans carrying the row-layout
 * classes, mirroring the Figma Item / CheckboxItem / RadioItem slot properties.
 * Content carries the size + placement modifiers; SubContent reuses the panel
 * with the `submenu` placement default. Keep contract.json + the stylesheet +
 * this file in sync by hand.
 *
 * ANCHOR POSITIONING WIRES ITSELF. Positioning is CSS anchor positioning, which
 * needs a unique `anchor-name` on the trigger and a matching `position-anchor`
 * on the panel — per instance, because reusing one ident across two menus makes
 * the anchor ambiguous and both panels resolve to the same trigger. That used to
 * be the consumer's job, and it does not scale: a table with a menu per row
 * cannot use a static ident at all, so every consumer ended up writing the same
 * useId-derived wrapper by hand. `Dropdown` and `DropdownSub` now derive their
 * own from `useId()` and hand it to their trigger and panel through context —
 * the fix `breadcrumb-overflow` already makes internally, for the same reason.
 *
 * It is an inline style rather than a custom property because `anchor-name:
 * var(--x)` does not work: the property is not var()-substitutable in this
 * position and computes to `none`. A consumer's own `style.anchorName` /
 * `style.positionAnchor` still wins (spread order), which is the escape hatch
 * for anchoring a panel to something other than its trigger.
 */
import { Dropdown as DropdownPrimitive } from "@primitiv-ui/react";
import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  dropdown,
  dropdownItem,
  dropdownCheckboxItem,
  dropdownRadioItem,
  dropdownItemLeading,
  dropdownItemLabel,
  dropdownItemTrailing,
  dropdownItemIndicator,
  dropdownLabel,
  dropdownSeparator,
  dropdownGroup,
  dropdownRadioGroup,
  dropdownSubTrigger,
} from "./dropdown.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

/* `useId()` returns something like ":r3:", and a CSS <custom-ident> may not
   contain a colon — so every character outside [A-Za-z0-9_-] becomes a hyphen.
   Same helper as NavigationMenu's `toAnchorIdentFragment` and
   breadcrumb-overflow's copy of it. */
const toAnchorIdent = (id: string) => `--primitiv-dropdown-${id.replace(/[^A-Za-z0-9_-]/g, "-")}`;

/* Undefined outside a Dropdown, which is what lets the parts stay usable on
   their own — they simply set no ident, exactly as before this existed. */
const DropdownAnchorContext = createContext<string | undefined>(undefined);

/* A submenu's pair must not reuse its parent menu's ident, or the submenu panel
   anchors to the top-level trigger. `DropdownSub` provides a fresh one, and
   because SubTrigger and SubContent are both its children, the nearest-provider
   lookup gives each subtree the right ident with no plumbing. */
function useAnchorIdent(): string | undefined {
  return useContext(DropdownAnchorContext);
}

function AnchorProvider({ children }: { children: ReactNode }) {
  const ident = toAnchorIdent(useId());
  return <DropdownAnchorContext.Provider value={ident}>{children}</DropdownAnchorContext.Provider>;
}

type DropdownSize = "xs" | "sm" | "md" | "lg" | "xl";

type DropdownPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "submenu";

/**
 * A menu-button dropdown built on the native HTML Popover API.
 *
 * @see https://primitiv-ui.dev/docs/components/dropdown
 */
export type DropdownProps = ComponentPropsWithRef<typeof DropdownPrimitive.Root>;

export function Dropdown(props: DropdownProps) {
  return (
    <AnchorProvider>
      <DropdownPrimitive.Root {...props} />
    </AnchorProvider>
  );
}

export type DropdownTriggerProps = ComponentPropsWithRef<typeof DropdownPrimitive.Trigger>;

export function DropdownTrigger({ style, ...props }: DropdownTriggerProps) {
  const anchorName = useAnchorIdent();
  return (
    <DropdownPrimitive.Trigger
      style={{ anchorName, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type DropdownContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof DropdownPrimitive.Content>,
  "size" | "placement"
> & {
  /**
   * Panel + row scale; `data-density` scales the sizing within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/dropdown
   */
  size?: DropdownSize;
  /**
   * Which side of the trigger the panel opens on. The trigger↔panel anchor
   * wiring is automatic — nothing to set.
   * @default "bottom-start"
   * @see https://primitiv-ui.dev/docs/components/dropdown
   */
  placement?: Exclude<DropdownPlacement, "submenu">;
};

export function DropdownContent({
  size,
  placement,
  className,
  style,
  ...props
}: DropdownContentProps) {
  const positionAnchor = useAnchorIdent();
  return (
    <DropdownPrimitive.Content
      className={cx(dropdown({ size, placement }), className)}
      style={{ positionAnchor, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type DropdownItemProps = ComponentPropsWithRef<typeof DropdownPrimitive.Item>;

export function DropdownItem({ className, ...props }: DropdownItemProps) {
  return <DropdownPrimitive.Item className={cx(dropdownItem(), className)} {...props} />;
}

export type DropdownCheckboxItemProps = ComponentPropsWithRef<typeof DropdownPrimitive.CheckboxItem>;

export function DropdownCheckboxItem({ className, ...props }: DropdownCheckboxItemProps) {
  return (
    <DropdownPrimitive.CheckboxItem
      className={cx(dropdownCheckboxItem(), className)}
      {...props}
    />
  );
}

export type DropdownRadioItemProps = ComponentPropsWithRef<typeof DropdownPrimitive.RadioItem>;

export function DropdownRadioItem({ className, ...props }: DropdownRadioItemProps) {
  return (
    <DropdownPrimitive.RadioItem className={cx(dropdownRadioItem(), className)} {...props} />
  );
}

/**
 * Optional leading slot inside a row — an icon (or any small glyph) placed
 * after the checkbox / radio gutter and before the label.
 *
 * @see https://primitiv-ui.dev/docs/components/dropdown
 */
export type DropdownItemLeadingProps = ComponentPropsWithRef<"span">;

export function DropdownItemLeading({ className, ...props }: DropdownItemLeadingProps) {
  return <span className={cx(dropdownItemLeading(), className)} {...props} />;
}

/**
 * The row's text label. Takes the row's free space, so pair it with
 * {@link DropdownItemLeading} / {@link DropdownItemTrailing} to keep a glyph
 * hugging the gutter and a trailing affordance on the inline-end edge.
 *
 * @see https://primitiv-ui.dev/docs/components/dropdown
 */
export type DropdownItemLabelProps = ComponentPropsWithRef<"span">;

export function DropdownItemLabel({ className, ...props }: DropdownItemLabelProps) {
  return <span className={cx(dropdownItemLabel(), className)} {...props} />;
}

/**
 * Optional trailing slot inside a row — a keyboard shortcut, badge, or icon on
 * the inline-end edge. Sized to the row's icon scale in the block axis but free
 * to grow inline, so non-icon content keeps its natural width.
 *
 * @see https://primitiv-ui.dev/docs/components/dropdown
 */
export type DropdownItemTrailingProps = ComponentPropsWithRef<"span">;

export function DropdownItemTrailing({ className, ...props }: DropdownItemTrailingProps) {
  return <span className={cx(dropdownItemTrailing(), className)} {...props} />;
}

export type DropdownItemIndicatorProps = ComponentPropsWithRef<
  typeof DropdownPrimitive.ItemIndicator
>;

export function DropdownItemIndicator({ className, ...props }: DropdownItemIndicatorProps) {
  return (
    <DropdownPrimitive.ItemIndicator
      className={cx(dropdownItemIndicator(), className)}
      {...props}
    />
  );
}

export type DropdownLabelProps = ComponentPropsWithRef<typeof DropdownPrimitive.Label>;

export function DropdownLabel({ className, ...props }: DropdownLabelProps) {
  return <DropdownPrimitive.Label className={cx(dropdownLabel(), className)} {...props} />;
}

export type DropdownSeparatorProps = ComponentPropsWithRef<typeof DropdownPrimitive.Separator>;

export function DropdownSeparator({ className, ...props }: DropdownSeparatorProps) {
  return (
    <DropdownPrimitive.Separator className={cx(dropdownSeparator(), className)} {...props} />
  );
}

export type DropdownGroupProps = ComponentPropsWithRef<typeof DropdownPrimitive.Group>;

export function DropdownGroup({ className, ...props }: DropdownGroupProps) {
  return <DropdownPrimitive.Group className={cx(dropdownGroup(), className)} {...props} />;
}

export type DropdownRadioGroupProps = ComponentPropsWithRef<typeof DropdownPrimitive.RadioGroup>;

export function DropdownRadioGroup({ className, ...props }: DropdownRadioGroupProps) {
  return (
    <DropdownPrimitive.RadioGroup className={cx(dropdownRadioGroup(), className)} {...props} />
  );
}

export type DropdownSubProps = ComponentPropsWithRef<typeof DropdownPrimitive.Sub>;

export function DropdownSub(props: DropdownSubProps) {
  return (
    <AnchorProvider>
      <DropdownPrimitive.Sub {...props} />
    </AnchorProvider>
  );
}

export type DropdownSubTriggerProps = ComponentPropsWithRef<typeof DropdownPrimitive.SubTrigger>;

export function DropdownSubTrigger({ className, style, ...props }: DropdownSubTriggerProps) {
  const anchorName = useAnchorIdent();
  return (
    <DropdownPrimitive.SubTrigger
      className={cx(dropdownSubTrigger(), className)}
      style={{ anchorName, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type DropdownSubContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof DropdownPrimitive.SubContent>,
  "size" | "placement"
> & {
  /**
   * Panel + row scale; `data-density` scales the sizing within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/dropdown
   */
  size?: DropdownSize;
  /**
   * Where the submenu opens. Defaults to the inline-end side of its parent row.
   * The SubTrigger↔panel anchor wiring is automatic — nothing to set.
   * @default "submenu"
   * @see https://primitiv-ui.dev/docs/components/dropdown
   */
  placement?: DropdownPlacement;
};

export function DropdownSubContent({
  size,
  placement = "submenu",
  className,
  style,
  ...props
}: DropdownSubContentProps) {
  const positionAnchor = useAnchorIdent();
  return (
    <DropdownPrimitive.SubContent
      className={cx(dropdown({ size, placement }), className)}
      style={{ positionAnchor, ...style } as CSSProperties}
      {...props}
    />
  );
}
