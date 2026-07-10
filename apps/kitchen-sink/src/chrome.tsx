import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { Moon, Sun } from "@primitiv-ui/icons";

import { ToggleGroup, ToggleGroupItem, Divider, Switch } from "./components";
import "./chrome.css";

type Density = "dense" | "compact" | "comfortable" | "spacious";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface ChromeState {
  density: Density;
  setDensity: (density: Density) => void;
  size: Size;
  setSize: (size: Size) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
}

const ChromeContext = createContext<ChromeState | null>(null);

/**
 * Read the shared density / size / theme state. Density and theme are applied
 * ambiently on `<html>` by the provider; `size` is threaded as a prop by pages
 * that expose a component size axis (the kitchen-sink page). Must be called
 * under a {@link ChromeProvider}.
 */
export function useChrome(): ChromeState {
  const context = useContext(ChromeContext);
  if (!context) {
    throw new Error("useChrome must be used within a ChromeProvider");
  }
  return context;
}

/**
 * Owns the density / size / theme state for the whole app so a single header can
 * drive every route. Density and theme are applied on `<html>` (ambient for
 * every component below, and for portalled content like Modal); `size` is read
 * via {@link useChrome} where a page threads it as a prop.
 */
export function ChromeProvider({ children }: { children: ReactNode }) {
  const [density, setDensity] = useState<Density>("comfortable");
  const [size, setSize] = useState<Size>("md");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <ChromeContext.Provider
      value={{ density, setDensity, size, setSize, dark, setDark }}
    >
      {children}
    </ChromeContext.Provider>
  );
}

/**
 * The density / size / theme control bar. Presentational — it reads and writes
 * the shared state from {@link useChrome}, so a single instance mounted in the
 * app shell drives every route.
 */
export function ChromeControls() {
  const { density, setDensity, size, setSize, dark, setDark } = useChrome();

  return (
    <div className="ks-chrome" data-density="dense">
      <div className="ks-chrome__group">
        <span className="ks-chrome__label">Density</span>
        <ToggleGroup
          type="single"
          value={density}
          onValueChange={(value) => value && setDensity(value as Density)}
          aria-label="Density"
        >
          <ToggleGroupItem value="dense">Dense</ToggleGroupItem>
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Divider orientation="vertical" />

      <div className="ks-chrome__group">
        <span className="ks-chrome__label">Size</span>
        <ToggleGroup
          type="single"
          value={size}
          onValueChange={(value) => value && setSize(value as Size)}
          aria-label="Component size"
        >
          <ToggleGroupItem value="xs">XS</ToggleGroupItem>
          <ToggleGroupItem value="sm">SM</ToggleGroupItem>
          <ToggleGroupItem value="md">MD</ToggleGroupItem>
          <ToggleGroupItem value="lg">LG</ToggleGroupItem>
          <ToggleGroupItem value="xl">XL</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Divider orientation="vertical" />

      <div className="ks-chrome__group">
        {dark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        <Switch
          size="sm"
          checked={dark}
          onCheckedChange={setDark}
          aria-label="Dark mode"
        />
      </div>
    </div>
  );
}
