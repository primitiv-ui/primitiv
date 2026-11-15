import { defineCodeBlock } from "../elements";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

/** Resolves once the next block on the page has (re)rendered its code. */
const highlighted = () =>
  new Promise<CustomEvent<{ language: string | null }>>((resolve) =>
    document.addEventListener("primitiv-code-block-highlight", (event) => resolve(event as CustomEvent), { once: true }),
  );

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve();
};

async function mount(html: string) {
  defineCodeBlock();
  const done = highlighted();
  document.body.innerHTML = html;
  return done;
}

const block = () => document.querySelector("primitiv-code-block") as HTMLElement;
const code = (index = 0) => document.querySelectorAll("code")[index] as HTMLElement;

const PASTED = `<primitiv-code-block language="ts"><pre><code>
    const a = 1;
    if (a) {
      run();
    }
  </code></pre></primitiv-code-block>`;

describe("<primitiv-code-block>", () => {
  it("highlights its code in the language it names, without the indent it was pasted with", async () => {
    // Act
    const event = await mount(PASTED);

    // Assert
    expect(event.detail).toEqual({ language: "ts" });
    expect(code().querySelector(".token.keyword")?.textContent).toBe("const");
    expect(code().textContent).toBe("const a = 1;\nif (a) {\n  run();\n}");
  });

  it("reads the language from Prism's language-* class on the code or the pre", async () => {
    // Act
    await mount(`<primitiv-code-block><pre class="language-css"><code>a { color: red; }</code></pre></primitiv-code-block>`);

    // Assert
    expect(code().querySelector(".token.property")?.textContent).toBe("color");
  });

  it("numbers the lines under line-numbers, each line keeping its newline and its number out of the text", async () => {
    // Act
    await mount(PASTED.replace('language="ts"', 'language="ts" line-numbers'));

    // Assert
    const lines = code().querySelectorAll(".primitiv-code-block__line");
    expect(lines).toHaveLength(4);
    expect(lines[2]!.querySelector(".primitiv-code-block__ln")?.getAttribute("aria-hidden")).toBe("true");
    expect(lines[2]!.querySelector(".primitiv-code-block__ln")?.textContent).toBe("3");
    expect(lines[2]!.querySelector(".primitiv-code-block__line-content")?.textContent).toBe("  run();\n");
    expect(code().closest("pre")!.getAttribute("data-line-numbers")).toBe("");
    expect(code().textContent).toBe("1const a = 1;\n2if (a) {\n3  run();\n4}\n");
  });

  it("follows line-numbers as it changes, re-rendering from the code's source", async () => {
    // Arrange
    await mount(PASTED);

    // Act
    let done = highlighted();
    block().setAttribute("line-numbers", "");
    await done;

    // Assert
    expect(code().querySelectorAll(".primitiv-code-block__line")).toHaveLength(4);

    // Act
    done = highlighted();
    block().removeAttribute("line-numbers");
    await done;

    // Assert
    expect(code().querySelector(".primitiv-code-block__line")).toBeNull();
    expect(code().closest("pre")!.hasAttribute("data-line-numbers")).toBe(false);
    expect(code().textContent).toBe("const a = 1;\nif (a) {\n  run();\n}");
  });

  it("follows language as it changes", async () => {
    // Arrange
    await mount(`<primitiv-code-block language="none"><pre><code>{"a": 1}</code></pre></primitiv-code-block>`.replace('language="none"', 'language="json" line-numbers'));

    // Act
    const done = highlighted();
    block().setAttribute("language", "css");
    const event = await done;

    // Assert
    expect(event.detail.language).toBe("css");
  });

  it("highlights the new code when the page swaps plain text in", async () => {
    // Arrange
    await mount(PASTED);

    // Act
    const done = highlighted();
    code().textContent = "let fresh = true;";
    await done;

    // Assert
    expect(code().querySelector(".token.keyword")?.textContent).toBe("let");
  });

  it("highlights every code inside it, each in its own language", async () => {
    // Act
    defineCodeBlock();
    let count = 0;
    const both = new Promise<void>((resolve) =>
      document.addEventListener("primitiv-code-block-highlight", () => {
        if (++count === 2) resolve();
      }),
    );
    document.body.innerHTML =
      `<primitiv-code-block language="ts"><pre><code>let a;</code></pre>` +
      `<pre><code class="language-css">a { color: red; }</code></pre></primitiv-code-block>`;
    await both;

    // Assert
    expect(code(0).querySelector(".token.keyword")?.textContent).toBe("let");
    expect(code(1).querySelector(".token.property")?.textContent).toBe("color");
  });

  it("numbers the lines of a language it has no grammar for, as plain escaped text", async () => {
    // Act
    await mount(`<primitiv-code-block language="cobol" line-numbers><pre><code>if a &lt; b &amp;&amp; c\nstop</code></pre></primitiv-code-block>`);

    // Assert
    expect(code().querySelectorAll(".primitiv-code-block__line")).toHaveLength(2);
    expect(code().querySelector(".primitiv-code-block__line-content")?.textContent).toBe("if a < b && c\n");
    expect(code().querySelector(".token")).toBeNull();
  });

  it("highlights a <code> that has no <pre> around it", async () => {
    // Act
    await mount(`<primitiv-code-block language="js"><code>let a;</code></primitiv-code-block>`);

    // Assert
    expect(code().querySelector(".token.keyword")?.textContent).toBe("let");
  });

  it("numbers the lines of code that names no language", async () => {
    // Act
    const event = await mount(`<primitiv-code-block line-numbers><pre><code>a\nb</code></pre></primitiv-code-block>`);

    // Assert
    expect(event.detail.language).toBeNull();
    expect(code().querySelectorAll(".primitiv-code-block__line")).toHaveLength(2);
  });

  it("renders again when the page swaps the same text back in", async () => {
    // Arrange
    await mount(PASTED);
    const source = code().textContent;

    // Act
    const done = highlighted();
    code().textContent = source;
    await done;

    // Assert
    expect(code().querySelector(".token.keyword")?.textContent).toBe("const");
  });

  it("keeps the newer render when the language changes before the older one's grammar arrives", async () => {
    // Arrange
    defineCodeBlock();
    const seen: unknown[] = [];
    document.addEventListener("primitiv-code-block-highlight", (event) => seen.push((event as CustomEvent).detail.language));
    const done = new Promise<void>((resolve) =>
      document.addEventListener("primitiv-code-block-highlight", () => resolve(), { once: true }),
    );

    // Act
    document.body.innerHTML = `<primitiv-code-block language="rust"><pre><code>fn main() {}</code></pre></primitiv-code-block>`;
    block().setAttribute("language", "python");
    await done;
    await settle();

    // Assert
    expect(seen).toEqual(["python"]);
  });

  it("leaves code already highlighted on the server as it is", async () => {
    // Arrange
    defineCodeBlock();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const html = `<primitiv-code-block language="ts"><pre><code><span class="token keyword">let</span> a;</code></pre></primitiv-code-block>`;

    // Act
    document.body.innerHTML = html;
    await settle();

    // Assert
    expect(document.body.innerHTML).toBe(html);
    expect(writes).not.toHaveBeenCalled();
  });

  it("leaves code with no language and no line numbers as it is", async () => {
    // Arrange
    defineCodeBlock();
    const html = `<primitiv-code-block><pre><code>  plain  </code></pre></primitiv-code-block>`;

    // Act
    document.body.innerHTML = html;
    await settle();

    // Assert
    expect(document.body.innerHTML).toBe(html);
  });

  it("does nothing without code inside it", async () => {
    // Arrange
    defineCodeBlock();

    // Act & Assert
    expect(() => {
      document.body.innerHTML = `<primitiv-code-block language="ts"></primitiv-code-block>`;
    }).not.toThrow();
    await settle();
  });

  it.each([
    ["markup", "<a href=\"x\">y</a>", "tag"],
    ["html", "<a>y</a>", "tag"],
    ["css", "a { color: red; }", "property"],
    ["javascript", "const a = 1;", "keyword"],
    ["js", "let a;", "keyword"],
    ["jsx", "const a = <B />;", "tag"],
    ["typescript", "let a: string;", "builtin"],
    ["ts", "let a: number;", "builtin"],
    ["tsx", "const a = <B x={1} />;", "tag"],
    ["json", '{"a": 1}', "property"],
    ["bash", "echo $HOME", "environment"],
    ["sh", "echo hi", "builtin"],
    ["yaml", "a: 1", "key"],
    ["markdown", "# Title", "title"],
    ["python", "def f(): pass", "keyword"],
    ["diff", "+ added", "inserted"],
    ["sql", "SELECT 1", "keyword"],
    ["scss", "$a: 1;", "variable"],
    ["rust", "fn main() {}", "keyword"],
    ["go", "func main() {}", "keyword"],
    ["graphql", "query { a }", "keyword"],
  ])("highlights %s", async (language, source, token) => {
    // Arrange
    const escaped = source.replace(/&/g, "&amp;").replace(/</g, "&lt;");

    // Act
    await mount(`<primitiv-code-block language="${language}"><pre><code>${escaped}</code></pre></primitiv-code-block>`);

    // Assert
    expect(code().querySelector(`.token.${token}`)).not.toBeNull();
  });
});
