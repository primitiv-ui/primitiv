import { fireEvent, render, screen } from "@testing-library/react";

import { Avatar } from "../Avatar";

describe("Avatar image loading", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Avatar.Image as an <img> with the given src and alt", () => {
    // Arrange & Act
    render(
      <Avatar.Root>
        <Avatar.Image src="/ada.png" alt="Ada Lovelace" />
      </Avatar.Root>,
    );
    const img = screen.getByRole("img", { name: "Ada Lovelace" });

    // Assert
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "/ada.png");
  });

  it('reports data-status="loaded" on the Root and Image once the image loads', () => {
    // Arrange
    render(
      <Avatar.Root data-testid="root">
        <Avatar.Image src="/ada.png" alt="Ada" data-testid="img" />
      </Avatar.Root>,
    );

    // Act
    fireEvent.load(screen.getByTestId("img"));

    // Assert
    expect(screen.getByTestId("root")).toHaveAttribute(
      "data-status",
      "loaded",
    );
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "loaded");
  });

  it('reports data-status="error" on the Root and Image when the image fails', () => {
    // Arrange
    render(
      <Avatar.Root data-testid="root">
        <Avatar.Image src="/missing.png" alt="Ada" data-testid="img" />
      </Avatar.Root>,
    );

    // Act
    fireEvent.error(screen.getByTestId("img"));

    // Assert
    expect(screen.getByTestId("root")).toHaveAttribute("data-status", "error");
    expect(screen.getByTestId("img")).toHaveAttribute("data-status", "error");
  });

  it('reports data-status="loaded" on mount for an already-cached image', () => {
    // Arrange — a browser cache hit: the image is decoded before React
    // attaches its onLoad handler, so no load event will ever fire.
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalWidth",
      "get",
    ).mockReturnValue(64);

    // Act — render without firing any load event
    render(
      <Avatar.Root data-testid="root">
        <Avatar.Image src="/ada.png" alt="Ada" data-testid="img" />
      </Avatar.Root>,
    );

    // Assert
    expect(screen.getByTestId("img")).toHaveAttribute(
      "data-status",
      "loaded",
    );
  });
});
