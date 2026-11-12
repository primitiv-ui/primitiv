import { LISTBOX_OPTIONS, runListboxConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Listbox } from "..";

// The React reference surface runs the shared Listbox suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runListboxConformance(
  async ({ type, value = [], orientation, dir, selectionFollowsFocus, disabled = [], grouped, label }) => {
    let unmount = () => {};
    const options = LISTBOX_OPTIONS.map((option) => (
      <Listbox.Option key={option.value} value={option.value} disabled={disabled.includes(option.value)}>
        {option.label}
      </Listbox.Option>
    ));
    const body = grouped ? (
      <>
        <Listbox.Group>
          <Listbox.GroupLabel>Fruit</Listbox.GroupLabel>
          {options.slice(0, 3)}
        </Listbox.Group>
        <Listbox.Group>
          <Listbox.GroupLabel>Vegetables</Listbox.GroupLabel>
          {options[3]}
        </Listbox.Group>
      </>
    ) : (
      options
    );
    const shared = { orientation, dir, selectionFollowsFocus, "aria-label": label };
    const root =
      type === "single" ? (
        <Listbox.Root type="single" defaultValue={value[0]} {...shared}>
          {body}
        </Listbox.Root>
      ) : (
        <Listbox.Root type="multiple" defaultValue={[...value]} {...shared}>
          {body}
        </Listbox.Root>
      );
    await act(async () => {
      ({ unmount } = render(
        <>
          {root}
          <button type="button">After</button>
        </>,
      ));
    });
    return unmount;
  },
);
