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
 *
 * Compound subcomponents add a tabbed variant (e.g. an npm/pnpm/yarn/bun install
 * block): `CodeBlock.Tabs` composes the headless @primitiv-ui/react `Tabs`
 * primitive for the tab behaviour (roving focus, arrow keys, WAI-ARIA roles) and
 * reuses the Tabs component's `.primitiv-tabs__*` classes for the look (hence the
 * `tabs` component dependency) — the same "borrow the classes, not the component"
 * pattern the copy control uses for Button. The single-block `<CodeBlock code=… />`
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
  );
}

export type CodeBlockCopyProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  /** Button content. Defaults to the copy/check icon (swapping on success); pass
   * text (e.g. `Copy`) for the text form. */
  children?: ReactNode;
};

/**
 * The copy-to-clipboard control, shared by the single block and the tabbed form.
 * It copies whatever the enclosing block exposes (the single block's `code`, or
 * the active tab's `code`), wears the Button component's secondary classes, and
 * shows success for ~2s. With no `children` it renders the icon (swapping to a
 * check on success); with `children` it renders them, swapping to `Copied`.
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
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy code"}
      data-copied={copied ? "" : undefined}
      className={[
        `primitiv-button primitiv-button--secondary primitiv-button--${size} primitiv-code-block__copy`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {content}
    </button>
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
  const { size = "md", className, children, onChange, ...rootProps } = props;

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
      className={[codeBlock({ size }), "primitiv-tabs", `primitiv-tabs--${size}`, className]
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
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className="primitiv-tabs__trigger-label">{child}</span>
    ) : (
      child
    ),
  );
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
  size = "md",
  className,
  ...props
}: CodeBlockProps) {
  const headerShown = showHeader || filename != null;
  const getCopyCode = useCallback(() => code, [code]);

  return (
    <CodeBlockContext.Provider value={{ getCopyCode, size }}>
      <div className={[codeBlock({ size }), className].filter(Boolean).join(" ")} {...props}>
        {headerShown && (
          <div className="primitiv-code-block__header">
            {filename != null && (
              <span className="primitiv-code-block__filename">{filename}</span>
            )}
            <CodeBlockCopy />
          </div>
        )}
        <Highlighted code={code} language={language} showLineNumbers={showLineNumbers} />
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
