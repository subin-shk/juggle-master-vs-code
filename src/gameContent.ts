import * as crypto from 'crypto';
import * as vscode from 'vscode';

export function getNonce(): string {
    return crypto.randomBytes(16).toString('hex');
}

export function getWebviewContent(
    webview: vscode.Webview,
    nonce: string,
    savedBestStreak: number,
    savedTotalAttempts: number,
    mode: 'sidebar' | 'editor' = 'sidebar'
): string {
    const safeBest     = Math.max(0, Math.floor(Number(savedBestStreak)   || 0));
    const safeAttempts = Math.max(0, Math.floor(Number(savedTotalAttempts) || 0));

    const csp = [
        `default-src 'none'`,
        `style-src 'unsafe-inline'`,
        `script-src 'nonce-${nonce}'`,
    ].join('; ');

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Juggle Master</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #1a1a2e;
    --panel: #16213e;
    --surface: #0f3460;
    --accent: #4ade80;
    --accent2: #facc15;
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    --red: #f87171;
    --border: rgba(255,255,255,0.08);
    --shadow: rgba(0,0,0,0.5);
  }

  html, body {
    width: 100%; height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: 'Segoe UI', system-ui, sans-serif;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }

  .game-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px clamp(6px, 3%, 12px);
    background: var(--panel);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    min-height: 46px;
    gap: 4px;
    position: relative;
  }

  .score-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    flex: 1;
  }
  .score-label {
    font-size: clamp(7px, 2.5vw, 9px);
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--text-muted);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .score-value {
    font-size: clamp(16px, 6vw, 22px);
    font-weight: 800;
    line-height: 1;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    transition: transform 0.1s;
  }
  .score-value.pulse {
    transform: scale(1.3);
    color: var(--accent2);
  }
  .best-value { color: var(--accent2); }

  .title-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    gap: 6px;
  }
  .title-emoji { font-size: clamp(16px, 5vw, 20px); line-height: 1; }
  .title-text {
    font-size: clamp(7px, 2.5vw, 9px);
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .mute-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 2px;
    opacity: 0.55;
    transition: opacity 0.15s;
  }
  .mute-btn:hover { opacity: 1; }
  .mode-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 10px;
    cursor: pointer;
    margin-top: 3px;
    line-height: 1.4;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .mode-btn:hover {
    color: var(--text);
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.06);
  }

  /* ── Canvas wrapper ── */
  .canvas-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 0;
  }

  #gameCanvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }

  /* ── Overlays ── */
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 30, 0.88);
    backdrop-filter: blur(4px);
    z-index: 10;
    /* Safety net: if card taller than panel, scroll rather than clip */
    overflow-y: auto;
    padding: 6px 4%;
    box-sizing: border-box;
  }
  .overlay-card { flex-shrink: 0; }
  .overlay.hidden { display: none; }

  .overlay-card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: clamp(14px, 5%, 24px) clamp(12px, 5%, 20px);
    text-align: center;
    width: min(92%, 260px);
    box-shadow: 0 24px 48px var(--shadow);
  }

  .overlay-ball {
    font-size: clamp(36px, 14vw, 52px);
    line-height: 1;
    margin-bottom: 8px;
    display: block;
    animation: floatBall 2s ease-in-out infinite;
  }
  @keyframes floatBall {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .overlay-title {
    font-size: clamp(14px, 5vw, 18px);
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 6px;
    color: var(--accent);
  }
  .overlay-sub {
    font-size: clamp(10px, 3.5vw, 12px);
    color: var(--text-muted);
    margin-bottom: 4px;
    line-height: 1.5;
  }

  .btn {
    display: inline-block;
    padding: 9px clamp(14px, 6%, 28px);
    border-radius: 8px;
    font-size: clamp(11px, 3.5vw, 13px);
    font-weight: 700;
    letter-spacing: 1px;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    text-transform: uppercase;
  }
  .btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }
  .btn-primary { background: var(--accent); color: #0a1628; margin-top: 12px; }
  .btn-secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: clamp(9px, 3vw, 11px);
    padding: 5px 12px;
    margin-top: 6px;
  }

  .gameover-scores {
    margin: 10px 0;
    padding: clamp(8px, 3%, 12px);
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
  }
  .gameover-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }
  .gameover-row + .gameover-row {
    border-top: 1px solid var(--border);
    margin-top: 6px;
    padding-top: 6px;
  }
  .gameover-lbl { font-size: clamp(9px, 3vw, 11px); color: var(--text-muted); }
  .gameover-val { font-size: clamp(14px, 5vw, 18px); font-weight: 800; color: var(--accent2); }
  .gameover-val.new-record::after {
    content: ' 🏆';
    font-size: 14px;
  }

  .gameover-title {
    font-size: clamp(16px, 6vw, 20px);
    font-weight: 800;
    color: var(--red);
    margin-bottom: 4px;
  }

  /* ── Stats bar ── */
  .stats-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px clamp(6px, 3%, 12px);
    background: var(--panel);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
    min-height: 26px;
    gap: 4px;
    overflow: hidden;
  }
  .stats-bar span {
    font-size: clamp(9px, 3vw, 10px);
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .stats-bar strong { color: var(--text); }

  .difficulty-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    background: rgba(255,255,255,0.08);
    color: var(--text-muted);
  }
  .difficulty-badge.medium { background: rgba(250,204,21,0.15); color: var(--accent2); }
  .difficulty-badge.hard { background: rgba(251,113,133,0.15); color: #f87171; }
  .difficulty-badge.expert { background: rgba(168,85,247,0.15); color: #c084fc; }
  .difficulty-badge.legend { background: rgba(239,68,68,0.15); color: #ef4444; animation: legendPulse 1s ease-in-out infinite; }
  @keyframes legendPulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }

  /* ── Achievement toast ── */
  .achievement-toast {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%) translateY(-80px);
    background: linear-gradient(135deg, #1e3a5f, #0f3460);
    border: 1px solid rgba(74,222,128,0.4);
    border-radius: 12px;
    padding: 10px 18px;
    text-align: center;
    z-index: 20;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
    opacity: 0;
    white-space: nowrap;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  .achievement-toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  .achievement-toast .badge-icon { font-size: 22px; display: block; }
  .achievement-toast .badge-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent2);
  }
  .achievement-toast .badge-sub {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* ── Pause indicator ── */
  .pause-hint {
    position: absolute;
    bottom: 8px;
    right: 10px;
    font-size: 9px;
    color: rgba(255,255,255,0.2);
    z-index: 5;
    pointer-events: none;
  }

  /* ── Sidebar compact mode: 2 thin lines of chrome ── */
  [data-mode="sidebar"] .header {
    min-height: 28px;
    padding: 0 8px;
    gap: 6px;
  }
  /* Score blocks go horizontal: label + value side-by-side */
  [data-mode="sidebar"] .score-block {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  [data-mode="sidebar"] .score-label {
    font-size: 8px;
    letter-spacing: 0.5px;
  }
  [data-mode="sidebar"] .score-value {
    font-size: clamp(13px, 4.5vw, 16px);
  }
  /* Title: just the ball emoji, hide text */
  [data-mode="sidebar"] .title-area  { gap: 4px; }
  [data-mode="sidebar"] .mute-btn    { font-size: 11px; right: 4px; }
  [data-mode="sidebar"] .title-emoji { font-size: 14px; }
  [data-mode="sidebar"] .title-text  { display: none; }
  [data-mode="sidebar"] .mode-btn    { margin-top: 0; font-size: 9px; padding: 1px 5px; }
  /* Stats bar: thinner second line */
  [data-mode="sidebar"] .stats-bar {
    min-height: 20px;
    padding: 2px 8px;
  }
  [data-mode="sidebar"] .stats-bar span   { font-size: 9px; }
  [data-mode="sidebar"] .difficulty-badge { font-size: 9px; padding: 1px 4px; }
  /* Compact achievement toast */
  [data-mode="sidebar"] .achievement-toast { padding: 6px 12px; }
  [data-mode="sidebar"] .achievement-toast .badge-icon  { font-size: 16px; }
  [data-mode="sidebar"] .achievement-toast .badge-title { font-size: 9px; }
  [data-mode="sidebar"] .achievement-toast .badge-sub   { font-size: 8px; }

  /* Compact overlay cards — shrink to fit short panels */
  [data-mode="sidebar"] .overlay-card {
    padding: clamp(10px, 4%, 16px);
  }
  [data-mode="sidebar"] .overlay-ball {
    font-size: clamp(22px, 9vw, 34px);
    margin-bottom: 4px;
  }
  [data-mode="sidebar"] .overlay-title {
    font-size: clamp(11px, 4vw, 14px);
    margin-bottom: 3px;
  }
  [data-mode="sidebar"] .overlay-sub {
    font-size: clamp(9px, 3vw, 10px);
    margin-bottom: 2px;
    line-height: 1.4;
  }
  [data-mode="sidebar"] .btn-primary  { margin-top: 8px; }
  [data-mode="sidebar"] .btn-secondary { margin-top: 5px; }
  [data-mode="sidebar"] .gameover-title {
    font-size: clamp(13px, 5vw, 16px);
    margin-bottom: 2px;
  }
  [data-mode="sidebar"] .gameover-scores {
    margin: 6px 0;
    padding: clamp(6px, 3%, 10px);
  }
  [data-mode="sidebar"] .gameover-lbl { font-size: 9px; }
  [data-mode="sidebar"] .gameover-val { font-size: clamp(12px, 4.5vw, 15px); }
  [data-mode="sidebar"] .gameover-row { padding: 3px 0; }
  [data-mode="sidebar"] .gameover-row + .gameover-row {
    margin-top: 4px; padding-top: 4px;
  }
</style>
</head>
<body>
<div class="game-root" data-mode="${mode}">

  <!-- Header -->
  <div class="header">
    <div class="score-block">
      <span class="score-label">Streak</span>
      <span class="score-value" id="streakDisplay">0</span>
    </div>
    <div class="title-area">
      <span class="title-emoji">⚽</span>
      <span class="title-text">Juggle Master</span>
      ${mode === 'sidebar' ? '<button id="modeBtn" class="mode-btn" title="Open in Editor Tab">⧉ Tab</button>' : ''}
    </div>
    <button id="muteBtn" class="mute-btn" title="Toggle Sound">🔊</button>
    <div class="score-block">
      <span class="score-label">Best</span>
      <span class="score-value best-value" id="bestDisplay">${safeBest}</span>
    </div>
  </div>

  <!-- Canvas area -->
  <div class="canvas-wrapper">
    <canvas id="gameCanvas"></canvas>

    <!-- Start screen -->
    <div class="overlay" id="startScreen">
      <div class="overlay-card">
        <span class="overlay-ball">⚽</span>
        <div class="overlay-title">FOOTBALL JUGGLE</div>
        <p class="overlay-sub">Click the ball to keep it in the air.<br>Don't let it touch the ground!</p>
        <p class="overlay-sub" style="margin-top:6px; font-size:11px;">
          Space / P to pause &nbsp;·&nbsp; R to restart
        </p>
        <button class="btn btn-primary" id="startBtn">START GAME</button>
      </div>
    </div>

    <!-- Game over screen -->
    <div class="overlay hidden" id="gameOverScreen">
      <div class="overlay-card">
        <div class="gameover-title">GAME OVER</div>
        <p class="overlay-sub">The ball hit the ground!</p>
        <div class="gameover-scores">
          <div class="gameover-row">
            <span class="gameover-lbl">Final Score</span>
            <span class="gameover-val" id="finalScore">0</span>
          </div>
          <div class="gameover-row">
            <span class="gameover-lbl">Best Streak</span>
            <span class="gameover-val" id="bestScoreDisplay">0</span>
          </div>
          <div class="gameover-row">
            <span class="gameover-lbl">Total Attempts</span>
            <span class="gameover-val" id="attemptsDisplay" style="font-size:14px;color:var(--text-muted)">0</span>
          </div>
        </div>
        <button class="btn btn-primary" id="restartBtn">PLAY AGAIN</button>
        <br>
        <button class="btn btn-secondary" id="cancelBtn">Close</button>
      </div>
    </div>

    <!-- Pause screen -->
    <div class="overlay hidden" id="pauseScreen">
      <div class="overlay-card">
        <span class="overlay-ball" style="animation:none">⏸</span>
        <div class="overlay-title" style="color:var(--accent2)">PAUSED</div>
        <p class="overlay-sub">Press Space or P to resume</p>
        <button class="btn btn-primary" id="resumeBtn">RESUME</button>
      </div>
    </div>

    <!-- Achievement toast -->
    <div class="achievement-toast" id="achievementToast">
      <span class="badge-icon" id="toastIcon">🌟</span>
      <div class="badge-title" id="toastTitle">Achievement!</div>
      <div class="badge-sub" id="toastSub">Streak x10</div>
    </div>

    <div class="pause-hint">Space / P = pause &nbsp; R = restart</div>
  </div>

  <!-- Stats bar -->
  <div class="stats-bar">
    <span>Attempts: <strong id="attemptsBar">${safeAttempts}</strong></span>
    <span class="difficulty-badge" id="diffBadge">Normal</span>
  </div>
</div>

<script nonce="${nonce}">
(function() {
  'use strict';

  // ── VS Code API ──────────────────────────────────────────────────
  const vscodeApi = (typeof acquireVsCodeApi === 'function') ? acquireVsCodeApi() : null;
  function postMsg(msg) { if (vscodeApi) vscodeApi.postMessage(msg); }
  const LAUNCH_MODE = '${mode}';

  // ── Elements ─────────────────────────────────────────────────────
  const canvas        = document.getElementById('gameCanvas');
  const ctx           = canvas.getContext('2d');
  const startScreen   = document.getElementById('startScreen');
  const gameOverScreen= document.getElementById('gameOverScreen');
  const pauseScreen   = document.getElementById('pauseScreen');
  const streakDisplay = document.getElementById('streakDisplay');
  const bestDisplay   = document.getElementById('bestDisplay');
  const finalScoreEl  = document.getElementById('finalScore');
  const bestScoreEl   = document.getElementById('bestScoreDisplay');
  const attemptsEl    = document.getElementById('attemptsDisplay');
  const attemptsBar   = document.getElementById('attemptsBar');
  const diffBadge     = document.getElementById('diffBadge');
  const toast         = document.getElementById('achievementToast');
  const toastIcon     = document.getElementById('toastIcon');
  const toastTitle    = document.getElementById('toastTitle');
  const toastSub      = document.getElementById('toastSub');

  // ── Game constants ────────────────────────────────────────────────
  const BASE_GRAVITY      = 0.32;
  const GRAVITY_STEP      = 0.005;
  const JUMP_VELOCITY     = -13;
  const MAX_VX            = 5;
  const SQUASH_FRAMES     = 10;
  const GROUND_HEIGHT     = 28;
  const BALL_RADIUS_FRAC  = 0.088; // fraction of canvas width
  const MIN_BALL_R        = 18;
  const MAX_BALL_R        = 32;

  const ACHIEVEMENTS = [
    { streak: 10,  icon: '🌟', title: 'ROOKIE',  sub: '10 juggles!' },
    { streak: 25,  icon: '⭐', title: 'PRO',     sub: '25 juggles!' },
    { streak: 50,  icon: '🏆', title: 'ELITE',   sub: '50 juggles!' },
    { streak: 100, icon: '👑', title: 'LEGEND',  sub: '100 juggles!' },
  ];

  // ── State ─────────────────────────────────────────────────────────
  let state = 'start'; // 'start' | 'playing' | 'paused' | 'gameover'
  let bestStreak    = ${safeBest};
  let totalAttempts = ${safeAttempts};
  let streak        = 0;
  let gravity       = BASE_GRAVITY;
  let rafId         = null;
  let prevState     = null; // state before pause

  let ball = {};
  let particles = [];    // click ripples
  let floaters  = [];    // "+1" floating text
  let screenFlash = 0;   // frames of white flash

  // Logical canvas dimensions in CSS pixels (game logic always uses these,
  // not canvas.width/height which are in physical pixels on HiDPI displays).
  let canvasW = 300;
  let canvasH = 400;

  // ── Audio ─────────────────────────────────────────────────────────
  let audioCtx = null;
  let muted = false;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }

  function playTone(freq, endFreq, dur, vol, type) {
    if (muted) return;
    const ac = getAudio(); if (!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ac.currentTime);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur + 0.01);
  }

  function playKick() {
    playTone(280, 60, 0.12, 0.35, 'sine');
    playTone(180, 50, 0.08, 0.2, 'triangle');
  }

  function playMilestone() {
    const ac = getAudio(); if (!ac) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, f * 1.1, 0.18, 0.25, 'sine'), i * 70);
    });
  }

  function playGameOver() {
    playTone(400, 80, 0.6, 0.4, 'sawtooth');
    setTimeout(() => playTone(200, 60, 0.4, 0.2, 'sine'), 100);
  }

  // ── Canvas sizing ──────────────────────────────────────────────────
  function resize() {
    const wrapper = canvas.parentElement;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);

    canvasW = wrapper.clientWidth  || 300;
    canvasH = wrapper.clientHeight || 400;

    // Physical pixel buffer — sharp on HiDPI/Retina displays
    canvas.width  = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    // CSS display size stays at logical pixels
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    // Scale context so all draw calls use CSS pixel coordinates
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (ball.x !== undefined) {
      // Update ball radius and clamp position for new dimensions
      ball.r = Math.min(MAX_BALL_R, Math.max(MIN_BALL_R, Math.floor(canvasW * BALL_RADIUS_FRAC)));
      ball.x = Math.min(Math.max(ball.x, ball.r), canvasW - ball.r);
      ball.y = Math.min(ball.y, canvasH - GROUND_HEIGHT - ball.r - 1);
    }
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  // ── Ball init ─────────────────────────────────────────────────────
  function initBall() {
    const r = Math.min(MAX_BALL_R, Math.max(MIN_BALL_R,
                Math.floor(canvasW * BALL_RADIUS_FRAC)));
    ball = {
      x: canvasW / 2,
      y: canvasH * 0.4,
      vx: (Math.random() - 0.5) * 2,
      vy: -3,
      r,
      rot: 0,
      sx: 1, sy: 1,
      squash: 0,
    };
  }

  // ── Football drawing ──────────────────────────────────────────────
  function pentagon(cx, cy, r, startAngle) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = startAngle + (i / 5) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawBall() {
    const { x, y, r, rot, sx, sy } = ball;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sx, sy);

    // Shadow
    ctx.save();
    ctx.translate(2, r * 0.9);
    const sg = ctx.createRadialGradient(0,0,0, 0,0,r*0.75);
    sg.addColorStop(0, 'rgba(0,0,0,0.45)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.scale(1, 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, 0, Math.PI*2);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    // Base colour
    ctx.fillStyle = '#f0f0ee';
    ctx.fill();

    // Gradient sheen
    const grad = ctx.createRadialGradient(-r*0.35, -r*0.35, r*0.05, 0, 0, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Black patches
    ctx.fillStyle = '#1c1c1c';
    // Centre pentagon
    pentagon(0, 0, r * 0.3, -Math.PI / 2);
    ctx.fill();
    // 5 surrounding
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      pentagon(Math.cos(a)*r*0.66, Math.sin(a)*r*0.66, r*0.3, a + Math.PI);
      ctx.fill();
    }
    ctx.restore();

    // Outline
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ── Ground & background ───────────────────────────────────────────
  function drawBackground() {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, canvasH);
    sky.addColorStop(0, '#0d1b2a');
    sky.addColorStop(1, '#1a2d44');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle crowd silhouette at top
    drawCrowd();

    // Pitch lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const cx = canvasW / 2;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, canvasH - GROUND_HEIGHT);
    ctx.stroke();

    // Ground
    const gY = canvasH - GROUND_HEIGHT;
    const gGrad = ctx.createLinearGradient(0, gY, 0, canvasH);
    gGrad.addColorStop(0, '#2d5a27');
    gGrad.addColorStop(0.3, '#1e3d19');
    gGrad.addColorStop(1, '#0f1e0d');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, gY, canvasW, GROUND_HEIGHT);

    // Grass line highlight
    ctx.fillStyle = '#3a7a32';
    ctx.fillRect(0, gY, canvasW, 3);

    // Danger zone glow when ball is low
    if (state === 'playing') {
      const dist = (canvasH - GROUND_HEIGHT) - (ball.y + ball.r);
      if (dist < 60) {
        const alpha = Math.min(0.35, (60 - dist) / 60 * 0.35);
        const dangerGrad = ctx.createLinearGradient(0, gY - 60, 0, gY);
        dangerGrad.addColorStop(0, 'rgba(220,50,50,0)');
        dangerGrad.addColorStop(1, 'rgba(220,50,50,' + alpha + ')');
        ctx.fillStyle = dangerGrad;
        ctx.fillRect(0, gY - 60, canvasW, 60);
      }
    }
  }

  function drawCrowd() {
    const w = canvasW;
    const yBase = canvasH * 0.08;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < Math.floor(w / 8); i++) {
      const x = i * 8 + 4;
      const h = 6 + Math.sin(i * 1.7) * 3;
      ctx.beginPath();
      ctx.arc(x, yBase - h, 3, 0, Math.PI);
      ctx.fill();
    }
  }

  // ── Particles ─────────────────────────────────────────────────────
  function spawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      particles.push({
        x, y,
        vx: Math.cos(a) * (2 + Math.random() * 2),
        vy: Math.sin(a) * (2 + Math.random() * 2),
        life: 1,
        r: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#4ade80' : '#facc15'
      });
    }
  }

  function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.15;
      p.life -= 0.06;
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Floaters "+1" ────────────────────────────────────────────────
  function spawnFloater(x, y) {
    floaters.push({ x, y, vy: -2.5, life: 1 });
  }

  function updateFloaters() {
    floaters = floaters.filter(f => f.life > 0);
    floaters.forEach(f => { f.y += f.vy; f.life -= 0.035; });
  }

  function drawFloaters() {
    floaters.forEach(f => {
      ctx.save();
      ctx.globalAlpha = f.life;
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 14px "Segoe UI", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+1', f.x, f.y);
      ctx.restore();
    });
  }

  // ── Screen flash ────────────────────────────────────────────────
  function drawFlash() {
    if (screenFlash <= 0) return;
    ctx.save();
    ctx.globalAlpha = (screenFlash / 8) * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
    screenFlash--;
  }

  // ── Main update ───────────────────────────────────────────────────
  function update() {
    if (state !== 'playing') return;

    // Apply gravity
    ball.vy += gravity;

    // Move
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Rotate (based on vx)
    ball.rot += ball.vx * 0.04;

    // Wall collisions
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx) * 0.75;
    }
    if (ball.x + ball.r > canvasW) {
      ball.x = canvasW - ball.r;
      ball.vx = -Math.abs(ball.vx) * 0.75;
    }

    // Squash animation
    if (ball.squash > 0) {
      ball.squash--;
      const t = ball.squash / SQUASH_FRAMES;
      ball.sx = 1 + 0.32 * t;
      ball.sy = 1 - 0.32 * t;
    } else {
      ball.sx = 1; ball.sy = 1;
    }

    // Ground collision → game over
    if (ball.y + ball.r >= canvasH - GROUND_HEIGHT) {
      ball.y = canvasH - GROUND_HEIGHT - ball.r;
      endGame();
    }

    updateParticles();
    updateFloaters();
  }

  // ── Main draw ─────────────────────────────────────────────────────
  function draw() {
    drawBackground();
    if (state === 'playing' || state === 'paused') drawBall();
    drawParticles();
    drawFloaters();
    drawFlash();
  }

  // ── Game loop ────────────────────────────────────────────────────
  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // ── Difficulty ────────────────────────────────────────────────────
  function updateDifficulty() {
    gravity = BASE_GRAVITY + streak * GRAVITY_STEP;

    let label = 'Normal', cls = '';
    if (streak >= 100) { label = '👑 Legend'; cls = 'legend'; }
    else if (streak >= 50) { label = '💎 Expert'; cls = 'expert'; }
    else if (streak >= 25) { label = '🔥 Hard';   cls = 'hard'; }
    else if (streak >= 10) { label = '⚡ Medium';  cls = 'medium'; }

    diffBadge.textContent = label;
    diffBadge.className = 'difficulty-badge ' + cls;
  }

  // ── Score display ────────────────────────────────────────────────
  function updateHUD() {
    streakDisplay.textContent = streak;
    bestDisplay.textContent   = bestStreak;
    attemptsBar.textContent   = totalAttempts;

    // Pulse streak number
    streakDisplay.classList.remove('pulse');
    void streakDisplay.offsetWidth; // reflow
    streakDisplay.classList.add('pulse');
    setTimeout(() => streakDisplay.classList.remove('pulse'), 150);
  }

  // ── Achievements ────────────────────────────────────────────────
  let toastTimer = null;
  function checkAchievements(s) {
    const ach = ACHIEVEMENTS.find(a => a.streak === s);
    if (!ach) return;
    showToast(ach.icon, ach.title, ach.sub);
    playMilestone();
  }

  function showToast(icon, title, sub) {
    if (toastTimer) clearTimeout(toastTimer);
    toastIcon.textContent  = icon;
    toastTitle.textContent = title;
    toastSub.textContent   = sub;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ── Kick ball ────────────────────────────────────────────────────
  function kickBall(clickX, clickY) {
    if (state !== 'playing') return;

    const dx = clickX - ball.x;
    const dy = clickY - ball.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Match visual ball exactly — coords are pixel-perfect via offsetX/Y
    if (dist > ball.r) return;

    // Upward impulse — scaled so the ball jumps at most 35% of canvas height.
    // Prevents the ball flying off-screen in tall panel views.
    const maxJumpPx = Math.min(canvasH * 0.35, 220);
    ball.vy = -Math.sqrt(2 * BASE_GRAVITY * maxJumpPx);

    // Horizontal nudge based on click position within ball
    const nudge = (dx / ball.r) * 3.5;
    ball.vx = Math.max(-MAX_VX, Math.min(MAX_VX, ball.vx + nudge + (Math.random()-0.5)));

    // Squash
    ball.squash = SQUASH_FRAMES;
    ball.sx = 1.35; ball.sy = 0.65;

    // Particles & floaters
    spawnParticles(ball.x, ball.y + ball.r);
    spawnFloater(ball.x, ball.y - ball.r - 6);
    screenFlash = 6;

    streak++;
    if (streak > bestStreak) bestStreak = streak;

    updateHUD();
    updateDifficulty();
    checkAchievements(streak);
    playKick();
    saveScore();
  }

  // ── Start / End / Restart ─────────────────────────────────────────
  function startGame() {
    streak   = 0;
    gravity  = BASE_GRAVITY;
    particles = []; floaters = [];
    totalAttempts++;
    attemptsBar.textContent = totalAttempts;

    initBall();
    updateHUD();
    updateDifficulty();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');

    state = 'playing';
    if (!rafId) { rafId = requestAnimationFrame(loop); }

    saveScore();
  }

  function endGame() {
    state = 'gameover';
    playGameOver();

    finalScoreEl.textContent     = streak;
    bestScoreEl.textContent      = bestStreak;
    attemptsEl.textContent       = totalAttempts;

    // Highlight new record
    bestScoreEl.className = 'gameover-val' + (streak === bestStreak && streak > 0 ? ' new-record' : '');

    setTimeout(() => gameOverScreen.classList.remove('hidden'), 400);
    saveScore();
  }

  function pauseGame() {
    if (state !== 'playing') return;
    prevState = state;
    state = 'paused';
    pauseScreen.classList.remove('hidden');
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    pauseScreen.classList.add('hidden');
  }

  // ── Persistence ───────────────────────────────────────────────────
  function saveScore() {
    postMsg({ type: 'saveScore', bestStreak, totalAttempts });
  }

  // ── Input ─────────────────────────────────────────────────────────
  // pointerdown unifies mouse + touch; offsetX/Y are element-relative — no
  // viewport offset maths needed, works correctly in VS Code webview frames.
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    kickBall(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());

  // Visual cursor feedback: pointer when hovering over the ball
  canvas.addEventListener('pointermove', e => {
    if (state !== 'playing') return;
    const over = Math.hypot(e.offsetX - ball.x, e.offsetY - ball.y) <= ball.r;
    canvas.style.cursor = over ? 'pointer' : 'crosshair';
  });

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startGame();
  });
  document.getElementById('resumeBtn').addEventListener('click', resumeGame);
  document.getElementById('cancelBtn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    state = 'start';
  });

  const modeBtnEl = document.getElementById('modeBtn');
  if (modeBtnEl) {
    modeBtnEl.addEventListener('click', () => postMsg({ type: 'openInEditor' }));
  }

  document.getElementById('muteBtn').addEventListener('click', () => {
    muted = !muted;
    document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
  });

  document.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
      case ' ':
      case 'p':
        e.preventDefault();
        if (state === 'playing') pauseGame();
        else if (state === 'paused') resumeGame();
        break;
      case 'r':
        if (state === 'playing' || state === 'gameover' || state === 'paused') {
          gameOverScreen.classList.add('hidden');
          pauseScreen.classList.add('hidden');
          startGame();
        }
        break;
      case 'enter':
        if (state === 'start') startGame();
        else if (state === 'gameover') {
          gameOverScreen.classList.add('hidden');
          startGame();
        }
        break;
    }
  });

  // ── Messages from extension ───────────────────────────────────────
  window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'updateScore') {
      bestStreak    = msg.bestStreak    || bestStreak;
      totalAttempts = msg.totalAttempts || totalAttempts;
      bestDisplay.textContent  = bestStreak;
      attemptsBar.textContent  = totalAttempts;
    }
  });

  // ── Boot ──────────────────────────────────────────────────────────
  // Draw static background so panel isn't blank
  resize();
  draw();
  // Start loop for idle animation on start screen
  rafId = requestAnimationFrame(loop);

})();
</script>
</body>
</html>`;
}
