// render.js — draws the whole archive hall on one canvas: parquet floor,
// moonlight, warm lamp pools, cover, display cases, guards with their cones,
// and the thief. Lighting is drawn so the eye can read what is safe at a glance.

import { WORLD_W, WORLD_H, WALLS, SHELVES, STATUES, PLANTERS, CASES, LAMPS, MOONBEAMS, EXIT, isLit } from './level.js';
import { visionConePolygon } from './vision.js';
import { sightRange, GUARD_STATES } from './guards.js';

function drawFloor(ctx) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // Parquet tiles.
  ctx.strokeStyle = 'rgba(120, 84, 48, 0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_W; x += 40) {
    for (let y = 0; y < WORLD_H; y += 40) {
      ctx.fillStyle = (x / 40 + y / 40) % 2 === 0 ? '#2e2115' : '#2a1d12';
      ctx.fillRect(x, y, 40, 40);
      ctx.strokeRect(x + 0.5, y + 0.5, 40, 40);
    }
  }
  // A faded central rug.
  ctx.fillStyle = '#4a2430';
  ctx.fillRect(300, 240, 360, 160);
  ctx.strokeStyle = '#c9a24b';
  ctx.lineWidth = 2;
  ctx.strokeRect(308, 248, 344, 144);
  ctx.strokeStyle = 'rgba(201, 162, 75, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(320, 260, 320, 120);
}

