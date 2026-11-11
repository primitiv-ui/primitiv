import { RADIO_CARD_ITEMS, runRadioCardConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { RadioCard } from "..";

// The React reference surface runs the shared RadioCard suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runRadioCardConformance(async ({ value, orientation, dir, disabled = [], forceMount, label }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <RadioCard.Root defaultValue={value} orientation={orientation} dir={dir} aria-label={label}>
        {RADIO_CARD_ITEMS.map((item) => (
          <RadioCard.Item key={item.value} value={item.value} disabled={disabled.includes(item.value)}>
            <RadioCard.Indicator forceMount={forceMount} />
            {item.label}
          </RadioCard.Item>
        ))}
      </RadioCard.Root>,
    ));
  });
  return unmount;
});
