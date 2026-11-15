// Plain HTML: code blocks a server could have sent, plus their imports.
import "@primitiv-ui/web/define/code-block";
import "@primitiv-ui/web/define/tabs";

import { codeBlockFixtureFromUrl, codeBlockHtml, preHtml, tabbedCodeBlockHtml } from "./code-block-fixture";

const fixture = codeBlockFixtureFromUrl();
(document.getElementById("app") as HTMLElement).innerHTML =
  codeBlockHtml(fixture) +
  (fixture.forId ? `<div id="${fixture.forId}">${preHtml("echo elsewhere")}</div>` : "") +
  tabbedCodeBlockHtml();
