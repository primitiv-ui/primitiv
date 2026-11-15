// The markup `primitiv add tabs`, `add accordion`, `add collapsible`, `add modal`, `add confirm-dialog`, `add drawer`, `add popover`, `add tooltip`, `add dropdown`, `add context-menu`, `add toggle-group`, `add segmented-control`, `add radio-card`, `add checkbox-card`, `add slider`, `add breadcrumb-overflow`, `add split-button`, `add listbox`, `add select`, `add combobox`, `add navigation-menu`, `add tree`, `add stepper`, `add miller-columns` and `add data-table` printed, pasted into the page as a consumer
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
import toggleGroup from "../styled-site/toggle-group.example.html?raw";
import segmentedControl from "../styled-site/segmented-control.example.html?raw";
import radioCard from "../styled-site/radio-card.example.html?raw";
import checkboxCard from "../styled-site/checkbox-card.example.html?raw";
import slider from "../styled-site/slider.example.html?raw";
import breadcrumbOverflow from "../styled-site/breadcrumb-overflow.example.html?raw";
import splitButton from "../styled-site/split-button.example.html?raw";
import tooltip from "../styled-site/tooltip.example.html?raw";
import listbox from "../styled-site/listbox.example.html?raw";
import select from "../styled-site/select.example.html?raw";
import combobox from "../styled-site/combobox.example.html?raw";
import navigationMenu from "../styled-site/navigation-menu.example.html?raw";
import tree from "../styled-site/tree.example.html?raw";
import stepper from "../styled-site/stepper.example.html?raw";
import millerColumns from "../styled-site/miller-columns.example.html?raw";
import dataTable from "../styled-site/data-table.example.html?raw";

(document.getElementById("app") as HTMLElement).innerHTML = tabs + accordion + collapsible + modal + confirmDialog + drawer + popover + tooltip + dropdown + contextMenu + toggleGroup + segmentedControl + radioCard + checkboxCard + slider + breadcrumbOverflow + splitButton + listbox + select + combobox + navigationMenu + tree + stepper + millerColumns + dataTable;
await import("@primitiv-ui/web/define");
