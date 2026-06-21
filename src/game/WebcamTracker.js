// WebcamTracker.js — MediaPipe Tasks Vision hand tracking
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Index finger tip = landmark 8
const INDEX_TIP = 8;

export class WebcamTracker {
  constructor() {
    this.handLandmarker = null;
    this.videoEl = null;
    this.stream = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.onFinger = null; // callback(x, y) or callback(null)
    this._ready = false;
    this._error = null;
  }

  get ready() { return this._ready; }
  get error() { return this._error; }

  async init(videoEl) {
    this.videoEl = videoEl;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      await this._startCamera();
      this._ready = true;
    } catch (e) {
      this._error = e.message || 'Failed to initialise hand tracker';
      console.error('WebcamTracker init error:', e);
    }
  }

  async _startCamera() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    });
    this.videoEl.srcObject = this.stream;
    this.videoEl.setAttribute('playsinline', '');
    await new Promise(res => { this.videoEl.onloadedmetadata = res; });
    await this.videoEl.play();
  }

  // Call this every animation frame
  detect(canvasW, canvasH) {
    if (!this.handLandmarker || !this.videoEl || this.videoEl.readyState < 2) {
      if (this.onFinger) this.onFinger(null, null);
      return;
    }
    const now = performance.now();
    if (this.videoEl.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.videoEl.currentTime;

    const result = this.handLandmarker.detectForVideo(this.videoEl, now);

    if (result.landmarks && result.landmarks.length > 0) {
      const hand = result.landmarks[0];
      const wrist = hand[0];
      const indexPip = hand[6];
      const indexTip = hand[INDEX_TIP];

      if (wrist && indexPip && indexTip) {
        const distTip = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
        const distPip = Math.hypot(indexPip.x - wrist.x, indexPip.y - wrist.y);
        if (distTip <= distPip * 0.95) {
          if (this.onFinger) this.onFinger(null, null);
          return;
        }
      }

      const lm = indexTip;
      
      // Calculate aspect ratios for object-fit: cover mapping
      const videoW = this.videoEl.videoWidth || 1280;
      const videoH = this.videoEl.videoHeight || 720;
      const videoAspect = videoW / videoH;
      const canvasAspect = canvasW / canvasH;

      let x, y;

      if (canvasAspect > videoAspect) {
        // Canvas is wider than video (crops top/bottom)
        const visualH = canvasW / videoAspect;
        const yOffset = (visualH - canvasH) / 2;
        x = (1 - lm.x) * canvasW;
        y = lm.y * visualH - yOffset;
      } else {
        // Canvas is taller than video (crops left/right, standard portrait mobile)
        const visualW = canvasH * videoAspect;
        const xOffset = (visualW - canvasW) / 2;
        x = (1 - lm.x) * visualW - xOffset;
        y = lm.y * canvasH;
      }

      // Apply a comfort margin (8%) so the user doesn't have to reach the extreme physical edges of the camera
      let nx = x / canvasW;
      let ny = y / canvasH;
      const marginX = 0.08;
      const marginY = 0.08;
      nx = (nx - marginX) / (1 - 2 * marginX);
      ny = (ny - marginY) / (1 - 2 * marginY);

      // Clamp to logical screen dimensions for corner accuracy
      x = Math.max(0, Math.min(canvasW, nx * canvasW));
      y = Math.max(0, Math.min(canvasH, ny * canvasH));

      if (this.onFinger) this.onFinger(x, y);
    } else {
      if (this.onFinger) this.onFinger(null, null);
    }
  }

  stop() {
    this.running = false;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this._ready = false;
  }
}
