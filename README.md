# Speedrun catalogue: front

Astro + React island, statically built from WordPress via WPGraphQL.
No styling included: markup is semantic and every element carries a class name.

## Setup

```bash
npm install
cp .env.example .env      # then fill in WP_GRAPHQL_URL
npm run dev               # http://localhost:4321
```

## Build and deploy

```bash
npm run build             # outputs to dist/
```

Upload the **contents** of `dist/` into `public_html` on Hostinger,
not the `dist` folder itself.

## How it works

`src/lib/wp.js` queries WordPress at **build time only**. Nothing in that file
reaches the browser, so the CMS URL never appears in the bundle. Visitors hit
plain static HTML; WordPress is never in the request path.

The catalogue list is embedded in the page, and `Catalog.jsx` filters it in the
browser. Astro server-renders the island at build time, so the list is in the
HTML for search engines before hydration.

Content changes require a rebuild. That is what the `HL_DEPLOY_HOOK` block at
the bottom of `headless.php` is for.

## Adapting the ACF fields

The GraphQL query in `src/lib/wp.js` assumes a field group exposed as
`techniqueData` with: `difficulty`, `timeSave`, `videoUrl`, `inputWindow`,
`status`, `gameVersion`.

Yours will differ. Open **GraphQL > GraphiQL IDE** in wp-admin, build the query
there against your real field names, then paste it in. The docs panel on the
right lists everything your setup exposes.

## Files

```
src/
├── lib/wp.js                     GraphQL client + query   ← adapt this first
├── layouts/Base.astro            bare <html> shell        ← your CSS goes here
├── components/Catalog.jsx        search + filters (island)
└── pages/
    ├── index.astro               catalogue
    └── techniques/[slug].astro   one page per technique
```

## Gotchas

- **CORS in dev.** `headless.php` allows `http://localhost:4321`. Astro picks a
  different port if 4321 is taken, so check the port it prints and keep the two
  in sync.
- **Nothing comes back.** Almost always a missing `show_in_graphql` on a field
  group or post type, not a front-end problem. Test in GraphiQL first.
- **Build fails on a missing field.** Intentional. A silent empty catalogue is
  worse than a failed build.
