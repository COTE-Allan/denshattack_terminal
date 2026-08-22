import { getAllContent } from '../lib/wp.js';

/**
 * Static JSON endpoint (built once, served as a plain file — same static
 * hosting as every other page here). Powers the header's quick-search
 * dropdown: fetched lazily on the visitor's first keystroke and cached by
 * the browser across page navigations, rather than embedding the whole
 * index inline in every page's HTML.
 */
export async function GET() {
  const items = await getAllContent();

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json' },
  });
}
