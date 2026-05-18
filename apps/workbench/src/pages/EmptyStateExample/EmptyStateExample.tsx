import { useState } from "react";

import { EmptyState } from "@primitiv/react";

import "./EmptyStateExample.scss";

const PROJECTS = ["Harmoni", "Primitiv", "Workbench", "Roadmap"];

export function EmptyStateExample() {
  const [query, setQuery] = useState("");

  const matches = PROJECTS.filter((project) =>
    project.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="empty-state-example">
      <h2 className="empty-state-example__title">Empty State</h2>

      <section className="empty-state-example__section">
        <h3 className="empty-state-example__section-title">
          Empty search results
        </h3>
        <p className="empty-state-example__description">
          Filter the list — when nothing matches, the empty state is
          rendered in its place and announced as a polite live region.
        </p>

        <input
          className="empty-state-example__input"
          type="search"
          placeholder="Filter projects"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        {matches.length > 0 ? (
          <ul className="empty-state-example__list">
            {matches.map((project) => (
              <li className="empty-state-example__item" key={project}>
                {project}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState.Root className="empty-state-example__empty">
            <EmptyState.Media className="empty-state-example__media">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="16.5"
                  y1="16.5"
                  x2="21"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </EmptyState.Media>
            <EmptyState.Title
              asChild
              className="empty-state-example__empty-title"
            >
              <h4>No projects found</h4>
            </EmptyState.Title>
            <EmptyState.Description className="empty-state-example__empty-text">
              No project matches “{query}”. Try a different search.
            </EmptyState.Description>
            <EmptyState.Actions className="empty-state-example__actions">
              <button
                className="empty-state-example__button"
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            </EmptyState.Actions>
          </EmptyState.Root>
        )}
      </section>
    </div>
  );
}
