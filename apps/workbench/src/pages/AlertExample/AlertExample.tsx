import { useState } from "react";

import { Alert } from "@primitiv-ui/react";

import "./AlertExample.css";

export function AlertExample() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="alert-example">
      <h2 className="alert-example__title">Alert</h2>

      <section className="alert-example__section">
        <h3 className="alert-example__section-title">Assertive live region</h3>
        <p className="alert-example__description">
          Rendered conditionally so screen readers announce it on appearance.
        </p>
        <div className="alert-example__row">
          <button
            className="alert-example__button"
            onClick={() => setError("Your changes could not be saved.")}
          >
            Trigger error
          </button>
          <button
            className="alert-example__button"
            onClick={() => setError(null)}
          >
            Clear
          </button>
        </div>
        {error && <Alert className="alert-example__alert">{error}</Alert>}
      </section>

      <section className="alert-example__section">
        <h3 className="alert-example__section-title">asChild</h3>
        <p className="alert-example__description">
          Applies <code>role="alert"</code> to a semantic element.
        </p>
        <Alert asChild>
          <section className="alert-example__alert">
            Upload failed — please try again.
          </section>
        </Alert>
      </section>
    </div>
  );
}
