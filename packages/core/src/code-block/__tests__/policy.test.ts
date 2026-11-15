import { CODE_BLOCK_COPIED_MS, codeBlockCopyText, codeBlockDedent, codeBlockLanguage, codeBlockLines } from "../policy";

describe("codeBlockCopyText", () => {
  it("drops the one trailing newline a highlighter leaves, as the rendered block does", () => {
    expect(codeBlockCopyText("const a = 1;\nconst b = 2;\n")).toBe("const a = 1;\nconst b = 2;");
  });

  it("keeps a deliberate blank last line, dropping only one newline", () => {
    expect(codeBlockCopyText("a\n\n")).toBe("a\n");
  });

  it("leaves text with no trailing newline as it is", () => {
    expect(codeBlockCopyText("a\nb")).toBe("a\nb");
  });
});

describe("CODE_BLOCK_COPIED_MS", () => {
  it("shows the copied state for two seconds, as the React copy control does", () => {
    expect(CODE_BLOCK_COPIED_MS).toBe(2000);
  });
});

describe("codeBlockLanguage", () => {
  it("takes the language attribute, trimmed and lower-cased", () => {
    expect(codeBlockLanguage(" TSX ", ["language-css"])).toBe("tsx");
  });

  it("falls back to Prism's language-* class", () => {
    expect(codeBlockLanguage(null, ["primitiv-code-block__code", "language-css"])).toBe("css");
  });

  it("falls back to the class when the attribute is empty", () => {
    expect(codeBlockLanguage("", ["language-json"])).toBe("json");
  });

  it("has none when neither names one", () => {
    expect(codeBlockLanguage(null, ["primitiv-code-block__code"])).toBeNull();
  });
});

describe("codeBlockDedent", () => {
  it("drops the blank lines around pasted code and the indent every line shares", () => {
    expect(codeBlockDedent("\n    const a = 1;\n      nested();\n\n    done();\n  ")).toBe("const a = 1;\n  nested();\n\ndone();");
  });

  it("drops a leading line of only spaces, as it does a trailing one", () => {
    expect(codeBlockDedent("   \n  a\n   ")).toBe("a");
  });

  it("makes nothing of code that is only blank lines", () => {
    expect(codeBlockDedent("  \n \n")).toBe("");
  });

  it("leaves code with no shared indent as it is", () => {
    expect(codeBlockDedent("a\n  b")).toBe("a\n  b");
  });

  it("measures the shared indent over lines that have text, so a blank line's whitespace counts for nothing", () => {
    expect(codeBlockDedent("  a\n \n  b")).toBe("a\n\nb");
  });
});

describe("codeBlockLines", () => {
  it("splits highlighted markup into one string a line", () => {
    expect(codeBlockLines('<span class="token keyword">let</span> a;\nb;')).toEqual(['<span class="token keyword">let</span> a;', "b;"]);
  });

  it("closes a token at a line's end and reopens it on the next, so each line stands alone", () => {
    expect(codeBlockLines('x <span class="token comment">/* a\nb */</span> y')).toEqual([
      'x <span class="token comment">/* a</span>',
      '<span class="token comment">b */</span> y',
    ]);
  });

  it("reopens nested tokens in order", () => {
    expect(codeBlockLines('<span class="a"><span class="b">1\n2</span>3</span>')).toEqual([
      '<span class="a"><span class="b">1</span></span>',
      '<span class="a"><span class="b">2</span>3</span>',
    ]);
  });

  it("keeps an empty line empty", () => {
    expect(codeBlockLines("a\n\nb")).toEqual(["a", "", "b"]);
  });
});
