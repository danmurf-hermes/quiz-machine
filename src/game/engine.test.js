import { describe, it, expect } from 'vitest';
import { createGame, RANKS, rankFor, tierForRank, pickQuestion, answerQuestion, shouldResetSeen } from './engine';

const bank = {
  easy: [
    { id: 'e1', q: 'Q1', a: ['A', 'B', 'C', 'D'], c: 0, d: 'easy', cat: 'general' },
    { id: 'e2', q: 'Q2', a: ['A', 'B', 'C', 'D'], c: 1, d: 'easy', cat: 'general' },
    { id: 'e3', q: 'Q3', a: ['A', 'B', 'C', 'D'], c: 2, d: 'easy', cat: 'general' },
  ],
  medium: [
    { id: 'm1', q: 'Q4', a: ['A', 'B', 'C', 'D'], c: 3, d: 'medium', cat: 'general' },
    { id: 'm2', q: 'Q5', a: ['A', 'B', 'C', 'D'], c: 0, d: 'medium', cat: 'general' },
  ],
  hard: [
    { id: 'h1', q: 'Q6', a: ['A', 'B', 'C', 'D'], c: 1, d: 'hard', cat: 'general' },
  ],
};

describe('createGame', () => {
  it('starts with 3 lives, 0 streak, 0 score, not over', () => {
    const g = createGame();
    expect(g.lives).toBe(3);
    expect(g.streak).toBe(0);
    expect(g.score).toBe(0);
    expect(g.over).toBe(false);
    expect(g.usedThisGame.size).toBe(0);
  });

  it('accepts a pre-seen set of question ids', () => {
    const g = createGame(new Set(['e1']));
    expect(g.seen.has('e1')).toBe(true);
  });

  it('starts at rank 0 with empty progress', () => {
    const g = createGame();
    expect(g.rank).toBe(0);
    expect(g.rankProgress).toBe(0);
  });
});

describe('ranks', () => {
  it('has 8 ranks', () => {
    expect(RANKS.length).toBe(8);
  });

  it('escalates difficulty: easy, easy, medium, medium, medium, hard, hard, hard', () => {
    expect(RANKS.map((r) => r.tier)).toEqual(['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard']);
  });

  it('clamps rank lookups at the top rank', () => {
    const g = createGame();
    g.rank = 99;
    expect(rankFor(g).name).toBe('Grandmaster');
  });

  it('tierForRank maps to the right tier', () => {
    expect(tierForRank(0)).toBe('easy');
    expect(tierForRank(2)).toBe('medium');
    expect(tierForRank(5)).toBe('hard');
    expect(tierForRank(99)).toBe('hard');
  });
});

describe('pickQuestion', () => {
  it('picks from the tier matching the current rank', () => {
    const g = createGame();
    const q = pickQuestion(g, bank);
    expect(q.d).toBe('easy');
  });

  it('picks medium questions at rank 2', () => {
    const g = createGame();
    g.rank = 2;
    const q = pickQuestion(g, bank);
    expect(q.d).toBe('medium');
  });

  it('picks hard questions at rank 5', () => {
    const g = createGame();
    g.rank = 5;
    const q = pickQuestion(g, bank);
    expect(q.d).toBe('hard');
  });

  it('does not repeat questions within a game', () => {
    const g = createGame();
    const picked = new Set();
    for (let i = 0; i < 3; i++) {
      const q = pickQuestion(g, bank);
      picked.add(q.id);
      g.usedThisGame.add(q.id);
    }
    expect(picked.size).toBe(3);
  });

  it('falls back to any unused question when the tier is exhausted', () => {
    const g = createGame();
    g.usedThisGame = new Set(['e1', 'e2', 'e3']); // all easy used
    const q = pickQuestion(g, bank);
    expect(q).toBeDefined();
  });

  it('returns null when every question has been used', () => {
    const g = createGame();
    g.usedThisGame = new Set(['e1', 'e2', 'e3', 'm1', 'm2', 'h1']);
    const q = pickQuestion(g, bank);
    expect(q).toBeNull();
  });

  it('skips questions seen in previous games when fresh ones remain', () => {
    const bigBank = {
      easy: [
        { id: 'e1', q: 'Q1', a: ['A', 'B', 'C', 'D'], c: 0, d: 'easy', cat: 'general' },
        { id: 'e2', q: 'Q2', a: ['A', 'B', 'C', 'D'], c: 1, d: 'easy', cat: 'general' },
        { id: 'e3', q: 'Q3', a: ['A', 'B', 'C', 'D'], c: 2, d: 'easy', cat: 'general' },
        { id: 'e4', q: 'Q4', a: ['A', 'B', 'C', 'D'], c: 3, d: 'easy', cat: 'general' },
      ],
      medium: [],
      hard: [],
    };
    // Seen e1–e3 in previous games; only e4 is fresh
    const g = createGame(new Set(['e1', 'e2', 'e3']));
    const orig = Math.random;
    Math.random = () => 0.0; // picks the FIRST element of any pool — e1 if seen isn't respected
    try {
      const q = pickQuestion(g, bigBank);
      expect(q.id).toBe('e4');
    } finally {
      Math.random = orig;
    }
  });

  it('falls back to previously-seen questions once the tier has no fresh ones', () => {
    const bigBank = {
      easy: [
        { id: 'e1', q: 'Q1', a: ['A', 'B', 'C', 'D'], c: 0, d: 'easy', cat: 'general' },
        { id: 'e2', q: 'Q2', a: ['A', 'B', 'C', 'D'], c: 1, d: 'easy', cat: 'general' },
        { id: 'e3', q: 'Q3', a: ['A', 'B', 'C', 'D'], c: 2, d: 'easy', cat: 'general' },
        { id: 'e4', q: 'Q4', a: ['A', 'B', 'C', 'D'], c: 3, d: 'easy', cat: 'general' },
      ],
      medium: [],
      hard: [],
    };
    const g = createGame(new Set(['e1', 'e2', 'e3']));
    g.usedThisGame = new Set(['e4']); // the only fresh one is already used this game
    const orig = Math.random;
    Math.random = () => 0.999;
    try {
      const q = pickQuestion(g, bigBank);
      expect(['e1', 'e2', 'e3']).toContain(q.id);
    } finally {
      Math.random = orig;
    }
  });
});

