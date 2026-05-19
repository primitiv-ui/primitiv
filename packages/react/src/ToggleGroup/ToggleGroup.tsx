import { useEffect, useMemo, useRef } from "react";

import { useDirection } from "../DirectionProvider";
import { useRovingTabindex } from "../hooks";
import { Slot, composeEventHandlers, composeRefs } from "../Slot";

import { ToggleGroupContext } from "./ToggleGroupContext";
import { useToggleGroupRoot, useToggleGroupContext } from "./hooks";
import { ToggleGroupItemProps, ToggleGroupRootProps } from "./types";

/**
 * The root of a ToggleGroup — a `<div role="group">` that owns the
 * pressed values and provides {@link ToggleGroupContext} to descendant
 * {@link ToggleGroupItem | `ToggleGroup.Item`}s.
 *
 * Two type modes, statically discriminated at the type level:
 *
 * - **`type="single"`** — at most one item can be pressed at a time.
 *   Pressing the active item again deselects it (value returns to
 *   `undefined`). Controlled via `value: string | undefined` +
 *   `onValueChange: (value: string | undefined) => void`.
 * - **`type="multiple"`** — any number of items can be pressed
 *   simultaneously. Controlled via `value: string[]` +
 *   `onValueChange: (value: string[]) => void`.
 *
 * Each type supports **uncontrolled** (pass `defaultValue`, or omit for
 * nothing pressed on mount) and **controlled** (pass `value` +
 * `onValueChange`) modes. The two shapes are statically discriminated at
 * the type level.
 *
 * **Keyboard.** Arrow keys move focus between items (roving tabindex)
 * independently of selection. `Space` / `Enter` toggle the focused item.
 *
 * **ARIA.** `role="group"` on the root. Each item carries `aria-pressed`.
 *
 * **Styling hooks.** `data-orientation="horizontal" | "vertical"` on the
 * root. Each item: `data-state="on" | "off"`, `data-disabled=""`.
 *
 * **Reading direction.** `dir` (`"ltr"` / `"rtl"`) sets the arrow-key
 * direction for horizontal groups. When omitted, it is inherited from the
 * nearest {@link DirectionProvider}, falling back to `"ltr"` when there is
 * no provider.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied
 * element in place of the native `<div>`, with the group's `role`,
 * `data-orientation`, and ref merged in.
 *
 * @example Single mode — text alignment
 * ```tsx
 * <ToggleGroup.Root type="single" defaultValue="left" aria-label="Alignment">
 *   <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
 *   <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
 *   <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
 * </ToggleGroup.Root>
 * ```
 *
 * @example Multiple mode — text formatting
 * ```tsx
 * <ToggleGroup.Root type="multiple" aria-label="Formatting">
 *   <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
 *   <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
 * </ToggleGroup.Root>
 * ```
 */
function ToggleGroupRoot({
  type,
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "horizontal",
  dir,
  asChild = false,
  children,
  ref,
  ...rest
}: ToggleGroupRootProps) {
  const resolvedDir = dir ?? useDirection();
  const {
    value,
    toggle,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    focusedValue,
    setFocusedValue,
  } = useToggleGroupRoot({
    type,
    defaultValue,
    value: controlledValue,
    onValueChange,
    orientation,
    dir: resolvedDir,
  });

  const contextValue = useMemo(
    () => ({
      value,
      toggle,
      registerItem,
      itemValues,
      disabledValues,
      focusItem,
      focusedValue,
      setFocusedValue,
      orientation,
      dir: resolvedDir,
    }),
    [
      value,
      toggle,
      registerItem,
      itemValues,
      disabledValues,
      focusItem,
      focusedValue,
      setFocusedValue,
      orientation,
      resolvedDir,
    ],
  );

  const rootProps = {
    ...rest,
    ref,
    role: "group" as const,
    "data-orientation": orientation,
  };

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </ToggleGroupContext.Provider>
  );
}

ToggleGroupRoot.displayName = "ToggleGroupRoot";

