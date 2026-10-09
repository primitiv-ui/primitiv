/*
 * A schema.org JSON-LD block. A SERVER component: route files render it beside
 * their client page, so the structured data is in the static HTML a crawler
 * fetches and never ships to the client as a component.
 *
 * `<` is escaped because the payload is raw script text — a description holding
 * `</script>` would otherwise end the block early. This is the escaping Next's
 * JSON-LD guide recommends; it leaves the JSON's meaning unchanged.
 */
export function JsonLd({ data }: { readonly data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
