// GameCanvas.jsx — wires GameEngine + Renderer + WebcamTracker
import { useEffect, useRef, useCallback } from 'react';
import { GameEngine, ST } from '../game/GameEngine.js';
import { Renderer } from '../game/Renderer.js';
import { WebcamTracker } from '../game/WebcamTracker.js';
import { FRUIT_CATALOG } from '../utils/constants.js';

const SPRITE_NAMES = [
  ...FRUIT_CATALOG.map(f => f.sprite),
  'bomb.png', 'splash.png', 'life.png',
];

export default function GameCanvas({ onStateChange, onReady }) {
  const canvasRef = useRef(null);
  const videoRef  = useRef(null);
  const engineRef  = useRef(null);
  const rendererRef = useRef(null);
  const trackerRef  = useRef(null);
  const rafRef      = useRef(null);
  const mountedRef  = useRef(true);

  // ── Bootstrap ────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current;

    // Responsive canvas sizing
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w   = window.innerWidth;
      const h   = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      if (engineRef.current) {
        engineRef.current.setCanvasSize(w, h);
      }
    }
    resize();
    window.addEventListener('resize', resize);

    // Engine & renderer
    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    const engine   = new GameEngine(W, H);
    const renderer = new Renderer(canvas);
    engineRef.current  = engine;
    rendererRef.current = renderer;

    // Preload sprites
    SPRITE_NAMES.forEach(name => {
      renderer.loadImage(name, `/assets/${name}`);
    });

    // Hand tracker
    const tracker = new WebcamTracker();
    trackerRef.current = tracker;

    tracker.onFinger = (x, y) => {
      if (!engineRef.current) return;
      const now = performance.now() / 1000;
      if (x == null) {
        engine.clearFinger();
      } else {
        engine.updateFinger(x, y, now);
      }
    };

    // Start camera async
    tracker.init(videoRef.current).then(() => {
      if (mountedRef.current && onReady) onReady(true);
    }).catch(err => {
      console.warn('Tracker failed:', err);
      if (mountedRef.current && onReady) onReady(false, err.message);
    });

    // Keyboard
    function onKey(e) {
      const k = e.key.toLowerCase();
      engineRef.current?.handleKey(k, performance.now() / 1000);
      if (k === 'r' && engineRef.current?.state === ST.RESULT) {
        onStateChange?.(ST.SELECT);
      }
    }
    window.addEventListener('keydown', onKey);

    // Pointer events for mouse / touch support
    let isDrawing = false;

    function getPointerCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      return { x, y };
    }

    function handlePointerDown(e) {
      isDrawing = true;
      const { x, y } = getPointerCoords(e);
      const now = performance.now() / 1000;
      engineRef.current?.updateFinger(x, y, now);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    function handlePointerMove(e) {
      if (!isDrawing) return;
      const { x, y } = getPointerCoords(e);
      const now = performance.now() / 1000;
      engineRef.current?.updateFinger(x, y, now);
    }

    function handlePointerUp(e) {
      isDrawing = false;
      engineRef.current?.clearFinger();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    // Game loop
    let lastState = null;
    function loop() {
      if (!mountedRef.current) return;
      rafRef.current = requestAnimationFrame(loop);

      const now = performance.now() / 1000;
      engine.tick(now);

      // Run hand detection
      const cW = canvas.width  / (window.devicePixelRatio || 1);
      const cH = canvas.height / (window.devicePixelRatio || 1);
      tracker.detect(cW, cH);

      // Render and get card bounds back
      const cardBounds = renderer.render(engine, tracker.ready);
      if (cardBounds) engine.setCardBounds(cardBounds);

      // Notify React of state changes
      if (engine.state !== lastState) {
        lastState = engine.state;
        onStateChange?.(engine.state, engine);
      }
    }
    loop();

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      tracker.stop();
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Video feed displayed behind the canvas and mirrored */}
      <video
        ref={videoRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // Mirror webcam feed for selfie orientation
          zIndex: 1,
          pointerEvents: 'none',
        }}
        playsInline
        muted
      />
      {/* Game canvas fills viewport on top of webcam feed */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          touchAction: 'none',
          zIndex: 2,
        }}
      />
    </>
  );
}
