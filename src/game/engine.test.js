import { describe, it, expect } from 'vitest';
import { createGame, tierForStreak, pickQuestion, answerQuestion } from './engine';

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
});

describe('tierForStreak', () => {
  it('returns easy for streaks 0-4', () => {
    expect(tierForStreak(0)).toBe('easy');
    expect(tierForStreak(4)).toBe('easy');
  });
  it('returns medium for streaks 5-9', () => {
    expect(tierForStreak(5)).toBe('medium');
    expect(tierForStreak(9)).toBe('medium');
  });
  it('returns hard for streaks 10+', () => {
    expect(tierForStreak(10)).toBe('hard');
    expect(tierForStreak(25)).toBe('hard');
  });
});

describe('pickQuestion', () => {
  it('picks from the tier matching the current streak', () => {
    const g = createGame();
    const q = pickQuestion(g, bank);
    expect(q.d).toBe('easy');
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
