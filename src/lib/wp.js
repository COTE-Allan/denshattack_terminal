// wordpress graphql client, runs in the browser — every catalogue/detail page fetches live so the static build never goes stale

import { isRecent, youtubeId } from './format.js';

const ENDPOINT = import.meta.env.PUBLIC_WP_GRAPHQL_URL;

if (!ENDPOINT) {
  throw new Error(
    'PUBLIC_WP_GRAPHQL_URL is not set. Copy .env.example to .env and fill it in.'
  );
}

// rest api base, derived from the graphql endpoint (same host, different path)
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

  // graphql answers 200 even on errors, so this check is not optional
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

const TECHNIQUES = /* GraphQL */ `
  query AllTechniques {
    techniques(first: 500) {
      edges {
        node {
          id
          databaseId
          slug
          title
          modified
          techniqueData {
            description
            name
            youtubeLink
            variantOf {
              nodes {
                ... on Technique {
                  id
                  slug
                  techniqueData {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// strip tags, collapse whitespace — used for meta descriptions and previews
function plain(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// acf textarea fields are raw text with newlines, wysiwyg fields are html — normalise either way
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

// memoized per page load: several islands on the same page (catalog + search box, etc.) share one fetch
let skipsPromise = null;
export function getSkips() {
  return (skipsPromise ??= fetchSkips());
}

// flattens the graphql shape into plain objects the react island can filter without digging into nested fields
async function fetchSkips() {
  const data = await query(SKIPS);

  const skips = (data.skips?.nodes ?? []).map((n) => {
    const d = n.skipData ?? {};

    const title = (d.name || n.title || 'Untitled').trim(); // acf name wins over the wordpress post title
    const description = toHtml(d.description);
    const text = plain(d.description);

    return {
      id: n.id,
      slug: n.slug || String(n.databaseId), // fall back to the numeric id if there's no usable slug
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

  // group by level, then alphabetically inside each level
  return skips.sort(
    (a, b) =>
      a.level.localeCompare(b.level, 'fr', { numeric: true }) ||
      a.title.localeCompare(b.title, 'fr', { numeric: true })
  );
}

let stickersPromise = null;
export function getStickers() {
  return (stickersPromise ??= fetchStickers());
}

// flattens the graphql shape into plain objects the react island can filter without digging into nested fields
async function fetchStickers() {
  const data = await query(STICKERS);

  const stickers = (data.stickers?.edges ?? []).map(({ node: n }) => {
    const d = n.stickerData ?? {};

    // "tags" is one space-separated string, but handle an array too in case that field gets reconfigured
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

// flattens the graphql shape; each technique also collects the other techniques that point back at it via variantof (second pass, since that's not knowable from its own node)
let techniquesPromise = null;
export function getTechniques() {
  return (techniquesPromise ??= fetchTechniques());
}

async function fetchTechniques() {
  const data = await query(TECHNIQUES);

  const techniques = (data.techniques?.edges ?? []).map(({ node: n }) => {
    const d = n.techniqueData ?? {};

    const title = (d.name || n.title || 'Untitled').trim(); // acf name wins over the wordpress post title
    const description = toHtml(d.description);
    const text = plain(d.description);
    const parent = d.variantOf?.nodes?.[0]; // exposed as a connection, but the acf field only ever holds one post

    return {
      id: n.id,
      databaseId: n.databaseId, // plain wordpress post id, needed for the "variant of" field on submission
      slug: n.slug || String(n.databaseId), // fall back to the numeric id if there's no usable slug
      title,
      description,
      summary: truncate(text),
      youtubeLink: d.youtubeLink || '',
      variantOfId: parent?.id || null,
      variantOfSlug: parent?.slug || '',
      variantOfTitle: (parent?.techniqueData?.name || '').trim(),
      variants: [], // filled in below
      modified: n.modified,
    };
  });

  const byId = new Map(techniques.map((t) => [t.id, t]));
  for (const t of techniques) {
    if (!t.variantOfId) continue;
    const parent = byId.get(t.variantOfId);
    if (parent) parent.variants.push(t); // full data, so the parent's page can render it inline
  }

  return techniques.sort((a, b) => a.title.localeCompare(b.title, 'fr', { numeric: true }));
}

// distinct non-empty values of a scalar field, for the filter dropdowns
export function facet(items, key) {
  return [...new Set(items.map((i) => i[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr', { numeric: true })
  );
}

// a curated handful of sticker tags: recent ones first, topped up with the all-time most-used
const FEATURED_TAG_RECENT_DAYS = 30;
const MAX_FEATURED_TAGS = 12;

export function featuredStickerTags(stickers) {
  const tagCounts = new Map();
  for (const s of stickers) {
    for (const tag of s.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const mostUsedTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const recentTags = [
    ...new Set(
      stickers
        .filter((s) => isRecent(s.modified, FEATURED_TAG_RECENT_DAYS))
        .flatMap((s) => s.tags)
    ),
  ];

  return [...new Set([...recentTags, ...mostUsedTags])]
    .slice(0, MAX_FEATURED_TAGS)
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
}

function youtubeThumb(url) {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

// every skip/technique/sticker flattened into one shape, for search and "what's new"
export async function getAllContent() {
  const [skips, techniques, stickers] = await Promise.all([
    getSkips(),
    getTechniques(),
    getStickers(),
  ]);

  const skipItems = skips.map((s) => ({
    type: 'skip',
    href: `/skips/${s.slug}/`,
    title: s.title,
    summary: s.summary,
    mediaSrc: youtubeThumb(s.youtubeLink),
    modified: s.modified,
  }));

  const techniqueItems = techniques
    .filter((t) => !t.variantOfId) // variants show inline on their parent's page, not as their own entry
    .map((t) => ({
      type: 'technique',
      href: `/techniques/${t.slug}/`,
      title: t.title,
      summary: t.summary,
      mediaSrc: youtubeThumb(t.youtubeLink),
      modified: t.modified,
    }));

  const stickerItems = stickers.map((s) => ({
    type: 'sticker',
    href: `/stickers/${s.slug}/`,
    title: s.title,
    summary: s.artist ? `By ${s.artist}` : '',
    mediaSrc: s.screenshot || s.image || '',
    modified: s.modified,
  }));

  return [...skipItems, ...techniqueItems, ...stickerItems];
}
