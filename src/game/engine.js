// Pure game engine — no DOM, no storage. All state transitions live here.

export const TIER_BY_STREAK = [
  [0, 4, 'easy'],
  [5, 9, 'medium'],
  [10, Infinity, 'hard'],
];

export const BASE_POINTS = { easy: 100, medium: 200, hard: 300 };
export const MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50];
export const START_LIVES = 3;

export function createGame(seenIds = new Set()) {
  return {
    lives: START_LIVES,
    streak: 0,
    score: 0,
    over: false,
    seen: new Set(seenIds),
    usedThisGame: new Set(),
    milestonesHit: new Set(),
  };
}

export function tierForStreak(streak) {
  for (const [lo, hi, tier] of TIER_BY_STREAK) {
    if (streak >= lo && streak <= hi) return tier;
  }
  return 'hard';
}

export function pickQuestion(state, bank) {
  const tier = tierForStreak(state.streak);
  const pool = bank[tier] || [];
  const unused = pool.filter((q) => !state.usedThisGame.has(q.id));
  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)];
  }
  // Fall back to any unused question in the whole bank
  const allUnused = Object.values(bank)
    .flat()
    .filter((q) => !state.usedThisGame.has(q.id));
  if (allUnused.length === 0) return null;
  return allUnused[Math.floor(Math.random() * allUnused.length)];
}

export function answerQuestion(state, question, chosenIndex) {
  const correct = chosenIndex === question.c;
  state.seen.add(question.id);
  state.usedThisGame.add(question.id);

  let milestone = null;

  if (correct) {
    state.streak += 1;
    const multiplier = Math.min(state.streak, 10);
    state.score += BASE_POINTS[question.d] * multiplier;
    if (MILESTONES.includes(state.streak) && !state.milestonesHit.has(state.streak)) {
      state.milestonesHit.add(state.streak);
      milestone = state.streak;
    }
  } else {
    state.lives -= 1;
    state.streak = 0;
    if (state.lives <= 0) {
      state.lives = 0;
      state.over = true;
    }
  }

  return { correct, milestone, state };
}
