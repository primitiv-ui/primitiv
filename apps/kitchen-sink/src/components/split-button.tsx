import "../styles/primitiv/split-button/styles.css";
/*
 * SplitButton — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated: this is a composition over three surfaces rather than one
 * primitive. The two halves are real registry `Button`s (composed via the
 * headless parts' `asChild`, so intent, size, text-trim, transitions and
 * elevation come from Button verbatim and can never drift), and the menu is a
 * real `.primitiv-dropdown` panel resolving Dropdown's own row styles. This
 * file adds only what the composition needs: the shared variant/size context,
 * the per-part classes, and the anchor wiring.
 *
 * Anchor positioning: the MENU is floored at the group's width and aligns to
 * its leading edge, so the anchor is the group, not the trigger. The ident is
 * derived per instance from `useId` — several split buttons on one page must
 * not share an `anchor-name`. Sanitising mirrors `toAnchorIdentFragment`
 * (`packages/react/src/NavigationMenu/utils.ts`): `useId`'s colon-bracketed
 * output is not a valid CSS `<custom-ident>`, so every character outside
 * `[A-Za-z0-9_-]` becomes a hyphen.
 *
 * Richer menus: Root provides the Dropdown context, so `DropdownGroup`,
 * `DropdownLabel`, `DropdownItemLeading` / `…Label` / `…Trailing`,
 * `DropdownCheckboxItem` and `DropdownSub` all compose inside
 * `SplitButtonMenu` directly — import them from `./dropdown`.
 *
 * Keep contract.json + the stylesheet + this file in sync by hand.
 */
import { SplitButton as SplitButtonPrimitive } from "@primitiv-ui/react";
import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ComponentPropsWithRef,
} from "react";
import { Button } from "./button";
import { dropdown, dropdownItem, dropdownSeparator } from "./dropdown.recipe";
import {
  splitButton,
  splitButtonAction,
  splitButtonMenu,
  splitButtonTrigger,
} from "./split-button.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

function toAnchorIdentFragment(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "-");
}

/**
 * Visual intent, applied to both halves. Ghost and link are deliberately
 * absent: neither has a box at rest for the seam to divide, so a welded pair
 * reads as a label with a stray chevron until you hover it.
 */
export type SplitButtonVariant = "primary" | "secondary" | "danger";

export type SplitButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

type SplitButtonStyleContextValue = {
  anchorName: string;
  variant: SplitButtonVariant;
  size: SplitButtonSize;
};

/**
 * Carries the group's intent, size and anchor ident down to the parts, so the
 * consumer sets them once on the root instead of repeating them on both halves
 * and the menu.
 */
const SplitButtonStyleContext = createContext<SplitButtonStyleContextValue | null>(null);

function useSplitButtonStyle(part: string): SplitButtonStyleContextValue {
  const context = useContext(SplitButtonStyleContext);
  if (context === null) {
    throw new Error(`${part} must be rendered inside a <SplitButton>.`);
  }
  return context;
}

/**
 * One primary action welded to a chevron trigger that opens a menu of related
 * alternatives, bound into a single `role="group"` widget.
 *
 * @see https://primitiv-ui.dev/docs/components/split-button
 */
export type SplitButtonProps = DistributiveOmit<
  ComponentPropsWithRef<typeof SplitButtonPrimitive.Root>,
  "variant" | "size"
> & {
  /**
   * Visual intent, applied to both halves.
   * @default "primary"
   * @see https://primitiv-ui.dev/docs/components/split-button
   */
  variant?: SplitButtonVariant;
  /**
   * Control size, applied to both halves and the menu; `data-density` scales
   * each size further.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/split-button
   */
  size?: SplitButtonSize;
};

