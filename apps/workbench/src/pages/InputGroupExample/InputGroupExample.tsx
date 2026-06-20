import { useState } from "react";

import { Close, Eye, EyeOff, Mail, Search } from "@primitiv-ui/icons";
import { Input, InputGroup, RadioGroup } from "@primitiv-ui/react";

import "./InputGroupExample.css";
// The canonical per-component default themes straight from the registry — the
// same bytes `primitiv add input-group` / `add input` copy into a consumer repo
// (RFC 0006 §7). InputGroup owns the frame and neutralises the nested
// `.primitiv-input`, so both stylesheets are needed; they resolve against the
// app-level Primitiv token layer (imported once in main.tsx).
import "../../../../../registry/components/input-group/styles.css";
import "../../../../../registry/components/input/styles.css";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;

export function InputGroupExample() {
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [size, setSize] = useState("md");

  return (
    <div className="ig-example">
      <h2 className="ig-example__title">InputGroup</h2>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="ig-example__description">
          The headless <code>InputGroup</code> with the registry{" "}
          <code>.primitiv-input-group</code> classes applied. The group owns the
          frame — the nested <code>.primitiv-input</code> surrenders its own
          border and padding — and the frame reacts to the control&rsquo;s state
          with <code>:focus-within</code> and <code>:has()</code>.
        </p>

        <div className="ig-example__stack">
          <span className="ig-example__caption">plain frame</span>
          <InputGroup className="primitiv-input-group primitiv-input-group--md">
            <Input
              className="primitiv-input"
              aria-label="Plain framed input"
              placeholder="Just a framed input"
            />
          </InputGroup>

          <span className="ig-example__caption">leading icon</span>
          <InputGroup className="primitiv-input-group primitiv-input-group--md">
            <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
              <Search aria-hidden="true" />
            </InputGroup.LeadingAdornment>
            <Input
              className="primitiv-input"
              type="search"
              aria-label="Search documentation"
              placeholder="Search documentation"
            />
          </InputGroup>

          <span className="ig-example__caption">invalid</span>
          <InputGroup className="primitiv-input-group primitiv-input-group--md">
            <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
              <Mail aria-hidden="true" />
            </InputGroup.LeadingAdornment>
            <Input
              className="primitiv-input"
              type="email"
              aria-label="Invalid email"
              defaultValue="not-an-email"
              aria-invalid
            />
          </InputGroup>

          <span className="ig-example__caption">disabled</span>
          <InputGroup className="primitiv-input-group primitiv-input-group--md">
            <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
              <Mail aria-hidden="true" />
            </InputGroup.LeadingAdornment>
            <Input
              className="primitiv-input"
              type="email"
              aria-label="Locked email"
              defaultValue="ada@example.com"
              disabled
            />
          </InputGroup>
        </div>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Size</h3>
        <p className="ig-example__description">
          The <code>size</code> modifier re-points the frame&rsquo;s{" "}
          <code>framed-control/*</code> anatomy — height, padding, radius, gap,
          and the adornment icon size — at the chosen slot.
        </p>
        <div className="ig-example__stack">
          {SIZES.map((slot) => (
            <div key={slot} className="ig-example__sized">
              <span className="ig-example__caption">{slot}</span>
              <InputGroup
                className={`primitiv-input-group primitiv-input-group--${slot}`}
              >
                <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
                  <Search aria-hidden="true" />
                </InputGroup.LeadingAdornment>
                <Input
                  className="primitiv-input"
                  type="search"
                  aria-label={`Search ${slot}`}
                  placeholder={slot}
                />
              </InputGroup>
            </div>
          ))}
        </div>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Density</h3>
        <p className="ig-example__description">
          The same contract-styled group under each <code>data-density</code>{" "}
          scope. Density is ambient — the <code>framed-control/*</code> and{" "}
          <code>body/*</code> tokens resolve to the matching scale (RFC 0009).
          Pick a size to rescale them all.
        </p>

        <RadioGroup.Root
          className="ig-example__sizes"
          value={size}
          onValueChange={setSize}
          aria-label="InputGroup size"
        >
          {SIZES.map((slot) => (
            <RadioGroup.Item
              key={slot}
              className="ig-example__size-option"
              value={slot}
            >
              <span className="ig-example__size-ring">
                <RadioGroup.Indicator
                  className="ig-example__size-dot"
                  forceMount
                />
              </span>
              {slot}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>

        {DENSITIES.map((density) => (
          <div
            key={density}
            data-density={density}
            className="ig-example__density"
          >
            <span className="ig-example__density-label">{density}</span>
            <InputGroup
              className={`primitiv-input-group primitiv-input-group--${size}`}
            >
              <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
                <Search aria-hidden="true" />
              </InputGroup.LeadingAdornment>
              <Input
                className="primitiv-input"
                type="search"
                aria-label={`Search ${density} ${size}`}
                placeholder={`${density} ${size}`}
              />
            </InputGroup>
          </div>
        ))}
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">
          Leading icon + trailing clear button
        </h3>
        <p className="ig-example__description">
          The trailing slot renders <code>asChild</code> as a{" "}
          <code>{`<button>`}</code> — focusable, keyboard-activatable, and
          announced via its <code>aria-label</code>. It only shows when the
          input has a value.
        </p>
        <InputGroup className="primitiv-input-group primitiv-input-group--md">
          <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
            <Search aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="primitiv-input"
            type="search"
            aria-label="Search with clear button"
            placeholder="Type to enable the clear button…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.length > 0 && (
            <InputGroup.TrailingAdornment
              asChild
              className="primitiv-input-group__trailing"
            >
              <button
                type="button"
                className="ig-example__icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <Close aria-hidden="true" />
              </button>
            </InputGroup.TrailingAdornment>
          )}
        </InputGroup>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Password reveal toggle</h3>
        <p className="ig-example__description">
          The trailing button toggles the input&rsquo;s <code>type</code>{" "}
          between <code>password</code> and <code>text</code>, swapping the icon
          to match. Standard pattern for password-reveal UX.
        </p>
        <InputGroup className="primitiv-input-group primitiv-input-group--md">
          <InputGroup.LeadingAdornment className="primitiv-input-group__leading">
            <Mail aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="primitiv-input"
            type={showPassword ? "text" : "password"}
            aria-label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <InputGroup.TrailingAdornment
            asChild
            className="primitiv-input-group__trailing"
          >
            <button
              type="button"
              className="ig-example__icon-button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? (
                <Eye aria-hidden="true" />
              ) : (
                <EyeOff aria-hidden="true" />
              )}
            </button>
          </InputGroup.TrailingAdornment>
        </InputGroup>
      </section>
    </div>
  );
}
