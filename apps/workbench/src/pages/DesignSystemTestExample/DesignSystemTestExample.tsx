import { useState } from "react";

import { Switch } from "@primitiv-ui/react";

import "./DesignSystemTestExample.css";

const NAV = [
  "Overview",
  "Analytics",
  "Reports",
  "Customers",
  "Invoices",
  "Settings",
];

const STATS = [
  { label: "Revenue", value: "$48,210", delta: "+12.4%" },
  { label: "Active users", value: "2,930", delta: "+3.1%" },
  { label: "Conversion", value: "4.7%", delta: "-0.6%" },
  { label: "Avg. session", value: "6m 12s", delta: "+0.9%" },
];

const ROWS = [
  { id: "#1042", name: "Acme Corp", plan: "Enterprise", status: "Active" },
  { id: "#1041", name: "Globex", plan: "Pro", status: "Pending" },
  { id: "#1040", name: "Initech", plan: "Pro", status: "Active" },
  { id: "#1039", name: "Umbrella", plan: "Starter", status: "Paused" },
  { id: "#1038", name: "Soylent", plan: "Enterprise", status: "Active" },
];

const CHART = [42, 68, 35, 80, 55, 73, 48, 90];

const TABS = ["Overview", "Activity", "Settings"];

const METERS = [
  { label: "Storage", value: 72 },
  { label: "Bandwidth", value: 45 },
  { label: "API quota", value: 88 },
];

export function DesignSystemTestExample() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState("Overview");

  return (
    <div className="ds-test" data-theme={theme}>
      <aside className="ds-test__sidebar">
        <div className="ds-test__brand">
          <span className="ds-test__brand-mark" />
          Harmoni
        </div>
        <nav className="ds-test__nav">
          {NAV.map((item, i) => (
            <a
              key={item}
              href="#ds-test"
              className={
                "ds-test__nav-item" +
                (i === 0 ? " ds-test__nav-item--active" : "")
              }
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="ds-test__sidebar-foot">
          <span className="ds-test__avatar ds-test__avatar--sm" />
          <span className="ds-test__sidebar-foot-text">
            Jordan Lee
            <small>Workspace admin</small>
          </span>
        </div>
      </aside>

      <main className="ds-test__main">
        <header className="ds-test__topbar">
          <h2 className="ds-test__page-title">
            Design System Color Test - Dashboard Example
          </h2>
          <input
            className="ds-test__search"
            type="search"
            placeholder="Search…"
          />
          <label className="ds-test__theme">
            <span className="ds-test__theme-label">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
            <Switch.Root
              className="ds-test__toggle"
              aria-label="Toggle dark mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            >
              <Switch.Thumb className="ds-test__toggle-thumb" />
            </Switch.Root>
          </label>
          <span className="ds-test__avatar" />
        </header>

        <section className="ds-test__stats">
          {STATS.map((s) => (
            <article key={s.label} className="ds-test__stat">
              <span className="ds-test__stat-label">{s.label}</span>
              <strong className="ds-test__stat-value">{s.value}</strong>
              <span
                className={
                  "ds-test__stat-delta" +
                  (s.delta.startsWith("-") ? " ds-test__stat-delta--down" : "")
                }
              >
                {s.delta}
              </span>
            </article>
          ))}
        </section>

        <section className="ds-test__grid">
          <article className="ds-test__panel">
            <div className="ds-test__panel-head">
              <h3 className="ds-test__panel-title">Customers</h3>
              <div className="ds-test__tabs">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={
                      "ds-test__tab" +
                      (t === tab ? " ds-test__tab--active" : "")
                    }
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <table className="ds-test__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.plan}</td>
                    <td>
                      <span
                        className={
                          "ds-test__badge ds-test__badge--" +
                          r.status.toLowerCase()
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="ds-test__panel">
            <div className="ds-test__panel-head">
              <h3 className="ds-test__panel-title">Weekly traffic</h3>
            </div>
            <div className="ds-test__chart">
              {CHART.map((v, i) => (
                <div
                  key={i}
                  className="ds-test__bar"
                  style={{ height: `${v}%` }}
                />
              ))}
            </div>
            <div className="ds-test__meters">
              {METERS.map((m) => (
                <div key={m.label} className="ds-test__meter">
                  <span className="ds-test__meter-label">
                    {m.label}
                    <span>{m.value}%</span>
                  </span>
                  <div className="ds-test__progress">
                    <div
                      className="ds-test__progress-fill"
                      style={{ width: `${m.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="ds-test__grid">
          <article className="ds-test__panel">
            <div className="ds-test__panel-head">
              <h3 className="ds-test__panel-title">Notifications</h3>
            </div>
            <div className="ds-test__alerts">
              <div className="ds-test__alert ds-test__alert--accent">
                <strong>Deployment complete.</strong> Build 4.7 is now live in
                production.
              </div>
              <div className="ds-test__alert">
                <strong>3 invoices</strong> are awaiting your approval this
                week.
              </div>
              <div className="ds-test__alert ds-test__alert--solid">
                <strong>Storage almost full.</strong> Free up space to keep
                backups running.
              </div>
            </div>
          </article>

          <article className="ds-test__panel">
            <div className="ds-test__panel-head">
              <h3 className="ds-test__panel-title">Quick settings</h3>
            </div>
            <form
              className="ds-test__form"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="ds-test__field">
                <span className="ds-test__label">Workspace name</span>
                <input className="ds-test__input" defaultValue="Harmoni Labs" />
              </label>
              <label className="ds-test__field">
                <span className="ds-test__label">Region</span>
                <select className="ds-test__select" defaultValue="eu">
                  <option value="eu">Europe (Frankfurt)</option>
                  <option value="us">US East (Virginia)</option>
                  <option value="ap">Asia Pacific (Tokyo)</option>
                </select>
              </label>
              <label className="ds-test__check">
                <input type="checkbox" defaultChecked />
                <span>Email me weekly summaries</span>
              </label>
              <label className="ds-test__check">
                <input type="checkbox" />
                <span>Enable beta features</span>
              </label>
              <div className="ds-test__field">
                <span className="ds-test__label">Volume</span>
                <input
                  className="ds-test__range"
                  type="range"
                  defaultValue={60}
                />
              </div>
            </form>
          </article>
        </section>

        <section className="ds-test__buttons">
          <button type="button" className="ds-test__btn ds-test__btn--primary">
            Primary
          </button>
          <button
            type="button"
            className="ds-test__btn ds-test__btn--secondary"
          >
            Secondary
          </button>
          <button type="button" className="ds-test__btn ds-test__btn--ghost">
            Ghost
          </button>
          <button
            type="button"
            className="ds-test__btn ds-test__btn--primary"
            disabled
          >
            Disabled
          </button>
          <span className="ds-test__badge ds-test__badge--active">New</span>
          <span className="ds-test__badge ds-test__badge--paused">Beta</span>
          <span className="ds-test__badge">Default</span>
        </section>

        <footer className="ds-test__footer">
          Palette experiment — every colour on this page derives from the
          generated Harmoni ramps.
        </footer>
      </main>
    </div>
  );
}
