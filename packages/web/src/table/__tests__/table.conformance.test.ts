import { runTableExpandConformance } from "@primitiv-ui/conformance";

import { defineTable } from "../elements";
import { tableExpandHtml } from "./table.fixtures";

runTableExpandConformance(async (fixture) => {
  defineTable();
  document.body.innerHTML = tableExpandHtml(fixture);
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