function drawMoonbeams(ctx) {
  for (const beam of MOONBEAMS) {
    const grad = ctx.createLinearGradient(beam.x, beam.y, beam.x, beam.y + beam.h);
    grad.addColorStop(0, 'rgba(150, 180, 230, 0.20)');
    grad.addColorStop(1, 'rgba(150, 180, 230, 0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(beam.x, beam.y, beam.w, beam.h);
  }
}

function drawLamps(ctx, time) {
  for (const lamp of LAMPS) {
    const flicker = 0.92 + 0.08 * Math.sin(time * 2.1 + lamp.x);
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r * flicker);
    grad.addColorStop(0, 'rgba(255, 196, 110, 0.34)');
    grad.addColorStop(0.6, 'rgba(255, 180, 90, 0.12)');
    grad.addColorStop(1, 'rgba(255, 180, 90, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r * flicker, 0, Math.PI * 2);
    ctx.fill();
    // The lamp itself: a small brass stand.
    ctx.fillStyle = '#8a6a2f';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDarkness(ctx) {
  // Everything outside the light pools sinks into shadow.
  ctx.fillStyle = 'rgba(6, 8, 18, 0.42)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

function drawWalls(ctx) {
  ctx.fillStyle = '#3a2c1e';
  for (const w of WALLS) ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = '#57402a';
  for (const w of WALLS) {
    if (w.w > w.h) ctx.fillRect(w.x, w.y + w.h - 4, w.w, 4);
    else ctx.fillRect(w.x + w.w - 4, w.y, 4, w.h);
  }
  // High windows on the north wall.
  ctx.fillStyle = '#7d9cc9';
  ctx.fillRect(110, 2, 100, 16);
  ctx.fillRect(750, 2, 100, 16);
  ctx.strokeStyle = '#3a2c1e';
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 2, 100, 16);
  ctx.strokeRect(750, 2, 100, 16);
}

function drawShelves(ctx) {
  for (const s of SHELVES) {
    ctx.fillStyle = '#4b2f1a';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#5d3c22';
    ctx.fillRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
    // Book spines.
    const horizontal = s.w > s.h;
    const count = Math.floor((horizontal ? s.w : s.h) / 9);
    for (let i = 0; i < count; i++) {
      const hue = ['#7a4a3a', '#4a6a7a', '#6a7a4a', '#8a6a3a', '#5a4a7a'][i % 5];
      ctx.fillStyle = hue;
      if (horizontal) ctx.fillRect(s.x + 5 + i * 9, s.y + 6, 6, s.h - 12);
      else ctx.fillRect(s.x + 6, s.y + 5 + i * 9, s.w - 12, 6);
    }
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x, s.y, s.w, s.h);
  }
}

function drawStatuesAndPlanters(ctx) {
  for (const s of STATUES) {
    ctx.fillStyle = '#5a5f6a';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d8390';
    ctx.beginPath();
    ctx.arc(s.x - 3, s.y - 3, s.r - 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#33363e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of PLANTERS) {
    ctx.fillStyle = '#2e5a2e';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f7a3f';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * 8, p.y + Math.sin(a) * 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6a4a2a';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCases(ctx, time) {
  for (const c of CASES) {
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    if (!c.taken) {
      const glow = 0.5 + 0.3 * Math.sin(time * 2 + c.x);
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 46);
      grad.addColorStop(0, c.kind === 'astrolabe' ? `rgba(255, 214, 110, ${0.5 * glow + 0.25})` : `rgba(140, 190, 255, ${0.4 * glow + 0.2})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1d2733';
    ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
    ctx.fillStyle = c.taken ? '#2a3542' : 'rgba(180, 215, 255, 0.35)';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#c9a24b';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    if (!c.taken) {
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = c.kind === 'astrolabe' ? '#ffd66e' : '#bcd8ff';
      ctx.fillText(c.kind === 'astrolabe' ? '✦' : '✧', cx, cy + 1);
    }
    // Lock-pick progress ring while the thief works on this case.
    if (c.progress > 0 && !c.taken) {
      const frac = c.progress / c.pickTime;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.strokeStyle = '#ffd66e';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }
}

function drawExit(ctx, allLoot) {
  const open = allLoot;
  ctx.fillStyle = open ? '#2e6a4a' : '#4a2c2c';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = open ? '#7ddba4' : '#8a5a5a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT — 開いている' : 'EXIT — 鍵がかかっている', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 8);
  ctx.strokeStyle = '#c9a24b';
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
}

function drawCones(ctx, guards, player) {
  for (const g of guards) {
    const range = sightRange(g, player);
    const poly = visionConePolygon(g, range);
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    const alerted = g.state === GUARD_STATES.ALERTED;
    const suspicious = g.state === GUARD_STATES.SUSPICIOUS || g.state === GUARD_STATES.INVESTIGATE;
    ctx.fillStyle = alerted
      ? 'rgba(255, 64, 48, 0.34)'
      : suspicious
        ? 'rgba(255, 176, 48, 0.30)'
        : 'rgba(255, 214, 110, 0.20)';
    ctx.fill();
    ctx.strokeStyle = alerted ? 'rgba(255, 80, 60, 0.7)' : 'rgba(255, 220, 130, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    // A small "?" / "!" above a guard that is growing suspicious or alerted.
    if (g.state === GUARD_STATES.SUSPICIOUS || g.state === GUARD_STATES.INVESTIGATE) {
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffb030';
      ctx.fillText('?', g.x, g.y - 22);
    } else if (g.state === GUARD_STATES.ALERTED) {
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4030';
      ctx.fillText('!', g.x, g.y - 22);
    }
    ctx.fillStyle = '#20242e';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.state === GUARD_STATES.ALERTED ? '#c22e2e' : '#3a4a6a';
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r - 2, 0, Math.PI * 2);
    ctx.fill();
    // Facing direction: a small visor line and a torch dot.
    ctx.strokeStyle = '#ffd66e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * (g.r + 6), g.y + Math.sin(g.angle) * (g.r + 6));
    ctx.stroke();
    ctx.fillStyle = '#e8eef7';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 5, g.y + Math.sin(g.angle) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx, player, time) {
  // Noise ring while running: guards inside it can hear the thief.
  if (player.running) {
    const r = 30 + player.noisePulse * 105;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - player.noisePulse)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const inShadow = !isLit(player.x, player.y);
  ctx.fillStyle = '#101018';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = player.crouching ? '#7a5aa8' : '#9a7ad0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r - 2, 0, Math.PI * 2);
  ctx.fill();
  // Hooded head.
  ctx.fillStyle = '#e8dff5';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 1, 4.5, 0, Math.PI * 2);
  ctx.fill();
  if (inShadow) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fb4d8';
    ctx.fillText('影', player.x, player.y - 18);
  }
  if (player.crouching) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9b8e8';
    ctx.fillText('忍び足', player.x, player.y + 24);
  }
}

function drawVignette(ctx, detection) {
  if (detection <= 0.05) return;
  const grad = ctx.createRadialGradient(480, 320, 200, 480, 320, 560);
  grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
  grad.addColorStop(1, `rgba(200, 20, 20, ${0.35 * detection})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

// state: { guards, player, detection, time, allLoot }
export function drawWorld(ctx, state) {
  drawFloor(ctx);
  drawMoonbeams(ctx);
  drawLamps(ctx, state.time);
  drawDarkness(ctx);
  drawWalls(ctx);
  drawShelves(ctx);
  drawStatuesAndPlanters(ctx);
  drawCases(ctx, state.time);
  drawExit(ctx, state.allLoot);
  drawCones(ctx, state.guards, state.player);
  drawGuards(ctx, state.guards);
  drawPlayer(ctx, state.player, state.time);
  drawVignette(ctx, state.detection);
}
