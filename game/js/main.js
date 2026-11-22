// main.js — the game loop and state machine for NIGHT ARCHIVE.
// Modes: title -> playing -> spotted (grace) -> caught | won. The scene mode
// freezes a posed moment for screenshots and never advances the simulation.

import { WORLD_W, WORLD_H, SPAWN, PATROLS, CASES } from './level.js';
import { makeGuard, updateGuard, sightRange, alertGuard, raiseSuspicion, GUARD_STATES } from './guards.js';
import { makePlayer, updatePlayer, currentNoise, updatePicking, lootCount, allLootTaken, atExit, caseInReach } from './player.js';
import { canSeePlayer } from './vision.js';
import { drawWorld } from './render.js';
import { ensureAudio, playFootstep, playAlertSting, playCaseClick, playPickup, playWin, playCaught } from './audio.js';
import { applyScene } from './scenes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hudLoot = document.getElementById('hud-loot');
const hudMeter = document.getElementById('hud-meter-fill');
const hudMeterWrap = document.getElementById('hud-meter');
const hudState = document.getElementById('hud-state');
const hudTime = document.getElementById('hud-time');
const hudHint = document.getElementById('hud-hint');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayBody = document.getElementById('overlay-body');
const overlayButton = document.getElementById('overlay-button');

const game = {
  mode: 'title', // title | playing | caught | won | scene
  player: makePlayer(SPAWN.x, SPAWN.y),
  guards: PATROLS.map((p, i) => makeGuard(p, i)),
  detection: 0, // 0..1
  spotted: false,
  graceTimer: 0,
  timesSeen: 0,
  elapsed: 0,
  time: 0, // render clock (frozen in scene mode)
  lastStepIndex: 0,
  wasSeen: false,
};

const input = {
  up: false, down: false, left: false, right: false,
  crouch: false, pick: false,
};

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'crouch', ShiftRight: 'crouch',
  KeyE: 'pick',
};

window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.key] || e.code in KEYMAP) {
    input[KEYMAP[e.code] || KEYMAP[e.key]] = true;
    e.preventDefault();
  }
  if (e.code === 'Enter' || e.code === 'Space') {
    if (game.mode === 'title') startGame();
    else if (game.mode === 'caught' || game.mode === 'won') resetGame();
  }
  if (e.code === 'KeyR' && (game.mode === 'caught' || game.mode === 'won')) resetGame();
});
window.addEventListener('keyup', (e) => {
  if (e.code in KEYMAP) input[KEYMAP[e.code]] = false;
});
overlayButton.addEventListener('click', () => {
  ensureAudio();
  if (game.mode === 'title') startGame();
  else if (game.mode === 'caught' || game.mode === 'won') resetGame();
});
canvas.addEventListener('click', () => ensureAudio());

function grade() {
  if (game.timesSeen === 0 && game.elapsed < 180) return 'S — 影の名人';
  if (game.timesSeen === 0) return 'A — 気づかれず';
  if (game.timesSeen <= 2) return 'B — あと一歩';
  return 'C — なんとか逃げ切った';
}

