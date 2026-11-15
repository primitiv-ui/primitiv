// Its own file: Prism's core loads once per module graph.
import { defineCodeBlock } from "../elements";

it("extends the Prism a page already has rather than replacing it", async () => {
  // Arrange — the page's own Prism, loaded before Primitiv's
  const scope = globalThis as { Prism?: unknown };
  scope.Prism = { manual: true };
  const loaded = (await import("prismjs/components/prism-core.js")).default;
  // A page's Prism is its own script's instance, not the module Primitiv would
  // import (which Node caches): a copy stands in for it.
  const pagePrism = { ...loaded };
  scope.Prism = pagePrism;
  defineCodeBlock();
  const highlighted = new Promise((resolve) => document.addEventListener("primitiv-code-block-highlight", resolve, { once: true }));

  // Act
  document.body.innerHTML = `<primitiv-code-block language="js"><pre><code>let a;</code></pre></primitiv-code-block>`;
  await highlighted;

  // Assert
  expect(scope.Prism).toBe(pagePrism);
  expect(pagePrism.languages.javascript).toBeDefined();
  expect(document.querySelector(".token.keyword")?.textContent).toBe("let");
});
