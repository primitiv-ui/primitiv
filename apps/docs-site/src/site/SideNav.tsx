"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ChevronRight } from "@primitiv-ui/icons";

import { List } from "@/components/list";

import { NAV, type NavSection } from "@/lib/nav";
import { samePage, samePath } from "@/lib/path";

import "./side-nav.css";

const sectionContains = (section: NavSection, pathname: string): boolean =>
  (section.href !== undefined && samePath(section.href, pathname)) ||
  section.children.some((c) => samePage(c.href, pathname));

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const Section = ({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) => {
  // Sections containing the current page start open; everything else starts
  // closed, so a 50-component list doesn't dump every entry on arrival.
  const [open, setOpen] = useState(() => sectionContains(section, pathname));
  const listId = `docs-nav-${slug(section.title)}`;

  return (
    <List.Item>
      <div className="docs-nav-section-header">
        {section.href ? (
          <Link
            className="docs-nav-section-title"
            href={section.href}
            aria-current={samePath(section.href, pathname) ? "page" : undefined}
          >
            {section.title}
          </Link>
        ) : (
          <span className="docs-nav-section-title">{section.title}</span>
        )}

        <button
          type="button"
          className="docs-nav-disclosure"
          aria-expanded={open}
          aria-controls={listId}
          /* The label must name the section: a page with five identical
             "Expand" buttons is unusable from a screen reader's element list. */
          aria-label={`${open ? "Collapse" : "Expand"} ${section.title}`}
          onClick={() => setOpen((o) => !o)}
        >
          {/*
           * Rendered with NO props, deliberately.
           *
           * `IconProps extends SVGProps<SVGSVGElement>` so `className` is valid
           * in principle — but `packages/icons` has no resolvable React types
           * in this workspace (no local node_modules, none at the root), so
           * under Next's build type-checker `SVGProps` degrades and `IconProps`
           * collapses to `{}`, rejecting every prop. Plain `tsc` resolves it
           * via this app's tsconfig `paths`; Next's checker does not.
           *
           * The rotation is therefore applied from the parent button in CSS
           * instead. No aria-hidden needed either: IconBase sets it
           * automatically unless an aria-label is passed, so the glyph is
           * already hidden and the button's own aria-label is the name.
           */}
          <ChevronRight />
        </button>
      </div>

      {open && (
        <List marker={false} size="sm" className="docs-nav-links" id={listId}>
          {section.children.map((child) => (
            <List.Item key={child.href}>
              <Link
                className="docs-nav-link"
                href={child.href}
                aria-current={samePath(child.href, pathname) ? "page" : undefined}
              >
                {child.title}
              </Link>
            </List.Item>
          ))}
        </List>
      )}
    </List.Item>
  );
};

export const SideNav = () => {
  const pathname = usePathname();

  return (
    <nav className="docs-side-nav" aria-label="Documentation">
      {/* Registry List, like the TOC and footer. `indent={false}` because the
          sections are flush to the rail; the nested link lists keep the default
          indent (re-pointed to 20px in CSS). */}
      <List marker={false} indent={false} size="sm" className="docs-nav-sections">
        {NAV.map((section) => (
          <Section key={section.title} section={section} pathname={pathname} />
        ))}
      </List>
    </nav>
  );
};
