// player.js — movement, noise, crouching and lock-picking.
// Running is fast and loud (a noise ring other guards can hear); crouch-walking
// with Shift is slow and silent. Picking a case takes time and is slightly noisy.

import { isBlocked } from './vision.js';
import { CASES, EXIT } from './level.js';

export const RUN_SPEED = 168;
export const CROUCH_SPEED = 72;
export const NOISE_RADIUS_RUN = 135;
export const NOISE_RADIUS_PICK = 95;

export function makePlayer(x, y) {
  return {
    x,
    y,
    r: 12,
    crouching: false,
    moving: false,
    running: false,
    stepTimer: 0,
    stepIndex: 0,
    charts: 0,
    astrolabe: false,
    picking: null, // the case being picked, or null
    noisePulse: 0, // 0..1, animates the noise ring
  };
}

function movePlayer(player, dx, dy, dt) {
  const nx = player.x + dx * dt;
  const ny = player.y + dy * dt;
  if (!isBlocked(nx, player.y)) player.x = nx;
  if (!isBlocked(player.x, ny)) player.y = ny;
  player.x = Math.max(30, Math.min(930, player.x));
  player.y = Math.max(30, Math.min(610, player.y));
}

export function updatePlayer(player, input, dt) {
  player.crouching = !!input.crouch;
  const speed = player.crouching ? CROUCH_SPEED : RUN_SPEED;
  let dx = 0;
  let dy = 0;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  player.moving = dx !== 0 || dy !== 0;
  player.running = player.moving && !player.crouching;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    movePlayer(player, (dx / len) * speed, (dy / len) * speed, dt);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.crouching ? 0.55 : 0.34;
      player.stepIndex += 1;
    }
  }
  if (player.running) {
    player.noisePulse = (player.noisePulse + dt * 1.6) % 1;
  } else {
    player.noisePulse = 0;
  }
}

// The noise event guards hear this frame, or null when silent.
export function currentNoise(player) {
  if (player.running) return { x: player.x, y: player.y, radius: NOISE_RADIUS_RUN };
  if (player.picking) return { x: player.x, y: player.y, radius: NOISE_RADIUS_PICK };
  return null;
}

// The nearest unpicked case within reach, or null.
export function caseInReach(player) {
  for (const c of CASES) {
    if (c.taken) continue;
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    if (Math.hypot(cx - player.x, cy - player.y) < 52) return c;
  }
  return null;
}

// Hold E to pick. Returns 'opened' the frame a case clicks open, else null.
export function updatePicking(player, input, dt) {
  const target = caseInReach(player);
  if (input.pick && target) {
    player.picking = target;
    target.progress += dt;
    if (target.progress >= target.pickTime) {
      target.taken = true;
      target.progress = 0;
      player.picking = null;
      if (target.kind === 'chart') player.charts += 1;
      else player.astrolabe = true;
      return 'opened';
    }
  } else {
    if (player.picking) player.picking.progress = Math.max(0, player.picking.progress - dt * 2);
    player.picking = null;
  }
  return null;
}

export function lootCount(player) {
  return player.charts + (player.astrolabe ? 1 : 0);
}

export function allLootTaken(player) {
  return lootCount(player) >= 4;
}

export function atExit(player) {
  return (
    player.x >= EXIT.x - 6 &&
    player.x <= EXIT.x + EXIT.w + 6 &&
    player.y >= EXIT.y &&
    player.y <= EXIT.y + EXIT.h + 14
  );
}
