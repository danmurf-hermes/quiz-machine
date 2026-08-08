# Quiz Machine 🎰

A pub quiz, made for your phone. Four answers, three lives, eight ranks — and Quizbert, a host with opinions about your answers.

**Play it:** https://danmurf-hermes.github.io/quiz-machine/

## What is it?

Quiz Machine is a quick-fire pub quiz that works great on a phone. Tap to play, answer as many questions as you can, and climb the ranks from 🎟️ Contestant all the way to 👑 Grandmaster. Get three wrong and it's game over — Quizbert will have something to say about it.

## Why you'll like it

- **1,300+ questions** across 10 categories — food, general, geography, history, music, science, sport, TV & film, animals and tech. All fact-checked against Wikipedia.
- **8 ranks to climb** — a progress bar that fills when you're right and drains when you're wrong. Rank up and the questions get harder.
- **Quizbert the host** — roasts you when you're wrong (politely, at first), gives backhanded compliments when you're right, and reads out "words from our sponsors" at milestones.
- **Saloon music** — a rotating playlist of public-domain Scott Joplin piano rolls. Easy MUSIC ON/OFF button if you'd rather have silence.
- **20 seconds per question** — the heartbeat speeds up as time runs out. No dawdling.
- **Made for the pub** — after your first visit, everything's cached, so it works offline. No signal, no problem.
- **No accounts, no tracking, no ads** — just a quiz. Your best score lives in your browser.

## Tech

- React + Vite, static build, no backend
- Questions ship as JSON in `public/data/`
- Deployed to GitHub Pages automatically via GitHub Actions — push to `main`, it goes live

## Credits

- **Questions:** facts verified against Wikipedia (CC BY-SA)
- **Music:** Scott Joplin piano roll recordings, public domain via Wikimedia Commons

## Local dev

```sh
npm install
npm run dev        # dev server
npm run build      # production build to dist/
npx vitest run     # engine tests
```
