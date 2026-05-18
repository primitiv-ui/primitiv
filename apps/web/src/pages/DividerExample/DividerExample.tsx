import { Divider } from "@primitiv/react";

import "./DividerExample.scss";

export function DividerExample() {
  return (
    <div className="divider-example">
      <h2 className="divider-example__title">Divider</h2>

      <section className="divider-example__section">
        <h3 className="divider-example__section-title">
          Horizontal (semantic)
        </h3>
        <p className="divider-example__description">
          Separates two content groups; announced as a separator.
        </p>
        <p className="divider-example__text">First group of content.</p>
        <Divider className="divider-example__rule" />
        <p className="divider-example__text">Second group of content.</p>
      </section>

      <section className="divider-example__section">
        <h3 className="divider-example__section-title">Vertical</h3>
        <div className="divider-example__row">
          <span>Home</span>
          <Divider
            className="divider-example__rule divider-example__rule--vertical"
            orientation="vertical"
          />
          <span>About</span>
          <Divider
            className="divider-example__rule divider-example__rule--vertical"
            orientation="vertical"
          />
          <span>Contact</span>
        </div>
      </section>

      <section className="divider-example__section">
        <h3 className="divider-example__section-title">Decorative</h3>
        <p className="divider-example__description">
          <code>aria-hidden="true"</code> — purely visual, removed from the
          accessibility tree.
        </p>
        <Divider className="divider-example__rule" aria-hidden="true" />
      </section>
    </div>
  );
}
