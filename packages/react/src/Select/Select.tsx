import {
  ChangeEvent,
  Children,
  isValidElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { ReactElement } from "react";

import { useFieldProps } from "../Field/hooks/index.ts";
import { composeEventHandlers, Slot } from "../Slot/index.ts";

import { SelectContext, useSelectContext } from "./SelectContext";
import {
  SelectItemIndicatorContext,
  useSelectItemIndicatorContext,
} from "./SelectItemIndicatorContext";
import { useSelectContent, useSelectRoot } from "./hooks/index.ts";
import {
  SelectContentProps,
  SelectGroupProps,
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectPlaceholderProps,
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
} from "./types";

const ITEM_INDICATOR_DISPLAY_NAME = "SelectItemIndicator";

/** Off-screen but still submitted — the rich mode's hidden form `<select>`. */
const VISUALLY_HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

const PLACEHOLDER_DISPLAY_NAME = "SelectPlaceholder";

function hasPlaceholderChild(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    const type = child.type as { displayName?: string };
    return type.displayName === PLACEHOLDER_DISPLAY_NAME;
  });
}

/**
 * The root of a Select — renders a native `<select>` element with an
 * implicit `role="combobox"` as provided by the browser.
 *
 * Browser-native behaviour is preserved: keyboard navigation (arrow keys,
 * Home/End, typeahead), the platform popup, mobile UX (iOS/Android wheel
 * pickers), and form submission all work without additional JS. No
 * positioning JS or Portal is involved.
 *
 * **Controlled vs uncontrolled.** Two state modes are statically
 * discriminated at the type level so only one shape is accepted by
 * TypeScript at a time:
 *
 * - **Uncontrolled** — pass {@link SelectRootUncontrolledProps.defaultValue | `defaultValue`}
 *   (or omit it). The browser owns the selection. `onValueChange` is optional.
 * - **Controlled** — pass {@link SelectRootControlledProps.value | `value`}
 *   and {@link SelectRootControlledProps.onValueChange | `onValueChange`} together.
 *   Every transition defers back through `onValueChange`, which receives the
 *   new selection as a plain string. The consumer's own `onChange` (the raw
 *   `ChangeEvent`) still fires alongside it.
 *
 * **Placeholder integration.** When a {@link SelectPlaceholder | `Select.Placeholder`}
 * appears among the direct children and neither `value` nor `defaultValue`
 * is set, Root infers `defaultValue=""` so the placeholder — not the first
 * selectable option — is the initial selection. Pair with `required` to
 * make the browser's native form validation catch an unchosen value at
 * submission.
 *
 * **Field integration.** When rendered inside a `<Field.Root>`, Select
 * opts into `FieldContext` and inherits `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, and `required` from the field. Any prop the
 * consumer passes wins; `aria-describedby` is composed (consumer ids first,
 * then field-supplied description / error ids). Outside a `<Field.Root>`,
 * behaviour is unchanged.
 *
 * **`asChild` composition.** Pass `asChild` to delegate rendering to a
 * single consumer-supplied element (e.g. a styled `<select>` wrapper).
 * Root's `onChange`, `data-disabled`, `value` / `defaultValue`, and other
 * native attributes are merged onto the child via the {@link Slot} pattern.
 * Placeholder-detection walks direct children only in this mode, so
 * `asChild` + placeholder requires the consumer to set `defaultValue=""`
 * explicitly.
 *
 * **Styling hooks.**
 * - `data-disabled=""` — present on the `<select>` when `disabled` is set,
 *   so CSS can target `[data-disabled]` without relying on `:disabled`.
 *
 * **Ref forwarding.** Pass a `ref` to access the underlying
 * `HTMLSelectElement` directly:
 *
 * ```tsx
 * const ref = useRef<HTMLSelectElement>(null);
 * <Select.Root ref={ref} defaultValue="apple" aria-label="Pick a fruit">…</Select.Root>
 * ```
 *
 * @extends HTMLSelectElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Select.Root defaultValue="apple" aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [fruit, setFruit] = useState("apple");
 *
 * <Select.Root value={fruit} onValueChange={setFruit} aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example With placeholder and groups
 * ```tsx
 * <Select.Root required aria-label="Pick a food">
 *   <Select.Placeholder>Choose…</Select.Placeholder>
 *   <Select.Group label="Fruits">
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </Select.Group>
 *   <Select.Group label="Vegetables">
 *     <Select.Option value="carrot">Carrot</Select.Option>
 *   </Select.Group>
 * </Select.Root>
 * ```
 *
 * @example Field integration
 * ```tsx
 * <Field.Root invalid={!!errors.fruit}>
 *   <Field.Label>Fruit</Field.Label>
 *   <Select.Root {...register("fruit")}>
 *     <Select.Placeholder>Choose a fruit…</Select.Placeholder>
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </Select.Root>
 *   <Field.ErrorText>{errors.fruit?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 *
 * @example asChild — styled select wrapper
 * ```tsx
 * function StyledSelect(props: ComponentProps<"select">) {
 *   return <select {...props} className="ds-select" />;
 * }
 *
 * <Select.Root asChild value={fruit} onValueChange={setFruit}>
 *   <StyledSelect>
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </StyledSelect>
 * </Select.Root>
 * ```
 */
