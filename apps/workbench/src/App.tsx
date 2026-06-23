import { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

import { ColorEngine } from "./ColorEngine";
import {
  AccessibleIconExample,
  AccordionExample,
  AlertExample,
  AvatarExample,
  BreadcrumbExample,
  ButtonExample,
  CarouselExample,
  CheckboxExample,
  CheckboxCardExample,
  CollapsibleExample,
  ContextMenuExample,
  DesignSystemTestExample,
  DirectionProviderExample,
  DividerExample,
  DropdownExample,
  EmptyStateExample,
  FieldExample,
  FieldsetExample,
  InputExample,
  InputGroupExample,
  MillerColumnsExample,
  ModalExample,
  PluginFrameExample,
  PortalExample,
  ProgressExample,
  RadioExample,
  RadioCardExample,
  RadioGroupExample,
  SelectExample,
  SkipNavExample,
  SliderExample,
  StatusExample,
  SwitchExample,
  TableExample,
  TabsExample,
  TextareaExample,
  ToggleExample,
  ToggleGroupExample,
  TooltipExample,
  TreeExample,
  VisuallyHiddenExample,
} from "./pages";

import "./App.css";

type NavLink = { to: string; label: string };

const navGroups: { title: string; links: NavLink[] }[] = [
  { title: "Layout", links: [{ to: "/divider", label: "Divider" }] },
  { title: "Buttons", links: [{ to: "/button", label: "Button" }] },
  {
    title: "Forms",
    links: [
      { to: "/checkbox", label: "Checkbox" },
      { to: "/checkbox-card", label: "Checkbox Card" },
      { to: "/field", label: "Field" },
      { to: "/fieldset", label: "Fieldset" },
      { to: "/input", label: "Input" },
      { to: "/input-group", label: "Input Group" },
      { to: "/radio", label: "Radio" },
      { to: "/radio-group", label: "Radio Group" },
      { to: "/radio-card", label: "Radio Card" },
      { to: "/select", label: "Select" },
      { to: "/slider", label: "Slider" },
      { to: "/switch", label: "Switch" },
      { to: "/textarea", label: "Textarea" },
    ],
  },
  {
    title: "Collections & Selection",
    links: [
      { to: "/miller-columns", label: "Miller Columns" },
      { to: "/tree", label: "Tree" },
    ],
  },
  {
    title: "Overlays",
    links: [
      { to: "/context-menu", label: "Context Menu" },
      { to: "/dropdown", label: "Dropdown" },
      { to: "/modal", label: "Modal" },
      { to: "/tooltip", label: "Tooltip" },
    ],
  },
  {
    title: "Disclosure",
    links: [
      { to: "/accordion", label: "Accordion" },
      { to: "/breadcrumb", label: "Breadcrumb" },
      { to: "/carousel", label: "Carousel" },
      { to: "/collapsible", label: "Collapsible" },
      { to: "/tabs", label: "Tabs" },
    ],
  },
  {
    title: "Navigation",
    links: [
      { to: "/toggle", label: "Toggle" },
      { to: "/toggle-group", label: "Toggle Group" },
    ],
  },
  {
    title: "Feedback & Status",
    links: [
      { to: "/alert", label: "Alert" },
      { to: "/empty-state", label: "Empty State" },
      { to: "/progress", label: "Progress" },
      { to: "/status", label: "Status" },
    ],
  },
  {
    title: "Data Display",
    links: [
      { to: "/avatar", label: "Avatar" },
      { to: "/table", label: "Table" },
    ],
  },
  {
    title: "Utilities",
    links: [
      { to: "/accessible-icon", label: "Accessible Icon" },
      { to: "/direction-provider", label: "Direction Provider" },
      { to: "/portal", label: "Portal" },
      { to: "/skip-nav", label: "Skip Nav" },
      { to: "/visually-hidden", label: "Visually Hidden" },
    ],
  },
  {
    title: "Showcase",
    links: [
      { to: "/design-system-test", label: "Design System Test" },
      { to: "/plugin-frame", label: "Plugin Frame" },
    ],
  },
];

function App() {
  const location = useLocation();
  const isDesignSystemShowcasePage =
    location.pathname === "/design-system-test";
  const containerClasses = isDesignSystemShowcasePage
    ? "container container--full-width"
    : "container";

  // On mobile the sidebar collapses into a slide-in drawer. Close it whenever
  // the route changes so a tap on a link doesn't leave the menu hanging open.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <header className="app-topbar">
        <button
          type="button"
          className="app-topbar__menu-button"
          aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMenuOpen}
          aria-controls="workbench-sidebar"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="app-topbar__menu-icon" aria-hidden="true" />
          Menu
        </button>
        <Link className="app-topbar__title" to="/">
          Primitiv Workbench
        </Link>
      </header>
      {isMenuOpen && (
        <button
          type="button"
          className="app-backdrop"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <aside
        id="workbench-sidebar"
        className={isMenuOpen ? "sidebar sidebar--open" : "sidebar"}
      >
        <Link className="sidebar__home" to="/">
          Color Engine
        </Link>
        {navGroups.map((group) => (
          <div className="sidebar__group" key={group.title}>
            <h2 className="sidebar__group-title">{group.title}</h2>
            <ul className="sidebar__links">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link className="sidebar__link" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <main className={containerClasses}>
        <Routes>
          <Route path="/" element={<ColorEngine />} />
          <Route
            path="/accessible-icon"
            element={<AccessibleIconExample />}
          />
          <Route path="/accordion" element={<AccordionExample />} />
          <Route path="/alert" element={<AlertExample />} />
          <Route path="/avatar" element={<AvatarExample />} />
          <Route path="/breadcrumb" element={<BreadcrumbExample />} />
          <Route path="/button" element={<ButtonExample />} />
          <Route path="/carousel" element={<CarouselExample />} />
          <Route path="/checkbox" element={<CheckboxExample />} />
          <Route path="/checkbox-card" element={<CheckboxCardExample />} />
          <Route path="/collapsible" element={<CollapsibleExample />} />
          <Route path="/context-menu" element={<ContextMenuExample />} />
          <Route
            path="/design-system-test"
            element={<DesignSystemTestExample />}
          />
          <Route
            path="/direction-provider"
            element={<DirectionProviderExample />}
          />
          <Route path="/divider" element={<DividerExample />} />
          <Route path="/dropdown" element={<DropdownExample />} />
          <Route path="/empty-state" element={<EmptyStateExample />} />
          <Route path="/field" element={<FieldExample />} />
          <Route path="/fieldset" element={<FieldsetExample />} />
          <Route path="/input" element={<InputExample />} />
          <Route path="/input-group" element={<InputGroupExample />} />
          <Route path="/miller-columns" element={<MillerColumnsExample />} />
          <Route path="/modal" element={<ModalExample />} />
          <Route path="/plugin-frame" element={<PluginFrameExample />} />
          <Route path="/portal" element={<PortalExample />} />
          <Route path="/progress" element={<ProgressExample />} />
          <Route path="/radio" element={<RadioExample />} />
          <Route path="/radio-card" element={<RadioCardExample />} />
          <Route path="/radio-group" element={<RadioGroupExample />} />
          <Route path="/select" element={<SelectExample />} />
          <Route path="/skip-nav" element={<SkipNavExample />} />
          <Route path="/slider" element={<SliderExample />} />
          <Route path="/status" element={<StatusExample />} />
          <Route path="/switch" element={<SwitchExample />} />
          <Route path="/table" element={<TableExample />} />
          <Route path="/tabs" element={<TabsExample />} />
          <Route path="/textarea" element={<TextareaExample />} />
          <Route path="/toggle" element={<ToggleExample />} />
          <Route path="/toggle-group" element={<ToggleGroupExample />} />
          <Route path="/tooltip" element={<TooltipExample />} />
          <Route path="/tree" element={<TreeExample />} />
          <Route
            path="/visually-hidden"
            element={<VisuallyHiddenExample />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
