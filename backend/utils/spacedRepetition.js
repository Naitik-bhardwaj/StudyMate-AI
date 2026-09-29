// Simplified SM-2 (SuperMemo 2) spaced repetition algorithm.
// quality: 0-5 rating of how well the card was recalled
//   0-2 = forgot / hard to recall -> reset repetitions, review again soon
//   3-5 = recalled successfully -> grow the interval

export const applySM2 = (card, quality) => {
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    interval = 1; // review again tomorrow
  } else {
    repetitions += 1;

    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReviewDate };
};