export function SelectRoot({
  children,
  native = false,
  asChild = false,
  onChange,
  onValueChange,
  value,
  defaultValue,
  defaultOpen,
  open,
  onOpenChange,
  ...consumer
}: SelectRootProps): ReactElement {
  const merged = useFieldProps(consumer);
  const {
    contextValue,
    value: selectedValue,
    itemValues,
  } = useSelectRoot({
    defaultOpen,
    open,
    onOpenChange,
    value,
    defaultValue,
    onValueChange,
  });

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  const inferredDefaultValue =
    !asChild &&
    value === undefined &&
    defaultValue === undefined &&
    hasPlaceholderChild(children)
      ? ""
      : defaultValue;

  const controlProps =
    value !== undefined
      ? { value }
      : inferredDefaultValue !== undefined
        ? { defaultValue: inferredDefaultValue }
        : {};

  const rootProps = {
    ...merged,
    ...controlProps,
    "data-disabled": merged.disabled ? "" : undefined,
    onChange: handleChange,
  };

  // Rich (non-native) render path — the fully-styleable Popover listbox.
  // Root provides open/selection state to Trigger / Content / Value via
  // context, and renders a visually-hidden native <select> so the selection
  // still submits through the browser (mirroring what `native` gets free).
  // The hidden select is uncontrolled + remounted by `key` on each change,
  // so it needs no onChange and stays warning-free.
  if (!native) {
    return (
      <SelectContext.Provider value={contextValue}>
        {children}
        <select
          key={selectedValue}
          name={merged.name}
          defaultValue={selectedValue}
          required={merged.required}
          disabled={merged.disabled}
          tabIndex={-1}
          aria-hidden
          style={VISUALLY_HIDDEN}
        >
          <option value="" />
          {itemValues
            .filter((itemValue) => itemValue !== "")
            .map((itemValue) => (
              <option key={itemValue} value={itemValue} />
            ))}
        </select>
      </SelectContext.Provider>
    );
  }

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }
  return <select {...rootProps}>{children}</select>;
}

/** @internal */
SelectRoot.displayName = "SelectRoot";

/**
 * An individual choice inside a Select.
 *
 * In `native` mode (the case handled in this cycle) it renders a native
 * `<option>` element with an implicit `role="option"`. Because an
 * `<option>` can only hold text, `Select.Item` keeps **only the
 * string/number parts** of its children — joined as the option's visible
 * text — and **drops every element child** (icons, indicators). This is
 * the inverse of the string-vs-element split used elsewhere in the
 * library, and it means an icon-only item with no text renders an empty,
 * unlabelled `<option>` under `native`.
 *
 * Pass `disabled` to make a single choice unreachable from the dropdown
 * while still visible.
 *
 * @extends HTMLOptionElement
 *
 * @example Native
 * ```tsx
 * <Select.Root native>
 *   <Select.Item value="apple">Apple</Select.Item>
 *   <Select.Item value="durian" disabled>Durian (sold out)</Select.Item>
 * </Select.Root>
 * ```
 */
