# Quiz Machine 🎰

The pub quiz machine, at home. 4-answer questions, 3 lives, an 8-rank ladder, and Quizbert — a host with opinions about your answers.

**Play it:** https://danmurf-hermes.github.io/quiz-machine/

## Features

- **1,300+ questions** across 10 categories (food, general, geography, history, music, science, sport, TV & film, animals, tech), fact-checked against Wikipedia
- **8-rank progression ladder** — 🍺 Glass Collector up to 👑 Machine Master, with a segmented progress bar that fills on correct answers and drains on wrong ones
- **Quizbert the host** — roasts you for wrong answers (politely escalating), dishes backhanded compliments when you're right, and delivers "words from our sponsors" at milestones
- **Public-domain saloon music** — a rotating playlist of Scott Joplin piano rolls (The Entertainer, Maple Leaf Rag and more), with an easy MUSIC ON/OFF toggle
- **20-second question timer** with accelerating heartbeat and a red vignette as time runs out
- **Game juice everywhere** — confetti, screen shake, floating score popups, rank-up celebration screens with fanfare, haptics on mobile
- **PWA-lite** — service worker caches everything so it works offline in the pub after first visit

## Tech

- React 19 + Vite 8, static build, no backend
- Questions ship as JSON in `public/data/` (easy/medium/hard tiers)
- localStorage for best score + seen questions (no accounts, no tracking)
- Deployed via GitHub Pages (gh-pages branch)

## Credits

- **Questions:** facts verified against Wikipedia (CC BY-SA). The `cat` field in the data files carries the category tag.
- **Music:** Scott Joplin piano roll recordings (public domain, via Wikimedia Commons). Joplin died in 1917; the compositions are public domain.

## Local dev

```sh
npm install
npm run dev        # dev server
npm run build      # production build to dist/
npx vitest run     # engine tests
```
