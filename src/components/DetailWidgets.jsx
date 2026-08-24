import { Check } from 'lucide-react';
import { useState } from 'react';
import { useLearnedSkips } from '../lib/useLearned.js';

// react port of learnedtoggle.astro: same "denshattack:learned-skips" localstorage key, via the shared hook
export function LearnedToggle({ skipId }) {
  const { learned, loaded, toggle } = useLearnedSkips();

  if (!loaded) return null;

  const isLearned = learned.has(skipId);

  return (
    <button
      type="button"
      className={isLearned ? 'btn learned-toggle btn--learned' : 'btn learned-toggle'}
      onClick={() => toggle(skipId)}
      aria-pressed={isLearned}
    >
      <Check size={16} aria-hidden="true" />
      <span>{isLearned ? 'Learned' : 'Mark as learned'}</span>
    </button>
  );
}

// react port of copylinkbutton.astro
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard api can fail (permissions, insecure context) — no-op
    }
  }

  return (
    <button className="btn copy-link-btn" type="button" onClick={handleClick}>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}
