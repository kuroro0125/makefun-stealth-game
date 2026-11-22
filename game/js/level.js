// level.js — the archive hall: walls, cover, cases, lamps, exit and patrol routes.
// One large well-made level. All coordinates are in world pixels (960 x 640).

export const WORLD_W = 960;
export const WORLD_H = 640;

export function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Solid rectangles that block movement and sight.
export const WALLS = [
  rect(0, 0, 960, 24), // north wall
  rect(0, 616, 960, 24), // south wall
  rect(0, 0, 24, 640), // west wall
  rect(936, 0, 24, 640), // east wall
  rect(330, 90, 24, 140), // interior wall, west wing
  rect(606, 410, 24, 140), // interior wall, east wing
];

// Bookshelves: tall cover that blocks sight and movement.
export const SHELVES = [
  rect(140, 140, 120, 36),
  rect(140, 460, 120, 36),
  rect(700, 140, 120, 36),
  rect(700, 460, 120, 36),
  rect(420, 180, 36, 120),
  rect(560, 420, 36, 120),
];

// Round cover: statues (stone) and planters (leafy, block sight).
export const STATUES = [
  { x: 480, y: 120, r: 16 },
  { x: 480, y: 520, r: 16 },
  { x: 240, y: 320, r: 16 },
  { x: 720, y: 320, r: 16 },
];
export const PLANTERS = [
  { x: 90, y: 320, r: 18 },
  { x: 870, y: 320, r: 18 },
  { x: 360, y: 560, r: 18 },
  { x: 600, y: 80, r: 18 },
];

// Display cases to pick. The astrolabe sits on the central pedestal.
export const CASES = [
  { id: 'chart-a', kind: 'chart', label: '星図・其の一', x: 180, y: 90, w: 48, h: 30, pickTime: 2.5, taken: false, progress: 0 },
  { id: 'chart-b', kind: 'chart', label: '星図・其の二', x: 780, y: 90, w: 48, h: 30, pickTime: 2.5, taken: false, progress: 0 },
  { id: 'chart-c', kind: 'chart', label: '星図・其の三', x: 780, y: 550, w: 48, h: 30, pickTime: 2.5, taken: false, progress: 0 },
  { id: 'astrolabe', kind: 'astrolabe', label: '黄金のアストロラーベ', x: 456, y: 305, w: 48, h: 30, pickTime: 3.5, taken: false, progress: 0 },
];

// Warm lamp pools. Outside every pool (and moonbeam) is shadow.
export const LAMPS = [
  { x: 240, y: 200, r: 150 },
  { x: 720, y: 200, r: 150 },
  { x: 240, y: 440, r: 150 },
  { x: 720, y: 440, r: 150 },
  { x: 480, y: 320, r: 130 },
];

// Moonlight falling through the high windows: lit, but cold.
export const MOONBEAMS = [
  rect(100, 24, 120, 160),
  rect(740, 24, 120, 160),
];

// The exit door in the north wall. It opens only once all four pieces are taken.
export const EXIT = rect(440, 0, 80, 34);
export const SPAWN = { x: 480, y: 590 };

// Guard patrol loops: waypoint lists the guards walk in order, forever.
export const PATROLS = [
  [ // west wing guard
    { x: 120, y: 120 }, { x: 120, y: 520 }, { x: 260, y: 520 }, { x: 260, y: 120 },
  ],
  [ // east wing guard
    { x: 840, y: 120 }, { x: 840, y: 520 }, { x: 700, y: 520 }, { x: 700, y: 120 },
  ],
  [ // central hall guard
    { x: 360, y: 240 }, { x: 600, y: 240 }, { x: 600, y: 400 }, { x: 360, y: 400 },
  ],
  [ // long north-south guard
    { x: 400, y: 100 }, { x: 560, y: 100 }, { x: 560, y: 540 }, { x: 400, y: 540 },
  ],
];

// Every solid rectangle (walls + shelves) for collision and sight.
export function solidRects() {
  return WALLS.concat(SHELVES);
}

// Every solid circle (statues + planters) for collision and sight.
export function solidCircles() {
  return STATUES.concat(PLANTERS);
}

// True when the point stands in lamplight or moonlight.
export function isLit(x, y) {
  for (const lamp of LAMPS) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy <= lamp.r * lamp.r) return true;
  }
  for (const beam of MOONBEAMS) {
    if (x >= beam.x && x <= beam.x + beam.w && y >= beam.y && y <= beam.y + beam.h) return true;
  }
  return false;
}
