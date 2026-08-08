import { useEffect, useRef, useState } from 'react';
import { createGame, pickQuestion, answerQuestion, RANKS, rankFor, tierForRank, BASE_POINTS } from './game/engine';
import { playCorrect, playWrong, playMilestone, playGameOver, playTap, playCashCount, playHeartbeat, playTimeout, playRoast, playWhoosh, playRankUp, startSaloonMusic, stopSaloonMusic, unlockAudio, vibrate } from './game/sounds';
import { burst, bigBurst, streamers } from './game/confetti';
import './styles.css';

const STORAGE = {
  best: 'quizmachine_best',
  bestRank: 'quizmachine_best_rank',
  seen: 'quizmachine_seen',
  music: 'quizmachine_music',
};

const QUESTION_TIME = 20; // seconds per question
const HEARTBEAT_START = 8; // seconds remaining when heartbeat begins
const HEARTBEAT_MIN_GAP = 250; // ms — fastest heartbeat

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

function loadBestRank() {
  try {
    return parseInt(localStorage.getItem(STORAGE.bestRank) || '0', 10);
  } catch {
    return 0;
  }
}

function saveBestRank(rank) {
  try {
    localStorage.setItem(STORAGE.bestRank, String(rank));
  } catch { /* noop */ }
}

function loadMusicPref() {
  try {
    return localStorage.getItem(STORAGE.music) !== 'off';
  } catch {
    return true;
  }
}

function saveMusicPref(on) {
  try {
    localStorage.setItem(STORAGE.music, on ? 'on' : 'off');
  } catch { /* noop */ }
}

const SPONSORS = [
  { name: 'Bovril & Sons', tag: 'Warm your soul since 1889' },
  { name: 'Wobbly Bob\'s Furniture', tag: 'Slightly wonky, slightly lovely' },
  { name: 'Captain Crunch\'s Cereal', tag: 'For champions who chew' },
  { name: 'The Soggy Biscuit Co.', tag: 'Dunk responsibly' },
  { name: 'Sir Reginald\'s Pickled Eggs', tag: 'A pub classic, now in cans' },
  { name: 'Mildred\'s Miracle Elixir', tag: 'Cures what ails ya (probably)' },
  { name: 'Derek\'s Discount Dentures', tag: 'Bite back on a budget' },
  { name: 'Gertrude\'s Gravity Boots', tag: 'Walk upside down in style' },
  { name: 'Hank\'s Hovercraft Hire', tag: 'Because boats are so last century' },
  { name: 'Mabel\'s Marmalade Mine', tag: 'Pure gold, spreadable' },
  { name: 'Neville\'s Night-Lights', tag: 'For adults afraid of the dark' },
  { name: 'The Tumbleweed Transport Co.', tag: 'Slow travel, cowboy approved' },
  { name: 'Boris\'s Bounce House Emporium', tag: 'Grown-ups welcome, dignity not required' },
  { name: 'Gloria\'s Glow-in-the-Dark Gravy', tag: 'Dinner, but spooky' },
  { name: 'The Invisible Fence Company', tag: 'You\'ll never see it coming' },
  { name: 'Hubert\'s Hugs & Handshakes', tag: 'Affection, professionally applied' },
  { name: 'The Echo Chamber', tag: 'We hear you. We hear you. We hear you.' },
  { name: 'Stanley\'s Spare Spleens', tag: 'Spare parts for the brave' },
  { name: 'Mortimer\'s Moustache Wax', tag: 'For lips with ambition' },
  { name: 'Doris\'s Dinosaur Repellent', tag: 'Works 60% of the time, every time' },
  { name: 'The Wrong-Way Roundabout', tag: 'Going nowhere, faster' },
];

