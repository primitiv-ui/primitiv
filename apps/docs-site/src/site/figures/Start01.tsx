"use client";

import { useId } from "react";

import "./figure-chrome.css";
import "./route-figures.css";

/**
 * START-01 — three ways in, side by side.
 *
 * Each route opens with the question a reader is actually asking, resolves to a
 * path name, and ends in the one thing you would type. **Three parallel columns,
 * not a flowchart**: the brief is explicit that these are alternatives rather
 * than steps, and an arrow between them would say the opposite. The caption is
 * the other half of that — you can change your mind.
 *
 * Built against the frame `START-01 — desktop`, which stays the design record
 * (plan §6.0.29).
 *
 * The third route's chip carries PROSE, not mono, and that is deliberate: that
 * route has no terminal command, and changing the type tells the truth about
 * the difference rather than inventing a command to keep the columns matching
 * (§6.0.8). The `mono` flag is what carries it.
 */
const ROUTES = [
  {
    question: "Already styled?",
    name: "Headless",
    action: "npm i @primitiv-ui/react",
    mono: true,
  },
  {
    question: "Want it to look finished?",
    name: "Styled",
    action: "primitiv add button",
    mono: true,
  },
  {
    question: "Designing, not building?",
    name: "Figma",
    action: "Open the Figma library",
    mono: false,
  },
] as const;

const Route = ({ route }: { route: (typeof ROUTES)[number] }) => {
  const id = useId();
  return (
    <li className="docs-figure__panel docs-route" aria-labelledby={id}>
      <p className="docs-figure__note">{route.question}</p>
      <p className="docs-figure__heading" id={id}>
        {route.name}
      </p>
      <p className={route.mono ? "docs-figure__chip" : "docs-figure__chip docs-route__prose"}>
        {route.action}
      </p>
    </li>
  );
};

export const Start01 = () => (
  <figure className="docs-figure">
    <ul className="docs-route__row" aria-label="Three ways in">
      {ROUTES.map((route) => (
        <Route key={route.name} route={route} />
      ))}
    </ul>
    <figcaption className="docs-figure__caption">
      You can change your mind — most teams end up using two.
    </figcaption>
  </figure>
);
