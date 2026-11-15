/**
 * Code Block's copy rules, shared by every surface (RFC 0033 §4): what the copy
 * control puts on the clipboard, and how long it reads "Copied".
 */

/** How long the copy control shows its copied state, in milliseconds. */
export const CODE_BLOCK_COPIED_MS = 2000;

/**
 * The text a block copies: its code without the one trailing newline a
 * highlighter leaves, which the rendered block does not show either. A blank
 * last line written on purpose keeps its own newline.
 */
export function codeBlockCopyText(text: string): string {
  return text.endsWith("\n") ? text.slice(0, -1) : text;
}

/**
 * The language a block highlights as: its `language` attribute, else Prism's
 * own `language-*` class (so markup written for Prism works as it is), else
 * none.
 */
export function codeBlockLanguage(attribute: string | null, classNames: readonly string[]): string | null {
  const named = attribute?.trim().toLowerCase();
  if (named) return named;
  const prismClass = classNames.find((name) => name.startsWith("language-"));
  return prismClass ? prismClass.slice("language-".length) : null;
}

/**
 * Pasted code as it was meant: without the blank lines around it and the
 * indent every line picked up from the HTML it sits in. The indent is measured
 * over lines that have text, so a blank line's stray whitespace counts for
 * nothing, and relative indentation is kept.
 */
export function codeBlockDedent(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 0 && lines[0]!.trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === "") lines.pop();
  const indents = lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
  const shared = Math.min(...indents);
  return lines.map((line) => line.slice(shared)).join("\n");
}

/**
 * Highlighted markup split into one string a line, each standing alone: a
 * token span that runs across a newline (a multi-line comment, a template
 * string) is closed at the end of one line and reopened at the start of the
 * next, so every line can sit in its own element beside its line number.
 */
export function codeBlockLines(html: string): string[] {
  const lines: string[] = [];
  const open: string[] = [];
  let line = "";
  for (const part of html.split(/(<span[^>]*>|<\/span>|\n)/)) {
    if (part === "\n") {
      lines.push(line + "</span>".repeat(open.length));
      line = open.join("");
    } else {
      if (part.startsWith("<span")) open.push(part);
      else if (part === "</span>") open.pop();
      line += part;
    }
  }
  lines.push(line);
  return lines;
}
