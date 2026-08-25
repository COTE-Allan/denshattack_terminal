import { useMemo } from 'react';
import TRAINS from '../data/trains.json';
import { useSkips, useTechniques } from '../lib/useContent.js';
import { facet } from '../lib/wp.js';
import SubmitForm from './SubmitForm.jsx';

const LEVELS = [
  '1-1-1 Hot Ramen Delivery',
  '1-1-2 There’s A Trick To It',
  '1-2-1 Adventure Awaits!',
  '1-3-1 Seaside Showdown',
  '1-4-1 Keep the Balance!',
  '1-4-2 Riding the Tides',
  '1-5-1 Glow Up!',
  '1-6-1 8 Million Roads',
  '1-6-2 Trick Terminal',
  '1-7-B Fashion Overdrive',
  '2-1-1 Wallriding Coast',
  '2-1-2 Raiders of the Dead Ball',
  '2-1-R Proving Grounds',
  '2-2-1 Healthy Vandalism',
  '2-2-2 Strength Is Absolute',
  '2-3-B Knock It Out Of The Park',
  '3-1-1 Light, Fire, Destruction!',
  '3-1-2 Rock Around the Tunnel',
  '3-1-3 A Land of Castles',
  '3-2-1 Welcome to the Jungle',
  '3-2-2 Shin’s Testgrounds',
  '3-3-1 Cursed Track',
  '3-3-R Rolling Circuit',
  '3-4-B Rockabilly Moving Castle',
  '4-1-1 Splash Wave',
  '4-1-2 Less Talk. More Denshattack.',
  '4-1-3 The Tower of Endurance',
  '4-2-B Grand Slam',
  '5-1-1 A Castle In The Sky',
  '5-1-2 Into Tarantula Territory',
  '5-2-1 Mountains Ablaze',
  '5-2-2 Ready to Rumble',
  '5-3-1 A Legend in the Making',
  '5-4-1 Winds of Hope',
  '5-5-1 The Phantom Wind Pilgrimage',
  '5-5-R Tarantula Racing Course',
  '5-6-1 Nara Is For The People!',
  '5-7-B 100 Train Battle',
  '6-1-1 Riot Academy',
  '6-2-1 Beware the Dog',
  '6-3-1 A Long And Winding Road',
  '6-3-2 It’s All About The Money',
  '6-4-1 Breakout Brigade',
  '6-5-R Forbidden Speedway',
  '6-6-1 The Fuji Escape',
  '6-7-1 Forgotten Snowfields',
  '6-8-1 Alpine Adventure',
  '6-9-B The Wretchhound',
  '7-1-1 Lie Low, Drift Hard!',
  '7-2-1 Meet and Greet',
  '7-3-1 The Yamanote Dare',
  '7-3-2 Kaiju Attack!',
  '7-4-1 The Dream Will Not Die!',
  '7-4-2 Who’s Afraid of Monsters?',
  '7-5-1 Showstopper',
  '7-6-R Gothic Race Ring',
  '7-7-B Rainbow Hero',
  '8-1-1 Land of the Loyal',
  '8-2-1 Tradition Above All',
  '8-3-R Success Starland',
  '8-3-2 Protection Run',
  '8-4-1 Open the Floodgates!',
  '8-5-1 Frontal Assault',
  '8-6-B Nebuta Crash',
  '9-1-1 The Last Frontier',
  '9-1-B 10 Seconds to Revolution',
  '9-2-B To the Moon',
];

export default function SkipSubmitForm({ endpoint }) {
  const { data: techniques, loading } = useTechniques();
  const { data: skips, loading: loadingSkips } = useSkips();

  // suggests names already used by other skips, so the same finder doesn't end up spelled three different ways
  const foundByNames = skips ? facet(skips, 'foundBy') : [];

  // only base skips are offered as a parent — a variant of a variant would be a confusing third level
  const baseSkips = useMemo(() => (skips ? skips.filter((s) => !s.variantOfId) : []), [skips]);

  const fields = [
    { name: 'name', label: 'Skip name', required: true, maxLength: 120 },
    {
      name: 'variantOf',
      label: loadingSkips ? 'Variant of (optional, loading…)' : 'Variant of (optional)',
      type: 'select',
      options: baseSkips.map((s) => ({ value: String(s.databaseId), label: s.title })),
      // picking a base skip carries over its level/difficulty/train as a starting point (still editable), and
      // defaults time save to 0 seconds, since a variant's value is a bonus on top of the base's, not a total
      onLinkedChange: (value, next) => {
        const parent = baseSkips.find((s) => String(s.databaseId) === value);
        if (!parent) return null;
        return {
          level: parent.level || '',
          difficulty: parent.difficulty || '',
          trainNeeded: parent.trainNeeded || '',
          // only a default: an already-typed bonus (e.g. after switching parents) is left alone
          timesave: next.timesave === '' ? '0' : next.timesave,
        };
      },
    },
    {
      name: 'level',
      label: 'Level',
      type: 'select',
      options: LEVELS,
      required: true,
    },
    {
      name: 'difficulty',
      label: 'Difficulty',
      type: 'select',
      options: ['1', '2', '3', '4', '5', '6'],
      required: true,
    },
    {
      name: 'timesave',
      label: (values) =>
        values.variantOf
          ? 'Bonus time save vs. the base skip, in seconds (0 if none)'
          : 'Time save (seconds)',
      type: 'number',
      required: true,
    },
    { name: 'youtubeLink', label: 'YouTube link', type: 'url', required: true },
    { name: 'foundBy', label: 'Found by', required: true, maxLength: 80, suggestions: foundByNames },
    { name: 'trainNeeded', label: 'Train needed (optional)', type: 'select', options: TRAINS },
    { name: 'trainRequired', label: 'Required (not just recommended)', type: 'checkbox' },
    { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 2000 },
    {
      name: 'techniqueUsed',
      label: loading ? 'Techniques used (optional, loading…)' : 'Techniques used (optional)',
      type: 'multiselect',
      options: (techniques || []).map((t) => ({ value: String(t.databaseId), label: t.title })),
    },
  ];

  return <SubmitForm endpoint={endpoint} submitLabel="Add skip" fields={fields} />;
}
