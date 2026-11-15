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
