type JsonLdProps = {
  /** One schema.org node or an array of them. Serialized into a script tag. */
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Renders schema.org structured data. Search engines read JSON-LD from a
 * <script type="application/ld+json">; there is no React-safe alternative to
 * injecting the serialized JSON here.
 */
export const JsonLd = (props: JsonLdProps) => (
  <script
    type="application/ld+json"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be raw JSON in a script tag
    dangerouslySetInnerHTML={{ __html: JSON.stringify(props.data) }}
  />
);
