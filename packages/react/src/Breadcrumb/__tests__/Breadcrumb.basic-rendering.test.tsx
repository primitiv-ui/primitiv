import { render, screen } from "@testing-library/react";

import { Breadcrumb } from "../Breadcrumb";

describe("Breadcrumb basic rendering", () => {
  it('renders the Root as a <nav aria-label="Breadcrumb">', () => {
    // Arrange & Act
    render(<Breadcrumb.Root />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });

    // Assert
    expect(nav.tagName).toBe("NAV");
  });

  it("lets the consumer override the Root aria-label", () => {
    // Arrange & Act
    render(<Breadcrumb.Root aria-label="You are here" />);

    // Assert
    expect(
      screen.getByRole("navigation", { name: "You are here" }),
    ).toBeInTheDocument();
  });

  it("renders the List as an <ol>", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List />
      </Breadcrumb.Root>,
    );

    // Assert
    expect(screen.getByRole("list").tagName).toBe("OL");
  });

  it("renders the Item as an <li>", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );

    // Assert
    expect(screen.getByRole("listitem").tagName).toBe("LI");
  });

  it("renders the Link as an <a> carrying its href", () => {
    // Arrange & Act
    render(<Breadcrumb.Link href="/library">Library</Breadcrumb.Link>);
    const link = screen.getByRole("link", { name: "Library" });

    // Assert
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/library");
  });

  it('renders the Page as a <span aria-current="page">', () => {
    // Arrange & Act
    render(<Breadcrumb.Page>Current article</Breadcrumb.Page>);
    const page = screen.getByText("Current article");

    // Assert
    expect(page.tagName).toBe("SPAN");
    expect(page).toHaveAttribute("aria-current", "page");
  });

  it("renders the Separator as a decorative <li> with a default glyph", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Separator data-testid="sep" />
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );
    const separator = screen.getByTestId("sep");

    // Assert — presentation role keeps it out of the list semantics
    expect(separator.tagName).toBe("LI");
    expect(separator).toHaveAttribute("role", "presentation");
    expect(separator).toHaveAttribute("aria-hidden", "true");
    expect(separator).toHaveTextContent("/");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("lets the consumer override the Separator glyph", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Separator data-testid="sep">&rsaquo;</Breadcrumb.Separator>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );

    // Assert
    expect(screen.getByTestId("sep")).toHaveTextContent("›");
  });

  it("composes a full trail of links, separators, and the current page", () => {
    // Arrange & Act
    render(
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/library">Library</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>Current article</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>,
    );

    // Assert — two links, three list items, current page marked
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Current article")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("sets a displayName on the compound and each sub-component", () => {
    // Assert — an empty displayName would render each as anonymous in DevTools.
    // Root aliases the compound (Object.assign), so its name is "Breadcrumb".
    expect(Breadcrumb.displayName).toBe("Breadcrumb");
    expect(Breadcrumb.List.displayName).toBe("BreadcrumbList");
    expect(Breadcrumb.Item.displayName).toBe("BreadcrumbItem");
    expect(Breadcrumb.Link.displayName).toBe("BreadcrumbLink");
    expect(Breadcrumb.Page.displayName).toBe("BreadcrumbPage");
    expect(Breadcrumb.Separator.displayName).toBe("BreadcrumbSeparator");
  });
});
