// Plain HTML: Collapsible markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/collapsible";

import { collapsibleFixtureFromUrl, collapsibleHtml } from "./collapsible-fixture";

(document.getElementById("app") as HTMLElement).innerHTML = collapsibleHtml(collapsibleFixtureFromUrl());
