// Plain HTML: Tooltip markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/tooltip";

import { TOOLTIPS, tooltipFixtureFromUrl, tooltipHtml } from "./tooltip-fixture";

const { open } = tooltipFixtureFromUrl();
(document.getElementById("app") as HTMLElement).innerHTML =
  tooltipHtml({ open }, TOOLTIPS[0]) + " " + tooltipHtml({}, TOOLTIPS[1]);
