// Plain HTML: Tree markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/tree";

import { treeFixtureFromUrl, treeHtml } from "./tree-fixture";

const fixture = treeFixtureFromUrl();
(document.getElementById("app") as HTMLElement).innerHTML =
  `<div${fixture.rtl ? ' dir="rtl"' : ""}>${treeHtml(fixture)}</div>` + `<button type="button" id="outside">Outside</button>`;
