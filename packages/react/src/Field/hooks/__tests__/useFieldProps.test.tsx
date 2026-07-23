import { render, screen } from "@testing-library/react";

import { FieldContext, type FieldContextValue } from "../../FieldContext";
import { useFieldProps } from "../useFieldProps";

/**
 * `useFieldProps` is a reusable hook that reads {@link FieldContext} directly,
 * so it is exercised here against a hand-built provider value (and, for the
 * no-context path, no provider at all) rather than the full `Field.Root` —
 * always through a real component that consumes it. `Field.Root` always
 * supplies a truthy `descriptionId`, so its defensive "nothing to describe"
 * fallback is only reachable through a custom provider like the one below.
 */
type ProbeProps = {
  id?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
};

function Probe(props: ProbeProps) {
  const merged = useFieldProps(props);
  return <input data-testid="probe" {...merged} />;
}

function renderInField(field: Partial<FieldContextValue>, props: ProbeProps = {}) {
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

describe("useFieldProps without a FieldContext", () => {
  it("returns the consumer props unchanged when no provider is in scope", () => {
    // Arrange & Act — no <FieldContext.Provider>: the early guard must fire.
    render(<Probe id="consumer-id" aria-invalid="true" />);
    const probe = screen.getByTestId("probe");

    // Assert — consumer props survive untouched and no field wiring is added.
    expect(probe).toHaveAttribute("id", "consumer-id");
    expect(probe).toHaveAttribute("aria-invalid", "true");
    expect(probe).not.toHaveAttribute("aria-describedby");
  });
});

describe("useFieldProps inheriting from the field", () => {
  it("adopts the field's id, disabled, required, and invalid state when the consumer omits them", () => {
    // Arrange & Act
    renderInField(
      {
        id: "field-id",
        descriptionId: "field-desc",
        errorId: "field-err",
        invalid: true,
        disabled: true,
        required: true,
      },
      {},
    );
    const probe = screen.getByTestId("probe");

    // Assert — every value falls back to the field.
    expect(probe).toHaveAttribute("id", "field-id");
    expect(probe).toBeDisabled();
    expect(probe).toBeRequired();
    expect(probe).toHaveAttribute("aria-invalid", "true");
    expect(probe).toHaveAttribute("aria-describedby", "field-desc field-err");
  });

  it("omits aria-invalid entirely when the field is valid and the consumer is silent", () => {
    // Arrange & Act
    renderInField({ invalid: false }, {});

    // Assert — a valid field contributes no aria-invalid, so the attribute is
    // absent rather than rendered as aria-invalid="false".
    expect(screen.getByTestId("probe")).not.toHaveAttribute("aria-invalid");
  });
});

describe("useFieldProps with consumer overrides", () => {
  it("lets consumer id, disabled, required, and aria-invalid win over the field", () => {
    // Arrange & Act — field would contribute the opposite of each override.
    renderInField(
      {
        id: "field-id",
        invalid: false,
        disabled: false,
        required: false,
      },
      {
        id: "consumer-id",
        disabled: true,
        required: true,
        "aria-invalid": "true",
      },
    );
    const probe = screen.getByTestId("probe");

    // Assert — the consumer's explicit values are preserved.
    expect(probe).toHaveAttribute("id", "consumer-id");
    expect(probe).toBeDisabled();
    expect(probe).toBeRequired();
    expect(probe).toHaveAttribute("aria-invalid", "true");
  });
});

describe("useFieldProps aria-describedby composition", () => {
  it("omits aria-describedby entirely when nothing contributes an id", () => {
    // Arrange & Act — empty description/error ids, not invalid, no consumer id.
    renderInField({});

    // Assert — the empty join collapses to undefined, so the attribute is absent
    // rather than rendered as aria-describedby="".
    expect(screen.getByTestId("probe")).not.toHaveAttribute("aria-describedby");
  });

  it("prepends the consumer's ids ahead of the field's, space-separated", () => {
    // Arrange & Act — a valid field so the errorId does not join in.
    renderInField(
      { descriptionId: "field-desc", errorId: "field-err", invalid: false },
      { "aria-describedby": "consumer-desc" },
    );

    // Assert — consumer id first, then the field's descriptionId; the errorId is
    // excluded while valid.
    expect(screen.getByTestId("probe")).toHaveAttribute(
      "aria-describedby",
      "consumer-desc field-desc",
    );
  });
});
