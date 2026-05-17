import { Routes, Route, Link } from "react-router-dom";

import { ColorEngine } from "./ColorEngine";
import {
  AccordionExample,
  BreadcrumbExample,
  CarouselExample,
  CheckboxCardExample,
  CollapsibleExample,
  DropdownExample,
  MillerColumnsExample,
  ModalExample,
  ProgressExample,
  RadioCardExample,
  SliderExample,
  SwitchExample,
  ToggleExample,
  ToggleGroupExample,
  TooltipExample,
} from "./pages";

import "./App.scss";

function App() {
  return (
    <>
      <header>
        <nav>
          <Link to="/">Color Engine</Link>
          <Link to="/accordion">Accordion</Link>
          <Link to="/breadcrumb">Breadcrumb</Link>
          <Link to="/carousel">Carousel</Link>
          <Link to="/checkbox-card">Checkbox Card</Link>
          <Link to="/collapsible">Collapsible</Link>
          <Link to="/dropdown">Dropdown</Link>
          <Link to="/miller-columns">Miller Columns</Link>
          <Link to="/modal">Modal</Link>
          <Link to="/progress">Progress</Link>
          <Link to="/radio-card">Radio Card</Link>
          <Link to="/slider">Slider</Link>
          <Link to="/switch">Switch</Link>
          <Link to="/toggle">Toggle</Link>
          <Link to="/toggle-group">Toggle Group</Link>
          <Link to="/tooltip">Tooltip</Link>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ColorEngine />} />
          <Route path="/accordion" element={<AccordionExample />} />
          <Route path="/breadcrumb" element={<BreadcrumbExample />} />
          <Route
            path="/checkbox-card"
            element={<CheckboxCardExample />}
          />
          <Route path="/carousel" element={<CarouselExample />} />
          <Route path="/collapsible" element={<CollapsibleExample />} />
          <Route path="/dropdown" element={<DropdownExample />} />
          <Route
            path="/miller-columns"
            element={<MillerColumnsExample />}
          />
          <Route path="/modal" element={<ModalExample />} />
          <Route path="/progress" element={<ProgressExample />} />
          <Route path="/radio-card" element={<RadioCardExample />} />
          <Route path="/slider" element={<SliderExample />} />
          <Route path="/switch" element={<SwitchExample />} />
          <Route path="/toggle" element={<ToggleExample />} />
          <Route path="/toggle-group" element={<ToggleGroupExample />} />
          <Route path="/tooltip" element={<TooltipExample />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
