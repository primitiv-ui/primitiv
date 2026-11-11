import { runToggleGroupConformance, TOGGLE_GROUP_ITEMS } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { ToggleGroup } from "..";

// The React reference surface runs the shared ToggleGroup suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runToggleGroupConformance(async ({ type, value = [], orientation, dir, disabled = [], label }) => {
  let unmount = () => {};
  const items = TOGGLE_GROUP_ITEMS.map((item) => (
    <ToggleGroup.Item key={item.value} value={item.value} disabled={disabled.includes(item.value)}>
      {item.label}
    </ToggleGroup.Item>
  ));
  const root =
    type === "single" ? (
      <ToggleGroup.Root type="single" defaultValue={value[0]} orientation={orientation} dir={dir} aria-label={label}>
        {items}
      </ToggleGroup.Root>
    ) : (
      <ToggleGroup.Root type="multiple" defaultValue={[...value]} orientation={orientation} dir={dir} aria-label={label}>
        {items}
      </ToggleGroup.Root>
    );
  await act(async () => {
    ({ unmount } = render(root));
  });
  return unmount;
});
