import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel.IndicatorGroup", () => {
  it('should render with role="group"', () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toBeVisible();
  });

  it("should accept a label that becomes the group's aria-label", () => {
    const groupLabel = "Choose slide";
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label={groupLabel} />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: groupLabel })).toHaveAttribute(
      "aria-label",
      groupLabel,
    );
  });

  it("should accept ariaLabelledBy that points at an external label element", () => {
    const labelId = "indicator-heading";
    render(
      <Carousel.Root ariaLabel="Featured products">
        <h3 id={labelId}>Choose slide</h3>
        <Carousel.IndicatorGroup ariaLabelledBy={labelId} />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toHaveAttribute(
      "aria-labelledby",
      labelId,
    );
  });

  it("should accept a className prop", () => {
    const testClass = "custom-indicator-group";
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide" className={testClass} />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toHaveAttribute(
      "class",
      testClass,
    );
  });

  it("should apply a className of empty string by default when not specified", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toHaveAttribute(
      "class",
      "",
    );
  });

  it("should render children inside the group", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <span>indicator-child</span>
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByText("indicator-child")).toBeVisible();
  });
});

describe("Carousel.Indicator", () => {
  it('should render as <button type="button">', () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    const indicator = screen.getByRole("button", { name: "Slide 1" });
    expect(indicator).toBeVisible();
    expect(indicator).toHaveAttribute("type", "button");
  });

  it('should generate an aria-label of "Slide N" from the 1-indexed page position', () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Slide 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Slide 3" })).toBeVisible();
  });

  it("should set a data-carousel-indicator attribute as a CSS-targeting hook", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "data-carousel-indicator",
      "",
    );
  });

  it("should accept a className prop", () => {
    const testClass = "custom-indicator";
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} className={testClass} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "class",
      testClass,
    );
  });

  it("should apply a className of empty string by default when not specified", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "class",
      "",
    );
  });

  it("should jump to the targeted page when clicked in uncontrolled mode", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Slide 3" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should call onPageChange with the targeted page when clicked in controlled mode", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    function Parent() {
      const [page, setPage] = useState(0);
      return (
        <Carousel.Root
          ariaLabel="Featured products"
          page={page}
          onPageChange={(next) => {
            onPageChange(next);
            setPage(next);
          }}
        >
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
          <Carousel.IndicatorGroup label="Choose slide">
            <Carousel.Indicator index={0} />
            <Carousel.Indicator index={1} />
            <Carousel.Indicator index={2} />
          </Carousel.IndicatorGroup>
        </Carousel.Root>
      );
    }

    render(<Parent />);

    await user.click(screen.getByRole("button", { name: "Slide 2" }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should invoke the consumer's onClick handler before navigating", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} onClick={onClick} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Slide 2" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should render a non-interactive element (not a button) when readOnly", () => {
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} readOnly />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const dot = container.querySelector("[data-carousel-indicator]")!;
    expect(dot.tagName).toBe("SPAN");
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  it("should still track the active page via data-state when readOnly", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} readOnly />
          <Carousel.Indicator index={1} readOnly />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    const dots = container.querySelectorAll("[data-carousel-indicator]");
    expect(dots[0]).toHaveAttribute("data-state", "active");
    expect(dots[1]).toHaveAttribute("data-state", "inactive");

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(dots[0]).toHaveAttribute("data-state", "inactive");
    expect(dots[1]).toHaveAttribute("data-state", "active");
  });

  it("should not navigate when a readOnly indicator is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} readOnly />
          <Carousel.Indicator index={1} readOnly />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    const dots = container.querySelectorAll("[data-carousel-indicator]");
    await user.click(dots[1]);

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should still invoke the consumer's onClick handler when readOnly", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} readOnly onClick={onClick} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    const dot = container.querySelector("[data-carousel-indicator]")!;
    await user.click(dot);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Carousel.Indicators (auto-rendered)", () => {
  it("should render exactly one indicator button per registered slide", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });

  it("should render no indicators when there are no slides registered", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(
      screen.queryAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(0);
  });

  it("should update the rendered indicator count when slides mount or unmount", () => {
    const { rerender } = render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);

    rerender(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(2);
  });

  it("should label each auto-rendered indicator as 'Slide N' with N matching its 1-indexed position", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Slide 2" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Slide 3" })).toBeVisible();
  });

  it("should expose the provided label as the wrapping group's aria-label", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toBeVisible();
  });

  it("should accept ariaLabelledBy as an alternative to label", () => {
    const labelId = "indicator-heading";
    render(
      <Carousel.Root ariaLabel="Featured products">
        <h3 id={labelId}>Choose slide</h3>
        <Carousel.Viewport>
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators ariaLabelledBy={labelId} />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toHaveAttribute(
      "aria-labelledby",
      labelId,
    );
  });

  it("should jump to the targeted page when an auto-rendered indicator is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Slide 3" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should accept a className prop on the wrapping group", () => {
    const testClass = "indicator-row";
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Indicators label="Choose slide" className={testClass} />
      </Carousel.Root>,
    );

    expect(screen.getByRole("group", { name: "Choose slide" })).toHaveAttribute(
      "class",
      testClass,
    );
  });

  it("should forward readOnly to every auto-rendered indicator", () => {
    const { container } = render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" readOnly />
      </Carousel.Root>,
    );

    expect(
      screen.queryAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll("[data-carousel-indicator]"),
    ).toHaveLength(2);
  });
});

describe("Carousel.Indicator active state", () => {
  it('should mark the indicator at the current page with aria-disabled="true"', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 2" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it('should mark non-active indicators with aria-disabled="false"', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(screen.getByRole("button", { name: "Slide 3" })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
  });

  it('should set data-state="active" on the indicator at the current page and "inactive" on the others', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Slide 2" })).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Slide 3" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should follow the active page across navigation, flipping aria-disabled and data-state on the right indicators", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        <Carousel.IndicatorGroup label="Choose slide">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByRole("button", { name: "Slide 1" })).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(screen.getByRole("button", { name: "Slide 2" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByRole("button", { name: "Slide 2" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("should propagate the active state to indicators rendered by Carousel.Indicators", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose slide" />
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Slide 2" })).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByRole("button", { name: "Slide 2" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

describe("Indicator context errors", () => {
  it.each([
    [
      "Carousel.IndicatorGroup",
      () => <Carousel.IndicatorGroup label="Choose slide" />,
    ],
    ["Carousel.Indicator", () => <Carousel.Indicator index={0} />],
    [
      "Carousel.Indicators",
      () => <Carousel.Indicators label="Choose slide" />,
    ],
  ] as const)(
    "should throw an error when %s is used outside Carousel.Root",
    (_, ComponentRenderer) => {
      expect(() => {
        render(ComponentRenderer());
      }).toThrow("Component must be rendered as a child of Carousel.Root");
    },
  );
});
