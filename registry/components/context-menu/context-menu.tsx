/*
 * ContextMenu — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: ContextMenu.Root / Sub are context providers with no DOM, and
 * Trigger is a pass-through span (the right-click target) — so they take no
 * className. The styled parts (Content, Item, CheckboxItem, RadioItem,
 * ItemIndicator, Label, Separator, Group, RadioGroup, SubTrigger, SubContent)
 * follow the generated shape against context-menu.recipe.ts. ItemLeading /
 * ItemLabel / ItemTrailing are presentational row slots with no headless
 * counterpart — plain spans carrying the row-layout classes, identical to
 * Dropdown's.
 *
 * Content carries only `size` — unlike Dropdown, the root panel has no
 * `placement` prop, since the headless layer already positions it at the
 * pointer (see styles.css for the `@position-try` overflow-flip mechanics).
 * SubContent carries `size` + `placement`, defaulting to `submenu`, and uses
 * real CSS anchor positioning against its SubTrigger exactly like Dropdown's
 * subs — wire an `anchor-name` on the SubTrigger and a matching
 * `position-anchor` on SubContent. Keep contract.json + the stylesheet + this
 * file in sync by hand.
 */
import { ContextMenu as ContextMenuPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  contextMenu,
  contextMenuItem,
  contextMenuCheckboxItem,
  contextMenuRadioItem,
  contextMenuItemLeading,
  contextMenuItemLabel,
  contextMenuItemTrailing,
  contextMenuItemIndicator,
  contextMenuLabel,
  contextMenuSeparator,
  contextMenuGroup,
  contextMenuRadioGroup,
  contextMenuSubTrigger,
} from "./context-menu.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

type ContextMenuSize = "xs" | "sm" | "md" | "lg" | "xl";

type ContextMenuSubPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "submenu";

/**
 * A right-click / long-press context menu built on the native HTML Popover API.
 *
 * @see https://primitiv-ui.dev/docs/components/context-menu
 */
export type ContextMenuProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Root>;

export function ContextMenu(props: ContextMenuProps) {
  return <ContextMenuPrimitive.Root {...props} />;
}

export type ContextMenuTriggerProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Trigger>;

export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <ContextMenuPrimitive.Trigger {...props} />;
}

export type ContextMenuContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof ContextMenuPrimitive.Content>,
  "size"
> & {
  /**
   * Panel + row scale; `data-density` scales the sizing within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/context-menu
   */
  size?: ContextMenuSize;
};

export function ContextMenuContent({ size, className, ...props }: ContextMenuContentProps) {
  return (
    <ContextMenuPrimitive.Content
      className={cx(contextMenu({ size }), className)}
      {...props}
    />
  );
}

export type ContextMenuItemProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Item>;

export function ContextMenuItem({ className, ...props }: ContextMenuItemProps) {
  return <ContextMenuPrimitive.Item className={cx(contextMenuItem(), className)} {...props} />;
}

export type ContextMenuCheckboxItemProps = ComponentPropsWithRef<
  typeof ContextMenuPrimitive.CheckboxItem
>;

export function ContextMenuCheckboxItem({ className, ...props }: ContextMenuCheckboxItemProps) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      className={cx(contextMenuCheckboxItem(), className)}
      {...props}
    />
  );
}

export type ContextMenuRadioItemProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.RadioItem>;

export function ContextMenuRadioItem({ className, ...props }: ContextMenuRadioItemProps) {
  return (
    <ContextMenuPrimitive.RadioItem className={cx(contextMenuRadioItem(), className)} {...props} />
  );
}

/**
 * Optional leading slot inside a row — an icon (or any small glyph) placed
 * after the checkbox / radio gutter and before the label.
 *
 * @see https://primitiv-ui.dev/docs/components/context-menu
 */
export type ContextMenuItemLeadingProps = ComponentPropsWithRef<"span">;

export function ContextMenuItemLeading({ className, ...props }: ContextMenuItemLeadingProps) {
  return <span className={cx(contextMenuItemLeading(), className)} {...props} />;
}

