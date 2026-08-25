import "../styles/primitiv/code-block/styles.css";
/*
 * Code Block — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add code-block`. Renders a block of
 * source code with Prism syntax highlighting (themed from the
 * --primitiv-code-syntax-* tokens, so it re-colours with light/dark), an optional
 * filename/copy header, and an optional line-number gutter. Hand-written — it
 * carries real behaviour (highlighting + copy-to-clipboard) — so it has no
 * drift-guard test. The copy control composes the registry `Button` component
 * (variant secondary; hence the `button` dependency), so its text label gets the
 * `__label` span + text-box-trim like any button; the Copy/Check glyphs are
 * inlined from @primitiv-ui/icons so the block installs no extra package.
 *
 * Compound subcomponents add a tabbed variant (e.g. an npm/pnpm/yarn/bun install
 * block): `CodeBlock.Tabs` composes the headless @primitiv-ui/react `Tabs`
 * primitive for the tab behaviour (roving focus, arrow keys, WAI-ARIA roles) and
 * reuses the Tabs component's `.primitiv-tabs__*` classes for the look (hence the
 * `tabs` component dependency); the copy control composes the registry `Button`
 * component. The single-block `<CodeBlock code=... />`
 * form is unchanged; the subcomponents are purely additive.
 */
import { Tabs as TabsPrimitive } from "@primitiv-ui/react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { codeBlock, type CodeBlockVariants } from "./code-block.recipe";
// The copy control composes the registry Button (a sibling copied component, so
// this resolves flat in the consumer where `add` installs both). code-block
// `dependsOn` button; the Button wraps its text label for text-box-trim parity.
import { Button } from "./button";
// `CodeBlock.Tabs` borrows the tabs component's `.primitiv-tabs__*` classes (see
// the header comment) without rendering any of its parts, so nothing else pulls
// that stylesheet in — and a consumer importing only code-block got bare,
// unstyled tab buttons. Importing the sibling wrapper for its side effect is what
// supplies the sheet: `tabs.tsx` self-imports its own stylesheet (the CLI
// prepends that line at install time, computed from the consumer's configurable
// `styles.path`), which is why this cannot be a direct `.css` import here — the
// registry source has no idea where the styles will land. `dependsOn` already
// lists `tabs`, so `add code-block` installs the file this resolves to.
import "./tabs";

/* Disable Prism's inline theme so the .token.* classes take their colour from
   the stylesheet's --primitiv-code-syntax-* tokens (light/dark via the cascade). */
const NO_INLINE_THEME: PrismTheme = { plain: {}, styles: [] };

/* `Omit` over a discriminated union must be distributed to keep the arms intact
   (e.g. the headless Tabs.Root controlled/uncontrolled union). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/* The five control sizes, spelled out independently of the recipe's variant
   type so the step-down map keys cleanly regardless of how `cva` resolves. */
type CodeBlockSize = "xs" | "sm" | "md" | "lg" | "xl";

/* The copy control sits one size step below the block (floored at xs) so it
   reads as a subordinate affordance rather than a peer of the code — matching
   the Figma Code Block set (the Copy button/icon is one step down at every size). */
const COPY_SIZE: Record<CodeBlockSize, CodeBlockSize> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

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

/* Shared by the single block and each tabbed panel: the code to copy (resolved
   lazily — for tabs it follows the active tab) and the control size, so
   `CodeBlock.Copy` can render anywhere inside a block without prop threading. */
type CodeBlockContextValue = {
  getCopyCode: () => string;
  size: CodeBlockVariants["size"];
};
const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

/* Provided only by `CodeBlock.Tabs`: each `CodeBlock.Content` registers its
   `{ value → code }` so the shared copy control can copy the active panel. */
type CodeRegistryContextValue = {
  register: (value: string, code: string) => void;
};
const CodeRegistryContext = createContext<CodeRegistryContextValue | null>(null);

/* The Prism highlight body, shared by the single block and each tabbed panel so
   there is one highlighting implementation. No `style={style}` from Prism: the
   emptied theme returns {}, and dropping it guarantees Prism can never inline a
   font-size/background over the stylesheet (all sizing/colour comes from CSS). */
