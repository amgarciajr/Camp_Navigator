// Woods After Dark event layer
// Source: public Google Calendar theme-week/weekend blocks shared by the campground.
// These are all-day theme blocks, so the app maps them to suggested spots rather than claiming exact venues.

export const EVENTS = [
  { title: 'Woods Summer Heat 1 Weekend', start: '2026-06-26', end: '2026-06-29', location: 'The Woods Camping Resort' },
  { title: 'Woods Holiday Vacation Week', start: '2026-06-29', end: '2026-07-02', location: 'The Woods Camping Resort' },
  { title: 'Woods July 4th Weekend', start: '2026-07-02', end: '2026-07-06', location: 'The Woods Camping Resort' },
  { title: 'Woods Christmas in July Weekend', start: '2026-07-10', end: '2026-07-13', location: 'The Woods Camping Resort' },
  { title: 'Woods Country 2 / Leather 2 Weekend', start: '2026-07-17', end: '2026-07-20', location: 'The Woods Camping Resort' },
  { title: 'Woods Bear Week', start: '2026-07-20', end: '2026-07-24', location: 'The Woods Camping Resort' },
  { title: 'Woods Bears 2 Weekend', start: '2026-07-24', end: '2026-07-27', location: 'The Woods Camping Resort' },
  { title: 'Woods Summer Heat 2 Weekend', start: '2026-07-31', end: '2026-08-03', location: 'The Woods Camping Resort' },
  { title: 'Woods Off Season Holidays Weekend', start: '2026-08-07', end: '2026-08-10', location: 'The Woods Camping Resort' },
  { title: 'Woods Key West Weekend', start: '2026-08-14', end: '2026-08-17', location: 'The Woods Camping Resort' },
  { title: 'Woods Geeks and Gaymers Weekend', start: '2026-08-21', end: '2026-08-24', location: 'The Woods Camping Resort' },
  { title: 'Woods Operation Illumination Week', start: '2026-08-24', end: '2026-08-28', location: 'The Woods Camping Resort' },
  { title: 'Woods Illumination Weekend', start: '2026-08-28', end: '2026-08-31', location: 'The Woods Camping Resort' },
  { title: 'Woods Labor Day Weekend', start: '2026-09-04', end: '2026-09-08', location: 'The Woods Camping Resort' },
  { title: 'Woods Country 3 / Leather 3 Weekend', start: '2026-09-11', end: '2026-09-14', location: 'The Woods Camping Resort' },
  { title: 'Woods Bears 3 Weekend', start: '2026-09-18', end: '2026-09-21', location: 'The Woods Camping Resort' },
  { title: 'Woods Time Travel Weekend', start: '2026-09-25', end: '2026-09-28', location: 'The Woods Camping Resort' },
  { title: 'Woods Festival of Lights Weekend', start: '2026-10-02', end: '2026-10-05', location: 'The Woods Camping Resort' },
  { title: 'Woods Fall Flannel Fest Weekend', start: '2026-10-09', end: '2026-10-12', location: 'The Woods Camping Resort' },
  { title: 'Woods OktoBear Fest', start: '2026-10-16', end: '2026-10-19', location: 'The Woods Camping Resort' },
  { title: 'Woods Halloween Weekend', start: '2026-10-23', end: '2026-10-26', location: 'The Woods Camping Resort' },
];

export function eventProfileForTitle(title) {
  const name = String(title || '').toLowerCase();

  if (name.includes('christmas in july') || name.includes('illumination') || name.includes('festival of lights')) {
    return {
      type: 'campground-tour',
      badge: 'Decoration tour',
      note: 'Big site-decoration energy. Touring the campground is encouraged — admire the sparkle, respect sites, and keep paths clear.',
      primaryDestination: 'Main Office',
      suggestedDestinations: ['The Grove', 'Grove Parking', 'Walnut Loop', 'Diversity Way', 'The Pavilion', 'The Bonfire Pit', 'Back to the Cabin at 125'],
    };
  }

  if (name.includes('summer heat') || name.includes('key west')) {
    return {
      type: 'theme-weekend',
      badge: 'Poolside heat',
      note: 'Hot theme weekend. Pool, Pavilion, Fort Dix, and The Afters are your likely orbit.',
      primaryDestination: 'Pool',
      suggestedDestinations: ['Pool', 'The Pavilion', 'Fort Dix', 'The Afters at Triangle Field'],
    };
  }

  if (name.includes('bear') || name.includes('oktobear')) {
    return {
      type: 'theme-weekend',
      badge: 'Bear weekend',
      note: 'Big bear-week energy. Start social, stay respectful, and follow the camp rules.',
      primaryDestination: 'The Pavilion',
      suggestedDestinations: ['The Pavilion', 'Pool', 'Fort Dix', 'The Afters at Triangle Field'],
    };
  }

  if (name.includes('leather') || name.includes('country')) {
    return {
      type: 'theme-weekend',
      badge: 'Country / leather',
      note: 'Boots, gear, and after-dark wandering. Consent only, always.',
      primaryDestination: 'The Pavilion',
      suggestedDestinations: ['The Pavilion', 'Fort Dix', 'The Afters at Triangle Field', 'The Bonfire Pit'],
    };
  }

  if (name.includes('july 4') || name.includes('labor day') || name.includes('holiday')) {
    return {
      type: 'theme-weekend',
      badge: 'Holiday weekend',
      note: 'Classic long-weekend circuit: pool, Pavilion, fire pit, then whatever the night becomes.',
      primaryDestination: 'The Pavilion',
      suggestedDestinations: ['Pool', 'The Pavilion', 'The Bonfire Pit', 'The Afters at Triangle Field'],
    };
  }

  if (name.includes('geeks') || name.includes('gaymers')) {
    return {
      type: 'theme-weekend',
      badge: 'Gaymer quest',
      note: 'Nerdy, social, and cute. Pavilion and Grove are good starting points.',
      primaryDestination: 'The Pavilion',
      suggestedDestinations: ['The Pavilion', 'The Grove', 'Pool', 'Back to the Cabin at 125'],
    };
  }

  if (name.includes('halloween') || name.includes('time travel') || name.includes('flannel')) {
    return {
      type: 'theme-weekend',
      badge: 'Costume circuit',
      note: 'Theme-heavy weekend. Tour, mingle, and keep it spooky but respectful.',
      primaryDestination: 'The Pavilion',
      suggestedDestinations: ['The Pavilion', 'The Grove', 'Fort Dix', 'The Afters at Triangle Field'],
    };
  }

  return {
    type: 'theme-weekend',
    badge: 'Theme weekend',
    note: 'Suggested spots for this weekend. Exact event locations may vary by posted schedule.',
    primaryDestination: 'Main Office',
    suggestedDestinations: ['Main Office', 'The Pavilion', 'Pool', 'The Afters at Triangle Field'],
  };
}
