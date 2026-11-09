// The markup `primitiv add tabs`, `add accordion` and `add collapsible` printed, pasted into the page as a consumer
// would, then the elements defined over it (the lab's stand-in for the CDN
// script, so it runs from workspace source).
import accordion from "../styled-site/accordion.example.html?raw";
import collapsible from "../styled-site/collapsible.example.html?raw";
import tabs from "../styled-site/tabs.example.html?raw";

(document.getElementById("app") as HTMLElement).innerHTML = tabs + accordion + collapsible;
await import("@primitiv-ui/web/define");
