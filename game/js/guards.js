// guards.js — patrol, suspicion, investigation and chase.
// A guard walks a learnable loop, turns its head at each waypoint, and only
// leaves the loop when it sees something, hears a noise, or finds a picked case.

import { isBlocked } from './vision.js';
import { isLit } from './level.js';

export const GUARD_STATES = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  INVESTIGATE: 'investigate',
  ALERTED: 'alerted',
};

const PATROL_SPEED = 55;
const INVESTIGATE_SPEED = 85;
const CHASE_SPEED = 115;
const TURN_SPEED = 2.6; // radians per second while scanning

export function makeGuard(waypoints, startIndex) {
  const start = waypoints[startIndex % waypoints.length];
  const next = waypoints[(startIndex + 1) % waypoints.length];
  return {
    x: start.x,
    y: start.y,
    r: 13,
    angle: Math.atan2(next.y - start.y, next.x - start.x),
    halfAngle: 0.61, // ~70 degree cone
    waypoints,
    wpIndex: (startIndex + 1) % waypoints.length,
    state: GUARD_STATES.PATROL,
    waitTimer: 0,
    scanDir: 1,
    investigateX: 0,
    investigateY: 0,
    suspicion: 0, // 0..1, builds while the guard hears or glimpses something
    chaseTimer: 0,
    lastSeenX: 0,
    lastSeenY: 0,
  };
}

// How far this guard can see the player, in pixels. Shadow shortens it a lot,
// crouching shortens it a little more, and an alerted guard sees further.
export function sightRange(guard, player) {
  let range = 280;
  if (!isLit(player.x, player.y)) range = 150;
  if (player.crouching) range *= 0.75;
  if (guard.state === GUARD_STATES.ALERTED) range *= 1.2;
  return range;
}

// Slide a guard around solids: try full move, then each axis alone.
function moveGuard(guard, dx, dy, dt) {
  const nx = guard.x + dx * dt;
  const ny = guard.y + dy * dt;
  if (!isBlocked(nx, guard.y)) guard.x = nx;
  if (!isBlocked(guard.x, ny)) guard.y = ny;
}

function angleToward(guard, tx, ty, dt, speed) {
  const target = Math.atan2(ty - guard.y, tx - guard.x);
  let diff = target - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const step = Math.max(-speed * dt, Math.min(speed * dt, diff));
  guard.angle += step;
  return Math.abs(diff) < 0.05;
}

function walkTo(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  angleToward(guard, tx, ty, dt, 4.5);
  moveGuard(guard, (dx / dist) * speed, (dy / dist) * speed, dt);
  return false;
}

export function updateGuard(guard, dt, player, hearing) {
  // hearing: { x, y, loud } when the player made noise this frame, else null.
  if (hearing) {
    const d = Math.hypot(hearing.x - guard.x, hearing.y - guard.y);
    if (d < hearing.radius && guard.state !== GUARD_STATES.ALERTED) {
      guard.state = GUARD_STATES.INVESTIGATE;
      guard.investigateX = hearing.x;
      guard.investigateY = hearing.y;
      guard.suspicion = Math.max(guard.suspicion, 0.6);
    }
  }

  switch (guard.state) {
    case GUARD_STATES.PATROL: {
      const wp = guard.waypoints[guard.wpIndex];
      if (guard.waitTimer > 0) {
        guard.waitTimer -= dt;
        guard.angle += TURN_SPEED * 0.45 * guard.scanDir * dt;
        if (guard.waitTimer <= 0) guard.scanDir *= -1;
        break;
      }
      if (walkTo(guard, wp.x, wp.y, PATROL_SPEED, dt)) {
        guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
        guard.waitTimer = 0.9; // pause and look around at each corner
      }
      break;
    }
    case GUARD_STATES.SUSPICIOUS: {
      guard.suspicion -= dt * 0.25;
      angleToward(guard, guard.lastSeenX, guard.lastSeenY, dt, TURN_SPEED);
      if (guard.suspicion <= 0) guard.state = GUARD_STATES.PATROL;
      break;
    }
    case GUARD_STATES.INVESTIGATE: {
      if (walkTo(guard, guard.investigateX, guard.investigateY, INVESTIGATE_SPEED, dt)) {
        guard.state = GUARD_STATES.SUSPICIOUS;
        guard.suspicion = 0.7;
        guard.lastSeenX = guard.investigateX;
        guard.lastSeenY = guard.investigateY;
      }
      break;
    }
    case GUARD_STATES.ALERTED: {
      guard.chaseTimer -= dt;
      guard.lastSeenX = player.x;
      guard.lastSeenY = player.y;
      walkTo(guard, player.x, player.y, CHASE_SPEED, dt);
      if (guard.chaseTimer <= 0) {
        guard.state = GUARD_STATES.INVESTIGATE;
        guard.investigateX = player.x;
        guard.investigateY = player.y;
      }
      break;
    }
    default:
      break;
  }
}

// Called when the player is caught in a cone: raise the alarm on this guard.
export function alertGuard(guard, px, py) {
  guard.state = GUARD_STATES.ALERTED;
  guard.chaseTimer = 4;
  guard.lastSeenX = px;
  guard.lastSeenY = py;
}

// Called when a guard glimpses the player but the meter has not filled yet.
export function raiseSuspicion(guard, px, py, amount) {
  if (guard.state === GUARD_STATES.PATROL) {
    guard.suspicion = Math.min(1, guard.suspicion + amount);
    guard.lastSeenX = px;
    guard.lastSeenY = py;
    if (guard.suspicion >= 1) {
      guard.state = GUARD_STATES.SUSPICIOUS;
    }
  }
}
