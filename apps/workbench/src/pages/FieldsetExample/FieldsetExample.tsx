import { Fieldset } from "@primitiv/react";

import "./FieldsetExample.scss";

export function FieldsetExample() {
  return (
    <div className="fs-example">
      <h2 className="fs-example__title">Fieldset</h2>

      <section className="fs-example__section">
        <h3 className="fs-example__section-title">Default</h3>
        <p className="fs-example__description">
          A <code>{`<fieldset>`}</code> grouping related controls, named by
          its <code>{`<legend>`}</code>.
        </p>
        <Fieldset.Root className="fs-example__group">
          <Fieldset.Legend className="fs-example__legend">
            Notifications
          </Fieldset.Legend>
          <label className="fs-example__option">
            <input type="checkbox" name="email" defaultChecked /> Email
          </label>
          <label className="fs-example__option">
            <input type="checkbox" name="sms" /> SMS
          </label>
          <label className="fs-example__option">
            <input type="checkbox" name="push" /> Push
          </label>
        </Fieldset.Root>
      </section>

      <section className="fs-example__section">
        <h3 className="fs-example__section-title">Disabled</h3>
        <p className="fs-example__description">
          A disabled fieldset disables every control nested inside it.
        </p>
        <Fieldset.Root className="fs-example__group" disabled>
          <Fieldset.Legend className="fs-example__legend">Plan</Fieldset.Legend>
          <label className="fs-example__option">
            <input type="radio" name="plan" value="free" defaultChecked /> Free
          </label>
          <label className="fs-example__option">
            <input type="radio" name="plan" value="pro" /> Pro
          </label>
        </Fieldset.Root>
      </section>
    </div>
  );
}
