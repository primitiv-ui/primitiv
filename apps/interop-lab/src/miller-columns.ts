// Plain HTML: Miller Columns markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/miller-columns";

import { millerColumnsFixtureFromUrl, millerColumnsHtml } from "./miller-columns-fixture";

(document.getElementById("app") as HTMLElement).innerHTML = millerColumnsHtml(millerColumnsFixtureFromUrl());
