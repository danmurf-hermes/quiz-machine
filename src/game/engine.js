// Pure game engine — no DOM, no storage. All state transitions live here.

export const RANKS = [
  { name: 'Contestant', emoji: '🎟️', tier: 'easy', segments: 3 },
  { name: 'Qualifier', emoji: '📝', tier: 'easy', segments: 4 },
  { name: 'Quiz Apprentice', emoji: '📚', tier: 'medium', segments: 4 },
  { name: 'Brainbox', emoji: '🧠', tier: 'medium', segments: 5 },
  { name: 'Semi-Finalist', emoji: '🏆', tier: 'medium', segments: 5 },
  { name: 'Finalist', emoji: '⚡', tier: 'hard', segments: 6 },
  { name: 'Champion', emoji: '🚀', tier: 'hard', segments: 6 },
  { name: 'Grandmaster', emoji: '👑', tier: 'hard', segments: 8 },
];

export const BASE_POINTS = { easy: 100, medium: 200, hard: 300 };
export const MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50];
export const START_LIVES = 3;
export const SEEN_RESET_RATIO = 0.8;

const TIER_PREFIX = { easy: 'e', medium: 'm', hard: 'h' };

export function shouldResetSeen(seenIds, bankSizes) {
  return Object.entries(bankSizes).some(([tier, size]) => {
    if (!size) return false;
    const prefix = TIER_PREFIX[tier];
    let seenInTier = 0;
    for (const id of seenIds) {
      if (id.startsWith(prefix) && /^\d+$/.test(id.slice(1))) seenInTier++;
    }
    return seenInTier / size >= SEEN_RESET_RATIO;
  });
}

export function createGame(seenIds = new Set()) {
  return {
    lives: START_LIVES,
    streak: 0,
    score: 0,
    over: false,
    seen: new Set(seenIds),
    usedThisGame: new Set(),
    milestonesHit: new Set(),
    rank: 0,
    rankProgress: 0,
  };
}

export function rankFor(state) {
  return RANKS[Math.min(state.rank, RANKS.length - 1)];
}

export function tierForRank(rank) {
  return RANKS[Math.min(rank, RANKS.length - 1)].tier;
}

export function pickQuestion(state, bank) {
  const tier = tierForRank(state.rank);
  const pool = bank[tier] || [];
  // Prefer questions never seen in ANY game (state.seen), then this game (usedThisGame)
  const fresh = pool.filter((q) => !state.seen.has(q.id) && !state.usedThisGame.has(q.id));
  if (fresh.length > 0) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
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
  let rankUp = false;

  if (correct) {
    state.streak += 1;
    const multiplier = Math.min(state.streak, 10);
    state.score += BASE_POINTS[question.d] * multiplier;
    if (MILESTONES.includes(state.streak) && !state.milestonesHit.has(state.streak)) {
      state.milestonesHit.add(state.streak);
      milestone = state.streak;
    }
    // Rank progress — fill the bar
    const current = rankFor(state);
    if (state.rank < RANKS.length - 1) {
      state.rankProgress += 1;
      if (state.rankProgress >= current.segments) {
        state.rank += 1;
        state.rankProgress = 0;
        rankUp = true;
      }
    } else {
      // Top rank: bar fills and stays full
      state.rankProgress = Math.min(state.rankProgress + 1, current.segments);
    }
  } else {
    state.lives -= 1;
    state.streak = 0;
    // Wrong answer drains the bar
    state.rankProgress = Math.max(0, state.rankProgress - 1);
    if (state.lives <= 0) {
      state.lives = 0;
      state.over = true;
    }
  }

  return { correct, milestone, rankUp, state };
}
