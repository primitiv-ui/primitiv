import { useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { useRovingTabindex } from "../hooks/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { RadioCardContext } from "./RadioCardContext";
import { RadioCardItemContext } from "./RadioCardItemContext";
import {
  useRadioCardContext,
  useRadioCardItemContext,
  useRadioCardRoot,
} from "./hooks/index.ts";
import {
  RadioCardIndicatorProps,
  RadioCardItemProps,
  RadioCardRootProps,
} from "./types";

/**
 * The root of a RadioCard group — a `<div role="radiogroup">` that owns the
 * selected value and provides {@link RadioCardContext} to descendant
 * {@link RadioCardItem | `RadioCard.Item`}s.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link RadioCardRootProps.defaultValue | `defaultValue`} (or omit
 *   for nothing selected on mount). The component owns the value.
 * - **Controlled** — pass
 *   {@link RadioCardRootProps.value | `value`} *and*
 *   {@link RadioCardRootProps.onValueChange | `onValueChange`}
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
 * element with the RadioCard's props merged in. The native `<div>` is dropped.
 *
 * @example Uncontrolled
 * ```tsx
 * <RadioCard.Root defaultValue="pro" aria-label="Plan">
 *   <RadioCard.Item value="starter">
 *     <h3>Starter</h3>
 *     <RadioCard.Indicator />
 *   </RadioCard.Item>
 *   <RadioCard.Item value="pro">
 *     <h3>Pro</h3>
 *     <RadioCard.Indicator />
 *   </RadioCard.Item>
 * </RadioCard.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [plan, setPlan] = useState("pro");
 *
 * <RadioCard.Root value={plan} onValueChange={setPlan} aria-label="Plan">
 *   <RadioCard.Item value="starter">Starter</RadioCard.Item>
 *   <RadioCard.Item value="pro">Pro</RadioCard.Item>
 * </RadioCard.Root>
 * ```
 */
export function RadioCardRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "both",
  dir,
  asChild = false,
  children,
  ...rest
}: RadioCardRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const { value, select, registerItem, itemValues, disabledValues, focusItem } =
    useRadioCardRoot({
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
    <RadioCardContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </RadioCardContext.Provider>
  );
}

/** @internal */
RadioCardRoot.displayName = "RadioCardRoot";

/**
 * An individual card option inside a RadioCard group — a native
 * `<button role="radio">` whose entire surface is the interactive area.
 * Participates in the roving tabindex and handles arrow-key navigation.
 *
 * **Selection.** Clicking an Item (or pressing Space / Enter via native
 * `<button>` behaviour) selects it. The arrow keys enabled by the group's
 * `orientation` move focus and selection to the next or previous
 * non-disabled Item, wrapping at the ends.
 *
 * **Roving tabindex.** Only one Item per group is in the document tab
 * sequence at a time: the selected one if any, otherwise the first
 * non-disabled Item.
 *
 * **Disabled.** Passing `disabled` forwards the native attribute and
 * excludes the Item from arrow-key navigation and the roving-tabindex
 * home base.
 *
 * **Styling hook.** `data-state="checked" | "unchecked"` mirrors the
 * selection state for CSS targeting.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer element with
 * the Item's ARIA, data-state, tabIndex, onClick, onKeyDown, disabled, and
 * ref merged onto it.
 *
 * @throws if rendered outside a `RadioCard.Root`.
 */
export function RadioCardItem({
  value,
  children,
  onClick,
  onKeyDown,
  disabled,
  asChild = false,
  ref,
  ...rest
}: RadioCardItemProps): ReactElement {
  const {
    value: selectedValue,
    select,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    orientation,
    dir,
  } = useRadioCardContext();
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
    <RadioCardItemContext.Provider value={itemContextValue}>
      {asChild ? (
        <Slot {...itemProps}>{children}</Slot>
      ) : (
        <button type="button" {...itemProps}>
          {children}
        </button>
      )}
    </RadioCardItemContext.Provider>
  );
}

/** @internal */
RadioCardItem.displayName = "RadioCardItem";

/**
 * A decorative `<span aria-hidden="true">` that renders its children
 * only while the enclosing {@link RadioCardItem | `RadioCard.Item`}
 * is the selected one. Purely visual — accessible state is conveyed by
 * `aria-checked` on the Item.
 *
 * **Styling hook.** Mirrors the parent Item's
 * `data-state="checked" | "unchecked"` so the same CSS rule can target both.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element
 * as the indicator itself, with `aria-hidden` and `data-state` merged in.
 *
 * **`forceMount` prop.** Pass `forceMount` to keep the indicator in the DOM
 * while unchecked so a CSS exit animation can play against
 * `data-state="unchecked"`.
 *
 * @example
 * ```tsx
 * <RadioCard.Item value="pro">
 *   <RadioCard.Indicator />
 *   Pro
 * </RadioCard.Item>
 * ```
 *
 * @throws if rendered outside a `RadioCard.Item`.
 */
export function RadioCardIndicator({
  children,
  forceMount,
  asChild = false,
  ...rest
}: RadioCardIndicatorProps): ReactElement | null {
  const { checked } = useRadioCardItemContext();
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
RadioCardIndicator.displayName = "RadioCardIndicator";

/** Type of the {@link RadioCard} compound: the callable `RadioCard.Root`
 * component augmented with its sub-components as static properties. */
export type TRadioCardCompound = typeof RadioCardRoot & {
  Root: typeof RadioCardRoot;
  Item: typeof RadioCardItem;
  Indicator: typeof RadioCardIndicator;
};

/**
 * Headless, accessible **RadioCard** — a card/tile-shaped radio group
 * variant implementing the
 * [WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
 * The entire card surface is the interactive element. Zero styles ship.
 *
 * `RadioCard` is both callable (an alias of
 * {@link RadioCardRoot | `RadioCard.Root`}) and carries its sub-components
 * as static properties.
 *
 * - {@link RadioCardRoot | `RadioCard.Root`} — state owner, context provider,
 *   `<div role="radiogroup">` wrapper.
 * - {@link RadioCardItem | `RadioCard.Item`} — a selectable card participating
 *   in the roving tabindex.
 * - {@link RadioCardIndicator | `RadioCard.Indicator`} — decorative indicator,
 *   mounted only while the parent Item is selected.
 *
 * @example Minimal usage
 * ```tsx
 * import { RadioCard } from "@primitiv-ui/react";
 *
 * <RadioCard.Root defaultValue="pro" aria-label="Plan">
 *   <RadioCard.Item value="starter">
 *     <RadioCard.Indicator />
 *     Starter
 *   </RadioCard.Item>
 *   <RadioCard.Item value="pro">
 *     <RadioCard.Indicator />
 *     Pro
 *   </RadioCard.Item>
 * </RadioCard.Root>
 * ```
 *
 * @see {@link RadioCardRoot} for state modes.
 * @see {@link RadioCardItem} for selection, roving tabindex, and keyboard navigation.
 * @see {@link RadioCardIndicator} for the mount gate and animation hooks.
 */
const RadioCardCompound: TRadioCardCompound = Object.assign(RadioCardRoot, {
  Root: RadioCardRoot,
  Item: RadioCardItem,
  Indicator: RadioCardIndicator,
});

RadioCardCompound.displayName = "RadioCard";

export { RadioCardCompound as RadioCard };
