import { ChangeEvent, Children, isValidElement, ReactNode } from "react";

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
 */
function SelectRoot({
  children,
  onChange,
  onValueChange,
  value,
  defaultValue,
  ...rest
}: SelectRootProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  const inferredDefaultValue =
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

  return (
    <select {...rest} {...controlProps} onChange={handleChange}>
      {children}
    </select>
  );
}

SelectRoot.displayName = "SelectRoot";

/**
 * An individual choice inside a Select — renders a native `<option>`
 * element and passes all `OptionHTMLAttributes` through to the DOM.
 *
 * Native `<option>` only renders text; rich content (icons, descriptions)
 * is not supported.
 */
function SelectOption({ children, ...rest }: SelectOptionProps) {
  return <option {...rest}>{children}</option>;
}

SelectOption.displayName = "SelectOption";

/**
 * Visually groups related options inside the Select popup — renders a
 * native `<optgroup>` element. The `label` is shown by the browser as a
 * non-selectable heading and is announced as the group's accessible name.
 */
function SelectGroup({ children, ...rest }: SelectGroupProps) {
  return <optgroup {...rest}>{children}</optgroup>;
}

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
function SelectPlaceholder({ children, ...rest }: SelectPlaceholderProps) {
  return (
    <option {...rest} value="" disabled hidden>
      {children}
    </option>
  );
}

SelectPlaceholder.displayName = "SelectPlaceholder";

type TSelectCompound = typeof SelectRoot & {
  Root: typeof SelectRoot;
  Option: typeof SelectOption;
  Group: typeof SelectGroup;
  Placeholder: typeof SelectPlaceholder;
};

const SelectCompound: TSelectCompound = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Option: SelectOption,
  Group: SelectGroup,
  Placeholder: SelectPlaceholder,
});

SelectCompound.displayName = "Select";

export { SelectCompound as Select };
