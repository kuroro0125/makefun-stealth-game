// vision.js — line of sight and vision cones, occluded by walls and cover.
// A cone is built by casting rays across the guard's view angle and stopping
// each ray at the first solid surface, so shelves and walls carve real shadows.

import { solidRects, solidCircles } from './level.js';

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function pointInCircle(px, py, c) {
  const dx = px - c.x;
  const dy = py - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

// True when the point is inside any solid (a wall, a shelf, a statue, a planter).
export function isBlocked(x, y) {
  for (const r of solidRects()) if (pointInRect(x, y, r)) return true;
  for (const c of solidCircles()) if (pointInCircle(x, y, c)) return true;
  return false;
}

// True when nothing solid stands between (x1, y1) and (x2, y2).
export function hasLineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isBlocked(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

// Cast one ray from (x, y) along `angle` up to `range`; stop at the first solid.
function castRay(x, y, angle, range) {
  const step = 7;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let d = step;
  while (d < range) {
    const px = x + cos * d;
    const py = y + sin * d;
    if (px < 0 || px > 960 || py < 0 || py > 640) break;
    if (isBlocked(px, py)) break;
    d += step;
  }
  return { x: x + cos * d, y: y + sin * d };
}

// The polygon of a guard's vision cone, already clipped by cover.
export function visionConePolygon(guard, range) {
  const half = guard.halfAngle;
  const rays = 16;
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rays; i++) {
    const a = guard.angle - half + (2 * half * i) / rays;
    points.push(castRay(guard.x, guard.y, a, range));
  }
  return points;
}

// Can this guard see the player right now? Range already accounts for the
// player's light and posture; this checks angle and line of sight.
export function canSeePlayer(guard, px, py, range) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 26) return hasLineOfSight(guard.x, guard.y, px, py);
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > guard.halfAngle) return false;
  return hasLineOfSight(guard.x, guard.y, px, py);
}
