import { useMemo } from 'react';
import { useTechniques } from '../lib/useContent.js';
import SubmitForm from './SubmitForm.jsx';

export default function TechniqueSubmitForm({ endpoint }) {
  const { data: allTechniques, loading } = useTechniques();

  // only base techniques are offered as a parent — a variant of a variant would be a confusing third level
  const baseTechniques = useMemo(
    () => (allTechniques ? allTechniques.filter((t) => !t.variantOfId) : []),
    [allTechniques]
  );

  const fields = [
    { name: 'name', label: 'Technique name', required: true, maxLength: 120 },
    {
      name: 'variantOf',
      label: loading ? 'Variant of (optional, loading…)' : 'Variant of (optional)',
      type: 'select',
      options: baseTechniques.map((t) => ({ value: String(t.databaseId), label: t.title })),
    },
    { name: 'youtubeLink', label: 'YouTube link', type: 'url', required: true },
    { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000 },
  ];

  return <SubmitForm endpoint={endpoint} submitLabel="Add technique" fields={fields} />;
}
