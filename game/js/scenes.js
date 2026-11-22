// scenes.js — deterministic preview poses for screenshots.
// Each scene sets up the same rendering code with a frozen, readable moment:
// cover = mid-patrol infiltration, shadow = hidden in darkness beside a guard,
// caught = the detection meter nearly full with a guard alerted.

import { CASES } from './level.js';
import { GUARD_STATES } from './guards.js';

function setCaseTaken(id, taken) {
  const c = CASES.find((k) => k.id === id);
  if (c) {
    c.taken = taken;
    c.progress = 0;
  }
}

export function applyScene(game, name) {
  const { player, guards } = game;
  if (name === 'cover') {
    // Two charts already lifted; the thief crouches behind a shelf mid-hall.
    setCaseTaken('chart-a', true);
    setCaseTaken('chart-b', true);
    player.charts = 2;
    player.x = 380;
    player.y = 300;
    player.crouching = true;
    guards[0].x = 130;
    guards[0].y = 300;
    guards[0].angle = 0;
    guards[0].state = GUARD_STATES.PATROL;
    guards[1].x = 830;
    guards[1].y = 300;
    guards[1].angle = Math.PI;
    guards[1].state = GUARD_STATES.PATROL;
    guards[2].x = 480;
    guards[2].y = 240;
    guards[2].angle = Math.PI / 2;
    guards[2].state = GUARD_STATES.PATROL;
    guards[3].x = 560;
    guards[3].y = 420;
    guards[3].angle = -Math.PI / 2;
    guards[3].state = GUARD_STATES.PATROL;
    game.detection = 0.18;
    game.mode = 'scene';
  } else if (name === 'shadow') {
    // The thief pressed into a dark corner while a guard walks past, cone
    // sweeping just wide of the hiding spot.
    setCaseTaken('chart-a', true);
    player.charts = 1;
    player.x = 96;
    player.y = 556;
    player.crouching = true;
    guards[0].x = 190;
    guards[0].y = 520;
    guards[0].angle = Math.PI;
    guards[0].state = GUARD_STATES.PATROL;
    guards[1].x = 830;
    guards[1].y = 180;
    guards[1].angle = Math.PI / 2;
    guards[1].state = GUARD_STATES.PATROL;
    guards[2].x = 480;
    guards[2].y = 400;
    guards[2].angle = 0;
    guards[2].state = GUARD_STATES.PATROL;
    guards[3].x = 400;
    guards[3].y = 100;
    guards[3].angle = Math.PI / 2;
    guards[3].state = GUARD_STATES.PATROL;
    game.detection = 0;
    game.mode = 'scene';
  } else if (name === 'caught') {
    // A heartbeat from being caught: meter nearly full, one guard alerted
    // and closing in, the thief caught in the open near the north hall.
    player.x = 480;
    player.y = 180;
    player.crouching = false;
    guards[0].x = 480;
    guards[0].y = 260;
    guards[0].angle = -Math.PI / 2;
    guards[0].state = GUARD_STATES.ALERTED;
    guards[0].chaseTimer = 4;
    guards[1].x = 700;
    guards[1].y = 140;
    guards[1].angle = Math.PI;
    guards[1].state = GUARD_STATES.INVESTIGATE;
    guards[2].x = 360;
    guards[2].y = 240;
    guards[2].angle = 0;
    guards[2].state = GUARD_STATES.PATROL;
    guards[3].x = 560;
    guards[3].y = 420;
    guards[3].angle = -Math.PI / 2;
    guards[3].state = GUARD_STATES.PATROL;
    game.detection = 0.92;
    game.spotted = true;
    game.graceTimer = 1.1;
    game.mode = 'scene';
  }
}
