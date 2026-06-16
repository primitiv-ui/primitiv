import { ChangeEvent, Children, isValidElement, ReactNode } from "react";
import type { ReactElement } from "react";

import { useFieldProps } from "../Field/hooks/index.ts";
import { Slot } from "../Slot/index.ts";

import {
  SelectGroupProps,
  SelectOptionProps,
  SelectPlaceholderProps,
  SelectRootProps,
} from "./types";

const PLACEHOLDER_DISPLAY_NAME = "SelectPlaceholder";

function hasPlaceholderChild(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    const type = child.type as { displayName?: string };
    return type.displayName === PLACEHOLDER_DISPLAY_NAME;
  });
}

/**
 * The root of a Select — renders a native `<select>` element and passes
 * all `SelectHTMLAttributes` through to the DOM.
 *
 * Browser-native behaviour is preserved: keyboard navigation (arrow keys,
 * Home/End, typeahead), the platform popup, mobile UX, and form
 * submission all work without additional JS.
 *
 * Supports two state modes, statically discriminated at the type level:
 *
 * - **Uncontrolled** — pass `defaultValue` (or omit it). The browser owns
 *   the selection. `onValueChange` is optional.
 * - **Controlled** — pass `value` and `onValueChange` together. Every
 *   transition defers back through `onValueChange`.
 *
 * `onValueChange` receives the new selection as a plain string. The
 * consumer's own `onChange` (the raw `ChangeEvent`) still fires alongside
 * it.
 *
 * **Placeholder integration.** When a {@link Select.Placeholder} appears
 * among the direct children and neither `value` nor `defaultValue` is
 * set, Root infers `defaultValue=""` so the placeholder — not the first
 * selectable option — is the initial selection.
 *
 * **Field integration.** When rendered inside a `<Field.Root>`, Select
 * opts into `FieldContext` and inherits `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, and `required` from the field. Any prop
 * the consumer passes wins; `aria-describedby` is composed (consumer
 * ids first, then field-supplied description / error ids). Outside a
 * `<Field.Root>`, behaviour is unchanged.
 */
export function SelectRoot({
  children,
  asChild = false,
  onChange,
  onValueChange,
  value,
  defaultValue,
  ...consumer
}: SelectRootProps): ReactElement {
  const merged = useFieldProps(consumer);

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

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }
  return <select {...rootProps}>{children}</select>;
}

/** @internal */
SelectRoot.displayName = "SelectRoot";

/**
 * An individual choice inside a Select — renders a native `<option>`
 * element and passes all `OptionHTMLAttributes` through to the DOM.
 *
 * Native `<option>` only renders text; rich content (icons, descriptions)
 * is not supported.
 */
export function SelectOption({
  children,
  ...rest
}: SelectOptionProps): ReactElement {
  return <option {...rest}>{children}</option>;
}

/** @internal */
SelectOption.displayName = "SelectOption";

/**
 * Visually groups related options inside the Select popup — renders a
 * native `<optgroup>` element. The `label` is shown by the browser as a
 * non-selectable heading and is announced as the group's accessible name.
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
 * displays it before the user picks anything but makes it unreachable
 * from the dropdown afterwards. Render it as the first child of
 * {@link Select.Root} (above any `Select.Option` or `Select.Group`).
 *
 * Pair with `required` on {@link Select.Root} to make the browser's
 * native form validation catch an unchosen value at submission.
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
  Option: typeof SelectOption;
  Group: typeof SelectGroup;
  Placeholder: typeof SelectPlaceholder;
};

/**
 * Headless **Select** — a compound component wrapping the native
 * `<select>` / `<option>` / `<optgroup>` elements. Zero styles ship.
 *
 * Because the underlying element is the real `<select>`, the browser
 * owns the popup, keyboard interaction (arrow keys, Home/End,
 * typeahead), mobile UX (wheel pickers), and form submission. No
 * positioning JS or Portal is involved.
 *
 * `Select` is both callable (an alias of {@link SelectRoot | `Select.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link SelectRoot | `Select.Root`} — state owner, renders `<select>`.
 * - {@link SelectOption | `Select.Option`} — renders `<option>`.
 * - {@link SelectGroup | `Select.Group`} — renders `<optgroup label>`.
 * - {@link SelectPlaceholder | `Select.Placeholder`} — disabled+hidden
 *   first option used as the initial hint.
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
 * @see {@link SelectRoot} for state modes, placeholder integration, and `asChild`.
 * @see {@link SelectPlaceholder} for the placeholder + `defaultValue` interaction.
 */
const SelectCompound: TSelectCompound = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Option: SelectOption,
  Group: SelectGroup,
  Placeholder: SelectPlaceholder,
});

SelectCompound.displayName = "Select";

export { SelectCompound as Select };
