import { useState } from "react";
import type { ChangeEvent } from "react";

import type { RadioChangeHandler } from "../types";

type UseRadioRootArgs = {
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: RadioChangeHandler;
};

/**
 * Resolves the controlled / uncontrolled state for a {@link Radio.Root} and
 * produces the props to spread onto its native `<input type="radio">`.
 *
 * The key correctness move: in **uncontrolled** mode the input is rendered
 * with `defaultChecked` and *no* `checked` prop, so the browser owns the
 * value and native `name`-grouping (including the silent deselection of
 * siblings) works. The returned `checked` is only a best-effort mirror used
 * for the `data-state` styling hook — it is updated from the input's own
 * `change` events, and may lag behind a sibling-driven deselect, which the
 * CSS `:checked` selector handles instead.
 */
export function useRadioRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  onChange,
}: UseRadioRootArgs) {
  const isControlled = controlledChecked !== undefined;
  const [mirror, setMirror] = useState(defaultChecked ?? false);
  const checked = isControlled ? controlledChecked : mirror;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) return;
    const next = event.target.checked;
    if (!isControlled) setMirror(next);
    onCheckedChange?.(next);
  };

  const inputStateProps = isControlled
    ? { checked: controlledChecked }
    : { defaultChecked: defaultChecked ?? false };

  return { checked, handleChange, inputStateProps };
}