const QUIZBERT_QUIPS = {
  intro: [
    'Welcome, welcome, WELCOME to the Quiz Machine! I\'m your host, Quizbert!',
    'Good evening, contestant! Quizbert here — the machine is warm and the questions are waiting!',
    'Hello hello hello! Quizbert at your service. Let\'s make some memories!',
    'The stage is set, the glitter is on! I\'m Quizbert, and this is the Quiz Machine!',
    'Ladies and gentlemen... and contestant! Quizbert welcomes you to the show!',
  ],
  correct: [
    'Correct! Splendid!',
    'Right you are, contestant!',
    'Ooh, lovely stuff!',
    'The machine approves!',
    'Correct! The machine is delighted!',
    'Yes! That\'s the stuff!',
    'The machine hums with approval!',
  ],
  wrong: [
    'Oh dear. Oh dear oh dear.',
    'The machine is not impressed, contestant.',
    'Ooh, that one got away from us.',
    'The audience winces. I wince. We all wince.',
    'A valiant effort. The machine is not impressed.',
  ],
  timeout: [
    'Time\'s up! The machine waits for no one!',
    'Too slow, contestant! The clock is merciless!',
    'The sands of time have run out!',
    'Tick tock! The machine moves on!',
    'The clock beat you. The CLOCK.',
    'I\'ve seen glaciers move faster, and they weren\'t even trying.',
    'That\'s what happens when you bring a nap to a quiz show.',
  ],
  milestone: [
    'Splendid stuff!',
    'The crowd goes wild!',
    'Magnificent!',
    'You\'re on fire, contestant!',
    'Ooh, what a corker!',
  ],
  gameOver: [
    'The machine giveth, and the machine taketh away.',
    'I\'ve seen better, but I\'ve also seen much worse.',
    'The pub quiz circuit will be hearing about this.',
    'The machine remembers. The machine always remembers.',
    'That performance was so bad the sponsors are reconsidering.',
    'You made the machine sad. The MACHINE. Sad.',
    'I\'d say "better luck next time" but luck wasn\'t the problem.',
    'The machine is going to need a lie down after that.',
  ],
};

// Roasts escalate with consecutive wrongs — banter, not bullying. Quizbert teases.
const QUIZBERT_ROASTS = {
  mild: {
    face: '😏',
    laugh: false,
    lines: [
      'Ooh, a swing and a miss. The crowd goes "oooh".',
      'Not quite! I\'d say unlucky, but I\'d be lying.',
      'Bold choice, contestant. Bold.',
      'The machine would tut, but it doesn\'t have a mouth.',
      'That\'s one for the blooper reel.',
    ],
  },
  spicy: {
    face: '🤭',
    laugh: true,
    lines: [
      'Two in a row! You\'re building a collection.',
      'I\'m starting to think you\'re doing this on purpose.',
      'Really? That one? Okay then.',
      'The audience is trying not to laugh. They\'re failing.',
      'You\'re making this too easy, contestant.',
    ],
  },
  nuclear: {
    face: '🥱',
    laugh: false,
    lines: [
      'Third one! I\'d yawn, but I don\'t want to be rude. Actually, I do.',
      'At this point I\'m just impressed by the commitment.',
      'I\'ve seen better, but I\'ve also seen worse. Just not often.',
      'The machine is having a lovely evening, thanks for asking.',
      'I\'d say "take your time", but you clearly are.',
    ],
  },
};

// Backhanded compliments — Quizbert roasts you even when you're right
const QUIZBERT_BANTER = [
  { face: '😏', text: 'Correct! I\'m as surprised as you are.' },
  { face: '😏', text: 'Even a broken clock is right twice a day.' },
  { face: '😌', text: 'I\'ll allow it. Don\'t let it go to your head.' },
  { face: '😏', text: 'Well, well, well. Look who decided to show up.' },
  { face: '😏', text: 'That was a free one. The next won\'t be so kind.' },
  { face: '🤨', text: 'Hmm. Lucky guess, or are you warming up?' },
  { face: '😏', text: 'The machine is impressed. Marginally.' },
  { face: '😏', text: 'Don\'t get too excited — beginners get lucky too.' },
];

function roastFor(wrongs) {
  const tier = wrongs >= 3 ? 'nuclear' : wrongs === 2 ? 'spicy' : 'mild';
  const pool = QUIZBERT_ROASTS[tier];
  return {
    text: pool.lines[Math.floor(Math.random() * pool.lines.length)],
    face: pool.face,
    laugh: pool.laugh,
  };
}

