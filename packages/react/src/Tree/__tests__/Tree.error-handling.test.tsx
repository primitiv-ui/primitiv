import { render } from "@testing-library/react";

import { Tree } from "../Tree";

describe("Tree error handling tests", () => {
  it("should throw when Tree.Item is rendered outside Tree.Root", () => {
    // Act / Assert
    expect(() => render(<Tree.Item value="a">Orphan</Tree.Item>)).toThrow(
      "<Tree.Root>",
    );
  });
});
