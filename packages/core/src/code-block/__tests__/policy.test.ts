import { CODE_BLOCK_COPIED_MS, codeBlockCopyText } from "../policy";

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
