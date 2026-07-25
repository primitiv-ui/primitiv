import { NavigationMenu } from "@primitiv-ui/react";
import { useState } from "react";

import "./NavigationMenuExample.css";

const Chevron = () => (
  <svg
    className="nm-example__chevron"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const conceptLinks = [
  { href: "/tokens", label: "Tokens" },
  { href: "/themes", label: "Themes" },
  { href: "/density", label: "Density" },
];

const registryLinks = [
  { href: "/cli", label: "The CLI" },
  { href: "/components", label: "Registry components" },
];

export function NavigationMenuExample() {
  const [active, setActive] = useState("/tokens");
  const [controlled, setControlled] = useState("");

  return (
    <div className="nm-example">
      <h2 className="nm-example__title">Navigation Menu</h2>

      <p className="nm-example__note">
        Hover a trigger to open after the intent delay, then cross to a sibling
        — switching is instant. Arrow keys move between top-level entries,
        ArrowDown enters a panel, Escape closes and returns focus.
      </p>

      <section className="nm-example__section">
        <h3 className="nm-example__subtitle">
          Horizontal, shared viewport + indicator
        </h3>

        <NavigationMenu.Root className="nm">
          <NavigationMenu.List className="nm__list">
            <NavigationMenu.Item className="nm__item" value="concepts">
              <NavigationMenu.Trigger className="nm__trigger">
                Concepts
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content">
                {conceptLinks.map((link) => (
                  <NavigationMenu.Link
                    key={link.href}
                    className="nm__link"
                    href={link.href}
                    active={active === link.href}
                    onClick={(event) => {
                      event.preventDefault();
                      setActive(link.href);
                    }}
                  >
                    {link.label}
                  </NavigationMenu.Link>
                ))}
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item className="nm__item" value="registry">
              <NavigationMenu.Trigger className="nm__trigger">
                Registry &amp; CLI
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content">
                {registryLinks.map((link) => (
                  <NavigationMenu.Link
                    key={link.href}
                    className="nm__link"
                    href={link.href}
                    active={active === link.href}
                    onClick={(event) => {
                      event.preventDefault();
                      setActive(link.href);
                    }}
                  >
                    {link.label}
                  </NavigationMenu.Link>
                ))}
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item className="nm__item">
              <NavigationMenu.Link
                className="nm__trigger nm__trigger--link"
                href="/changelog"
                active={active === "/changelog"}
                onClick={(event) => {
                  event.preventDefault();
                  setActive("/changelog");
                }}
              >
                Changelog
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Indicator className="nm__indicator" />
          <NavigationMenu.Viewport className="nm__viewport" />
        </NavigationMenu.Root>

        <p className="nm-example__readout">
          Active link: <code>{active}</code>
        </p>
      </section>

      <section className="nm-example__section">
        <h3 className="nm-example__subtitle">asChild indicator — an arrow</h3>

        <NavigationMenu.Root className="nm nm--arrow">
          <NavigationMenu.List className="nm__list">
            <NavigationMenu.Item className="nm__item" value="one">
              <NavigationMenu.Trigger className="nm__trigger">
                Products
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content">
                <NavigationMenu.Link className="nm__link" href="/a">
                  Overview
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item className="nm__item" value="two">
              <NavigationMenu.Trigger className="nm__trigger">
                Pricing
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content">
                <NavigationMenu.Link className="nm__link" href="/b">
                  Plans
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>

          <NavigationMenu.Indicator asChild>
            <svg
              className="nm__arrow"
              viewBox="0 0 10 6"
              width="14"
              height="8"
              aria-hidden="true"
            >
              <polygon points="0,6 5,0 10,6" fill="currentColor" />
            </svg>
          </NavigationMenu.Indicator>
          <NavigationMenu.Viewport className="nm__viewport" />
        </NavigationMenu.Root>
      </section>

      <section className="nm-example__section">
        <h3 className="nm-example__subtitle">
          Vertical rail, click-only, no viewport
        </h3>

        <NavigationMenu.Root
          className="nm nm--vertical"
          orientation="vertical"
          openOnHover={false}
        >
          <NavigationMenu.List className="nm__list">
            <NavigationMenu.Item className="nm__item" value="start">
              <NavigationMenu.Trigger className="nm__trigger">
                Start Here
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content nm__content--inline">
                <NavigationMenu.Link className="nm__link" href="/install">
                  Install
                </NavigationMenu.Link>
                <NavigationMenu.Link className="nm__link" href="/first-theme">
                  Your first theme
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item className="nm__item" value="recipes">
              <NavigationMenu.Trigger className="nm__trigger">
                Recipes
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content nm__content--inline">
                <NavigationMenu.Link className="nm__link" href="/dark-mode">
                  Dark mode
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>
      </section>

      <section className="nm-example__section">
        <h3 className="nm-example__subtitle">Controlled</h3>

        <div className="nm-example__controls">
          <button
            type="button"
            className="nm-example__button"
            onClick={() => setControlled("docs")}
          >
            Open Docs
          </button>
          <button
            type="button"
            className="nm-example__button"
            onClick={() => setControlled("")}
          >
            Close
          </button>
        </div>

        <NavigationMenu.Root
          className="nm"
          value={controlled}
          onValueChange={setControlled}
        >
          <NavigationMenu.List className="nm__list">
            <NavigationMenu.Item className="nm__item" value="docs">
              <NavigationMenu.Trigger className="nm__trigger">
                Docs
                <Chevron />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="nm__content nm__content--inline">
                <NavigationMenu.Link className="nm__link" href="/guides">
                  Guides
                </NavigationMenu.Link>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <p className="nm-example__readout">
          Open value: <code>{controlled === "" ? '"" (closed)' : controlled}</code>
        </p>
      </section>
    </div>
  );
}
