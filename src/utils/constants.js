// constants.js — ported from Python config.py

export const TARGET_FPS = 60;
export const TRAIL_HISTORY = 5;
export const TRAIL_MAX_AGE = 0.08;
export const FRUIT_MIN_RADIUS = 36;
export const FRUIT_MAX_RADIUS = 72;
export const FREEZE_DURATION = 3.5;
export const FREEZE_SPEED_FACTOR = 0.22;
export const GOLDEN_FRUIT_CHANCE = 0.06;
export const GOLDEN_FRUIT_MULTIPLIER = 3.0;
export const COMBO_WINDOW = 1.25;
export const MAX_COMBO = 5.0;
export const EXTRA_LIFE_SCORE = 100;
export const INTRO_DUR = 2.5;
export const SELECT_HOLD = 1.5;
export const SLICE_THRESHOLD_BASE = 350; // px/s minimum for a slice

export const LEVELS = {
  1: {
    name: 'EASY',
    color: '#00f5d4', // Neon turquoise
    colorRGB: [0, 245, 212],
    timeLimit: 45,
    spawnInterval: 1.8,
    gravity: 750,
    vxRange: 180,
    sliceThreshold: 250,
    bombChance: 0.04,
    multiSpawnChance: 0.08,
    scoreTarget: 200,
    lives: 5,
  },
  2: {
    name: 'MEDIUM',
    color: '#ffb703', // Vibrant yellow-orange
    colorRGB: [255, 183, 3],
    timeLimit: 45,
    spawnInterval: 1.2,
    gravity: 950,
    vxRange: 240,
    sliceThreshold: 350,
    bombChance: 0.08,
    multiSpawnChance: 0.16,
    scoreTarget: 400,
    lives: 4,
  },
  3: {
    name: 'HARD',
    color: '#ff006e', // Hot pink-crimson
    colorRGB: [255, 0, 110],
    timeLimit: 45,
    spawnInterval: 0.8,
    gravity: 1150,
    vxRange: 300,
    sliceThreshold: 450,
    bombChance: 0.13,
    multiSpawnChance: 0.28,
    scoreTarget: 800,
    lives: 3,
  },
};

export const FRUIT_CATALOG = [
  { sprite: 'apple.png',       scale: 0.85, value: 11 },
  { sprite: 'banana.png',      scale: 0.95, value: 10 },
  { sprite: 'grapes.png',      scale: 0.85, value: 12 },
  { sprite: 'watermelon.png',  scale: 1.25, value: 15 },
  { sprite: 'strawberry.png',  scale: 0.80, value: 13 },
  { sprite: 'pineapple.png',   scale: 1.35, value: 16 },
  { sprite: 'orange.png',      scale: 0.90, value:  9 },
  { sprite: 'peach.png',       scale: 0.95, value: 12 },
  { sprite: 'cherries.png',    scale: 0.75, value: 11 },
  { sprite: 'mango.png',       scale: 1.00, value: 14 },
  { sprite: 'kiwi.png',        scale: 0.80, value: 11 },
  { sprite: 'pear.png',        scale: 0.95, value: 10 },
  { sprite: 'lemon.png',       scale: 0.85, value:  9 },
  { sprite: 'melon.png',       scale: 1.15, value: 14 },
  { sprite: 'blueberries.png', scale: 0.75, value: 13 },
];
