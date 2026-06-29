# Juggle Master

A football juggling mini-game that lives inside VS Code. Click the ball to keep it in the air — don't let it touch the ground!

---

## Features

- **Playable in the sidebar** — sits in the Explorer panel so you can play without leaving your editor
- **Editor tab mode** — open as a full tab for a bigger canvas
- **Physics-based gameplay** — gravity increases as your streak grows
- **Difficulty scaling** — Normal → Medium → Hard → Expert → Legend based on your streak
- **Sound effects** — procedurally generated kick, milestone, and game over sounds
- **Mute toggle** — one click to silence all sounds
- **Persistent scores** — best streak and total attempts saved across sessions
- **Fully responsive** — adapts to any panel or window size

---

## How to Play

1. Open the **Explorer** sidebar — the Juggle Master panel appears automatically
2. Click **Start** and then click the ball to juggle it
3. Every click on the ball scores +1 — keep the streak going
4. The ball falls faster the longer your streak, increasing difficulty
5. If the ball hits the ground, the run ends

---

## Launch

| Method | Action |
|--------|--------|
| Command Palette | `Ctrl+Shift+P` → type **Juggle Master** |
| Keyboard shortcut | `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) |
| Sidebar | Explorer panel → **Juggle Master** section |

---

## Opening Modes

By default the game opens in the **sidebar**. To switch to a dedicated editor tab:

- Command Palette → **Juggle Master: Switch Launch Mode**
- Or go to **Settings** → search `footballJuggle.openMode` and set it to `editor`

---

## Difficulty Levels

| Streak | Level |
|--------|-------|
| 0 – 9 | Normal |
| 10 – 24 | ⚡ Medium |
| 25 – 49 | 🔥 Hard |
| 50 – 99 | 💎 Expert |
| 100+ | 👑 Legend |

---

## Requirements

VS Code `1.74.0` or higher.

---

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `footballJuggle.openMode` | `sidebar` | Where the game opens — `sidebar` or `editor` |

---

## Contributing

Pull requests are welcome. To run locally:

```bash
git clone https://github.com/subin-shk/juggle-master-vs-code.git
cd juggle-master-vs-code
npm install
npm run compile
# Press F5 in VS Code to launch the Extension Development Host
```
