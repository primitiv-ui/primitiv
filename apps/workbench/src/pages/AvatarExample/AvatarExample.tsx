import { Avatar } from "@primitiv-ui/react";

import "./AvatarExample.css";

// An inline SVG portrait — guaranteed to load without a network request.
const portrait =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='128'%20height='128'%3E%3Crect%20width='128'%20height='128'%20fill='%234f46e5'/%3E%3Ccircle%20cx='64'%20cy='50'%20r='24'%20fill='%23fff'/%3E%3Ccircle%20cx='64'%20cy='128'%20r='42'%20fill='%23fff'/%3E%3C/svg%3E";

export function AvatarExample() {
  return (
    <div className="av-example">
      <h2 className="av-example__title">Avatar</h2>

      <section className="av-example__section">
        <h3 className="av-example__section-title">Loaded image</h3>
        <p className="av-example__description">
          The image loads successfully, so the fallback never appears.
        </p>
        <Avatar.Root className="av-avatar">
          <Avatar.Image
            className="av-avatar__image"
            src={portrait}
            alt="Ada Lovelace"
          />
          <Avatar.Fallback className="av-avatar__fallback">
            AL
          </Avatar.Fallback>
        </Avatar.Root>
      </section>

      <section className="av-example__section">
        <h3 className="av-example__section-title">Broken image</h3>
        <p className="av-example__description">
          The <code>src</code> fails to load, so the fallback initials show
          instead.
        </p>
        <Avatar.Root className="av-avatar">
          <Avatar.Image
            className="av-avatar__image"
            src="/this-image-does-not-exist.png"
            alt="Grace Hopper"
          />
          <Avatar.Fallback className="av-avatar__fallback">
            GH
          </Avatar.Fallback>
        </Avatar.Root>
      </section>

      <section className="av-example__section">
        <h3 className="av-example__section-title">Delayed fallback</h3>
        <p className="av-example__description">
          With <code>delayMs</code> the fallback is withheld briefly — long
          enough that a fast image load avoids a flash of initials.
        </p>
        <Avatar.Root className="av-avatar">
          <Avatar.Image
            className="av-avatar__image"
            src="/this-image-does-not-exist.png"
            alt="Katherine Johnson"
          />
          <Avatar.Fallback className="av-avatar__fallback" delayMs={600}>
            KJ
          </Avatar.Fallback>
        </Avatar.Root>
      </section>
    </div>
  );
}
