import { useEffect, useRef, useState } from 'react';
import { createGame, pickQuestion, answerQuestion, tierForStreak } from './game/engine';
import { playCorrect, playWrong, playMilestone, playGameOver, playTap, playCashCount, unlockAudio, vibrate } from './game/sounds';
import { burst } from './game/confetti';
import './styles.css';

const STORAGE = {
  best: 'itbox_best',
  seen: 'itbox_seen',
};

function loadSeen() {
  try {
    const raw = localStorage.getItem(STORAGE.seen);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen) {
  try {
    localStorage.setItem(STORAGE.seen, JSON.stringify([...seen]));
  } catch { /* noop */ }
}

function loadBest() {
  try {
    return parseInt(localStorage.getItem(STORAGE.best) || '0', 10);
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(STORAGE.best, String(score));
  } catch { /* noop */ }
}

const SPONSORS = [
  { name: 'Bovril & Sons', tag: 'Warm your soul since 1889' },
  { name: 'Wobbly Bob\'s Furniture', tag: 'Slightly wonky, slightly lovely' },
  { name: 'Captain Crunch\'s Cereal', tag: 'For champions who chew' },
  { name: 'The Soggy Biscuit Co.', tag: 'Dunk responsibly' },
  { name: 'Sir Reginald\'s Pickled Eggs', tag: 'A pub classic, now in cans' },
  { name: 'Mildred\'s Miracle Elixir', tag: 'Cures what ails ya (probably)' },
];

const QUIZBERT_QUIPS = {
  intro: [
    'Welcome, welcome, WELCOME to the Quiz Machine!',
    'I\'m your host, Quizbert! Let\'s make some memories!',
    'The stage is set, the glitter is on — let\'s play!',
    'Contestant! The machine awaits!',
  ],
  wrong: [
    'Oh dear. Oh dear oh dear.',
    'The machine is not impressed, contestant.',
    'Ooh, that one got away from us.',
    'The audience winces. I wince. We all wince.',
    'A valiant effort. The machine is not impressed.',
  ],
  milestone: [
    'Splendid stuff!',
    'The crowd goes wild!',
    'Magnificent!',
    'You\'re on fire, contestant!',
    'Ooh, what a corker!',
  ],
  gameOver: [
    'Unlucky, contestant!',
    'The machine giveth, and the machine taketh away.',
    'I\'ve seen better, but I\'ve also seen much worse.',
    'The pub quiz circuit will be hearing about this.',
    'The machine remembers. The machine always remembers.',
  ],
};

function App() {
  const [screen, setScreen] = useState('title');
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [bank, setBank] = useState(null);
  const [best, setBest] = useState(loadBest());
  const [lastResult, setLastResult] = useState(null); // {correct, chosen, correctIndex}
  const [sponsor, setSponsor] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [cash, setCash] = useState(0);
  const [quizbert, setQuizbert] = useState(null); // {text, kind}
  const cashTimer = useRef(null);

  // Load question bank once
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/data/easy.json').then((r) => r.json()),
      fetch('/data/medium.json').then((r) => r.json()),
      fetch('/data/hard.json').then((r) => r.json()),
    ]).then(([easy, medium, hard]) => {
      if (!cancelled) setBank({ easy, medium, hard });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => clearInterval(cashTimer.current), []);

  function startGame() {
    unlockAudio();
    playTap();
    const seen = loadSeen();
    // Reset seen when 80% of the bank has been seen — fresh shuffle
    const total = bank ? bank.easy.length + bank.medium.length + bank.hard.length : 180;
    if (seen.size > total * 0.8) {
      seen.clear();
      saveSeen(seen);
    }
    const g = createGame(seen);
    const q = pickQuestion(g, bank);
    setGame(g);
    setQuestion(q);
    setLastResult(null);
    setCash(0);
    setQuizbert({
      text: QUIZBERT_QUIPS.intro[Math.floor(Math.random() * QUIZBERT_QUIPS.intro.length)],
      kind: 'intro',
    });
    setTimeout(() => setQuizbert((qb) => (qb && qb.kind === 'intro' ? null : qb)), 2800);
    setScreen('playing');
  }

  function handleAnswer(chosen) {
    if (!game || !question || lastResult) return;
    const result = answerQuestion(game, question, chosen);
    saveSeen(game.seen);
    setLastResult({ correct: result.correct, chosen, correctIndex: question.c });

    if (result.correct) {
      playCorrect(game.streak);
      vibrate(30);
      burst(0.5, 0.45, 30);
      // Cash pot count-up
      clearInterval(cashTimer.current);
      const target = game.score;
      cashTimer.current = setInterval(() => {
        setCash((c) => {
          if (c >= target) { clearInterval(cashTimer.current); return target; }
          return c + Math.max(1, Math.round((target - c) / 8));
        });
      }, 30);
      if (result.milestone) {
        playMilestone();
        vibrate([60, 40, 60]);
        setQuizbert({
          text: QUIZBERT_QUIPS.milestone[Math.floor(Math.random() * QUIZBERT_QUIPS.milestone.length)],
          kind: 'milestone',
        });
        setSponsor(SPONSORS[Math.floor(Math.random() * SPONSORS.length)]);
        setTimeout(() => setSponsor(null), 2600);
      }
    } else {
      playWrong();
      vibrate([80, 60, 80]);
      setQuizbert({
        text: QUIZBERT_QUIPS.wrong[Math.floor(Math.random() * QUIZBERT_QUIPS.wrong.length)],
        kind: 'wrong',
      });
      setTimeout(() => setQuizbert((qb) => (qb && qb.kind === 'wrong' ? null : qb)), 2200);
    }

    setTimeout(() => {
      if (result.state.over) {
        playGameOver();
        setFinalScore(game.score);
        setFinalStreak(game.streak);
        setQuizbert({
          text: QUIZBERT_QUIPS.gameOver[Math.floor(Math.random() * QUIZBERT_QUIPS.gameOver.length)],
          kind: 'gameover',
        });
        if (game.score > loadBest()) {
          saveBest(game.score);
          setBest(game.score);
        }
        setScreen('gameover');
      } else {
        const next = pickQuestion(game, bank);
        if (!next) {
          // Bank exhausted mid-game — treat as a win
          setFinalScore(game.score);
          setFinalStreak(game.streak);
          setScreen('gameover');
          return;
        }
        setQuestion(next);
        setLastResult(null);
      }
    }, 900);
  }

  if (!bank) {
    return <div className="app loading">Loading questions…</div>;
  }

  return (
    <div className="app">
      {screen === 'title' && (
        <div className="screen title-screen">
          <div className="logo">
            <span className="logo-big">QUIZ</span>
            <span className="logo-small">MACHINE</span>
          </div>
          <div className="quizbert-banner">with your host, <strong>Quizbert</strong> 🎩</div>
          <div className="best-score">Best: £{best.toLocaleString()}</div>
          <button className="big-btn play-btn" onClick={startGame}>
            TAP TO PLAY
          </button>
          <div className="title-hint">3 lives · how far can you get?</div>
        </div>
      )}

      {screen === 'playing' && game && question && (
        <div className="screen game-screen">
          <div className="hud">
            <div className="lives">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`heart ${i < game.lives ? 'alive' : 'dead'}`}>♥</span>
              ))}
            </div>
            <div className={`streak ${game.streak >= 5 ? 'hot' : ''}`}>
              {game.streak > 0 ? `🔥 ×${game.streak}` : '—'}
            </div>
            <div className="cash">£{cash.toLocaleString()}</div>
          </div>

          <div className={`question-card ${lastResult ? (lastResult.correct ? 'flash-good' : 'flash-bad') : ''}`}>
            <div className="tier-tag">{tierForStreak(game.streak).toUpperCase()}</div>
            <div className="question-text">{question.q}</div>
          </div>

          <div className="answers">
            {question.a.map((ans, i) => {
              let cls = 'answer-btn';
              if (lastResult) {
                if (i === question.c) cls += ' correct';
                else if (i === lastResult.chosen) cls += ' wrong';
                else cls += ' dimmed';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={!!lastResult}
                >
                  <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
                  {ans}
                </button>
              );
            })}
          </div>

          {sponsor && (
            <div className="sponsor-card">
              <div className="sponsor-kicker">AND NOW A WORD FROM OUR SPONSORS</div>
              <div className="sponsor-name">{sponsor.name}</div>
              <div className="sponsor-tag">{sponsor.tag}</div>
            </div>
          )}

          {quizbert && quizbert.kind !== 'gameover' && (
            <div className={`quizbert-quip ${quizbert.kind}`}>
              <span className="quizbert-avatar">🎩</span>
              {quizbert.text}
            </div>
          )}
        </div>
      )}

      {screen === 'gameover' && (
        <div className="screen gameover-screen">
          <div className="gameover-title">GAME OVER</div>
          {quizbert && <div className="quizbert-quip gameover-quip">{quizbert.text}</div>}
          <div className="final-score">£{finalScore.toLocaleString()}</div>
          <div className="final-streak">Best streak: {finalStreak}</div>
          <button className="big-btn play-btn" onClick={startGame}>
            ONE MORE GO
          </button>
          <button className="ghost-btn" onClick={() => { playTap(); setScreen('title'); }}>
            Back to title
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
