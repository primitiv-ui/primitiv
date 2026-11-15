/** A copy control, as the server writes it: an icon button with both glyphs, the copied one hidden. */
export const COPY_BUTTON =
  `<primitiv-code-block-copy><button type="button" aria-label="Copy code">` +
  `<svg data-copy-state="idle"></svg><svg data-copy-state="copied" hidden></svg>` +
  `</button></primitiv-code-block-copy>`;

/** A highlighted block with a line-number gutter, each line ending in its newline. */
export const BLOCK =
  `<div id="block"><div>${COPY_BUTTON}</div>` +
  `<pre><code>` +
  `<span><span aria-hidden="true">1</span><span><span class="token keyword">const</span> a = 1;\n</span></span>` +
  `<span><span aria-hidden="true">2</span><span><span class="token keyword">const</span> b = 2;\n</span></span>` +
  `</code></pre></div>`;