export function SplitButton({
  variant = "primary",
  size = "md",
  className,
  style,
  children,
  ...props
}: SplitButtonProps) {
  const anchorName = `--primitiv-split-button-${toAnchorIdentFragment(useId())}`;
  const context = useMemo(
    () => ({ anchorName, variant, size }),
    [anchorName, variant, size],
  );

  return (
    <SplitButtonStyleContext.Provider value={context}>
      <SplitButtonPrimitive.Root
        className={cx(splitButton({ variant, size }), className)}
        style={{ anchorName, ...style }}
        {...props}
      >
        {children}
      </SplitButtonPrimitive.Root>
    </SplitButtonStyleContext.Provider>
  );
}

/**
 * The primary half — runs the default action immediately. Give it a visible
 * text label and {@link SplitButtonTrigger} is named for free.
 *
 * @see https://primitiv-ui.dev/docs/components/split-button
 */
export type SplitButtonActionProps = ComponentPropsWithRef<typeof SplitButtonPrimitive.Action>;

export function SplitButtonAction({
  asChild,
  className,
  children,
  ...props
}: SplitButtonActionProps) {
  const { variant, size } = useSplitButtonStyle("SplitButtonAction");

  return (
    <SplitButtonPrimitive.Action asChild {...props}>
      <Button
        asChild={asChild}
        variant={variant}
        size={size}
        className={cx(splitButtonAction(), className)}
      >
        {children}
      </Button>
    </SplitButtonPrimitive.Action>
  );
}

/**
 * The menu half — a square chevron button. Its accessible name is derived from
 * the action unless you pass `aria-label` / `aria-labelledby`, so put the
 * chevron in `aria-hidden` and add visually-hidden text for the best result.
 *
 * @see https://primitiv-ui.dev/docs/components/split-button
 */
export type SplitButtonTriggerProps = ComponentPropsWithRef<typeof SplitButtonPrimitive.Trigger>;

export function SplitButtonTrigger({ className, children, ...props }: SplitButtonTriggerProps) {
  const { variant, size } = useSplitButtonStyle("SplitButtonTrigger");

  return (
    <SplitButtonPrimitive.Trigger asChild {...props}>
      <Button
        variant={variant}
        size={size}
        className={cx(splitButtonTrigger(), className)}
      >
        {children}
      </Button>
    </SplitButtonPrimitive.Trigger>
  );
}

/**
 * The menu panel — a Dropdown panel at least as wide as the group, growing to
 * fit its rows, aligned to the group's leading edge because the alternatives
 * belong to the action rather than to the chevron.
 *
 * @see https://primitiv-ui.dev/docs/components/split-button
 */
export type SplitButtonMenuProps = DistributiveOmit<
  ComponentPropsWithRef<typeof SplitButtonPrimitive.Menu>,
  "size" | "placement"
>;

export function SplitButtonMenu({ className, style, ...props }: SplitButtonMenuProps) {
  const { anchorName, size } = useSplitButtonStyle("SplitButtonMenu");

  return (
    <SplitButtonPrimitive.Menu
      className={cx(dropdown({ size }), splitButtonMenu(), className)}
      style={{ positionAnchor: anchorName, ...style }}
      {...props}
    />
  );
}

/**
 * One alternative action in the menu. Compose `DropdownItemLeading` /
 * `DropdownItemLabel` inside it for an icon-plus-label row.
 *
 * @see https://primitiv-ui.dev/docs/components/split-button
 */
export type SplitButtonItemProps = ComponentPropsWithRef<typeof SplitButtonPrimitive.Item>;

export function SplitButtonItem({ className, ...props }: SplitButtonItemProps) {
  return <SplitButtonPrimitive.Item className={cx(dropdownItem(), className)} {...props} />;
}

/**
 * A divider between groups of alternatives.
 *
 * @see https://primitiv-ui.dev/docs/components/split-button
 */
export type SplitButtonSeparatorProps = ComponentPropsWithRef<
  typeof SplitButtonPrimitive.Separator
>;

export function SplitButtonSeparator({ className, ...props }: SplitButtonSeparatorProps) {
  return (
    <SplitButtonPrimitive.Separator className={cx(dropdownSeparator(), className)} {...props} />
  );
}
