"use client";

import { CodeBlock } from "@/components/code-block";

/**
 * A small code block a server component can render: CodeBlock imports the React
 * package, which cannot load on the server, so it is reached through this
 * client boundary. Its props are plain strings.
 */
export const CodeSample = ({ language, code }: { language: string; code: string }) => (
  <CodeBlock size="sm" language={language} code={code} />
);
