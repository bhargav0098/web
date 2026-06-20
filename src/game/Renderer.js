// Renderer.js — canvas drawing ported from Python ui_overlay.py
import { ST } from './GameEngine.js';
import { LEVELS, SELECT_HOLD, TRAIL_MAX_AGE, FREEZE_DURATION } from '../utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.images = {};  // sprite cache
    this._loadedImages = new Set();
  }

  loadImage(name, src) {
    if (this._loadedImages.has(name)) return;
    this._loadedImages.add(name);
    const img = new Image();
    img.src = src;
    img.onload = () => { this.images[name] = img; };
  }

  // ── Main render dispatch ───────────────────────────────────────────────

  render(engine, webcamReady) {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);

    if (engine.state === ST.SELECT) {
      this._renderSelect(engine, W, H, webcamReady);
    } else if (engine.state === ST.INTRO) {
      this._renderIntro(engine, W, H);
    } else if (engine.state === ST.PLAYING || engine.state === ST.RESULT) {
      this._renderGame(engine, W, H);
    }

    return this._cardBoundsForEngine;
  }

  // ── Level Select ───────────────────────────────────────────────────────

  _renderSelect(engine, W, H, webcamReady) {
    const ctx = this.ctx;
    const isPortrait = H > W;

    // Translucent background gradient so webcam is visible but text is highly readable
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, 'rgba(10, 10, 26, 0.65)');
    bg.addColorStop(1, 'rgba(26, 10, 42, 0.75)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Responsive Title
    const titleSize = Math.max(28, Math.min(56, W * 0.10));
    const subSize = Math.max(12, Math.min(20, W * 0.04));
    const titleY = isPortrait ? 65 : 90;
    const subY = isPortrait ? 98 : 128;

    ctx.save();
    ctx.font = `bold ${titleSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 24;
    ctx.fillText('🍉 FRUIT NINJA', W / 2, titleY);
    ctx.shadowBlur = 0;
    ctx.font = `${subSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Web Edition — Slice with your index finger', W / 2, subY);
    ctx.restore();

    // Webcam status
    if (!webcamReady) {
      ctx.save();
      ctx.font = isPortrait ? '13px monospace' : '16px monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.fillText('⏳ Starting webcam… allow camera access when prompted', W / 2, isPortrait ? 124 : 160);
      ctx.restore();
    }

    // Level cards setup based on screen orientation
    const cardW = isPortrait ? Math.min(340, W - 40) : Math.min(240, (W - 80) / 3);
    const cardH = isPortrait ? 110 : 280;
    const gap = isPortrait ? Math.max(12, (H - 200 - cardH * 3) / 4) : (W - cardW * 3) / 4;
    const startY = isPortrait ? 150 : H / 2 - cardH / 2 + 20;

    const cardBounds = {};

    for (let lvl = 1; lvl <= 3; lvl++) {
      const cfg = LEVELS[lvl];
      const cardX = isPortrait ? W / 2 - cardW / 2 : gap + (lvl - 1) * (cardW + gap);
      const cardY = isPortrait ? startY + (lvl - 1) * (cardH + gap) : startY;
      cardBounds[lvl] = { x: cardX, y: cardY, w: cardW, h: cardH };

      const isHovered = engine.hoverCard === lvl;
      const heldPct = isHovered ? engine.hoverProgress : 0;

      // Card background
      ctx.save();
      ctx.beginPath();
      this._roundRect(ctx, cardX, cardY, cardW, cardH, 18);
      const cardBg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
      cardBg.addColorStop(0, isHovered ? '#2a2a4a' : '#181828');
      cardBg.addColorStop(1, isHovered ? '#1a1a3a' : '#0f0f1f');
      ctx.fillStyle = cardBg;
      ctx.fill();
      ctx.strokeStyle = isHovered ? cfg.color : '#333355';
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();

      if (isPortrait) {
        // --- Portrait layout (Wide, short cards stacked vertically) ---
        // Level number and name on the left
        ctx.save();
        ctx.font = `bold 42px "Segoe UI", system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = isHovered ? 12 : 4;
        ctx.fillText(lvl, cardX + 45, cardY + 52);
        ctx.restore();

        ctx.save();
        ctx.font = `bold 15px "Segoe UI", system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        ctx.fillText(cfg.name, cardX + 45, cardY + 80);
        ctx.restore();

        // Vertical divider separating label from stats
        ctx.save();
        ctx.strokeStyle = '#333355';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 90, cardY + 15);
        ctx.lineTo(cardX + 90, cardY + cardH - 15);
        ctx.stroke();
        ctx.restore();

        // Stats grid
        ctx.save();
        ctx.font = '13px "Segoe UI", system-ui';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaaacc';
        const col1 = cardX + 105;
        const col2 = cardX + 105 + Math.max(80, (cardW - 125) * 0.55);
        ctx.fillText(`🎯 Target: ${cfg.scoreTarget}`, col1, cardY + 38);
        ctx.fillText(`❤️ Lives: ${cfg.lives}`, col1, cardY + 68);
        ctx.fillText(`💣 Bomb: ${Math.round(cfg.bombChance * 100)}%`, col2, cardY + 38);
        ctx.fillText(`⏱ Time: ${cfg.timeLimit}s`, col2, cardY + 68);
        ctx.restore();

        // Progress bar along the bottom
        if (isHovered && heldPct > 0) {
          ctx.save();
          ctx.beginPath();
          this._roundRect(ctx, cardX + 12, cardY + cardH - 14, cardW - 24, 6, 3);
          ctx.fillStyle = '#222244';
          ctx.fill();
          ctx.beginPath();
          this._roundRect(ctx, cardX + 12, cardY + cardH - 14, (cardW - 24) * heldPct, 6, 3);
          ctx.fillStyle = cfg.color;
          ctx.fill();
          ctx.restore();
        } else {
          ctx.save();
          ctx.font = '11px "Segoe UI", system-ui';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#555577';
          ctx.fillText(`Hover or press ${lvl}`, cardX + cardW - 16, cardY + cardH - 12);
          ctx.restore();
        }

      } else {
        // --- Landscape layout (Tall, side-by-side cards) ---
        // Level number
        ctx.save();
        ctx.font = `bold 52px "Segoe UI", system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur = isHovered ? 16 : 6;
        ctx.fillText(lvl, cardX + cardW / 2, cardY + 68);
        ctx.restore();

        // Level name
        ctx.save();
        ctx.font = `bold 22px "Segoe UI", system-ui`;
        ctx.textAlign = 'center';
        ctx.fillStyle = cfg.color;
        ctx.fillText(cfg.name, cardX + cardW / 2, cardY + 102);
        ctx.restore();

        // Divider
        ctx.save();
        ctx.strokeStyle = '#333355';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 16, cardY + 116);
        ctx.lineTo(cardX + cardW - 16, cardY + 116);
        ctx.stroke();
        ctx.restore();

        // Stats
        const stats = [
          `🎯 Target: ${cfg.scoreTarget} pts`,
          `❤️ Lives: ${cfg.lives}`,
          `💣 Bomb: ${Math.round(cfg.bombChance * 100)}%`,
          `⏱ Time: ${cfg.timeLimit}s`,
        ];
        ctx.save();
        ctx.font = '14px "Segoe UI", system-ui';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaaacc';
        stats.forEach((s, i) => {
          ctx.fillText(s, cardX + cardW / 2, cardY + 145 + i * 26);
        });
        ctx.restore();

        // Hover progress bar
        if (isHovered && heldPct > 0) {
          const barY = cardY + cardH - 28;
          ctx.save();
          ctx.beginPath();
          this._roundRect(ctx, cardX + 12, barY, cardW - 24, 10, 5);
          ctx.fillStyle = '#222244';
          ctx.fill();
          ctx.beginPath();
          this._roundRect(ctx, cardX + 12, barY, (cardW - 24) * heldPct, 10, 5);
          ctx.fillStyle = cfg.color;
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.font = '12px "Segoe UI", system-ui';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#aaaacc';
          ctx.fillText('Hold to select…', cardX + cardW / 2, cardY + cardH - 8);
          ctx.restore();
        } else {
          ctx.save();
          ctx.font = '12px "Segoe UI", system-ui';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#555577';
          ctx.fillText(`Hover 1.5s or press ${lvl}`, cardX + cardW / 2, cardY + cardH - 10);
          ctx.restore();
        }
      }
    }

    this._cardBoundsForEngine = cardBounds;

    // Finger cursor
    const last = engine.trail[engine.trail.length - 1];
    if (last) {
      this._drawFingerCursor(last.x, last.y);
    }

    // Keyboard hint
    ctx.save();
    ctx.font = isPortrait ? '13px "Segoe UI", system-ui' : '15px "Segoe UI", system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555577';
    ctx.fillText('Keyboard: press 1, 2, or 3 to select a level', W / 2, H - 24);
    ctx.restore();
  }

  // ── Intro ──────────────────────────────────────────────────────────────

  _renderIntro(engine, W, H) {
    const ctx = this.ctx;
    const cfg = engine.levelCfg;
    const prog = engine.introProg;

    // Translucent overlay instead of solid BG
    ctx.fillStyle = 'rgba(10, 10, 26, 0.65)';
    ctx.fillRect(0, 0, W, H);

    // Animated circle
    const r = prog * Math.min(W, H) * 0.55;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
    ctx.fillStyle = cfg.color + '22';
    ctx.fill();
    ctx.strokeStyle = cfg.color + '66';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    const alpha = Math.min(1, prog * 2);
    
    // Scale text elements responsively
    const levelSize = Math.max(40, Math.min(80, W * 0.12));
    const nameSize = Math.max(24, Math.min(40, W * 0.06));
    const descSize = Math.max(12, Math.min(20, W * 0.035));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${levelSize}px "Segoe UI", system-ui`;
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 32;
    ctx.fillText(`LEVEL ${engine.chosenLevel}`, W / 2, H / 2 - 20);
    ctx.font = `bold ${nameSize}px "Segoe UI", system-ui`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(cfg.name, W / 2, H / 2 + 40);
    
    ctx.font = `${descSize}px "Segoe UI", system-ui`;
    ctx.fillStyle = '#aaaacc';
    
    if (W < 500) {
      // Split stats into two lines if mobile portrait to prevent wrapping/overflow
      ctx.fillText(`Target: ${cfg.scoreTarget} pts`, W / 2, H / 2 + 82);
      ctx.fillText(`Lives: ${cfg.lives}  •  Time: ${cfg.timeLimit}s`, W / 2, H / 2 + 108);
    } else {
      ctx.fillText(`Target: ${cfg.scoreTarget} pts  •  ${cfg.lives} lives  •  ${cfg.timeLimit}s`, W / 2, H / 2 + 90);
    }
    
    ctx.restore();
  }

  // ── Gameplay ───────────────────────────────────────────────────────────

  _renderGame(engine, W, H) {
    const ctx = this.ctx;
    const now = engine._lastNow || 0;

    // Fruits
    for (const fruit of engine.fruits) {
      if (fruit.slicedAt === null) {
        this._drawFruit(fruit, now);
      } else {
        this._drawSlicedFruit(fruit, engine.levelCfg.gravity, now);
      }
    }

    // Splashes
    for (const s of engine.splashes) {
      const age = now - s.bornAt;
      const alpha = Math.max(0, 1 - age / s.dur);
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 55 * (1 - alpha * 0.3) + 10, 0, Math.PI * 2);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }

    // Trail
    this._drawTrail(engine.trail, now);

    // Popups
    for (const p of engine.popups) {
      const age = now - p.bornAt;
      const alpha = Math.max(0, 1 - age / p.dur);
      const yOff = -(1 - alpha) * 50;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 22px "Segoe UI", system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(p.text, p.x + 2, p.y + yOff + 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y + yOff);
      ctx.restore();
    }

    // HUD
    this._drawHUD(engine, W, H, now);

    // Result overlay
    if (engine.state === ST.RESULT) {
      this._drawResult(engine, W, H);
    }

    // Finger cursor
    const last = engine.trail[engine.trail.length - 1];
    if (last) {
      this._drawFingerCursor(last.x, last.y);
    }

    // Prompt
    if (now < engine.promptUntil && engine.prompt) {
      this._drawPrompt(engine.prompt, now, engine.promptUntil, W, H);
    }
  }

  _drawFruit(fruit, now) {
    const ctx = this.ctx;
    const img = this.images[fruit.sprite];
    const size = fruit.radius * 2;

    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);

    // Glow effects
    if (fruit.isGolden) {
      const pulse = 3 + 2 * Math.abs(Math.sin(now * 7));
      ctx.beginPath();
      ctx.arc(0, 0, fruit.radius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = pulse;
      ctx.stroke();
    }
    if (fruit.kind === 'bomb') {
      ctx.beginPath();
      ctx.arc(0, 0, fruit.radius * 1.1, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    if (fruit.kind === 'freeze') {
      ctx.beginPath();
      ctx.arc(0, 0, fruit.radius * 1.1, 0, Math.PI * 2);
      ctx.strokeStyle = '#66aaff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // ICE label
      ctx.restore();
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.font = 'bold 13px "Segoe UI", system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#aaddff';
      ctx.fillText('❄️ ICE', 0, -fruit.radius - 8);
      ctx.restore();
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);
    }

    if (img) {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      // Fallback colored circle
      ctx.beginPath();
      ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
      ctx.fillStyle = fruit.kind === 'bomb' ? '#cc2222' : fruit.isGolden ? '#ffd700' : '#44bb44';
      ctx.fill();
    }
    ctx.restore();
  }

  _drawSlicedFruit(fruit, gravity, now) {
    const ctx = this.ctx;
    const img = this.images[fruit.sprite];
    const size = fruit.radius * 1.2;

    for (const hf of fruit.halves) {
      ctx.save();
      ctx.translate(hf.x, hf.y);
      ctx.rotate((hf.angle * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, 1 - (now - fruit.slicedAt) / 0.5);

      if (img) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, fruit.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
      }
      ctx.restore();
    }

    // Juice particles
    for (const p of fruit.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = fruit.isGolden ? '#ffd700' :
                      fruit.kind === 'bomb' ? '#ff4444' :
                      fruit.kind === 'freeze' ? '#66aaff' : '#44cc44';
      ctx.fill();
      ctx.restore();
    }
  }

  _drawTrail(trail, now) {
    const ctx = this.ctx;
    if (trail.length < 2) return;

    for (let i = 1; i < trail.length; i++) {
      const p1 = trail[i - 1], p2 = trail[i];
      const age = now - p2.t;
      const alpha = Math.max(0, 1 - age / TRAIL_MAX_AGE);
      if (alpha <= 0) continue;

      const t = i / trail.length;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.85})`;
      ctx.lineWidth = 3 + t * 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ffffaa';
      ctx.shadowBlur = 8 * alpha;
      ctx.stroke();
      ctx.restore();
    }

    // Glowing tip
    const tip = trail[trail.length - 1];
    if (tip && now - tip.t < 0.05) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffaa';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.restore();
    }
  }

  _drawHUD(engine, W, H, now) {
    const ctx = this.ctx;
    const cfg = engine.levelCfg;
    const remaining = engine.timeRemaining;
    const timeFrac = remaining / cfg.timeLimit;
    const isMobile = W < 600;

    // Score panel (top left)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const scoreW = isMobile ? 100 : 230;
    const scoreH = isMobile ? 60 : 90;
    this._roundRect(ctx, 10, 10, scoreW, scoreH, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    if (isMobile) {
      ctx.font = 'bold 24px "Segoe UI", system-ui';
      ctx.fillText(engine.score, 20, 36);
      ctx.font = '11px "Segoe UI", system-ui';
      ctx.fillStyle = '#aaaacc';
      ctx.fillText(`Target: ${cfg.scoreTarget}`, 20, 52);
    } else {
      ctx.font = 'bold 36px "Segoe UI", system-ui';
      ctx.fillText(engine.score, 22, 50);
      ctx.font = '13px "Segoe UI", system-ui';
      ctx.fillStyle = '#aaaacc';
      ctx.fillText(`Target: ${cfg.scoreTarget}`, 22, 70);
      ctx.fillStyle = cfg.color;
      ctx.textAlign = 'right';
      ctx.fillText(`LVL ${engine.chosenLevel} ${cfg.name}`, 235, 70);
    }

    // Combo
    if (engine.combo > 1.05) {
      ctx.font = isMobile ? 'bold 11px "Segoe UI", system-ui' : 'bold 14px "Segoe UI", system-ui';
      ctx.fillStyle = '#ff8800';
      ctx.textAlign = 'left';
      ctx.fillText(`${engine.combo.toFixed(1)}× combo`, 20, isMobile ? 82 : 90);
    }
    ctx.restore();

    // Timer (top center)
    ctx.save();
    ctx.textAlign = 'center';
    const timerColor = remaining <= 10 ? '#ff4444' : remaining <= 20 ? '#ffaa00' : cfg.color;
    const timerSize = isMobile ? (remaining <= 10 ? 30 : 24) : (remaining <= 10 ? 44 : 36);
    ctx.font = `bold ${timerSize}px "Segoe UI", system-ui`;
    ctx.fillStyle = timerColor;
    ctx.shadowColor = timerColor;
    ctx.shadowBlur = remaining <= 5 ? 15 : 6;
    ctx.fillText(Math.ceil(remaining), W / 2, isMobile ? 38 : 52);
    ctx.shadowBlur = 0;
    
    // Timer bar
    const barW = isMobile ? 80 : 160;
    const barH = isMobile ? 4 : 6;
    const barX = W / 2 - barW / 2;
    const barY = isMobile ? 46 : 60;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this._roundRect(ctx, barX, barY, barW, barH, 2);
    ctx.fill();
    ctx.fillStyle = timerColor;
    this._roundRect(ctx, barX, barY, barW * timeFrac, barH, 2);
    ctx.fill();
    ctx.restore();

    // Lives (top right)
    ctx.save();
    const heartImg = this.images['life.png'];
    const heartSize = isMobile ? 20 : 28;
    const gap = isMobile ? 2 : 4;
    const livesX = W - 10 - engine.lives * (heartSize + gap);
    const heartY = isMobile ? 16 : 14;
    for (let i = 0; i < engine.lives; i++) {
      if (heartImg) {
        ctx.drawImage(heartImg, livesX + i * (heartSize + gap), heartY, heartSize, heartSize);
      } else {
        ctx.font = `${heartSize}px serif`;
        ctx.textAlign = 'left';
        ctx.fillText('❤️', livesX + i * (heartSize + gap), heartY + (isMobile ? 18 : 24));
      }
    }
    ctx.restore();

    // Freeze bar
    if (engine.freezeActive) {
      const freezeRemain = Math.max(0, engine.freezeUntil - now);
      const freezeFrac = freezeRemain / FREEZE_DURATION;
      const barW2 = isMobile ? 120 : 200, barY = H - 36;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = isMobile ? '11px "Segoe UI", system-ui' : '13px "Segoe UI", system-ui';
      ctx.fillStyle = '#66aaff';
      ctx.fillText('❄️ FREEZE', W / 2, barY - 6);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this._roundRect(ctx, W / 2 - barW2 / 2, barY, barW2, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#66aaff';
      this._roundRect(ctx, W / 2 - barW2 / 2, barY, barW2 * freezeFrac, 8, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawResult(engine, W, H) {
    const ctx = this.ctx;
    const cfg = engine.levelCfg;
    const passed = engine.resultPassed;
    const isMobile = W < 600;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    const color = passed ? '#44ee44' : '#ff4444';
    ctx.shadowColor = color;
    ctx.shadowBlur = 32;
    
    // Scale result title
    const titleSize = isMobile ? 36 : 60;
    ctx.font = `bold ${titleSize}px "Segoe UI", system-ui`;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(passed ? '🏆 YOU WIN!' : '💀 GAME OVER', W / 2, H / 2 - 40);
    ctx.shadowBlur = 0;

    const scoreSize = isMobile ? 18 : 26;
    ctx.font = `${scoreSize}px "Segoe UI", system-ui`;
    ctx.fillStyle = '#ffffff';
    if (passed) {
      ctx.fillText(`Score: ${engine.score} / ${cfg.scoreTarget}   Best: ${engine.bestScore}`, W / 2, H / 2 + 20);
    } else {
      ctx.fillText(`${engine.resultReason}  Score: ${engine.score}`, W / 2, H / 2 + 20);
      const short = cfg.scoreTarget - engine.score;
      if (short > 0) {
        ctx.font = isMobile ? '14px "Segoe UI", system-ui' : '18px "Segoe UI", system-ui';
        ctx.fillStyle = '#aaaacc';
        ctx.fillText(`${short} points short of target`, W / 2, H / 2 + 52);
      }
    }

    ctx.font = isMobile ? '16px "Segoe UI", system-ui' : '20px "Segoe UI", system-ui';
    ctx.fillStyle = '#888899';
    ctx.fillText('Press R to play again', W / 2, H / 2 + (isMobile ? 100 : 90));
    ctx.restore();
  }

  _drawPrompt(text, now, until, W, H) {
    const ctx = this.ctx;
    const remaining = until - now;
    const alpha = Math.min(1, remaining / 0.5, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '18px "Segoe UI", system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000aa';
    const tw = ctx.measureText(text).width;
    this._roundRect(ctx, W / 2 - tw / 2 - 14, H - 66, tw + 28, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffcc';
    ctx.fillText(text, W / 2, H - 44);
    ctx.restore();
  }

  _drawFingerCursor(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#b4ff5a';
    ctx.shadowColor = '#b4ff5a';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
