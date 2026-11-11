// The markup `primitiv add tabs`, `add accordion`, `add collapsible`, `add modal`, `add confirm-dialog`, `add drawer`, `add popover`, `add tooltip`, `add dropdown` and `add context-menu` printed, pasted into the page as a consumer
// would, then the elements defined over it (the lab's stand-in for the CDN
// script, so it runs from workspace source).
import accordion from "../styled-site/accordion.example.html?raw";
import collapsible from "../styled-site/collapsible.example.html?raw";
import contextMenu from "../styled-site/context-menu.example.html?raw";
import confirmDialog from "../styled-site/confirm-dialog.example.html?raw";
import drawer from "../styled-site/drawer.example.html?raw";
import dropdown from "../styled-site/dropdown.example.html?raw";
import popover from "../styled-site/popover.example.html?raw";
import modal from "../styled-site/modal.example.html?raw";
import tabs from "../styled-site/tabs.example.html?raw";
import tooltip from "../styled-site/tooltip.example.html?raw";

(document.getElementById("app") as HTMLElement).innerHTML = tabs + accordion + collapsible + modal + confirmDialog + drawer + popover + tooltip + dropdown + contextMenu;
await import("@primitiv-ui/web/define");