describe('shouldResetSeen', () => {
  it('resets when 80% or more of the tier has been seen', () => {
    const seen = new Set(['e1', 'e2', 'e3', 'e4']);
    const bankSizes = { easy: 4, medium: 100, hard: 100 };
    expect(shouldResetSeen(seen, bankSizes)).toBe(true); // 4/4 = 100%
  });

  it('does not reset below 80% of the tier', () => {
    const seen = new Set(['e1', 'e2', 'e3']);
    const bankSizes = { easy: 4, medium: 100, hard: 100 };
    expect(shouldResetSeen(seen, bankSizes)).toBe(false); // 3/4 = 75%
  });

  it('counts only seen ids that exist in the bank', () => {
    const seen = new Set(['e1', 'e2', 'e3', 'e4', 'ghost']);
    const bankSizes = { easy: 4, medium: 100, hard: 100 };
    // 4 real seen / 4 easy = 100%; 'ghost' must not inflate the count
    expect(shouldResetSeen(seen, bankSizes)).toBe(true);
  });
});

describe('answerQuestion', () => {
  it('scores 100 for a correct easy answer at streak 0', () => {
    const g = createGame();
    const r = answerQuestion(g, bank.easy[0], 0);
    expect(r.correct).toBe(true);
    expect(r.state.score).toBe(100);
    expect(r.state.streak).toBe(1);
    expect(r.state.lives).toBe(3);
  });

  it('applies the streak multiplier to points', () => {
    const g = createGame();
    g.streak = 1; // answering correctly takes streak to 2 → x2
    const r = answerQuestion(g, bank.medium[0], 3);
    expect(r.correct).toBe(true);
    expect(r.state.score).toBe(400); // 200 base x2
  });

  it('loses a life and resets streak on a wrong answer', () => {
    const g = createGame();
    g.streak = 3;
    const r = answerQuestion(g, bank.easy[0], 1);
    expect(r.correct).toBe(false);
    expect(r.state.lives).toBe(2);
    expect(r.state.streak).toBe(0);
  });

  it('ends the game when lives reach zero', () => {
    const g = createGame();
    g.lives = 1;
    const r = answerQuestion(g, bank.easy[0], 1);
    expect(r.state.lives).toBe(0);
    expect(r.state.over).toBe(true);
  });

  it('flags milestone at streak 5', () => {
    const g = createGame();
    g.streak = 4;
    const r = answerQuestion(g, bank.easy[0], 0);
    expect(r.milestone).toBe(5);
  });

  it('does not re-flag the same milestone twice', () => {
    const g = createGame();
    g.streak = 4;
    g.milestonesHit.add(5);
    const r = answerQuestion(g, bank.easy[0], 0);
    expect(r.milestone).toBeNull();
  });

  it('marks the question as seen and used', () => {
    const g = createGame();
    const q = bank.easy[0];
    answerQuestion(g, q, 0);
    expect(g.seen.has(q.id)).toBe(true);
    expect(g.usedThisGame.has(q.id)).toBe(true);
  });
});

describe('rank progression', () => {
  it('fills progress on correct answers', () => {
    const g = createGame();
    answerQuestion(g, bank.easy[0], 0);
    expect(g.rankProgress).toBe(1);
    expect(g.rank).toBe(0);
  });

  it('ranks up when the bar fills', () => {
    const g = createGame();
    g.rankProgress = 2; // Glass Collector needs 3
    const r = answerQuestion(g, bank.easy[0], 0);
    expect(r.rankUp).toBe(true);
    expect(g.rank).toBe(1);
    expect(g.rankProgress).toBe(0);
  });

  it('drains progress on wrong answers', () => {
    const g = createGame();
    g.rankProgress = 2;
    answerQuestion(g, bank.easy[0], 1);
    expect(g.rankProgress).toBe(1);
  });

  it('does not drain below zero', () => {
    const g = createGame();
    answerQuestion(g, bank.easy[0], 1);
    expect(g.rankProgress).toBe(0);
  });

  it('stays at the top rank and keeps the bar full', () => {
    const g = createGame();
    g.rank = 7; // Machine Master
    g.rankProgress = 7;
    const r = answerQuestion(g, bank.hard[0], 1);
    expect(r.rankUp).toBe(false);
    expect(g.rank).toBe(7);
    expect(g.rankProgress).toBe(8);
  });
});
