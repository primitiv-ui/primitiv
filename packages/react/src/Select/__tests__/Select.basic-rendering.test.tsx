import { render, screen } from "@testing-library/react";

import { Select } from "../Select";

describe("Select basic rendering", () => {
  it("renders an <option> for each Select.Item child so the value is in the DOM", () => {
    // Arrange & Act
    render(
      <Select.Root native>
        <Select.Item value="apple">Apple</Select.Item>
      </Select.Root>,
    );

    // Assert
    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("sets a displayName on the compound and each sub-component", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // `Select`, `Select.Root` and the underlying function are one object
    // (Object.assign compound), so the compound's "Select" alias is the
    // observable Root displayName; the sub-components are distinct objects.
    // SelectPlaceholder's name is load-bearing beyond DevTools: Root detects a
    // placeholder among its direct children by it (see the placeholder tests),
    // and so must any consumer wrapper that wants that inference.
    expect(Select.displayName).toBe("Select");
    expect(Select.Trigger.displayName).toBe("SelectTrigger");
    expect(Select.Value.displayName).toBe("SelectValue");
    expect(Select.Content.displayName).toBe("SelectContent");
    expect(Select.Item.displayName).toBe("SelectItem");
    expect(Select.ItemIndicator.displayName).toBe("SelectItemIndicator");
    expect(Select.Group.displayName).toBe("SelectGroup");
    expect(Select.Placeholder.displayName).toBe("SelectPlaceholder");
  });
});
