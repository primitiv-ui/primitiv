// Plain HTML: an expandable table a server could have sent, plus one import.
import "@primitiv-ui/web/define/table";

import { tableFixtureFromUrl, tableHtml } from "./table-fixture";

(document.getElementById("app") as HTMLElement).innerHTML = tableHtml(tableFixtureFromUrl());
