import { render, screen } from "@testing-library/react";

import { Avatar } from "../Avatar";
import { AvatarContext } from "../AvatarContext";

describe("Avatar basic rendering", () => {
  it("renders Avatar.Root as a <span>", () => {
    // Arrange & Act
    render(<Avatar.Root data-testid="avatar" />);
    const root = screen.getByTestId("avatar");

    // Assert
    expect(root.tagName).toBe("SPAN");
  });

  it("sets a displayName on the compound, sub-components, and context", () => {
    // Assert — empty displayNames would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "Avatar".
    expect(Avatar.displayName).toBe("Avatar");
    expect(Avatar.Image.displayName).toBe("AvatarImage");
    expect(Avatar.Fallback.displayName).toBe("AvatarFallback");
    expect(AvatarContext.displayName).toBe("AvatarContext");
  });
});
