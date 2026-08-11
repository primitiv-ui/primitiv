import { createStrictContext } from "../utils/index.ts";
import { TableExpandableContextValue } from "./types";

export const [TableExpandableContext, useTableExpandableContext] =
  createStrictContext<TableExpandableContextValue>(
    "Table.ExpandTrigger and Table.DetailRow must be rendered inside a <Table.Expandable>.",
  );
