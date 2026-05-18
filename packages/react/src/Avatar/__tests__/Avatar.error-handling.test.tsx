import { render } from "@testing-library/react";

import { Avatar } from "../Avatar";

const OUTSIDE_ROOT_ERROR =
  "Avatar.Image and Avatar.Fallback must be rendered inside an <Avatar.Root>.";

describe("Avatar error handling", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when Avatar.Image is rendered outside an Avatar.Root", () => {
    // Arrange & Act & Assert
    expect(() =>
      render(<Avatar.Image src="/ada.png" alt="Ada" />),
    ).toThrow(OUTSIDE_ROOT_ERROR);
  });

  it("throws when Avatar.Fallback is rendered outside an Avatar.Root", () => {
    // Arrange & Act & Assert
    expect(() => render(<Avatar.Fallback>AL</Avatar.Fallback>)).toThrow(
      OUTSIDE_ROOT_ERROR,
    );
  });
});
