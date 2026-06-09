import type { ReactNode } from "react";

import { Tabs } from "@primitiv-ui/react";

import {
  AutoPlay,
  CoverFlow,
  MultiSlideCrossfade,
  MultiSlideScroll,
  MultiStepSlideCrossfade,
  MultiStepSlideScroll,
  Peek,
  Programmatic,
  SingleSlideCrossfade,
  SingleSlideScroll,
  Thumbnails,
  VariableSizes,
} from "./examples";
import "./CarouselExample.css";
import "./examples/carouselShared.css";

interface ExampleTab {
  value: string;
  label: string;
  render: () => ReactNode;
}

const TABS: ExampleTab[] = [
  {
    value: "single-slide-scroll",
    label: "Single · Slide",
    render: () => <SingleSlideScroll />,
  },
  {
    value: "single-slide-crossfade",
    label: "Single · Fade",
    render: () => <SingleSlideCrossfade />,
  },
  {
    value: "multi-slide-scroll",
    label: "Multi · Slide",
    render: () => <MultiSlideScroll />,
  },
  {
    value: "multi-slide-crossfade",
    label: "Multi · Fade",
    render: () => <MultiSlideCrossfade />,
  },
  {
    value: "multi-step-slide-scroll",
    label: "Multi · Step · Slide",
    render: () => <MultiStepSlideScroll />,
  },
  {
    value: "multi-step-slide-crossfade",
    label: "Multi · Step · Fade",
    render: () => <MultiStepSlideCrossfade />,
  },
  {
    value: "peek",
    label: "Peek",
    render: () => <Peek />,
  },
  {
    value: "variable-sizes",
    label: "Variable sizes",
    render: () => <VariableSizes />,
  },
  {
    value: "programmatic",
    label: "Programmatic",
    render: () => <Programmatic />,
  },
  {
    value: "cover-flow",
    label: "Cover Flow",
    render: () => <CoverFlow />,
  },
  {
    value: "autoplay",
    label: "Autoplay",
    render: () => <AutoPlay />,
  },
  {
    value: "thumbnails",
    label: "Thumbnails",
    render: () => <Thumbnails />,
  },
];

export function CarouselExample() {
  return (
    <div className="carousel-example">
      <Tabs.Root defaultValue={TABS[0].value} lazyMount>
        <Tabs.List
          className="carousel-example__tabs"
          label="Carousel examples"
        >
          {TABS.map(({ value, label }) => (
            <Tabs.Trigger
              key={value}
              className="carousel-example__tab"
              value={value}
            >
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map(({ value, render }) => (
          <Tabs.Content
            key={value}
            className="carousel-example__panel"
            value={value}
          >
            {render()}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
