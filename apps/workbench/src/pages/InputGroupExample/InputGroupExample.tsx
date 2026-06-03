import { useState } from "react";

import { Close, Eye, EyeOff, Mail, Search } from "@primitiv/icons";
import { Input, InputGroup } from "@primitiv/react";

import "./InputGroupExample.css";

export function InputGroupExample() {
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="ig-example">
      <h2 className="ig-example__title">InputGroup</h2>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Plain frame</h3>
        <p className="ig-example__description">
          The wrapper works without any adornments — useful as a consistent
          frame even when a particular input has no leading or trailing
          decoration.
        </p>
        <InputGroup className="ig-example__group">
          <Input
            className="ig-example__input"
            aria-label="Plain framed input"
            placeholder="Just a framed input"
          />
        </InputGroup>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Leading decorative icon</h3>
        <p className="ig-example__description">
          A search icon at the start of the frame. <code>aria-hidden</code> on
          the icon keeps it out of the accessibility tree.
        </p>
        <InputGroup className="ig-example__group">
          <InputGroup.LeadingAdornment className="ig-example__icon">
            <Search size={18} aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="ig-example__input"
            type="search"
            aria-label="Search documentation"
            placeholder="Search documentation"
          />
        </InputGroup>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">
          Leading icon + trailing clear button
        </h3>
        <p className="ig-example__description">
          The trailing slot renders <code>asChild</code> as a{" "}
          <code>{`<button>`}</code> — focusable, keyboard-activatable, and
          announced by screen readers via its <code>aria-label</code>. It only
          shows when the input has a value.
        </p>
        <InputGroup className="ig-example__group">
          <InputGroup.LeadingAdornment className="ig-example__icon">
            <Search size={18} aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="ig-example__input"
            type="search"
            aria-label="Search with clear button"
            placeholder="Type to enable the clear button…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search.length > 0 && (
            <InputGroup.TrailingAdornment asChild>
              <button
                type="button"
                className="ig-example__icon-button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <Close size={16} aria-hidden="true" />
              </button>
            </InputGroup.TrailingAdornment>
          )}
        </InputGroup>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">
          Password reveal toggle
        </h3>
        <p className="ig-example__description">
          The trailing button toggles the input's <code>type</code> between{" "}
          <code>password</code> and <code>text</code>, swapping the icon to
          match. Standard pattern for password-reveal UX.
        </p>
        <InputGroup className="ig-example__group">
          <InputGroup.LeadingAdornment className="ig-example__icon">
            <Mail size={18} aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="ig-example__input"
            type={showPassword ? "text" : "password"}
            aria-label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <InputGroup.TrailingAdornment asChild>
            <button
              type="button"
              className="ig-example__icon-button"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? (
                <Eye size={16} aria-hidden="true" />
              ) : (
                <EyeOff size={16} aria-hidden="true" />
              )}
            </button>
          </InputGroup.TrailingAdornment>
        </InputGroup>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Disabled frame</h3>
        <p className="ig-example__description">
          The frame's disabled styling is driven by{" "}
          <code>:has(input:disabled)</code> in CSS — no <code>disabled</code>{" "}
          prop on <code>InputGroup</code> itself.
        </p>
        <InputGroup className="ig-example__group">
          <InputGroup.LeadingAdornment className="ig-example__icon">
            <Mail size={18} aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="ig-example__input"
            type="email"
            aria-label="Locked email"
            defaultValue="ada@example.com"
            disabled
          />
        </InputGroup>
      </section>

      <section className="ig-example__section">
        <h3 className="ig-example__section-title">Invalid frame</h3>
        <p className="ig-example__description">
          Same trick: <code>:has(input[aria-invalid="true"])</code> tints the
          frame border red. The state lives on the <code>Input</code>, the
          frame just reacts.
        </p>
        <InputGroup className="ig-example__group">
          <InputGroup.LeadingAdornment className="ig-example__icon">
            <Mail size={18} aria-hidden="true" />
          </InputGroup.LeadingAdornment>
          <Input
            className="ig-example__input"
            type="email"
            aria-label="Invalid email"
            defaultValue="not-an-email"
            aria-invalid
          />
        </InputGroup>
      </section>
    </div>
  );
}
