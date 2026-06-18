# Rust Monument Timer

A simple web-based Rust monument countdown tracker built with HTML, CSS, and JavaScript.

## Features
- Clickable monument cards for each major location
- Start and reset controls for each timer
- Population slider that updates countdown estimates
- Independent timer tracking for each monument
- Local storage saving so timers persist after refresh
- Dark Rust-themed UI with a background image effect
- Simple notification when a timer finishes

## How to Use
1. Open `index.html` in your browser, or run the folder through a local web server.
2. Select a monument from the cards.
3. Adjust the population slider to estimate reset speed.
4. Click **Start Timer** to begin countdowns.
5. Use **Reset** to restart the selected monument timer.

## Files
- `index.html` — main layout
- `style.css` — styling and theme
- `script.js` — timer logic and local storage

## Notes
- The Chinook crate timer is fixed at about 15 minutes.
- Other monument timers are estimated using population-based ranges.
