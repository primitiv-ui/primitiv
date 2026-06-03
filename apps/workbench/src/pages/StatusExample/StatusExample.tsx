import { useState } from "react";

import { Status } from "@primitiv/react";

import "./StatusExample.css";

export function StatusExample() {
  const [count, setCount] = useState(0);

  return (
    <div className="status-example">
      <h2 className="status-example__title">Status</h2>

      <section className="status-example__section">
        <h3 className="status-example__section-title">Polite live region</h3>
        <p className="status-example__description">
          The message updates in place; screen readers announce it politely.
        </p>
        <button
          className="status-example__button"
          onClick={() => setCount((c) => c + 1)}
        >
          Add to cart
        </button>
        <Status className="status-example__status">
          {count} {count === 1 ? "item" : "items"} in your cart
        </Status>
      </section>

      <section className="status-example__section">
        <h3 className="status-example__section-title">asChild</h3>
        <p className="status-example__description">
          Applies <code>role="status"</code> to a native <code>output</code>.
        </p>
        <Status asChild>
          <output className="status-example__status">All changes saved.</output>
        </Status>
      </section>
    </div>
  );
}
