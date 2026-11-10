import { POPOVER, runPopoverConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Popover } from "..";

// The React reference surface runs the shared Popover suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runPopoverConformance(async ({ open }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <>
        <Popover.Root defaultOpen={open}>
          <Popover.Trigger>{POPOVER.open}</Popover.Trigger>
          <Popover.Content>
            <Popover.Title>{POPOVER.title}</Popover.Title>
            <Popover.Description>{POPOVER.description}</Popover.Description>
            <input aria-label={POPOVER.field} />
            <Popover.Close>{POPOVER.close}</Popover.Close>
          </Popover.Content>
        </Popover.Root>
        <button type="button">{POPOVER.outside}</button>
      </>,
    ));
  });
  return unmount;
});
