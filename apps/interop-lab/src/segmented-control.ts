// Plain HTML: SegmentedControl markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/segmented-control";

import { segmentedControlFixtureFromUrl, segmentedControlHtml } from "./segmented-control-fixture";

const fixture = segmentedControlFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = segmentedControlHtml(fixture);