export function SelectItem({
  children,
  value,
  disabled,
  onClick,
  ...rest
}: SelectItemProps): ReactElement {
  const ctx = useContext(SelectContext);
  const registerItem = ctx?.registerItem;
  const unregisterItem = ctx?.unregisterItem;
  const selected = ctx?.value === value;

  // Keep the registered content current every render (silent — no bump).
  useEffect(() => {
    registerItem?.(value, children);
  });
  // Drop the registration when the item unmounts or changes value.
  useEffect(() => () => unregisterItem?.(value), [unregisterItem, value]);

  const indicatorContext = useMemo(() => ({ selected }), [selected]);

  // Native mode — no rich context is provided, so render an <option> whose
  // text is only the string/number children (element children are dropped).
  if (!ctx) {
    const text = Children.toArray(children).filter(
      (child): child is string | number =>
        typeof child === "string" || typeof child === "number",
    );
    return (
      <option value={value} disabled={disabled} onClick={onClick} {...rest}>
        {text}
      </option>
    );
  }

  // Rich mode — a listbox option that can carry arbitrary content. Clicking
  // it (when enabled) commits the selection and closes the listbox.
  const handleClick = () => {
    if (disabled) return;
    ctx.select(value);
  };
  const itemProps = {
    ...rest,
    role: "option" as const,
    tabIndex: -1,
    "aria-selected": selected,
    "aria-disabled": disabled || undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-state": selected ? "checked" : "unchecked",
    onClick: composeEventHandlers(onClick, handleClick),
  };
  return (
    <SelectItemIndicatorContext.Provider value={indicatorContext}>
      <div {...itemProps}>{children}</div>
    </SelectItemIndicatorContext.Provider>
  );
}

/** @internal */
SelectItem.displayName = "SelectItem";

/**
 * The rich-mode trigger button that opens the listbox. Exposes the
 * WAI-ARIA listbox-combobox contract: `aria-haspopup="listbox"`,
 * `aria-expanded` reflecting the open state, and `aria-controls` pointing
 * at the {@link SelectContent | `Select.Content`} id. Place a
 * {@link SelectValue | `Select.Value`} inside it to show the current
 * selection.
 *
 * Renders a `<button type="button">` by default; pass `asChild` to compose
 * the ARIA attributes and click handler onto a consumer element via the
 * {@link Slot} pattern.
 *
 * @extends HTMLButtonElement
 *
 * @example
 * ```tsx
 * <Select.Trigger>
 *   <Select.Value placeholder="Pick a framework…" />
 * </Select.Trigger>
 * ```
 */
export function SelectTrigger({
  children,
  onClick,
  asChild = false,
  ...rest
}: SelectTriggerProps): ReactElement {
  const { open, setOpen, contentId, triggerId, triggerRef } = useSelectContext();

  const triggerProps = {
    ...rest,
    ref: triggerRef,
    id: triggerId,
    type: "button" as const,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-controls": contentId,
    onClick: composeEventHandlers(onClick, () => setOpen(!open)),
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }
  return <button {...triggerProps}>{children}</button>;
}

/** @internal */
SelectTrigger.displayName = "SelectTrigger";

/**
 * The rich-mode display of the current selection, placed inside a
 * {@link SelectTrigger | `Select.Trigger`}. Shows the `placeholder` when
 * nothing is selected; mirroring the selected item's content is layered on
 * in a later cycle.
 *
 * Renders a `<span>`.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <Select.Value placeholder="Select a framework…" />
 * ```
 */
