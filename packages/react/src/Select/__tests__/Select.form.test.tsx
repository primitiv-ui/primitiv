import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "../Select";

describe("Select rich form integration", () => {
  it("submits the selected value through a hidden native <select>", async () => {
    const user = userEvent.setup();
    let submitted: string | null = null;
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitted = new FormData(event.currentTarget).get(
            "framework",
          ) as string;
        }}
      >
        <Select.Root name="framework">
          <Select.Trigger>
            <Select.Value placeholder="Pick" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="react">React</Select.Item>
            <Select.Item value="vue">Vue</Select.Item>
          </Select.Content>
        </Select.Root>
        <button type="submit">Submit</button>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Pick" }));
    await user.click(screen.getByText("Vue"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(submitted).toBe("vue");
  });
});