// ~1 in 3 correct answers gets a backhanded compliment instead of praise
function banterFor() {
  return QUIZBERT_BANTER[Math.floor(Math.random() * QUIZBERT_BANTER.length)];
}

function gameOverLine(score) {
  if (score === 0) {
    return 'Zero. Not a single point. The machine has seen everything now.';
  }
  if (score < 1000) {
    return 'The machine giveth, and the machine taketh away.';
  }
  const pool = QUIZBERT_QUIPS.gameOver;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Question presentation lines — {v} is replaced with the points on offer
const QUIZBERT_PRESENT = [
  'And now, for {v} points!',
  'Next up — for {v} points!',
  'For {v} points, contestant!',
  'Let\'s see you take {v} points!',
  'The next question is worth {v} points!',
];

// Rank-up celebration lines — {r} is the new rank name
const QUIZBERT_RANKUP = [
  'A round of applause! You\'re now a {r}!',
  'The machine is impressed. You\'ve reached {r}!',
  'Look at you go! Welcome to the rank of {r}!',
  'The crowd goes wild! {r} in the house!',
  'You\'ve earned it, contestant — {r}!',
];

// Points the next question is worth: tier base × next multiplier
function pointsOnOffer(state, q) {
  return BASE_POINTS[q.d] * Math.min(state.streak + 1, 10);
}

// Quizbert's presentation line for the next question
function presentFor(state, q) {
  const v = pointsOnOffer(state, q).toLocaleString();
  const tpl = QUIZBERT_PRESENT[Math.floor(Math.random() * QUIZBERT_PRESENT.length)];
  return tpl.replace('{v}', v);
}

const QUIZBERT_FACES = {
  intro: '😎',
  present: '😏',
  correct: '😄',
  wrong: '😬',
  timeout: '😰',
  milestone: '🤩',
  gameover: '😔',
};

function App() {
  const [screen, setScreen] = useState('title');
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [bank, setBank] = useState(null);
  const [best, setBest] = useState(loadBest());
  const [bestRank, setBestRank] = useState(loadBestRank());
  const [musicOn, setMusicOn] = useState(loadMusicPref());
  const [lastResult, setLastResult] = useState(null); // {correct, chosen, correctIndex}
  const [quizbert, setQuizbert] = useState(null); // {text, kind, face, sponsor?}
  const [presentLine, setPresentLine] = useState(null); // Quizbert's "for £X" line
  const [finalScore, setFinalScore] = useState(0);
  const [finalStreak, setFinalStreak] = useState(0);
  const [finalRank, setFinalRank] = useState(0);
  const [rankDisplay, setRankDisplay] = useState(0); // rank index for the HUD
  const [rankProgress, setRankProgress] = useState(0); // segments filled
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [consecutiveWrongs, setConsecutiveWrongs] = useState(0);
  const [popup, setPopup] = useState(null); // {text, kind, id} floating text
  const [flash, setFlash] = useState(null); // {kind, id} full-screen colour flash
  const [shake, setShake] = useState(false); // screen shake on wrong
  const [rankUpEvent, setRankUpEvent] = useState(null); // {oldRank, newRank} — full-screen celebration
  const heartbeatTimer = useRef(null);
  const popupId = useRef(0);
  const flashId = useRef(0);

  function showPopup(text, kind) {
    popupId.current += 1;
    setPopup({ text, kind, id: popupId.current });
    setTimeout(() => setPopup((p) => (p && p.id === popupId.current ? null : p)), 1100);
  }

  function showFlash(kind) {
    flashId.current += 1;
    setFlash({ kind, id: flashId.current });
    setTimeout(() => setFlash((f) => (f && f.id === flashId.current ? null : f)), 800);
  }

  // Auto-dismiss the rank-up celebration after 4s
  useEffect(() => {
    if (!rankUpEvent) return;
    const t = setTimeout(() => setRankUpEvent(null), 4000);
    return () => clearTimeout(t);
  }, [rankUpEvent]);

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

  useEffect(() => () => clearInterval(heartbeatTimer.current), []);

  function startGame() {
    unlockAudio();
    playTap();
    if (musicOn) startSaloonMusic();
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
    setRankDisplay(0);
    setRankProgress(0);
    setConsecutiveWrongs(0);
    // Quizbert introduces himself, full screen
    setQuizbert({
      kind: 'intro',
      text: QUIZBERT_QUIPS.intro[Math.floor(Math.random() * QUIZBERT_QUIPS.intro.length)],
      face: QUIZBERT_FACES.intro,
    });
    setTimeout(() => {
      setQuizbert(null);
      setPresentLine(presentFor(g, q));
    }, 2800);
    setScreen('playing');
  }

  // Countdown timer per question
  useEffect(() => {
    if (screen !== 'playing' || !question || lastResult) return;
    setTimeLeft(QUESTION_TIME);
    const started = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      const left = Math.max(0, QUESTION_TIME - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(tick);
        handleTimeout();
      }
    }, 100);
    return () => clearInterval(tick);
  }, [screen, question, lastResult]);

  // Accelerating heartbeat as the timer runs out
  useEffect(() => {
    if (screen !== 'playing' || !question || lastResult) return;
    if (timeLeft > HEARTBEAT_START) return;
    const gap = HEARTBEAT_MIN_GAP + (timeLeft / HEARTBEAT_START) * 900;
    heartbeatTimer.current = setTimeout(() => {
      playHeartbeat();
      vibrate(20);
    }, gap);
    return () => clearTimeout(heartbeatTimer.current);
  }, [timeLeft, screen, question, lastResult]);

  function handleTimeout() {
    if (!game || !question || lastResult) return;
    playTimeout();
    vibrate([100, 60, 100]);
    const result = answerQuestion(game, question, -1); // -1 is never correct
    saveSeen(game.seen);
    setLastResult({ correct: false, chosen: -1, correctIndex: question.c });
    const wrongs = consecutiveWrongs + 1;
    setConsecutiveWrongs(wrongs);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    showFlash('bad');
    showPopup('TIME\'S UP!', 'bad');
    const roast = roastFor(wrongs);
    setQuizbert({
      kind: 'timeout',
      text: QUIZBERT_QUIPS.timeout[Math.floor(Math.random() * QUIZBERT_QUIPS.timeout.length)],
      face: roast.face,
      laugh: roast.laugh,
    });
    advanceAfter(result, wrongs);
  }

  function advanceAfter(result, wrongs = 0) {
    setTimeout(() => {
      if (result.state.over) {
        stopSaloonMusic();
        playGameOver();
        setFinalScore(game.score);
        setFinalStreak(game.streak);
        setFinalRank(game.rank);
        setQuizbert({
          kind: 'gameover',
          text: gameOverLine(game.score),
          face: QUIZBERT_FACES.gameover,
        });
        if (game.score > loadBest()) {
          saveBest(game.score);
          setBest(game.score);
        }
        if (game.rank > loadBestRank()) {
          saveBestRank(game.rank);
          setBestRank(game.rank);
        }
        setScreen('gameover');
      } else {
        const next = pickQuestion(game, bank);
        if (!next) {
          // Bank exhausted mid-game — treat as a win
          setFinalScore(game.score);
          setFinalStreak(game.streak);
          setFinalRank(game.rank);
          setScreen('gameover');
          return;
        }
        const kind = result.correct ? (result.milestone ? 'milestone' : 'correct') : 'wrong';
        const roast = result.correct ? null : roastFor(wrongs);
        const banter = result.correct && !result.milestone && Math.random() < 0.33 ? banterFor() : null;
        const qb = {
          kind,
          text: result.correct
            ? (banter ? banter.text : QUIZBERT_QUIPS[kind][Math.floor(Math.random() * QUIZBERT_QUIPS[kind].length)])
            : roast.text,
          face: result.correct ? (banter ? banter.face : QUIZBERT_FACES[kind]) : roast.face,
          laugh: result.correct ? false : roast.laugh,
        };
        if (result.milestone) {
          qb.sponsor = SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
        }
        if (result.rankUp) {
          const newRank = rankFor(game);
          qb.kind = 'rankup';
          qb.text = QUIZBERT_RANKUP[Math.floor(Math.random() * QUIZBERT_RANKUP.length)].replace('{r}', `${newRank.emoji} ${newRank.name}`);
          qb.face = '🎉';
          qb.sponsor = SPONSORS[Math.floor(Math.random() * SPONSORS.length)];
        }
        setQuizbert(qb);
        const delay = result.milestone || result.rankUp ? 2800 : 1700;
        setTimeout(() => {
          setQuizbert(null);
          setQuestion(next);
          setLastResult(null);
          playWhoosh();
          // Quizbert presents the next question
          setPresentLine(presentFor(game, next));
        }, delay);
      }
    }, 900);
  }

  function handleAnswer(chosen) {
    if (!game || !question || lastResult) return;
    const result = answerQuestion(game, question, chosen);
    saveSeen(game.seen);
    setLastResult({ correct: result.correct, chosen, correctIndex: question.c });

    const wrongs = result.correct ? 0 : consecutiveWrongs + 1;
    setConsecutiveWrongs(wrongs);

    if (result.correct) {
      playCorrect(game.streak);
      vibrate(30);
      burst(0.5, 0.45, 30);
      showFlash('good');
      showPopup(`+${pointsOnOffer(game, question).toLocaleString()}`, 'good');
      setRankDisplay(game.rank);
      setRankProgress(game.rankProgress);
      if (result.milestone) {
        playMilestone();
        vibrate([60, 40, 60]);
        bigBurst(0.5, 0.3, 90);
        streamers();
        showFlash('milestone');
        showPopup(`STREAK ×${game.streak}!`, 'milestone');
      }
      if (result.rankUp) {
        playRankUp();
        vibrate([60, 40, 60, 40, 60]);
        bigBurst(0.5, 0.3, 120);
        streamers(30);
        showFlash('milestone');
        showPopup(`RANK UP! ${rankFor(game).emoji}`, 'milestone');
        // Full-screen rank-up celebration — capture old + new rank
        setRankUpEvent({ oldRank: game.rank - 1, newRank: game.rank });
      }
    } else {
      playWrong();
      playRoast();
      vibrate([80, 60, 80]);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      showFlash('bad');
      showPopup('WRONG!', 'bad');
      setRankDisplay(game.rank);
      setRankProgress(game.rankProgress);
    }

    advanceAfter(result, wrongs);
  }

  if (!bank) {
    return <div className="app loading">Loading questions…</div>;
  }

  return (
    <div className={`app ${shake ? 'shake' : ''}`}>
      {flash && <div key={`flash-${flash.id}`} className={`screen-flash ${flash.kind}`} />}
      {popup && <div key={`popup-${popup.id}`} className={`popup ${popup.kind}`}>{popup.text}</div>}
      {screen === 'playing' && timeLeft <= 2 && <div className="danger-vignette" />}

      {rankUpEvent && (
        <div className={`rankup-overlay ${rankUpEvent.newRank === RANKS.length - 1 ? 'summit' : ''}`}>
          <div className="rankup-kicker">
            {rankUpEvent.newRank === RANKS.length - 1 ? '👑 THE SUMMIT 👑' : 'RANK UP!'}
          </div>
          <div className="rankup-emoji-row">
            <span className="rankup-old">{RANKS[rankUpEvent.oldRank].emoji}</span>
            <span className="rankup-arrow">→</span>
            <span className="rankup-new">{RANKS[rankUpEvent.newRank].emoji}</span>
          </div>
          <div className="rankup-title">{RANKS[rankUpEvent.newRank].name}</div>
          {rankUpEvent.newRank < RANKS.length - 1 ? (
            <div className="rankup-next">
              Next: {RANKS[rankUpEvent.newRank + 1].emoji} {RANKS[rankUpEvent.newRank + 1].name}
            </div>
          ) : (
            <div className="rankup-next">You have conquered the Machine. Legend. 👑</div>
          )}
        </div>
      )}

      {screen === 'title' && (
        <div className="screen title-screen">
          <div className="logo">
            <span className="logo-big">QUIZ</span>
            <span className="logo-small">MACHINE</span>
          </div>
          <div className="quizbert-banner">with your host, <strong>Quizbert</strong> 🎩</div>
          <div className="best-score">Best: {best.toLocaleString()} pts</div>
          {bestRank > 0 && (
            <div className="best-rank">Highest rank: {RANKS[bestRank].emoji} {RANKS[bestRank].name}</div>
          )}
          <button className="big-btn play-btn" onClick={startGame}>
            TAP TO PLAY
          </button>
          <div className="title-hint">3 lives · climb the ranks · how far can you get?</div>
          <div className="attribution">Facts verified via Wikipedia · CC BY-SA</div>
        </div>
      )}

      {screen === 'playing' && game && question && (
        <div className="screen game-screen">
          <div className="hud">
            <div className={`lives ${lastResult && !lastResult.correct ? 'just-lost' : ''}`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`heart ${i < game.lives ? 'alive' : 'dead'}`}>♥</span>
              ))}
            </div>
            <div className={`streak ${game.streak >= 5 ? 'hot' : ''}`}>
              {game.streak > 0 ? `🔥 ×${game.streak}` : '—'}
            </div>
            <div className="score">{game.score.toLocaleString()}</div>
            <button
              className={`music-btn ${musicOn ? 'on' : 'off'}`}
              onClick={() => {
                const next = !musicOn;
                setMusicOn(next);
                saveMusicPref(next);
                playTap();
                if (next) startSaloonMusic();
                else stopSaloonMusic();
              }}
              aria-label={musicOn ? 'Mute music' : 'Play music'}
            >
              {musicOn ? '🎹' : '🔇'}
            </button>
          </div>

          <div className="rank-panel">
            <div className="rank-name">
              <span className="rank-emoji">{rankFor(game).emoji}</span>
              <span className="rank-title">{rankFor(game).name}</span>
              {game.rank < RANKS.length - 1 && (
                <span className="rank-next">→ {RANKS[game.rank + 1].emoji} {RANKS[game.rank + 1].name}</span>
              )}
            </div>
            <div className="rank-bar">
              {Array.from({ length: rankFor(game).segments }).map((_, i) => (
                <span key={i} className={`rank-seg ${i < rankProgress ? 'filled' : ''}`} />
              ))}
            </div>
          </div>

          <div className={`timer-bar ${timeLeft <= 5 ? 'danger' : ''} ${timeLeft <= 2 ? 'critical' : ''}`}>
            <div
              className="timer-fill"
              style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
            />
          </div>

          {presentLine && !lastResult && (
            <div className="present-line">
              <span className="quizbert-avatar">🎩</span> {presentLine}
            </div>
          )}

          <div key={question.id} className={`question-card ${game.streak >= 5 ? 'hot' : ''} ${lastResult ? (lastResult.correct ? 'flash-good' : 'flash-bad') : ''}`}>
            <div className="tier-tag">{tierForRank(game.rank).toUpperCase()}</div>
            <div className="question-text">{question.q}</div>
          </div>

          <div key={`answers-${question.id}`} className="answers">
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

          {quizbert && quizbert.kind !== 'gameover' && (
            <div className={`quizbert-full ${quizbert.kind} ${quizbert.laugh ? 'laughing' : ''}`}>
              <div className="quizbert-face">{quizbert.face}</div>
              <div className="quizbert-line">{quizbert.text}</div>
              {quizbert.sponsor && (
                <div className="sponsor-card">
                  <div className="sponsor-kicker">AND NOW A WORD FROM OUR SPONSORS</div>
                  <div className="sponsor-name">{quizbert.sponsor.name}</div>
                  <div className="sponsor-tag">{quizbert.sponsor.tag}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {screen === 'gameover' && (
        <div className="screen gameover-screen">
          <div className="gameover-title">GAME OVER</div>
          {quizbert && (
            <div className="quizbert-verdict">
              <div className="quizbert-face small">{quizbert.face}</div>
              <div className="quizbert-line">{quizbert.text}</div>
            </div>
          )}
          <div className="final-score">{finalScore.toLocaleString()} pts</div>
          <div className="final-rank">{RANKS[finalRank].emoji} Rank reached: {RANKS[finalRank].name}</div>
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
