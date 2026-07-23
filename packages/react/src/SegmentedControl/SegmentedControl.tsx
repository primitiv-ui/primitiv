import { useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";

import { useDirection } from "../DirectionProvider/index.ts";
import { useRovingTabindex } from "../hooks/index.ts";
import { Slot, composeEventHandlers, composeRefs } from "../Slot/index.ts";

import { SegmentedControlContext } from "./SegmentedControlContext";
import {
  useSegmentedControlContext,
  useSegmentedControlRoot,
} from "./hooks/index.ts";
import {
  SegmentedControlItemProps,
  SegmentedControlRootProps,
} from "./types";

/**
 * The root of a SegmentedControl — a `<div role="radiogroup">` that owns
 * the selected value and provides {@link SegmentedControlContext} to
 * descendant {@link SegmentedControlItem | `SegmentedControl.Item`}s. It is
 * the single-select value picker of the design system (the same WAI-ARIA
 * radio-group semantics as {@link RadioGroupRoot | `RadioGroup`}), styled as
 * a linear strip of segments rather than a stack of radios.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass
 *   {@link SegmentedControlRootProps.defaultValue | `defaultValue`} (or omit
 *   for nothing selected on mount). The component owns the value.
 * - **Controlled** — pass
 *   {@link SegmentedControlRootProps.value | `value`} *and*
 *   {@link SegmentedControlRootProps.onValueChange | `onValueChange`}
 *   together. The parent owns the value; the component defers every change
 *   back through the callback.
 *
 * **ARIA.** `role="radiogroup"` and `aria-orientation` are set
 * automatically. Provide an accessible name via `aria-label` or
 * `aria-labelledby`.
 *
 * **Orientation.** `"horizontal"` (default) binds the Arrow Left/Right pair;
 * `"vertical"` binds Arrow Up/Down. Reflected as `data-orientation` on the
 * root for styling.
 *
 * **Disabled.** Pass `disabled` to disable the whole control — every segment
 * becomes non-interactive and drops out of arrow-key navigation, and
 * `data-disabled=""` is set on the root.
 *
 * **Reading direction.** `dir` (`"ltr"` / `"rtl"`) swaps the horizontal
 * arrow pair so Arrow Left moves forward in RTL. When omitted, it is
 * inherited from the nearest {@link DirectionProvider}, falling back to
 * `"ltr"`.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer-supplied element
 * in place of the native `<div>`, with the control's `role`,
 * `aria-orientation`, `data-orientation`, `data-disabled`, `dir`, and
 * remaining props merged in.
 *
 * @extends HTMLDivElement
 *
 * @example Uncontrolled
 * ```tsx
 * <SegmentedControl.Root defaultValue="headless" aria-label="Consumption mode">
 *   <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
 *   <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
 *   <SegmentedControl.Item value="figma">Figma</SegmentedControl.Item>
 * </SegmentedControl.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [value, setValue] = useState("headless");
 *
 * <SegmentedControl.Root value={value} onValueChange={setValue} aria-label="…">
 *   <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
 *   <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
 * </SegmentedControl.Root>
 * ```
 */
export function SegmentedControlRoot({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = "horizontal",
  dir,
  disabled = false,
  asChild = false,
  children,
  ...rest
}: SegmentedControlRootProps): ReactElement {
  const resolvedDir = dir ?? useDirection();
  const { value, select, registerItem, itemValues, disabledValues, focusItem } =
    useSegmentedControlRoot({
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
      disabled,
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
      disabled,
    ],
  );
  const rootProps = {
    role: "radiogroup" as const,
    "aria-orientation": orientation,
    "data-orientation": orientation,
    "data-disabled": disabled ? "" : undefined,
    dir: resolvedDir,
    ...rest,
  };
  return (
    <SegmentedControlContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <div {...rootProps}>{children}</div>
      )}
    </SegmentedControlContext.Provider>
  );
}

/** @internal */
// Runtime-dead: the compound alias below (same object via Object.assign)
// overwrites this to "SegmentedControl" at load, so the value is never
// observable. The assignment stays because it declares `displayName` on
// `typeof SegmentedControlRoot`, which TSegmentedControlCompound extends.
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
SegmentedControlRoot.displayName = "SegmentedControlRoot";