export function SelectValue({
  placeholder,
  ...rest
}: SelectValueProps): ReactElement {
  const { value, getItemChildren } = useSelectContext();
  const selectedChildren = value ? getItemChildren(value) : undefined;

  // Mirror the selected item's content, minus its ItemIndicator (the
  // checkmark answers "which row is selected" — redundant on the trigger it
  // already represents). Everything else — icons, badges, text — carries
  // through. Falls back to the placeholder when nothing is selected (or the
  // selected value has no registered item yet).
  const mirrored =
    selectedChildren === undefined
      ? null
      : Children.toArray(selectedChildren).filter(
          (child) =>
            !(
              isValidElement(child) &&
              (child.type as { displayName?: string }).displayName ===
                ITEM_INDICATOR_DISPLAY_NAME
            ),
        );

  return <span {...rest}>{mirrored ?? placeholder}</span>;
}

/** @internal */
SelectValue.displayName = "SelectValue";

/**
 * The selection mark rendered inside a rich {@link SelectItem} — typically a
 * checkmark. Reads its item's selected state from context and renders only
 * when that item is selected (pass `forceMount` to keep it mounted for
 * CSS/animation), exposing `data-state` (`"checked"` / `"unchecked"`).
 *
 * `Select.Value` deliberately excludes the indicator when mirroring the
 * selection into the trigger.
 *
 * Renders a `<span>` by default; pass `asChild` to compose onto any element
 * (commonly an SVG icon) via the {@link Slot} pattern.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <Select.Item value="react">
 *   <ReactIcon />
 *   React
 *   <Select.ItemIndicator>✓</Select.ItemIndicator>
 * </Select.Item>
 * ```
 */
export function SelectItemIndicator({
  children,
  asChild = false,
  forceMount = false,
  ...rest
}: SelectItemIndicatorProps): ReactElement | null {
  const { selected } = useSelectItemIndicatorContext();

  if (!forceMount && !selected) return null;

  const indicatorProps = {
    ...rest,
    "data-state": selected ? "checked" : "unchecked",
  };
  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }
  return <span {...indicatorProps}>{children}</span>;
}

/** @internal */
SelectItemIndicator.displayName = ITEM_INDICATOR_DISPLAY_NAME;

/**
 * The rich-mode listbox panel, rendered with the native
 * [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
 * (`popover="auto"`) — no portal, no floating-ui. The browser manages the
 * top layer and light-dismiss (outside click / Escape). Opens and closes in
 * sync with the trigger; on open, focus moves into the listbox, and Escape
 * closes it and returns focus to the trigger.
 *
 * Renders a `<div role="listbox">` by default; pass `asChild` to compose the
 * listbox props onto a consumer element via the {@link Slot} pattern.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Select.Content>
 *   <Select.Item value="react">React</Select.Item>
 *   <Select.Item value="vue">Vue</Select.Item>
 * </Select.Content>
 * ```
 */
export function SelectContent({
  children,
  onKeyDown,
  asChild = false,
  ...rest
}: SelectContentProps): ReactElement {
  const { contentProps } = useSelectContent({ onKeyDown, restProps: rest });

  if (asChild) {
    return <Slot {...contentProps}>{children}</Slot>;
  }
  return <div {...contentProps}>{children}</div>;
}

/** @internal */
SelectContent.displayName = "SelectContent";

/**
 * Visually groups related options inside the Select popup — renders a
 * native `<optgroup>` element with an implicit `role="group"` as provided
 * by the browser.
 *
 * The required {@link SelectGroupProps.label | `label`} prop is shown by
 * the browser as a non-selectable heading above the group and is announced
 * as the group's accessible name by assistive technology.
 *
 * @extends HTMLOptGroupElement
 *
 * @example
 * ```tsx
 * <Select.Group label="Fruits">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Group>
 * ```
 */
export function SelectGroup({
  children,
  ...rest
}: SelectGroupProps): ReactElement {
  return <optgroup {...rest}>{children}</optgroup>;
}

/** @internal */
SelectGroup.displayName = "SelectGroup";

