import { runSelectConformance, SELECT_ITEMS } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Select } from "..";

// The React reference surface runs the shared Select suite (RFC 0033 §6.2) in
// its rich (default) mode. It is expected to pass here first: React is the
// implementation the suite describes, so a failure is a real React bug, fixed
// in its own cycle.
runSelectConformance(async ({ value, name, required, disabled = [], indicators, placeholder, label }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <form>
        <Select.Root defaultValue={value} name={name} required={required}>
          <Select.Trigger aria-label={label}>
            <Select.Value placeholder={placeholder} />
          </Select.Trigger>
          <Select.Content>
            {SELECT_ITEMS.map((item) => (
              <Select.Item key={item.value} value={item.value} disabled={disabled.includes(item.value)}>
                {indicators && <Select.ItemIndicator>✓</Select.ItemIndicator>}
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </form>,
    ));
  });
  return unmount;
});
