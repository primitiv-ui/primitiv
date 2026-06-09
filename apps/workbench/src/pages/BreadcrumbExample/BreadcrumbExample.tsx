import { Fragment } from "react";

import { Breadcrumb } from "@primitiv-ui/react";

import "./BreadcrumbExample.css";

const CRUMBS = [
  { label: "Workspace", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Primitiv", href: "/projects/primitiv" },
];

export function BreadcrumbExample() {
  return (
    <div className="bc-example">
      <h2 className="bc-example__title">Breadcrumb</h2>

      <section className="bc-example__section">
        <h3 className="bc-example__section-title">Default</h3>
        <p className="bc-example__description">
          A <code>nav</code> landmark wrapping an ordered list. The last entry
          is the current page and is not a link.
        </p>
        <Breadcrumb.Root className="bc">
          <Breadcrumb.List className="bc__list">
            <Breadcrumb.Item className="bc__item">
              <Breadcrumb.Link className="bc__link" href="/">
                Home
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator className="bc__separator" />
            <Breadcrumb.Item className="bc__item">
              <Breadcrumb.Link className="bc__link" href="/components">
                Components
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Separator className="bc__separator" />
            <Breadcrumb.Item className="bc__item">
              <Breadcrumb.Page className="bc__page">Navigation</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </section>

      <section className="bc-example__section">
        <h3 className="bc-example__section-title">Custom separator</h3>
        <p className="bc-example__description">
          A data-driven trail with a chevron glyph passed to{" "}
          <code>Breadcrumb.Separator</code>.
        </p>
        <Breadcrumb.Root className="bc">
          <Breadcrumb.List className="bc__list">
            {CRUMBS.map((crumb) => (
              <Fragment key={crumb.href}>
                <Breadcrumb.Item className="bc__item">
                  <Breadcrumb.Link className="bc__link" href={crumb.href}>
                    {crumb.label}
                  </Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator className="bc__separator">
                  &rsaquo;
                </Breadcrumb.Separator>
              </Fragment>
            ))}
            <Breadcrumb.Item className="bc__item">
              <Breadcrumb.Page className="bc__page">Settings</Breadcrumb.Page>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </section>
    </div>
  );
}
