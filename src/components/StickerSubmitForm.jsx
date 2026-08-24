import { useStickers } from '../lib/useContent.js';
import { facet } from '../lib/wp.js';
import SubmitForm from './SubmitForm.jsx';

export default function StickerSubmitForm({ endpoint }) {
  const { data: stickers } = useStickers();

  // suggests artist names already used by other stickers, so the same person doesn't end up spelled three different ways
  const artistNames = stickers ? facet(stickers, 'artist') : [];

  const fields = [
    { name: 'name', label: 'Sticker name', required: true, maxLength: 120 },
    { name: 'artist', label: 'Artist', required: true, maxLength: 80, suggestions: artistNames },
    { name: 'tags', label: 'Tags (comma-separated)', maxLength: 200 },
    { name: 'stickerImage', label: 'Sticker image', type: 'file', required: true },
    { name: 'screenshot', label: 'In-game screenshot', type: 'file' },
  ];

  return <SubmitForm endpoint={endpoint} submitLabel="Add sticker" fields={fields} />;
}
