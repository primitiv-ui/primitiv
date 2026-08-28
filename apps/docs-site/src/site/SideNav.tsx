"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ChevronRight } from "@primitiv-ui/icons";
import { Collapsible } from "@primitiv-ui/react";

import { List } from "@/components/list";

import { NAV, type NavSection } from "@/lib/nav";
import { samePage, samePath } from "@/lib/path";

import "./side-nav.css";

const sectionContains = (section: NavSection, pathname: string): boolean =>
  (section.href !== undefined && samePath(section.href, pathname)) ||
  section.children.some((c) => samePage(c.href, pathname));

const Section = ({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) => {
  // Sections containing the current page start open; everything else starts
  // closed, so a 50-component list doesn't dump every entry on arrival.
  // Controlled, so the chevron's label can read the open state and the fill
  // class below can key off it.
  const [open, setOpen] = useState(() => sectionContains(section, pathname));

  // The one section whose list can outgrow the rail is the grouped one
  // (Components). When it is open it becomes the rail's flexible, scrolling
  // region — see `.docs-nav-section--fill` in side-nav.css. A plain or closed
  // section stays natural height and never scrolls.
  const fill = open && Boolean(section.groups);

  const links = (items: readonly { title: string; href: string }[]) => (
    <List marker={false} size="sm" className="docs-nav-links">
      {items.map((child) => (
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
  );

  return (
    <li className={fill ? "docs-nav-section docs-nav-section--fill" : "docs-nav-section"}>
      <Collapsible.Root
        className="docs-nav-collapsible"
        open={open}
        onOpenChange={setOpen}
      >
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

          {/* A real button (aria-expanded/aria-controls wired by Collapsible),
              separate from the section link: the label navigates, the chevron
              toggles. Just the glyph — the section is already named by the link
              or span beside it, so the aria-label carries the section name for
              the icon-only control. */}
          <Collapsible.Trigger
            className="docs-nav-disclosure"
            aria-label={`${open ? "Collapse" : "Expand"} ${section.title}`}
          >
            <ChevronRight
              className="docs-nav-chevron"
              size="100%"
              aria-hidden="true"
            />
          </Collapsible.Trigger>
        </div>

        {/* forceMount so the panel is always in the DOM and can animate its
            grid-row collapse (side-nav.css). Closed + force-mounted, Collapsible
            sets aria-hidden, so a collapsed section's links stay out of the
            accessibility tree. The inner clip is the `overflow: hidden` grid
            item the row track collapses; the Components scroll region lives
            inside it. */}
        <Collapsible.Content forceMount className="docs-nav-content">
          <div className="docs-nav-content-inner">
            {section.groups ? (
              <div className="docs-nav-groups">
                {section.groups.map((group) => (
                  <div className="docs-nav-group" key={group.title}>
                    <h3 className="docs-nav-group-title">{group.title}</h3>
                    {links(group.links)}
                  </div>
                ))}
              </div>
            ) : (
              links(section.children)
            )}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </li>
  );
};

export const SideNav = () => {
  const pathname = usePathname();

  return (
    <nav className="docs-side-nav" aria-label="Documentation">
      {/* A plain list of sections — each section is a headless Collapsible, so
          the disclosure animates and carries its own ARIA. Not a registry
          `List`: the fill/scroll region (Components) needs the section `<li>` to
          be a flex column, which fought `List.Item`'s flex-row anatomy. */}
      <ul className="docs-nav-sections">
        {NAV.map((section) => (
          <Section key={section.title} section={section} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
};
