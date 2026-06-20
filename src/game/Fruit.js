// Fruit.js — ported from Python game_objects.py
import { FRUIT_CATALOG, FRUIT_MIN_RADIUS, FRUIT_MAX_RADIUS, GOLDEN_FRUIT_CHANCE } from '../utils/constants.js';

let _idCounter = 0;

export function spawnFruit(W, H, levelCfg) {
  const roll = Math.random();
  const bombChance = levelCfg.bombChance;

  let kind, sprite, scale, value, isGolden;

  if (roll < bombChance) {
    kind = 'bomb'; sprite = 'bomb.png'; scale = 1.1; value = 0; isGolden = false;
  } else if (roll < bombChance + 0.03) {
    kind = 'freeze'; sprite = 'splash.png'; scale = 0.9; value = 0; isGolden = false;
  } else {
    const entry = FRUIT_CATALOG[Math.floor(Math.random() * FRUIT_CATALOG.length)];
    kind = 'fruit'; sprite = entry.sprite; scale = entry.scale; value = entry.value;
    isGolden = Math.random() < GOLDEN_FRUIT_CHANCE;
  }

  // Scale sizing and physics relative to reference desktop dimensions (1280x720)
  const scaleX = W / 1280;
  const scaleY = H / 720;
  const minScale = Math.min(scaleX, scaleY);
  
  // Scale radius but keep a minimum floor so they are easily clickable/sliceable on mobile
  const radiusScale = Math.max(0.45, minScale);
  const radius = (FRUIT_MIN_RADIUS + Math.random() * (FRUIT_MAX_RADIUS - FRUIT_MIN_RADIUS)) * scale * radiusScale;

  const x = radius + Math.random() * (W - radius * 2);
  const y = H + radius + Math.random() * 25;
  const apex = H * 0.12 + Math.random() * (H * 0.28);
  
  // Scale gravity by height so the duration of flight remains consistent across viewports
  const scaledGravity = levelCfg.gravity * scaleY;
  const vy = -Math.sqrt(2 * scaledGravity * Math.max(80, y - apex)) * (0.92 + Math.random() * 0.13);
  
  // Scale horizontal launch speed by width and level-specific vxRange so movement is visually consistent
  const vxRange = levelCfg.vxRange || 280;
  const vx = (-vxRange + Math.random() * (vxRange * 2)) * scaleX;

  return {
    id: ++_idCounter,
    kind,
    sprite,
    isGolden,
    value,
    radius,
    x, y,
    vx, vy,
    gravity: scaledGravity, // Store scaled gravity on the fruit object for physics ticks
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 4,
    bornAt: performance.now() / 1000,
    slicedAt: null,
    removed: false,
    halves: [],
    particles: [],
  };
}

export function markSliced(fruit, now) {
  fruit.slicedAt = now;
  const angle = Math.random() * Math.PI;
  const speed = 160 + Math.random() * 140;
  for (const sign of [-1, 1]) {
    const ox = Math.cos(angle) * fruit.radius * 0.35;
    const oy = Math.sin(angle) * fruit.radius * 0.35;
    const vx = Math.cos(angle) * speed * sign + fruit.vx * 0.25;
    const vy = -Math.abs(Math.sin(angle) * speed) + fruit.vy * 0.20;
    fruit.halves.push({
      x: fruit.x + ox,
      y: fruit.y + oy,
      vx, vy,
      angle: (angle * 180) / Math.PI,
      spin: (160 + Math.random() * 220) * sign,
    });
  }
  // spawn juice particles
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 200;
    fruit.particles.push({
      x: fruit.x, y: fruit.y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd - 80,
      life: 1.0,
      size: 3 + Math.random() * 5,
    });
  }
}

export function segmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby));
}
