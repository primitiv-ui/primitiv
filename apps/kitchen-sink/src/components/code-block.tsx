import "../styles/primitiv/code-block/styles.css";
/*
 * Code Block — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add code-block`. Renders a block of
 * source code with Prism syntax highlighting (themed from the
 * --primitiv-code-syntax-* tokens, so it re-colours with light/dark), an optional
 * filename/copy header, and an optional line-number gutter. Hand-written — it
 * carries real behaviour (highlighting + copy-to-clipboard) — so it has no
 * drift-guard test. The copy control wears the Button component's secondary
 * classes (hence the `button` component dependency); the Copy/Check glyphs are
 * inlined from @primitiv-ui/icons so the block installs no extra package.
 */
import { Highlight, type PrismTheme } from "prism-react-renderer";
import { useState, type ComponentPropsWithRef } from "react";
import { codeBlock, type CodeBlockVariants } from "./code-block.recipe";

/* Disable Prism's inline theme so the .token.* classes take their colour from
   the stylesheet's --primitiv-code-syntax-* tokens (light/dark via the cascade). */
const NO_INLINE_THEME: PrismTheme = { plain: {}, styles: [] };

function CopyGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.75 7.25v13.5H7.25V7.25zm-12 12h10.5V8.75H8.75z" />
      <path d="M15.25 4.75H4.75v10.5h4v1.5h-5.5V3.25h13.5v5.5h-1.5z" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.057 5.904 10.05 19.111 2.939 12 4 10.94l5.95 5.949 9.954-11.946z" />
    </svg>
  );
}

export type CodeBlockProps = Omit<ComponentPropsWithRef<"div">, "children"> &
  CodeBlockVariants & {
    /** The source to render. */
    code: string;
    /** Prism language id (e.g. `tsx`, `css`, `bash`). Defaults to `tsx`. */
    language?: string;
    /** Filename shown in the header; its presence shows the header + copy control. */
    filename?: string;
    /** Force the header (with the copy control) even without a filename. */
    showHeader?: boolean;
    /** Show a line-number gutter. */
    showLineNumbers?: boolean;
  };

/**
 * A block of source code — a bordered, tinted surface with mono type, an optional
 * filename/copy header and line-number gutter, and Prism syntax highlighting
 * themed from `--primitiv-code-syntax-*` (so it tracks light/dark). The `size`
 * prop (`xs`–`xl`, default `md`) sets the type; a `data-density` ancestor scales
 * the padding.
 *
 * @example
 * ```tsx
 * <CodeBlock language="tsx" filename="app.tsx" showLineNumbers code={source} />
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/code-block
 */
export function CodeBlock({
  code,
  language = "tsx",
  filename,
  showHeader = false,
  showLineNumbers = false,
  size = "md",
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  const headerShown = showHeader || filename != null;
  // Prism keeps a trailing newline as an empty last line; drop it.
  const source = code.replace(/\n$/, "");

  return (
    <div className={[codeBlock({ size }), className].filter(Boolean).join(" ")} {...props}>
      {headerShown && (
        <div className="primitiv-code-block__header">
          {filename != null && (
            <span className="primitiv-code-block__filename">{filename}</span>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
            className={`primitiv-button primitiv-button--secondary primitiv-button--${size} primitiv-code-block__copy`}
          >
            {copied ? <CheckGlyph /> : <CopyGlyph />}
          </button>
        </div>
      )}
      <Highlight theme={NO_INLINE_THEME} code={source} language={language}>
        {({ className: preClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`primitiv-code-block__pre ${preClassName}`}
            style={style}
            data-line-numbers={showLineNumbers ? "" : undefined}
          >
            <code className="primitiv-code-block__code">
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line });
                return (
                  <span
                    {...lineProps}
                    key={i}
                    className={`primitiv-code-block__line ${lineProps.className ?? ""}`}
                  >
                    {showLineNumbers && (
                      <span className="primitiv-code-block__ln" aria-hidden="true">
                        {i + 1}
                      </span>
                    )}
                    <span className="primitiv-code-block__line-content">
                      {line.map((token, key) => (
                        <span {...getTokenProps({ token })} key={key} />
                      ))}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}
