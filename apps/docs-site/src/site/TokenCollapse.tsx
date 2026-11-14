"use client";

import { ChevronDown } from "@primitiv-ui/icons";
import type { ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleTriggerIcon,
} from "@/components/collapsible";

/**
 * One component's tokens on the token reference, closed until asked for: there
 * are 35 of them, and a reader looks up one. The table inside is rendered by
 * the server and passed in, so opening it fetches nothing.
 */
export const TokenCollapse = ({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) => (
  <Collapsible variant="inline" size="sm">
    <CollapsibleTrigger>
      <span>
        {title} <span className="docs-token-count">({count})</span>
      </span>
      <CollapsibleTriggerIcon>
        <ChevronDown size="100%" />
      </CollapsibleTriggerIcon>
    </CollapsibleTrigger>
    <CollapsibleContent>{children}</CollapsibleContent>
  </Collapsible>
);
