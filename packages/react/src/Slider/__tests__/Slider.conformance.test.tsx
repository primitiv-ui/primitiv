import { runSliderConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Slider } from "..";

// The React reference surface runs the shared Slider suite (RFC 0033 §6.2). It
// is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runSliderConformance(async ({ value, ...props }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Slider.Root defaultValue={[...value]} {...props} data-testid="root">
        <Slider.Track>
          <Slider.Range data-testid="range" />
        </Slider.Track>
        {value.map((_, index) => (
          <Slider.Thumb key={index} aria-label={`Thumb ${index + 1}`} />
        ))}
      </Slider.Root>,
    ));
  });
  return unmount;
});