/**
 * An individual segment inside a SegmentedControl — a native
 * `<button role="radio">` that reports its state, participates in the
 * roving tabindex, and handles arrow-key navigation within the control.
 *
 * **Selection.** Clicking a segment (or pressing Space / Enter on the
 * focused segment via native `<button>` behaviour) selects it. The arrow
 * keys enabled by the control's `orientation` move focus and selection to
 * the next or previous non-disabled segment, wrapping at the ends.
 *
 * **Roving tabindex.** Only one segment per control is in the document tab
 * sequence at a time: the selected one if any, otherwise the first
 * non-disabled segment. All others have `tabIndex=-1` so `Tab` escapes the
 * control in a single keystroke.
 *
 * **Disabled.** Passing `disabled` forwards the native attribute and
 * excludes the segment from arrow-key navigation and the roving-tabindex
 * home base. The whole control can also be disabled via Root's `disabled`
 * prop, which disables every segment.
 *
 * **Styling hooks.** `data-state="checked" | "unchecked"` mirrors the
 * selection state; `data-disabled=""` is set when the segment (or the whole
 * control) is disabled.
 *
 * **`asChild` prop.** Pass `asChild` to render any consumer element in place
 * of the native `<button>`, with the segment's ARIA, `data-state`,
 * `data-disabled`, `tabIndex`, `onClick`, `onKeyDown`, `disabled`, and `ref`
 * merged onto it. A non-focusable child must be made focusable by the
 * consumer.
 *
 * @extends HTMLButtonElement
 *
 * @throws if rendered outside a `SegmentedControl.Root`.
 */
export function SegmentedControlItem({
  value,
  children,
  onClick,
  onKeyDown,
  disabled: itemDisabled,
  asChild = false,
  ref,
  ...rest
}: SegmentedControlItemProps): ReactElement {
  const {
    value: selectedValue,
    select,
    registerItem,
    itemValues,
    disabledValues,
    focusItem,
    orientation,
    dir,
    disabled: groupDisabled,
  } = useSegmentedControlContext();
  const isChecked = selectedValue === value;
  const isDisabled = itemDisabled || groupDisabled;
  // When the whole control is disabled, nothing is navigable; otherwise the
  // per-item disabled set is excluded from arrow-key navigation.
  const enabledValues = useMemo(
    () =>
      groupDisabled ? [] : itemValues.filter((v) => !disabledValues.has(v)),
    [groupDisabled, itemValues, disabledValues],
  );
  const isTabStop =
    selectedValue !== undefined ? isChecked : enabledValues[0] === value;

  const localRef = useRef<HTMLButtonElement | null>(null);
  const setRef = useMemo(() => composeRefs(localRef, ref), [ref]);

  useEffect(() => {
    registerItem(value, localRef.current, itemDisabled);
    return () => registerItem(value, null);
  }, [value, itemDisabled, registerItem]);

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

  const itemProps = {
    ...rest,
    ref: setRef,
    role: "radio" as const,
    "aria-checked": isChecked,
    "data-state": isChecked ? ("checked" as const) : ("unchecked" as const),
    "data-disabled": isDisabled ? "" : undefined,
    tabIndex: isTabStop ? 0 : -1,
    disabled: isDisabled,
    onClick: composeEventHandlers(onClick, () => select(value)),
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return asChild ? (
    <Slot {...itemProps}>{children}</Slot>
  ) : (
    <button type="button" {...itemProps}>
      {children}
    </button>
  );
}

/** @internal */
SegmentedControlItem.displayName = "SegmentedControlItem";

/** Type of the {@link SegmentedControl} compound: the root callable plus its attached sub-components. */
export type TSegmentedControlCompound = typeof SegmentedControlRoot & {
  Root: typeof SegmentedControlRoot;
  Item: typeof SegmentedControlItem;
};

/**
 * Headless, accessible **SegmentedControl** — a compound component for
 * picking one option from a small linear set. It implements the
 * [WAI-ARIA Radio Group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
 * on native `<button role="radio">` elements: exactly one segment is
 * selected at a time and the selection can never be cleared to nothing
 * (unlike a toggle group). Zero styles ship.
 *
 * `SegmentedControl` is both callable (an alias of
 * {@link SegmentedControlRoot | `SegmentedControl.Root`}) and carries its
 * sub-components as static properties. Prefer the namespaced form in
 * application code for readability and grep-ability.
 *
 * - {@link SegmentedControlRoot | `SegmentedControl.Root`} — state owner,
 *   context provider, `<div role="radiogroup">` wrapper.
 * - {@link SegmentedControlItem | `SegmentedControl.Item`} — a selectable
 *   segment participating in the roving tabindex.
 *
 * @example Minimal usage
 * ```tsx
 * import { SegmentedControl } from "@primitiv-ui/react";
 *
 * <SegmentedControl.Root defaultValue="headless" aria-label="Consumption mode">
 *   <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
 *   <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
 *   <SegmentedControl.Item value="figma">Figma</SegmentedControl.Item>
 * </SegmentedControl.Root>;
 * ```
 *
 * @see {@link SegmentedControlRoot} for state modes, orientation, and ARIA.
 * @see {@link SegmentedControlItem} for selection, roving tabindex, and keyboard navigation.
 */
const SegmentedControlCompound: TSegmentedControlCompound = Object.assign(
  SegmentedControlRoot,
  {
    Root: SegmentedControlRoot,
    Item: SegmentedControlItem,
  },
);

/** @internal */
SegmentedControlCompound.displayName = "SegmentedControl";

export { SegmentedControlCompound as SegmentedControl };
