import { useEffect, useState } from "react";

import { Moon, Sun } from "@primitiv-ui/icons";

import { ToggleGroup, ToggleGroupItem, Divider, Switch } from "./components";
import "./chrome.css";

type Density = "dense" | "compact" | "comfortable" | "spacious";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * The density / size / theme controls from the kitchen-sink header, extracted as
 * a self-contained bar so any page (e.g. the Carousel examples) can drop it in
 * for the same live checks. Density and theme are applied on `<html>` so they
 * are ambient for every component below (and for portalled content like Modal).
 */
export function ChromeControls() {
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