/**
 * An individual toggle button inside a ToggleGroup — a native
 * `<button type="button" aria-pressed>` that participates in the
 * group's roving tabindex and reports its pressed state.
 *
 * **Selection.** Clicking an Item (or pressing `Space` / `Enter` on
 * the focused Item) toggles it. In `type="single"` mode, pressing an
 * active item deselects it; in `type="multiple"` mode, items toggle
 * independently.
 *
 * **Roving tabindex.** Arrow keys move focus between enabled items
 * without changing selection. Only one Item is in the document tab
 * sequence at a time; `Tab` escapes the group in a single keystroke.
 *
 * **Disabled.** Passing `disabled` forwards the native attribute and
 * excludes the Item from arrow-key navigation. Use `data-disabled` for
 * CSS targeting without `:disabled` specificity complications.
 *
 * **Styling hooks.** `data-state="on" | "off"` mirrors the pressed state.
 * `data-disabled=""` when disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer element in
 * place of the native `<button>`, with the Item's `aria-pressed`,
 * `data-state`, `tabIndex`, and event handlers merged onto it.
 *
 * @throws if rendered outside a `ToggleGroup.Root`.
 */
function ToggleGroupItem({
  value,
  disabled,
  asChild = false,
  onClick,
  onKeyDown,
  onFocus,
  children,
  ref,
  ...rest
}: ToggleGroupItemProps) {
  const {
    value: groupValue,
    toggle,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    focusedValue,
    setFocusedValue,
    orientation,
    dir,
  } = useToggleGroupContext();

  const isPressed = groupValue.includes(value);

  const enabledValues = useMemo(
    () => itemValues.filter((v) => !disabledValues.has(v)),
    [itemValues, disabledValues],
  );

  // Tabstop: the focused item if known; otherwise fall back to the first
  // enabled item so the group is reachable via Tab before any interaction.
  const isTabstop =
    focusedValue !== undefined
      ? focusedValue === value
      : enabledValues[0] === value;

  const localRef = useRef<HTMLButtonElement | null>(null);
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);

  useEffect(() => {
    registerItem(value, localRef.current, disabled);
    return () => registerItem(value, null);
  }, [value, disabled, registerItem]);

  const { handleKeyDown } = useRovingTabindex<string>({
    orientation,
    dir,
    navigable: enabledValues,
    currentKey: value,
    includeHomeEnd: true,
    includeActivate: true,
    onNavigate: (target, action) => {
      if (action === "activate") {
        toggle(target);
      }
      focusItem(target);
    },
  });

  const itemProps = {
    ...rest,
    ref: setRef,
    "aria-pressed": isPressed,
    "data-state": isPressed ? ("on" as const) : ("off" as const),
    "data-disabled": disabled ? "" : undefined,
    tabIndex: isTabstop ? 0 : -1,
    disabled,
    onClick: composeEventHandlers(onClick, () => toggle(value)),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
    onFocus: composeEventHandlers(onFocus, () => setFocusedValue(value)),
  };

  return asChild ? (
    <Slot {...itemProps}>{children}</Slot>
  ) : (
    <button type="button" {...itemProps}>
      {children}
    </button>
  );
}

ToggleGroupItem.displayName = "ToggleGroupItem";

type TToggleGroupCompound = typeof ToggleGroupRoot & {
  Root: typeof ToggleGroupRoot;
  Item: typeof ToggleGroupItem;
};

/**
 * Headless, accessible **ToggleGroup** — a compound component that
 * manages a group of pressable toggle buttons with roving tabindex
 * keyboard navigation.
 *
 * Supports `type="single"` (at most one item pressed, pressing again
 * deselects) and `type="multiple"` (items toggle independently).
 *
 * `ToggleGroup` is both callable (an alias of
 * {@link ToggleGroupRoot | `ToggleGroup.Root`}) and carries its
 * sub-components as static properties.
 *
 * - {@link ToggleGroupRoot | `ToggleGroup.Root`} — state owner, context
 *   provider, `<div role="group">` wrapper.
 * - {@link ToggleGroupItem | `ToggleGroup.Item`} — a pressable toggle
 *   button participating in the roving tabindex.
 *
 * @example Single mode — text alignment
 * ```tsx
 * import { ToggleGroup } from "@primitiv/react";
 *
 * <ToggleGroup.Root type="single" defaultValue="left" aria-label="Alignment">
 *   <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
 *   <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
 *   <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
 * </ToggleGroup.Root>;
 * ```
 *
 * @see {@link ToggleGroupRoot} for type modes, state, and ARIA.
 * @see {@link ToggleGroupItem} for selection, roving tabindex, and keyboard navigation.
 */
const ToggleGroupCompound: TToggleGroupCompound = Object.assign(ToggleGroupRoot, {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
});

ToggleGroupCompound.displayName = "ToggleGroup";

export { ToggleGroupCompound as ToggleGroup };
