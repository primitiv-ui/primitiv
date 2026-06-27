import { render, screen } from "@testing-library/react";

import { FieldContext, type FieldContextValue } from "../../FieldContext";
import { useFieldProps } from "../useFieldProps";

/**
 * `useFieldProps` is a reusable hook that reads {@link FieldContext} directly,
 * so it is exercised here against a hand-built provider value rather than the
 * full `Field.Root`. `Field.Root` always supplies a truthy `descriptionId`,
 * which means its defensive "nothing to describe" fallback is only reachable
 * through a custom provider like the one below.
 */
function Probe(props: { "aria-describedby"?: string }) {
  const merged = useFieldProps(props);
  return <input data-testid="probe" {...merged} />;
}

function renderInField(
  field: Partial<FieldContextValue>,
  props: { "aria-describedby"?: string } = {},
) {
  const value: FieldContextValue = {
    id: "f",
    descriptionId: "",
    errorId: "",
    invalid: false,
    disabled: false,
    required: false,
    ...field,
  };
  return render(
    <FieldContext.Provider value={value}>
      <Probe {...props} />
    </FieldContext.Provider>,
  );
}

describe("useFieldProps aria-describedby composition", () => {
  it("omits aria-describedby entirely when nothing contributes an id", () => {
    // Arrange & Act — empty description/error ids, not invalid, no consumer id.
    renderInField({});

    // Assert — the empty join collapses to undefined, so the attribute is absent
    // rather than rendered as aria-describedby="".
    expect(screen.getByTestId("probe")).not.toHaveAttribute("aria-describedby");
  });
});
