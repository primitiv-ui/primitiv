/*
 * NavigationMenu — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: `Item` is a context provider whose `value` is the entire
 * disclosure-vs-plain-link distinction (a value-less Item with a Trigger throws),
 * `Content` portal-projects into a mounted `Viewport` rather than rendering in
 * place, and `Indicator` publishes the open trigger's measured geometry as inline
 * custom properties — none of which `emit_wrapper` models. The styled parts follow
 * the generated shape against navigation-menu.recipe.ts.
 *
 * TriggerLabel / TriggerIcon and LinkTitle / LinkDescription / LinkLeading /
 * LinkTrailing are presentational slots with no headless counterpart — plain spans
 * carrying the layout classes, mirroring the Figma Trigger and Panel Link anatomy
 * (and the same approach as Dropdown's ItemLeading / ItemLabel / ItemTrailing).
 * TriggerLabel exists so `text-box-trim` lands on the element that directly wraps
 * the text rather than on the trigger's flex box, where engines ignore it.
 *
 * Positioning: the panel is laid out in normal flow beneath the bar (the nav is the
 * containing block), so no anchor positioning is needed — unlike Dropdown/Popover.
 * Keep contract.json + the stylesheet + this file in sync by hand.
 */
import { NavigationMenu as NavigationMenuPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import {
  navigationMenu,
  navigationMenuList,
  navigationMenuItem,
  navigationMenuTrigger,
  navigationMenuTriggerLabel,
  navigationMenuTriggerIcon,
  navigationMenuContent,
  navigationMenuViewport,
  navigationMenuIndicator,
  navigationMenuLink,
  navigationMenuLinkText,
  navigationMenuLinkTitle,
  navigationMenuLinkDescription,
  navigationMenuLinkLeading,
  navigationMenuLinkTrailing,
} from "./navigation-menu.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

type NavigationMenuSize = "xs" | "sm" | "md" | "lg" | "xl";

type NavigationMenuLinkPlacement = "bar" | "panel";

type NavigationMenuIndicatorMarker = "arrow" | "underline";

/**
 * The desktop dropdown site nav — a `<nav>` landmark wrapping a list of top-level
 * entries, each either a plain link or a trigger that discloses a panel.
 *
 * @see https://primitiv-ui.dev/docs/components/navigation-menu
 */
export type NavigationMenuProps = DistributiveOmit<
  ComponentPropsWithRef<typeof NavigationMenuPrimitive.Root>,
  "size"
> & {
  /**
   * Entry + panel scale; `data-density` scales the sizing within each size. Set on
   * the root because the size knobs cascade to every part as custom properties.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/navigation-menu
   */
  size?: NavigationMenuSize;
};

export function NavigationMenu({ size, className, ...props }: NavigationMenuProps) {
  return (
    <NavigationMenuPrimitive.Root className={cx(navigationMenu({ size }), className)} {...props} />
  );
}

export type NavigationMenuListProps = ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>;

export function NavigationMenuList({ className, ...props }: NavigationMenuListProps) {
  return <NavigationMenuPrimitive.List className={cx(navigationMenuList(), className)} {...props} />;
}

export type NavigationMenuItemProps = ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>;

export function NavigationMenuItem({ className, ...props }: NavigationMenuItemProps) {
  return <NavigationMenuPrimitive.Item className={cx(navigationMenuItem(), className)} {...props} />;
}

export type NavigationMenuTriggerProps = ComponentPropsWithRef<
  typeof NavigationMenuPrimitive.Trigger
>;

export function NavigationMenuTrigger({ className, ...props }: NavigationMenuTriggerProps) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cx(navigationMenuTrigger(), className)}
      {...props}
    />
  );
}

/**
 * The trigger's text. Presentational — wrap the label string in this so the
 * line-box trim applies to the text's own box (engines ignore `text-box-trim` on a
 * flex container that also holds the chevron).
 */
export type NavigationMenuTriggerLabelProps = ComponentPropsWithRef<"span">;

export function NavigationMenuTriggerLabel({
  className,
  ...props
}: NavigationMenuTriggerLabelProps) {
  return <span className={cx(navigationMenuTriggerLabel(), className)} {...props} />;
}

/**
 * The trigger's chevron. Presentational — rotates 180° when its trigger reports
 * `data-state="open"`, so pass a single downward chevron and let CSS flip it.
 */
