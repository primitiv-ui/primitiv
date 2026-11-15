import { runTreeConformance } from "@primitiv-ui/conformance";

import { defineTree } from "../elements";
import { treeHtml } from "./tree.fixtures";

runTreeConformance(async (fixture) => {
  defineTree();
  document.body.innerHTML = treeHtml(fixture);
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
