// @vitest-environment node
//
// A server renderer (Next.js, Nuxt, Angular SSR, Astro) imports element modules
// where there is no DOM at all. Importing must not throw, and defining must be a
// no-op (RFC 0033 D21).

it("can be imported and defined where there is no DOM", async () => {
  // Arrange
  expect(globalThis.HTMLElement).toBeUndefined();

  // Act
  const { defineTabs, PrimitivTabsElement } = await import("../elements");

  // Assert
  expect(typeof PrimitivTabsElement).toBe("function");
  expect(() => defineTabs()).not.toThrow();
});