/**
 * A non-selectable hint shown as the initial selection of a Select.
 * Renders a native `<option value="" disabled hidden>` so the browser
 * displays it in the closed control before the user picks anything but
 * makes it unreachable from the dropdown afterwards.
 *
 * Always render it as the **first** child of
 * {@link SelectRoot | `Select.Root`}, above any
 * {@link SelectItem | `Select.Item`} or
 * {@link SelectGroup | `Select.Group`}.
 *
 * When `Select.Placeholder` is present among Root's direct children and
 * neither `value` nor `defaultValue` is set, Root automatically infers
 * `defaultValue=""` so the placeholder — not the first selectable option
 * — is the initial selection. Pair `required` on Root to make the
 * browser's native form validation catch an unchosen value at submission.
 *
 * `value=""`, `disabled`, and `hidden` are fixed by the component and
 * cannot be overridden. See {@link SelectPlaceholderProps}.
 *
 * @extends HTMLOptionElement
 *
 * @example
 * ```tsx
 * <Select.Root required aria-label="Pick a fruit">
 *   <Select.Placeholder>Choose a fruit…</Select.Placeholder>
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 */
export function SelectPlaceholder({
  children,
  ...rest
}: SelectPlaceholderProps): ReactElement {
  return (
    <option {...rest} value="" disabled hidden>
      {children}
    </option>
  );
}

/** @internal */
SelectPlaceholder.displayName = "SelectPlaceholder";

/** Type of the {@link Select} compound: the root callable plus its attached sub-components. */
export type TSelectCompound = typeof SelectRoot & {
  Root: typeof SelectRoot;
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
  ItemIndicator: typeof SelectItemIndicator;
  Group: typeof SelectGroup;
  Placeholder: typeof SelectPlaceholder;
};

/**
 * Headless **Select** — a compound component wrapping the native
 * `<select>` / `<option>` / `<optgroup>` elements. Zero styles ship.
 *
 * Because the underlying element is the real `<select>`, the browser owns
 * the popup, keyboard interaction (arrow keys, Home/End, typeahead), mobile
 * UX (iOS/Android wheel pickers), and form submission. No positioning JS,
 * no Portal, no anchor positioning.
 *
 * `Select` is both callable (it is an alias of
 * {@link SelectRoot | `Select.Root`}) and carries its sub-components as
 * static properties. Prefer the namespaced form in application code for
 * readability and grep-ability:
 *
 * - {@link SelectRoot | `Select.Root`} — state owner, renders `<select>`, field integration.
 * - {@link SelectItem | `Select.Item`} — renders `<option>` in `native` mode.
 * - {@link SelectGroup | `Select.Group`} — renders `<optgroup>` with a required `label`.
 * - {@link SelectPlaceholder | `Select.Placeholder`} — always `value=""`, disabled, hidden; the initial hint.
 *
 * @example Minimal usage
 * ```tsx
 * import { Select } from "@primitiv-ui/react";
 *
 * <Select.Root defaultValue="apple" aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [fruit, setFruit] = useState("apple");
 *
 * <Select.Root value={fruit} onValueChange={setFruit} aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example With placeholder and groups
 * ```tsx
 * <Select.Root required aria-label="Pick a food">
 *   <Select.Placeholder>Choose…</Select.Placeholder>
 *   <Select.Group label="Fruits">
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </Select.Group>
 *   <Select.Group label="Vegetables">
 *     <Select.Option value="carrot">Carrot</Select.Option>
 *   </Select.Group>
 * </Select.Root>
 * ```
 *
 * @see {@link SelectRoot} for state modes, placeholder inference, field integration, and `asChild`.
 * @see {@link SelectOption} for per-option disabled state.
 * @see {@link SelectGroup} for the required `label` prop.
 * @see {@link SelectPlaceholder} for the placeholder + `defaultValue` interaction.
 */
const SelectCompound: TSelectCompound = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  Group: SelectGroup,
  Placeholder: SelectPlaceholder,
});

SelectCompound.displayName = "Select";

export { SelectCompound as Select };
