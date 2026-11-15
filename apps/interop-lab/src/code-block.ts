// Plain HTML: code blocks a server could have sent, plus their imports.
import "@primitiv-ui/web/define/code-block";
import "@primitiv-ui/web/define/tabs";

import { codeBlockFixtureFromUrl, codeBlockHtml, highlightingBlockHtml, preHtml, tabbedCodeBlockHtml } from "./code-block-fixture";

const fixture = codeBlockFixtureFromUrl();
(document.getElementById("app") as HTMLElement).innerHTML =
  codeBlockHtml(fixture) +
  (fixture.forId ? `<div id="${fixture.forId}">${preHtml("echo elsewhere")}</div>` : "") +
  tabbedCodeBlockHtml() +
  // A page's own Prism-style block, which the element's Prism must leave alone.
  `<pre id="page-prism"><code class="language-css">a { color: red; }</code></pre>` +
  highlightingBlockHtml();
