# Blackjack

A single-deck casino blackjack game with a live win-probability panel. Pure HTML/CSS/JS — no build step, no dependencies.

## ▶️ Play

**[Play now → the-mechanlc.github.io/blackjack](https://the-mechanlc.github.io/blackjack/)**

## Features

- Single-deck blackjack: deal, hit, stand, and double down.
- Bankroll with selectable chip bets; blackjack pays 3:2; dealer stands on all 17s.
- Live win-probability panel that computes exact stand-vs-hit odds from the visible-deck composition (no peeking at the dealer's hole card).

## Run locally

From this directory:

```sh
python3 -m http.server 8001
```

Then open <http://localhost:8001/index.html>.