export type NavigationMenuTriggerIconProps = ComponentPropsWithRef<"span">;

export function NavigationMenuTriggerIcon({
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: NavigationMenuTriggerIconProps) {
  return (
    <span
      className={cx(navigationMenuTriggerIcon(), className)}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

export type NavigationMenuContentProps = ComponentPropsWithRef<
  typeof NavigationMenuPrimitive.Content
>;

export function NavigationMenuContent({ className, ...props }: NavigationMenuContentProps) {
  return (
    <NavigationMenuPrimitive.Content
      className={cx(navigationMenuContent(), className)}
      {...props}
    />
  );
}

export type NavigationMenuViewportProps = ComponentPropsWithRef<
  typeof NavigationMenuPrimitive.Viewport
>;

export function NavigationMenuViewport({ className, ...props }: NavigationMenuViewportProps) {
  return (
    <NavigationMenuPrimitive.Viewport
      className={cx(navigationMenuViewport(), className)}
      {...props}
    />
  );
}

export type NavigationMenuIndicatorProps = DistributiveOmit<
  ComponentPropsWithRef<typeof NavigationMenuPrimitive.Indicator>,
  "marker"
> & {
  /**
   * How the open trigger is marked — a pointer arrow on the panel edge, or a rule
   * beneath the trigger.
   * @default "arrow"
   * @see https://primitiv-ui.dev/docs/components/navigation-menu
   */
  marker?: NavigationMenuIndicatorMarker;
};

export function NavigationMenuIndicator({
  marker,
  className,
  ...props
}: NavigationMenuIndicatorProps) {
  return (
    <NavigationMenuPrimitive.Indicator
      className={cx(navigationMenuIndicator({ marker }), className)}
      {...props}
    />
  );
}

export type NavigationMenuLinkProps = DistributiveOmit<
  ComponentPropsWithRef<typeof NavigationMenuPrimitive.Link>,
  "placement"
> & {
  /**
   * Which of the two placements of the one headless `Link` part this is — a
   * top-level bar entry, or a row inside an open panel.
   * @default "bar"
   * @see https://primitiv-ui.dev/docs/components/navigation-menu
   */
  placement?: NavigationMenuLinkPlacement;
};

export function NavigationMenuLink({ placement, className, ...props }: NavigationMenuLinkProps) {
  return (
    <NavigationMenuPrimitive.Link
      className={cx(navigationMenuLink({ placement }), className)}
      {...props}
    />
  );
}

/**
 * The title + description stack inside a panel row. Presentational — it takes the
 * row's free space, so a trailing slot hugs the far edge and a long description
 * wraps rather than widening the row.
 */
export type NavigationMenuLinkTextProps = ComponentPropsWithRef<"span">;

export function NavigationMenuLinkText({ className, ...props }: NavigationMenuLinkTextProps) {
  return <span className={cx(navigationMenuLinkText(), className)} {...props} />;
}

/** A panel row's title. Presentational. */
export type NavigationMenuLinkTitleProps = ComponentPropsWithRef<"span">;

export function NavigationMenuLinkTitle({ className, ...props }: NavigationMenuLinkTitleProps) {
  return <span className={cx(navigationMenuLinkTitle(), className)} {...props} />;
}

/** A panel row's supporting sentence. Presentational. */
export type NavigationMenuLinkDescriptionProps = ComponentPropsWithRef<"span">;

export function NavigationMenuLinkDescription({
  className,
  ...props
}: NavigationMenuLinkDescriptionProps) {
  return <span className={cx(navigationMenuLinkDescription(), className)} {...props} />;
}

/** A panel row's leading slot — an icon, avatar, or any small mark. Presentational. */
export type NavigationMenuLinkLeadingProps = ComponentPropsWithRef<"span">;

export function NavigationMenuLinkLeading({
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: NavigationMenuLinkLeadingProps) {
  return (
    <span
      className={cx(navigationMenuLinkLeading(), className)}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

/** A panel row's trailing slot — a badge, count, or chevron. Presentational. */
export type NavigationMenuLinkTrailingProps = ComponentPropsWithRef<"span">;

export function NavigationMenuLinkTrailing({
  className,
  ...props
}: NavigationMenuLinkTrailingProps) {
  return <span className={cx(navigationMenuLinkTrailing(), className)} {...props} />;
}
