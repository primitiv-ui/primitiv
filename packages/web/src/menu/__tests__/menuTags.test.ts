import { menuTags } from "../elements";

describe("menuTags", () => {
  it("names every part of a menu component after its root, and lists the item parts together", () => {
    // Arrange & Act
    const tags = menuTags("primitiv-x");

    // Assert
    expect(tags).toEqual({
      root: "primitiv-x",
      trigger: "primitiv-x-trigger",
      content: "primitiv-x-content",
      item: "primitiv-x-item",
      checkboxItem: "primitiv-x-checkbox-item",
      radioGroup: "primitiv-x-radio-group",
      radioItem: "primitiv-x-radio-item",
      indicator: "primitiv-x-item-indicator",
      group: "primitiv-x-group",
      label: "primitiv-x-label",
      separator: "primitiv-x-separator",
      sub: "primitiv-x-sub",
      subTrigger: "primitiv-x-sub-trigger",
      subContent: "primitiv-x-sub-content",
      items: "primitiv-x-item,primitiv-x-checkbox-item,primitiv-x-radio-item",
    });
  });
});
