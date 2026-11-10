import { DROPDOWN, runDropdownConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Dropdown } from "..";

// The React reference surface runs the shared Dropdown suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runDropdownConformance(async ({ open }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <>
        <Dropdown.Root defaultOpen={open}>
          <Dropdown.Trigger>{DROPDOWN.trigger}</Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Item>{DROPDOWN.copy}</Dropdown.Item>
            <Dropdown.Item disabled>{DROPDOWN.cut}</Dropdown.Item>
            <Dropdown.CheckboxItem>{DROPDOWN.grid}</Dropdown.CheckboxItem>
            <Dropdown.RadioGroup defaultValue="small">
              <Dropdown.RadioItem value="small">{DROPDOWN.small}</Dropdown.RadioItem>
              <Dropdown.RadioItem value="large">{DROPDOWN.large}</Dropdown.RadioItem>
            </Dropdown.RadioGroup>
            <Dropdown.Sub>
              <Dropdown.SubTrigger>{DROPDOWN.share}</Dropdown.SubTrigger>
              <Dropdown.SubContent>
                <Dropdown.Item>{DROPDOWN.email}</Dropdown.Item>
                <Dropdown.Item>{DROPDOWN.link}</Dropdown.Item>
              </Dropdown.SubContent>
            </Dropdown.Sub>
            <Dropdown.Item>{DROPDOWN.remove}</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
        <button type="button">{DROPDOWN.outside}</button>
      </>,
    ));
  });
  return unmount;
});