/**
 * The row's text label. Takes the row's free space, so pair it with
 * {@link ContextMenuItemLeading} / {@link ContextMenuItemTrailing} to keep a
 * glyph hugging the gutter and a trailing affordance on the inline-end edge.
 *
 * @see https://primitiv-ui.dev/docs/components/context-menu
 */
export type ContextMenuItemLabelProps = ComponentPropsWithRef<"span">;

export function ContextMenuItemLabel({ className, ...props }: ContextMenuItemLabelProps) {
  return <span className={cx(contextMenuItemLabel(), className)} {...props} />;
}

/**
 * Optional trailing slot inside a row — a keyboard shortcut, badge, or icon on
 * the inline-end edge. Sized to the row's icon scale in the block axis but free
 * to grow inline, so non-icon content keeps its natural width.
 *
 * @see https://primitiv-ui.dev/docs/components/context-menu
 */
export type ContextMenuItemTrailingProps = ComponentPropsWithRef<"span">;

export function ContextMenuItemTrailing({ className, ...props }: ContextMenuItemTrailingProps) {
  return <span className={cx(contextMenuItemTrailing(), className)} {...props} />;
}

export type ContextMenuItemIndicatorProps = ComponentPropsWithRef<
  typeof ContextMenuPrimitive.ItemIndicator
>;

export function ContextMenuItemIndicator({ className, ...props }: ContextMenuItemIndicatorProps) {
  return (
    <ContextMenuPrimitive.ItemIndicator
      className={cx(contextMenuItemIndicator(), className)}
      {...props}
    />
  );
}

export type ContextMenuLabelProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Label>;

export function ContextMenuLabel({ className, ...props }: ContextMenuLabelProps) {
  return <ContextMenuPrimitive.Label className={cx(contextMenuLabel(), className)} {...props} />;
}

export type ContextMenuSeparatorProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Separator>;

export function ContextMenuSeparator({ className, ...props }: ContextMenuSeparatorProps) {
  return (
    <ContextMenuPrimitive.Separator className={cx(contextMenuSeparator(), className)} {...props} />
  );
}

export type ContextMenuGroupProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Group>;

export function ContextMenuGroup({ className, ...props }: ContextMenuGroupProps) {
  return <ContextMenuPrimitive.Group className={cx(contextMenuGroup(), className)} {...props} />;
}

export type ContextMenuRadioGroupProps = ComponentPropsWithRef<
  typeof ContextMenuPrimitive.RadioGroup
>;

export function ContextMenuRadioGroup({ className, ...props }: ContextMenuRadioGroupProps) {
  return (
    <ContextMenuPrimitive.RadioGroup
      className={cx(contextMenuRadioGroup(), className)}
      {...props}
    />
  );
}

export type ContextMenuSubProps = ComponentPropsWithRef<typeof ContextMenuPrimitive.Sub>;

export function ContextMenuSub(props: ContextMenuSubProps) {
  return <ContextMenuPrimitive.Sub {...props} />;
}

export type ContextMenuSubTriggerProps = ComponentPropsWithRef<
  typeof ContextMenuPrimitive.SubTrigger
>;

export function ContextMenuSubTrigger({ className, ...props }: ContextMenuSubTriggerProps) {
  return (
    <ContextMenuPrimitive.SubTrigger
      className={cx(contextMenuSubTrigger(), className)}
      {...props}
    />
  );
}

export type ContextMenuSubContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof ContextMenuPrimitive.SubContent>,
  "size" | "placement"
> & {
  /**
   * Panel + row scale; `data-density` scales the sizing within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/context-menu
   */
  size?: ContextMenuSize;
  /**
   * Where the submenu opens. Defaults to the inline-end side of its parent row;
   * wire `anchor-name` on the SubTrigger and a matching `position-anchor` here.
   * @default "submenu"
   * @see https://primitiv-ui.dev/docs/components/context-menu
   */
  placement?: ContextMenuSubPlacement;
};

export function ContextMenuSubContent({
  size,
  placement = "submenu",
  className,
  ...props
}: ContextMenuSubContentProps) {
  return (
    <ContextMenuPrimitive.SubContent
      className={cx(contextMenu({ size, placement }), className)}
      {...props}
    />
  );
}
