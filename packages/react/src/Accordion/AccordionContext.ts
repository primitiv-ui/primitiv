import { createStrictContext } from "../utils/index.ts";
import { AccordionContextValue, AccordionItemContextValue } from "./types";

export const [AccordionContext, useAccordionContext] =
  createStrictContext<AccordionContextValue>(
    "AccordionItem must be used within AccordionRoot",
  );

export const [AccordionItemContext, useAccordionItemContext] =
  createStrictContext<AccordionItemContextValue>(
    "Component must be used within AccordionItem",
  );