/*
 * NOTE: neither span spreads its props, and that is load-bearing.
 *
 * Both used to be written `<span {...getLineProps({ line })} key={i}>`, which
 * is the shape prism-react-renderer's own README shows. Under the automatic
 * JSX runtime a `key` written alongside a spread does not reach the element —
 * the compiler cannot hoist it out of the props object, and `jsx()`, unlike
 * `createElement`, only takes a key as its third argument. React then sees an
 * array of keyless children and logs "Each child in a list should have a
 * unique key prop", naming `Highlight` as the owner because the elements are
 * created inside its render callback. It produced ~100 errors per page view.
 *
 * Destructuring what the getters return and passing the parts explicitly keeps
 * the key where the compiler can see it. Do not "tidy" these back into a
 * spread.
 */
function Highlighted({
  code,
  language,
  showLineNumbers,
}: {
  code: string;
  language: string;
  showLineNumbers: boolean;
}) {
  // Prism keeps a trailing newline as an empty last line; drop it.
  const source = code.replace(/\n$/, "");
  return (
    <Highlight theme={NO_INLINE_THEME} code={source} language={language}>
      {({ className: preClassName, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`primitiv-code-block__pre ${preClassName}`}
          data-line-numbers={showLineNumbers ? "" : undefined}
        >
          <code className="primitiv-code-block__code">
            {tokens.map((line, i) => {
              const { className: lineClassName, style } = getLineProps({ line });
              return (
                <span
                  key={i}
                  className={`primitiv-code-block__line ${lineClassName ?? ""}`}
                  style={style}
                >
                  {showLineNumbers && (
                    <span className="primitiv-code-block__ln" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                  <span className="primitiv-code-block__line-content">
                    {line.map((token, t) => {
                      const {
                        children: tokenText,
                        className: tokenClassName,
                        style: tokenStyle,
                      } = getTokenProps({ token });
                      return (
                        <span key={t} className={tokenClassName} style={tokenStyle}>
                          {tokenText}
                        </span>
                      );
                    })}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

export type CodeBlockCopyProps = Omit<
  ComponentPropsWithRef<typeof Button>,
  "children" | "variant" | "size"
> & {
  /** Button content. Defaults to the copy/check icon (swapping on success); pass
   * text (e.g. `Copy`) for the text form. */
  children?: ReactNode;
};

/**
 * The copy-to-clipboard control, shared by the single block and the tabbed form.
 * It copies whatever the enclosing block exposes (the single block's `code`, or
 * the active tab's `code`) and shows success for ~2s. Composes the registry
 * `Button` (variant `secondary`, size one step below the block per {@link COPY_SIZE})
 * so its text label gets the `__label` span + text-box-trim like every other
 * button. With no `children` it renders the icon (swapping to a check on
 * success); with `children` it renders them, swapping to `Copied`.
 */
function CodeBlockCopy({ children, className, onClick, ...props }: CodeBlockCopyProps) {
  const context = useContext(CodeBlockContext);
  // One step below the block size (see COPY_SIZE), floored at xs.
  const size = COPY_SIZE[(context?.size ?? "md") as CodeBlockSize] ?? "sm";
  const [copied, setCopied] = useState(false);

  const copy = (event: MouseEvent<HTMLButtonElement>) => {
    const text = context?.getCopyCode() ?? "";
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
    onClick?.(event);
  };

  const content =
    children != null ? (copied ? "Copied" : children) : copied ? <CheckGlyph /> : <CopyGlyph />;

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      className={["primitiv-code-block__copy", className].filter(Boolean).join(" ")}
      {...props}
    >
      {content}
    </Button>
  );
}

export type CodeBlockHeaderProps = ComponentPropsWithRef<"div">;

/** The toolbar row of the tabbed form — hosts the tablist and the copy control.
 * Reuses the block's `__header` part (the single block renders its own header
 * internally). */
function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps) {
  return (
    <div
      className={["primitiv-code-block__header", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type CodeBlockTabsProps = DistributiveOmit<
  ComponentPropsWithRef<typeof TabsPrimitive.Root>,
  "size"
> & {
  /** Type size for the block; `data-density` scales the padding. @default "md" */
  size?: CodeBlockSize;
  /**
   * Whether long lines reflow to the panel. Turn it off for content whose column
   * alignment is the content; the panel then scrolls horizontally.
   * @default true
   */
  wrap?: boolean;
};

/**
 * The root of the tabbed form — a code block whose panels are switched by a
 * tablist (e.g. an npm/pnpm/yarn/bun install block). Composes the headless
 * `Tabs.Root` for behaviour and co-classes `.primitiv-tabs` so the borrowed
 * `.primitiv-tabs__*` classes resolve their custom properties; both roots agree
 * on `display: flex; flex-direction: column`, so co-classing is safe.
 *
 * @example
 * ```tsx
 * <CodeBlock.Tabs defaultValue="npm">
 *   <CodeBlock.Header>
 *     <CodeBlock.List label="Install with">
 *       <CodeBlock.Trigger value="npm">npm</CodeBlock.Trigger>
 *       <CodeBlock.Trigger value="pnpm">pnpm</CodeBlock.Trigger>
 *     </CodeBlock.List>
 *     <CodeBlock.Copy>Copy</CodeBlock.Copy>
 *   </CodeBlock.Header>
 *   <CodeBlock.Content value="npm" language="bash" code="npm i @primitiv-ui/react" />
 *   <CodeBlock.Content value="pnpm" language="bash" code="pnpm add @primitiv-ui/react" />
 * </CodeBlock.Tabs>
 * ```
 */
function CodeBlockTabs(props: CodeBlockTabsProps) {
  const { size = "md", wrap = true, className, children, onChange, ...rootProps } = props;

  // Mirror the active value for the copy control. When controlled, follow
  // `value`; otherwise track our own state, seeded from `defaultValue` and
  // advanced by the primitive's `onChange` (which we still forward).
  const isControlled = props.value !== undefined;
  const [uncontrolledActive, setUncontrolledActive] = useState<string | undefined>(
    props.defaultValue,
  );
  const active = isControlled ? props.value : uncontrolledActive;

  const codes = useRef(new Map<string, string>());
  const register = useCallback((value: string, code: string) => {
    codes.current.set(value, code);
  }, []);
  const getCopyCode = useCallback(
    () => (active != null ? (codes.current.get(active) ?? "") : ""),
    [active],
  );

  const handleChange = (meta: { index: number; name: string }) => {
    if (!isControlled) setUncontrolledActive(meta.name);
    onChange?.(meta);
  };

  return (
    <TabsPrimitive.Root
      className={[codeBlock({ size, wrap }), "primitiv-tabs", `primitiv-tabs--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      onChange={handleChange}
      {...rootProps}
    >
      <CodeBlockContext.Provider value={{ getCopyCode, size }}>
        <CodeRegistryContext.Provider value={{ register }}>{children}</CodeRegistryContext.Provider>
      </CodeBlockContext.Provider>
    </TabsPrimitive.Root>
  );
}

export type CodeBlockListProps = ComponentPropsWithRef<typeof TabsPrimitive.List>;

/** The tablist of the tabbed form. Wraps the headless `Tabs.List` (requires a
 * `label` or `ariaLabelledBy`) with the Tabs component's `__list` class. */
function CodeBlockList({ className, ...props }: CodeBlockListProps) {
  return (
    <TabsPrimitive.List
      className={["primitiv-tabs__list", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type CodeBlockTriggerProps = ComponentPropsWithRef<typeof TabsPrimitive.Trigger>;

/* Wrap bare text in the label span so `text-box-trim` can be honoured, mirroring
   the styled Tabs component's trigger. */
function wrapTriggerLabel(children: ReactNode): ReactNode {
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className="primitiv-tabs__trigger-label">{child}</span>
    ) : (
      child
    ),
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

/** A tab of the tabbed form. Wraps the headless `Tabs.Trigger` with the Tabs
 * component's `__trigger` class; its `value` links it to the matching
 * `CodeBlock.Content`. */
function CodeBlockTrigger({ className, children, ...props }: CodeBlockTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={["primitiv-tabs__trigger", className].filter(Boolean).join(" ")}
      {...props}
    >
      {wrapTriggerLabel(children)}
    </TabsPrimitive.Trigger>
  );
}

export type CodeBlockContentProps = Omit<
  ComponentPropsWithRef<typeof TabsPrimitive.Content>,
  "children"
> & {
  /** The source for this panel. */
  code: string;
  /** Prism language id (e.g. `tsx`, `css`, `bash`). Defaults to `tsx`. */
  language?: string;
  /** Show a line-number gutter. */
  showLineNumbers?: boolean;
};

/** A panel of the tabbed form — a highlighted code block for one tab. Wraps the
 * headless `Tabs.Content`, renders the shared Prism highlight, and registers its
 * `code` so the shared copy control can copy the active panel. */
function CodeBlockContent({
  code,
  language = "tsx",
  showLineNumbers = false,
  value,
  className,
  ...props
}: CodeBlockContentProps) {
  const registry = useContext(CodeRegistryContext);
  useEffect(() => {
    registry?.register(value, code);
  }, [registry, value, code]);

  return (
    <TabsPrimitive.Content
      value={value}
      className={["primitiv-code-block__panel", className].filter(Boolean).join(" ")}
      {...props}
    >
      <Highlighted code={code} language={language} showLineNumbers={showLineNumbers} />
    </TabsPrimitive.Content>
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
    /** Show a line-number gutter. Ignored under `variant="inline"`. */
    showLineNumbers?: boolean;
  };

/**
 * A block of source code — a bordered, tinted surface with mono type, an optional
 * filename/copy header and line-number gutter, and Prism syntax highlighting
 * themed from `--primitiv-code-syntax-*` (so it tracks light/dark). The `size`
 * prop (`xs`–`xl`, default `md`) sets the type; a `data-density` ancestor scales
 * the padding.
 *
 * Long lines wrap to the container by default, because a horizontal scrollbar
 * reads worse on a narrow viewport. `wrap={false}` opts out for content whose
 * column alignment IS the content — a tree with aligned trailing `//`
 * annotations, say — where reflowing a line drops its annotation onto the next
 * row; the block scrolls inside its own box instead.
 *
 * `variant="inline"` renders the same highlighted source as a CHIP instead — one
 * line, sized to its content, sitting on the baseline beside prose or a label.
 * It is the answer to "I want `InlineCode`, but syntax-highlighted": highlighting
 * lives here, with the Prism theme and the `--primitiv-code-syntax-*` palette, so
 * putting it in `inline-code` would have meant a second copy of both and a
 * highlighter dependency on a component that is otherwise dependency-free. The
 * header and gutter are ignored in this variant — a chip has nowhere to put them.
 *
 * For a tabbed variant (e.g. an npm/pnpm/yarn/bun install block), use the
 * compound subcomponents: {@link CodeBlock.Tabs}, {@link CodeBlock.Header},
 * {@link CodeBlock.List}, {@link CodeBlock.Trigger}, {@link CodeBlock.Content},
 * and {@link CodeBlock.Copy}.
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
  variant = "block",
  size = "md",
  wrap = true,
  className,
  ...props
}: CodeBlockProps) {
  /* The chip has nowhere to put a header or a gutter — it is one line on the
     baseline — so both are ignored rather than half-rendered. Stated here
     because the props remain in the type: a caller switching an existing block
     to `inline` should find them quietly dropped, not throwing. */
  const inline = variant === "inline";
  const headerShown = !inline && (showHeader || filename != null);
  const gutterShown = !inline && showLineNumbers;
  const getCopyCode = useCallback(() => code, [code]);

  return (
    <CodeBlockContext.Provider value={{ getCopyCode, size }}>
      <div
        className={[codeBlock({ variant, size, wrap }), className].filter(Boolean).join(" ")}
        {...props}
      >
        {headerShown && (
          <div className="primitiv-code-block__header">
            {filename != null && (
              <span className="primitiv-code-block__filename">{filename}</span>
            )}
            <CodeBlockCopy />
          </div>
        )}
        <Highlighted code={code} language={language} showLineNumbers={gutterShown} />
      </div>
    </CodeBlockContext.Provider>
  );
}

CodeBlock.Tabs = CodeBlockTabs;
CodeBlock.Header = CodeBlockHeader;
CodeBlock.List = CodeBlockList;
CodeBlock.Trigger = CodeBlockTrigger;
CodeBlock.Content = CodeBlockContent;
CodeBlock.Copy = CodeBlockCopy;
