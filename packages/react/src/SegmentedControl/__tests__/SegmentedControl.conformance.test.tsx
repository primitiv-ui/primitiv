import { runSegmentedControlConformance, SEGMENTED_CONTROL_ITEMS } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { SegmentedControl } from "..";

// The React reference surface runs the shared SegmentedControl suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runSegmentedControlConformance(async ({ value, name, orientation, dir, disabled = [], controlDisabled, label }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <form>
      <SegmentedControl.Root
        name={name}
        defaultValue={value}
        orientation={orientation}
        dir={dir}
        disabled={controlDisabled}
        aria-label={label}
      >
        {SEGMENTED_CONTROL_ITEMS.map((item) => (
          <SegmentedControl.Item key={item.value} value={item.value} disabled={disabled.includes(item.value)}>
            {item.label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl.Root>
      </form>,
    ));
  });
  return unmount;
});