function showOverlay(title, body, button) {
  overlayTitle.textContent = title;
  overlayBody.innerHTML = body;
  overlayButton.textContent = button;
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function startGame() {
  game.mode = 'playing';
  hideOverlay();
  ensureAudio();
}

function resetGame() {
  const fresh = makePlayer(SPAWN.x, SPAWN.y);
  game.player = fresh;
  game.guards = PATROLS.map((p, i) => makeGuard(p, i));
  game.detection = 0;
  game.spotted = false;
  game.graceTimer = 0;
  game.timesSeen = 0;
  game.elapsed = 0;
  game.mode = 'playing';
  hideOverlay();
  // Cases reset: level.js holds them as module state, shared with the player.
  for (const c of CASES) {
    c.taken = false;
    c.progress = 0;
  }
}

function winGame() {
  game.mode = 'won';
  playWin();
  const mins = Math.floor(game.elapsed / 60);
  const secs = Math.floor(game.elapsed % 60).toString().padStart(2, '0');
  showOverlay(
    '脱出成功 — 夜のアーカイブを制した',
    `戦利品 4/4 を持ち、誰にも気づかれず…いや、${game.timesSeen}回見つかりかけながらも扉を抜けた。<br>` +
      `時間 ${mins}:${secs} ／ 見つかった回数 ${game.timesSeen}回<br>` +
      `評価 <strong>${grade()}</strong>`,
    'もう一度忍び込む',
  );
}

function catchGame() {
  game.mode = 'caught';
  playCaught();
  showOverlay(
    '見つかった…！',
    '警備員に捕まってしまった。影に隠れ、音を立てず、視界の外を歩こう。<br>' +
      'ヒント：ランプの光の外は影。影の中では見つかりにくい。走ると音が聞こえる。',
    'リトライ（Rキー）',
  );
}

function update(dt) {
  game.time += dt;
  game.elapsed += dt;
  const player = game.player;

  updatePlayer(player, input, dt);
  if (player.stepIndex !== game.lastStepIndex) {
    game.lastStepIndex = player.stepIndex;
    playFootstep(player.crouching, player.stepIndex);
  }

  const opened = updatePicking(player, input, dt);
  if (opened === 'opened') {
    playCaseClick();
    playPickup();
  }

  const noise = currentNoise(player);
  for (const guard of game.guards) updateGuard(guard, dt, player, noise);

  // Detection: fill while any guard sees the player, decay otherwise.
  let seen = false;
  let nearestSeen = null;
  for (const guard of game.guards) {
    const range = sightRange(guard, player);
    if (canSeePlayer(guard, player.x, player.y, range)) {
      seen = true;
      nearestSeen = guard;
      break;
    }
  }
  if (seen) {
    const d = Math.hypot(nearestSeen.x - player.x, nearestSeen.y - player.y);
    const rate = 0.55 + Math.max(0, 1 - d / 300) * 0.55;
    game.detection = Math.min(1, game.detection + rate * dt);
    raiseSuspicion(nearestSeen, player.x, player.y, dt * 0.8);
  } else {
    game.detection = Math.max(0, game.detection - 0.28 * dt);
  }

  if (game.detection >= 1 && !game.spotted) {
    game.spotted = true;
    game.graceTimer = 1.5;
    game.timesSeen += 1;
    playAlertSting();
    if (nearestSeen) alertGuard(nearestSeen, player.x, player.y);
  }
  if (game.spotted) {
    game.graceTimer -= dt;
    const stillSeen = game.guards.some((g) => canSeePlayer(g, player.x, player.y, sightRange(g, player)));
    if (!stillSeen) {
      // Escaped the cone in time: the alarm dies down, the meter drains.
      game.spotted = false;
      game.detection = 0.55;
    } else if (game.graceTimer <= 0) {
      catchGame();
      return;
    }
  }

  if (allLootTaken(player) && atExit(player)) {
    winGame();
    return;
  }
}

function render() {
  drawWorld(ctx, {
    guards: game.guards,
    player: game.player,
    detection: game.detection,
    time: game.time,
    allLoot: allLootTaken(game.player),
  });
  updateHud();
}

function updateHud() {
  const player = game.player;
  const loot = lootCount(player);
  hudLoot.textContent = `星図 ${player.charts}/3　アストロラーベ ${player.astrolabe ? '✦' : '—'}　戦利品 ${loot}/4`;
  hudMeter.style.width = `${Math.round(game.detection * 100)}%`;
  hudMeterWrap.classList.toggle('hot', game.detection > 0.6);
  const anyAlerted = game.guards.some((g) => g.state === GUARD_STATES.ALERTED);
  const anySuspicious = game.guards.some((g) => g.state === GUARD_STATES.SUSPICIOUS || g.state === GUARD_STATES.INVESTIGATE);
  hudState.textContent = game.spotted
    ? `見つかった！ 逃げて！ ${game.graceTimer.toFixed(1)}`
    : anyAlerted ? '警戒中 — 追われている' : anySuspicious ? '不審 — 見られているかも' : '未発見';
  hudState.className = game.spotted || anyAlerted ? 'alert' : anySuspicious ? 'warn' : '';
  const mins = Math.floor(game.elapsed / 60);
  const secs = Math.floor(game.elapsed % 60).toString().padStart(2, '0');
  hudTime.textContent = `${mins}:${secs}`;
  const near = caseInReach(player);
  if (game.mode === 'playing') {
    if (near && !near.taken) hudHint.textContent = `E長押しで開錠中…「${near.label}」`;
    else if (allLootTaken(player)) hudHint.textContent = '全て揃った！ 北の出口へ！';
    else hudHint.textContent = 'WASD移動 ／ Shift忍び足 ／ E長押しで開錠 ／ 影に隠れろ';
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.mode === 'playing') update(dt);
  else if (game.mode === 'title') game.time += dt * 0.5;
  render();
  requestAnimationFrame(frame);
}

// Scene poses for screenshots (?scene=cover|shadow|caught).
const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene) {
  applyScene(game, scene);
  game.time = 3.2; // fixed light so every shot is identical
  hideOverlay();
  render();
} else {
  showOverlay(
    'NIGHT ARCHIVE — 夜のアーカイブ',
    '月明かりの資料館に忍び込み、<strong>星図3枚</strong>と<strong>黄金のアストロラーベ</strong>を' +
      '展示ケースから盗み出し、誰にも見つからず北の出口へ。<br><br>' +
      'WASD / 矢印キー：移動（走ると音が立つ）　Shift：忍び足（静かで遅い）<br>' +
      'E長押し：ケースの開錠（少し音がする）　ランプの光の外は影 — 影では見つかりにくい<br>' +
      '見つかると検知メーターが溜まる。満タンになる前に視界から逃げ切ればセーフ。',
    '忍び込む',
  );
  requestAnimationFrame(frame);
}
