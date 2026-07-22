import "../styles/primitiv/dropdown/styles.css";
/*
 * Dropdown — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: Dropdown.Root / Sub are context providers with no DOM, and
 * Trigger is a pass-through button — so they take no className. The styled parts
 * (Content, Item, CheckboxItem, RadioItem, ItemIndicator, Label, Separator,
 * Group, RadioGroup, SubTrigger, SubContent) follow the generated shape against
 * dropdown.recipe.ts. Content carries the size + placement modifiers; SubContent
 * reuses the panel with the `submenu` placement default. Positioning is CSS
 * anchor positioning — wire an `anchor-name` on the trigger and a matching
 * `position-anchor` on Content / SubContent. Keep contract.json + the stylesheet
 * + this file in sync by hand.
 */
import { Dropdown as DropdownPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  dropdown,
  dropdownItem,
  dropdownCheckboxItem,
  dropdownRadioItem,
  dropdownItemIndicator,
  dropdownLabel,
  dropdownSeparator,
  dropdownGroup,
  dropdownRadioGroup,
  dropdownSubTrigger,
} from "./dropdown.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

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
  return <DropdownPrimitive.Root {...props} />;
}

export type DropdownTriggerProps = ComponentPropsWithRef<typeof DropdownPrimitive.Trigger>;

export function DropdownTrigger(props: DropdownTriggerProps) {
  return <DropdownPrimitive.Trigger {...props} />;
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
   * Which side of the trigger the panel opens on. Wire `anchor-name` on the
   * trigger and a matching `position-anchor` on this panel (inline style).
   * @default "bottom-start"
   * @see https://primitiv-ui.dev/docs/components/dropdown
   */
  placement?: Exclude<DropdownPlacement, "submenu">;
};

export function DropdownContent({ size, placement, className, ...props }: DropdownContentProps) {
  return (
    <DropdownPrimitive.Content
      className={cx(dropdown({ size, placement }), className)}
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
  return <DropdownPrimitive.Sub {...props} />;
}

export type DropdownSubTriggerProps = ComponentPropsWithRef<typeof DropdownPrimitive.SubTrigger>;

export function DropdownSubTrigger({ className, ...props }: DropdownSubTriggerProps) {
  return (
    <DropdownPrimitive.SubTrigger className={cx(dropdownSubTrigger(), className)} {...props} />
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
   * Where the submenu opens. Defaults to the inline-end side of its parent row;
   * wire `anchor-name` on the SubTrigger and a matching `position-anchor` here.
   * @default "submenu"
   * @see https://primitiv-ui.dev/docs/components/dropdown
   */
  placement?: DropdownPlacement;
};

export function DropdownSubContent({
  size,
  placement = "submenu",
  className,
  ...props
}: DropdownSubContentProps) {
  return (
    <DropdownPrimitive.SubContent
      className={cx(dropdown({ size, placement }), className)}
      {...props}
    />
  );
}
