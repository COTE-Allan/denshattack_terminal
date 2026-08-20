/**
 * WordPress GraphQL client.
 *
 * Everything here runs at BUILD time only. Nothing in this file ships to the
 * browser, so the CMS URL never appears in the bundle.
 *
 * Field group: skipData
 * Fields:      name, description, level, difficulty, timesave, youtubeLink,
 *              foundBy
 *
 * Field group: stickerData
 * Fields:      name, artist, tags, stickerImage, screenshot
 */

const ENDPOINT = import.meta.env.WP_GRAPHQL_URL;

if (!ENDPOINT) {
  throw new Error(
    'WP_GRAPHQL_URL is not set. Copy .env.example to .env and fill it in.'
  );
}

/**
 * The WordPress REST API base, derived from the GraphQL endpoint (same
 * host, different path). Used only in `.astro` frontmatter to build a
 * public submission endpoint URL that then gets passed as a plain prop
 * into a client island. This module itself must never be imported from a
 * `.jsx` file (see file header).
 */
export function restBase() {
  return ENDPOINT.replace(/\/graphql\/?$/, '/wp-json');
}

async function query(document, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: document, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  // GraphQL answers 200 even on errors, so this check is not optional.
  if (json.errors?.length) {
    throw new Error(
      'GraphQL errors:\n' + json.errors.map((e) => `  - ${e.message}`).join('\n')
    );
  }

  return json.data;
}

const SKIPS = /* GraphQL */ `
  query AllSkips {
    skips(first: 500) {
      nodes {
        id
        databaseId
        slug
        title
        modified
        skipData {
          name
          description
          level
          difficulty
          timesave
          youtubeLink
          foundBy
        }
      }
    }
  }
`;

const STICKERS = /* GraphQL */ `
  query AllStickers {
    stickers(first: 500) {
      edges {
        node {
          id
          databaseId
          slug
          title
          modified
          stickerData {
            tags
            name
            artist
            stickerImage {
              node {
                id
                sourceUrl
                altText
                mediaDetails {
                  height
                  width
                }
                srcSet
                sizes
              }
            }
            screenshot {
              node {
                id
                sourceUrl
                altText
                mediaDetails {
                  height
                  width
                }
                srcSet
                sizes
              }
            }
          }
        }
      }
    }
  }
`;

/** Strip tags, collapse whitespace. Used for meta descriptions and previews. */
function plain(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ACF textarea fields arrive as raw text with newlines; WYSIWYG fields arrive
 * as HTML. Detect which one we got and normalise to renderable HTML either way.
 */
function toHtml(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('<')) return raw;

  return raw
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function truncate(text, max = 180) {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)) + '…';
}

/**
 * Flatten the GraphQL shape into plain objects the React island can filter
 * over without digging through nested fields on every keystroke.
 */
export async function getSkips() {
  const data = await query(SKIPS);

  const skips = (data.skips?.nodes ?? []).map((n) => {
    const d = n.skipData ?? {};

    // The ACF name field wins over the WordPress post title.
    const title = (d.name || n.title || 'Untitled').trim();
    const description = toHtml(d.description);
    const text = plain(d.description);

    return {
      id: n.id,
      // Fall back to the numeric id if a post has no usable slug.
      slug: n.slug || String(n.databaseId),
      title,
      description,
      summary: truncate(text),
      level: d.level == null || d.level === '' ? '' : String(d.level),
      difficulty:
        d.difficulty == null || d.difficulty === '' ? '' : String(d.difficulty),
      timesave: d.timesave == null || d.timesave === '' ? null : Number(d.timesave),
      youtubeLink: d.youtubeLink || '',
      foundBy: (d.foundBy || '').trim(),
      modified: n.modified,
    };
  });

  // Group by level, then alphabetically inside each level.
  return skips.sort(
    (a, b) =>
      a.level.localeCompare(b.level, 'fr', { numeric: true }) ||
      a.title.localeCompare(b.title, 'fr', { numeric: true })
  );
}

/**
 * Flatten the GraphQL shape into plain objects the React island can filter
 * over without digging through nested fields on every keystroke.
 */
export async function getStickers() {
  const data = await query(STICKERS);

  const stickers = (data.stickers?.edges ?? []).map(({ node: n }) => {
    const d = n.stickerData ?? {};

    // The "tags" ACF field is one space-separated string (e.g. "meme
    // harambe flowery"), no commas, but handle a repeater (array) too in
    // case that field ever gets reconfigured.
    const tags = Array.isArray(d.tags)
      ? d.tags.filter(Boolean).map(String)
      : String(d.tags || '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);

    return {
      id: n.id,
      slug: n.slug || String(n.databaseId),
      title: (d.name || n.title || 'Untitled').trim(),
      artist: (d.artist || '').trim(),
      tags,
      image: d.stickerImage?.node?.sourceUrl || '',
      imageAlt: d.stickerImage?.node?.altText || '',
      screenshot: d.screenshot?.node?.sourceUrl || '',
      screenshotAlt: d.screenshot?.node?.altText || '',
      modified: n.modified,
    };
  });

  return stickers.sort((a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }));
}

/** Distinct non-empty values of a scalar field, for the filter dropdowns. */
export function facet(items, key) {
  return [...new Set(items.map((i) => i[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr', { numeric: true })
  );
}
