import "./jsdom";
import { runMillerColumnsConformance } from "@primitiv-ui/conformance";

import { defineMillerColumns } from "../elements";
import { millerColumnsHtml } from "./miller-columns.fixtures";

runMillerColumnsConformance(async (fixture) => {
  defineMillerColumns();
  document.body.innerHTML = millerColumnsHtml({
    ...fixture,
    preview: fixture.preview ? "" : undefined,
    resize: fixture.resize ? ' min-width="120" max-width="400" step="10"' : undefined,
  });
  await Promise.resolve();
  return () => document.body.replaceChildren();
});
