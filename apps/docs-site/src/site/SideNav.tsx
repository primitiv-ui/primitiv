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

  // The one section whose list can outgrow the rail is the grouped one
  // (Components). When it is open it becomes the rail's flexible, scrolling
  // region — see `.docs-nav-section--fill` in side-nav.css. A plain or closed
  // section stays natural height and never scrolls.
  const fill = open && Boolean(section.groups);

  return (
    <List.Item className={fill ? "docs-nav-section--fill" : undefined}>
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
          {/* size="100%" fills the disclosure button rather than rendering at
              the icon's 24px default, which is 4px WIDER than the 20px button
              and poked 2px past the rail's edge — enough to trip the rail's
              overflow-x into a stray horizontal scrollbar. Same fill-the-wrapper
              pattern the Collapsible trigger icon uses. */}
          <ChevronRight className="docs-nav-chevron" size="100%" />
        </button>
      </div>

      {open &&
        (section.groups ? (
          /* Grouped by category — the same grouping the /components index uses,
             so a reader who learns one learns the other. Each category is its
             own list under its own heading rather than one long run: five pages
             today, sixty-three eventually, and by then a flat alphabetical list
             says nothing about what sits near what. */
          <div className="docs-nav-groups" id={listId}>
            {section.groups.map((group) => (
              <div className="docs-nav-group" key={group.title}>
                {/* A real heading, not a styled span: it names the list under
                    it, so the group is announced rather than being an indent a
                    screen-reader user cannot see. */}
                <h3 className="docs-nav-group-title">{group.title}</h3>
                <List marker={false} size="sm" className="docs-nav-links">
                  {group.links.map((child) => (
                    <List.Item key={child.href}>
                      <Link
                        className="docs-nav-link"
                        href={child.href}
                        aria-current={
                          samePath(child.href, pathname) ? "page" : undefined
                        }
                      >
                        {child.title}
                      </Link>
                    </List.Item>
                  ))}
                </List>
              </div>
            ))}
          </div>
        ) : (
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
        ))}
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
