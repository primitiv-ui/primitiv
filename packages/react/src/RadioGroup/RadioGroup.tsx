import { useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { useRovingTabindex } from "../hooks/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { RadioGroupContext } from "./RadioGroupContext";
import { RadioGroupItemContext } from "./RadioGroupItemContext";
import {
  useRadioGroupContext,
  useRadioGroupItemContext,
  useRadioGroupRoot,
} from "./hooks/index.ts";
import {
  RadioGroupIndicatorProps,
  RadioGroupItemProps,
  RadioGroupRootProps,
} from "./types";

/**
 * The root of a RadioGroup — a `<div role="radiogroup">` that owns the
 * selected value and provides {@link RadioGroupContext} to descendant
 * {@link RadioGroupItem | `RadioGroup.Item`}s.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link RadioGroupRootProps.defaultValue | `defaultValue`} (or omit
 *   for nothing selected on mount). The component owns the value.
 * - **Controlled** — pass
 *   {@link RadioGroupRootProps.value | `value`} *and*
 *   {@link RadioGroupRootProps.onValueChange | `onValueChange`}
 *   together. The parent owns the value; the component defers every
 *   change back through the callback.
 *
 * **ARIA.** `role="radiogroup"` is set automatically. Provide an
 * accessible name via `aria-label` or `aria-labelledby`.
 *
 * **Orientation.** By default (`orientation="both"`) all four arrow keys
 * navigate. Pass `orientation="horizontal"` or `"vertical"` to restrict
 * navigation to a single axis.
 *
 * **Reading direction.** `dir` (`"ltr"` / `"rtl"`) swaps the horizontal
 * arrow pair so Arrow Left moves forward in RTL. When omitted, it is
 * inherited from the nearest {@link DirectionProvider}, falling back to
 * `"ltr"`.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied
 * element (e.g. `<menu role="menu">` for dropdown composition) with
 * the RadioGroup's props merged in. The native `<div>` is dropped.
 *
 * @example Uncontrolled
 * ```tsx
 * <RadioGroup.Root defaultValue="comfortable" aria-label="Density">
 *   <RadioGroup.Item value="compact">
 *     <RadioGroup.Indicator />
 *     Compact
 *   </RadioGroup.Item>
 *   <RadioGroup.Item value="comfortable">
 *     <RadioGroup.Indicator />
 *     Comfortable
 *   </RadioGroup.Item>
 * </RadioGroup.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [value, setValue] = useState("comfortable");
 *
 * <RadioGroup.Root value={value} onValueChange={setValue} aria-label="…">
 *   <RadioGroup.Item value="compact">Compact</RadioGroup.Item>
 *   <RadioGroup.Item value="comfortable">Comfortable</RadioGroup.Item>
 * </RadioGroup.Root>
 * ```
 */
export function RadioGroupRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "both",
  dir,
  asChild = false,
  children,
  ...rest
}: RadioGroupRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const { value, select, registerItem, itemValues, disabledValues, focusItem } =
    useRadioGroupRoot({
      defaultValue,
      value: controlledValue,
      onValueChange,
    });
  const contextValue = useMemo(
    () => ({
      value,
      select,
      registerItem,
      itemValues,
      disabledValues,
      focusItem,
      orientation,
      dir: resolvedDir,
    }),
    [
      value,
      select,
      registerItem,
      itemValues,
      disabledValues,
      focusItem,
      orientation,
      resolvedDir,
    ],
  );
  const rootProps = {
    role: "radiogroup" as const,
    "aria-orientation": orientation === "both" ? undefined : orientation,
    dir: resolvedDir,
    ...rest,
  };
  return (
    <RadioGroupContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </RadioGroupContext.Provider>
  );
}

/** @internal */
RadioGroupRoot.displayName = "RadioGroupRoot";

/**
 * An individual radio option inside a RadioGroup — a native
 * `<button role="radio">` that reports its state, participates in the
 * roving tabindex, and handles arrow-key navigation within the group.
 *
 * **Selection.** Clicking an Item (or pressing Space / Enter on the
 * focused Item via native `<button>` behaviour) selects it. The arrow
 * keys enabled by the group's `orientation` move focus and selection to
 * the next or previous non-disabled Item, wrapping at the ends.
 *
 * **Roving tabindex.** Only one Item per group is in the document tab
 * sequence at a time: the selected one if any, otherwise the first
 * non-disabled Item. All others have `tabIndex=-1` so `Tab` escapes
 * the group in a single keystroke.
 *
 * **Disabled.** Passing `disabled` forwards the native attribute (the
 * browser suppresses clicks and removes it from the focus ring) and
 * excludes the Item from arrow-key navigation and the roving-tabindex
 * home base. Styling via `:disabled` works natively.
 *
 * **Styling hook.** `data-state="checked" | "unchecked"` mirrors the
 * selection state for CSS targeting.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer element
 * (e.g. `<li role="menuitemradio">` for dropdown menu composition)
 * with the Item's ARIA, data-state, tabIndex, onClick, onKeyDown,
 * disabled, and ref merged onto it. The native `<button>` is dropped;
 * consumers who render a non-focusable element are responsible for
 * making it focusable.
 *
 * @throws if rendered outside a `RadioGroup.Root`.
 */
