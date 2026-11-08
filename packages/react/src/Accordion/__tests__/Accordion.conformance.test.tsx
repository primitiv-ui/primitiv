import { ACCORDION_ITEMS, runAccordionConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Accordion } from "..";

// The React reference surface runs the shared Accordion suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runAccordionConformance(async ({ value, multiple, orientation, dir, disabled = [] }) => {
  let unmount = () => {};
  const items = ACCORDION_ITEMS.map((item) => (
    <Accordion.Item key={item.value} value={item.value}>
      <Accordion.Header>
        <Accordion.Trigger disabled={disabled.includes(item.value)}>{item.label}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>{item.panel}</Accordion.Content>
    </Accordion.Item>
  ));
  await act(async () => {
    ({ unmount } = render(
      <Accordion.Root multiple={multiple} defaultValue={value} orientation={orientation} dir={dir}>
        {items}
      </Accordion.Root>,
    ));
  });
  return unmount;
});
