import "./ElevationExample.css";

/** The semantic depth hierarchy (RFC 0017 §1) — the role tokens a consumer
 * applies, ordered by ascending depth. */
const roles: { token: string; name: string; purpose: string }[] = [
  { token: "--primitiv-elevation-flat", name: "flat", purpose: "Flush with the surface — the ground plane." },
  { token: "--primitiv-elevation-raised", name: "raised", purpose: "Cards, raised buttons, the Switch thumb." },
  { token: "--primitiv-elevation-overlay", name: "overlay", purpose: "Dropdowns, selects, popovers, tooltips." },
  { token: "--primitiv-elevation-floating", name: "floating", purpose: "Drawers, side sheets, date pickers." },
  { token: "--primitiv-elevation-modal", name: "modal", purpose: "Dialogs, command palettes — top of the stack." },
];

/** The raw primitive ramp (RFC 0017 §2) — the building blocks the roles alias. */
const ramp: { token: string; size: string }[] = [
  { token: "--primitiv-shadow-1", size: "xs" },
  { token: "--primitiv-shadow-2", size: "sm" },
  { token: "--primitiv-shadow-3", size: "md" },
  { token: "--primitiv-shadow-4", size: "lg" },
  { token: "--primitiv-shadow-5", size: "xl" },
];

/**
 * Elevation specimen — every rung of the shadow scale on a light surface, for
 * browser QA against smoothshadows.com (RFC 0017 §6). The cards carry the
 * box-shadow inline so each surfaces its own token without per-card CSS.
 */
export function ElevationExample() {
  return (
    <div className="elev-example">
      <h2 className="elev-example__title">Elevation</h2>

      <section className="elev-example__section">
        <h3 className="elev-example__section-title">Semantic roles</h3>
        <p className="elev-example__description">
          The depth hierarchy — pick a level by what the element is, not by its
          blur. This is the interface a consumer reaches for.
        </p>
        <div className="elev-example__grid">
          {roles.map((role) => (
            <div
              key={role.name}
              className="elev-example__card"
              style={{ boxShadow: `var(${role.token})` }}
            >
              <span className="elev-example__card-name">elevation-{role.name}</span>
              <span className="elev-example__card-purpose">{role.purpose}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="elev-example__section">
        <h3 className="elev-example__section-title">Primitive ramp</h3>
        <p className="elev-example__description">
          The raw layered box-shadows the roles alias — available directly for
          one-offs (e.g. the Switch thumb uses shadow-1).
        </p>
        <div className="elev-example__grid">
          {ramp.map((step) => (
            <div
              key={step.token}
              className="elev-example__card"
              style={{ boxShadow: `var(${step.token})` }}
            >
              <span className="elev-example__card-name">{step.token.replace("--primitiv-", "")}</span>
              <span className="elev-example__card-purpose">{step.size}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