export function RadioGroupItem({
  value,
  children,
  onClick,
  onKeyDown,
  disabled,
  asChild = false,
  ref,
  ...rest
}: RadioGroupItemProps): ReactElement {
  const {
    value: selectedValue,
    select,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    orientation,
    dir,
  } = useRadioGroupContext();
  const isChecked = selectedValue === value;
  const enabledValues = useMemo(
    () => itemValues.filter((v) => !disabledValues.has(v)),
    [itemValues, disabledValues],
  );
  const isTabStop =
    selectedValue !== undefined ? isChecked : enabledValues[0] === value;

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
    onNavigate: (target) => {
      select(target);
      focusItem(target);
    },
  });

  const itemContextValue = useMemo(() => ({ checked: isChecked }), [isChecked]);

  const itemProps = {
    ...rest,
    ref: setRef,
    role: "radio" as const,
    "aria-checked": isChecked,
    "data-state": isChecked ? ("checked" as const) : ("unchecked" as const),
    tabIndex: isTabStop ? 0 : -1,
    disabled,
    onClick: composeEventHandlers(onClick, () => select(value)),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return (
    <RadioGroupItemContext.Provider value={itemContextValue}>
      {asChild ? (
        <Slot {...itemProps}>{children}</Slot>
      ) : (
        <button type="button" {...itemProps}>
          {children}
        </button>
      )}
    </RadioGroupItemContext.Provider>
  );
}

/** @internal */
RadioGroupItem.displayName = "RadioGroupItem";

/**
 * A decorative `<span aria-hidden="true">` that renders its children
 * only while the enclosing {@link RadioGroupItem | `RadioGroup.Item`}
 * is the selected one — typically the filled dot inside a radio
 * control. The radio's accessible state is already conveyed by
 * `aria-checked` on the Item, so the indicator is purely visual.
 *
 * **Styling hook.** Mirrors the parent Item's
 * `data-state="checked" | "unchecked"` so the same CSS rule can target
 * both.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own
 * element (typically an `<svg>` dot) as the indicator itself, with
 * `aria-hidden` and `data-state` merged onto that element rather than
 * a wrapper.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the indicator in
 * the DOM while unchecked so a CSS exit animation can play against
 * `data-state="unchecked"`. Consumers who use `forceMount` own the
 * exit lifecycle themselves.
 *
 * @example Default span wrapper
 * ```tsx
 * <RadioGroup.Item value="red">
 *   <RadioGroup.Indicator />
 *   Red
 * </RadioGroup.Item>
 * ```
 *
 * @example Icon as the indicator via `asChild`
 * ```tsx
 * <RadioGroup.Indicator asChild>
 *   <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" /></svg>
 * </RadioGroup.Indicator>
 * ```
 *
 * @throws if rendered outside a `RadioGroup.Item`.
 */
export function RadioGroupIndicator({
  children,
  forceMount,
  asChild = false,
  ...rest
}: RadioGroupIndicatorProps): ReactElement | null {
  const { checked } = useRadioGroupItemContext();
  if (!checked && !forceMount) return null;
  const indicatorProps = {
    ...rest,
    "aria-hidden": "true" as const,
    "data-state": checked ? ("checked" as const) : ("unchecked" as const),
  };
  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }
  return <span {...indicatorProps}>{children}</span>;
}

/** @internal */
RadioGroupIndicator.displayName = "RadioGroupIndicator";

/** Type of the {@link RadioGroup} compound: the root callable plus its attached sub-components. */
export type TRadioGroupCompound = typeof RadioGroupRoot & {
  Root: typeof RadioGroupRoot;
  Item: typeof RadioGroupItem;
  Indicator: typeof RadioGroupIndicator;
};

/**
 * Headless, accessible **RadioGroup** — a compound component
 * implementing the
 * [WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
 * built on native `<button role="radio">` elements. Zero styles ship.
 *
 * `RadioGroup` is both callable (an alias of
 * {@link RadioGroupRoot | `RadioGroup.Root`}) and carries its
 * sub-components as static properties. Prefer the namespaced form in
 * application code for readability and grep-ability.
 *
 * - {@link RadioGroupRoot | `RadioGroup.Root`} — state owner, context
 *   provider, `<div role="radiogroup">` wrapper.
 * - {@link RadioGroupItem | `RadioGroup.Item`} — a selectable radio
 *   button participating in the roving tabindex.
 * - {@link RadioGroupIndicator | `RadioGroup.Indicator`} — decorative
 *   dot, mounted only while the parent Item is selected.
 *
 * @example Minimal usage
 * ```tsx
 * import { RadioGroup } from "@primitiv-ui/react";
 *
 * <RadioGroup.Root defaultValue="compact" aria-label="Density">
 *   <RadioGroup.Item value="compact">
 *     <RadioGroup.Indicator />
 *     Compact
 *   </RadioGroup.Item>
 *   <RadioGroup.Item value="comfortable">
 *     <RadioGroup.Indicator />
 *     Comfortable
 *   </RadioGroup.Item>
 * </RadioGroup.Root>;
 * ```
 *
 * @see {@link RadioGroupRoot} for state modes.
 * @see {@link RadioGroupItem} for selection, roving tabindex, and keyboard navigation.
 * @see {@link RadioGroupIndicator} for the mount gate and animation hooks.
 */
const RadioGroupCompound: TRadioGroupCompound = Object.assign(RadioGroupRoot, {
  Root: RadioGroupRoot,
  Item: RadioGroupItem,
  Indicator: RadioGroupIndicator,
});

/** @internal */
RadioGroupCompound.displayName = "RadioGroup";

export { RadioGroupCompound as RadioGroup };
