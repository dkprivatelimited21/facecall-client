/**
 * FaceSwapEngine
 * Real-time face overlay using MediaPipe FaceMesh + Canvas2D
 * Renders at 30fps via requestAnimationFrame
 */

// Key landmark indices (MediaPipe 468-point model)
const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
];

const NOSE_TIP = 1;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const CHIN = 152;
const FOREHEAD = 10;

export class FaceSwapEngine {
  constructor({ videoEl, canvasEl, onFaceDetected }) {
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.onFaceDetected = onFaceDetected;

    this.overlayImage = null;
    this.overlayFaceLandmarks = null; // pre-detected landmarks from uploaded image
    this.filterEnabled = false;
    this.blurBackground = false;
    this.currentFilter = 'overlay'; // 'overlay' | 'mask' | 'cartoon'

    this.faceMesh = null;
    this.camera = null;
    this.lastLandmarks = null;
    this.animFrame = null;
    this.running = false;
    this.faceDetected = false;

    // Off-screen canvas for composite
    this.offCanvas = document.createElement('canvas');
    this.offCtx = this.offCanvas.getContext('2d');
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Dynamic import to avoid SSR issues
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.crossOrigin = 'anonymous';
      script.onload = async () => {
        try {
          await this._setupFaceMesh();
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      script.onerror = reject;
      // Check if already loaded
      if (window.FaceMesh) {
        this._setupFaceMesh().then(resolve).catch(reject);
      } else {
        document.head.appendChild(script);
      }
    });
  }

  async _setupFaceMesh() {
    // eslint-disable-next-line no-undef
    const FM = window.FaceMesh || (await import('@mediapipe/face_mesh')).FaceMesh;
    this.faceMesh = new FM({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults((results) => this._onResults(results));
    await this.faceMesh.initialize();
  }

  _onResults(results) {
    const { width, height } = this.canvasEl;
    this.ctx.clearRect(0, 0, width, height);

    // Draw video frame
    this.ctx.save();
    this.ctx.scale(-1, 1);
    this.ctx.translate(-width, 0);
    this.ctx.drawImage(results.image, 0, 0, width, height);
    this.ctx.restore();

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      this.lastLandmarks = results.multiFaceLandmarks[0];
      this.faceDetected = true;
      this.onFaceDetected?.(true);

      if (this.blurBackground) {
        this._applyBlurBackground(results.multiFaceLandmarks[0], width, height);
      }

      if (this.filterEnabled && this.overlayImage) {
        this._drawFaceOverlay(results.multiFaceLandmarks[0], width, height);
      }
    } else {
      this.faceDetected = false;
      this.onFaceDetected?.(false);
    }

    // Watermark
    if (this.filterEnabled) {
      this._drawWatermark(width, height);
    }
  }

  _lm(landmarks, idx, w, h) {
    const l = landmarks[idx];
    return { x: (1 - l.x) * w, y: l.y * h }; // mirrored
  }

  _drawFaceOverlay(landmarks, w, h) {
    const ctx = this.ctx;
    const img = this.overlayImage;
    if (!img) return;

    // Key reference points
    const noseTip = this._lm(landmarks, NOSE_TIP, w, h);
    const leftEye = this._lm(landmarks, LEFT_EYE_OUTER, w, h);
    const rightEye = this._lm(landmarks, RIGHT_EYE_OUTER, w, h);
    const chin = this._lm(landmarks, CHIN, w, h);
    const forehead = this._lm(landmarks, FOREHEAD, w, h);

    // Calculate face bounding box from oval
    const ovalPts = FACE_OVAL_INDICES.map((i) => this._lm(landmarks, i, w, h));
    const minX = Math.min(...ovalPts.map((p) => p.x));
    const maxX = Math.max(...ovalPts.map((p) => p.x));
    const minY = Math.min(...ovalPts.map((p) => p.y));
    const maxY = Math.max(...ovalPts.map((p) => p.y));

    const faceW = maxX - minX;
    const faceH = maxY - minY;

    // Eye vector → rotation angle
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;
    const angle = Math.atan2(dy, dx);

    // Scale with padding
    const scaleX = faceW * 1.3;
    const scaleY = faceH * 1.25;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2 - faceH * 0.05;

    ctx.save();

    // Clip to face oval
    ctx.beginPath();
    ovalPts.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.clip();

    // Apply rotation + draw
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.92;
    ctx.drawImage(img, -scaleX / 2, -scaleY / 2, scaleX, scaleY);
    ctx.globalAlpha = 1;

    ctx.restore();

    // Subtle blend border
    ctx.save();
    ctx.beginPath();
    ovalPts.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  _applyBlurBackground(landmarks, w, h) {
    // Draw blurred version of the canvas behind face
    this.offCanvas.width = w;
    this.offCanvas.height = h;
    this.offCtx.filter = 'blur(12px)';
    this.offCtx.drawImage(this.canvasEl, 0, 0);
    this.offCtx.filter = 'none';

    // Mask: show blurred outside, sharp inside oval
    const ovalPts = FACE_OVAL_INDICES.map((i) => this._lm(landmarks, i, w, h));

    this.ctx.save();
    this.ctx.beginPath();
    ovalPts.forEach((pt, i) => {
      if (i === 0) this.ctx.moveTo(pt.x, pt.y);
      else this.ctx.lineTo(pt.x, pt.y);
    });
    this.ctx.closePath();

    // Invert clip (outside face)
    this.ctx.rect(0, 0, w, h);
    this.ctx.clip('evenodd');
    this.ctx.drawImage(this.offCanvas, 0, 0);
    this.ctx.restore();
  }

  _drawWatermark(w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const text = '⚡ AI Face Filter Active';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(8, h - 28, tw + 16, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(text, 16, h - 13);
    ctx.restore();
  }

  async processFrame() {
    if (!this.running || !this.videoEl || this.videoEl.readyState < 2) return;
    const { videoWidth: vw, videoHeight: vh } = this.videoEl;
    if (vw && vh) {
      this.canvasEl.width = vw;
      this.canvasEl.height = vh;
      try {
        await this.faceMesh.send({ image: this.videoEl });
      } catch (e) {
        // fallback: just draw video
        const ctx = this.ctx;
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-vw, 0);
        ctx.drawImage(this.videoEl, 0, 0, vw, vh);
        ctx.restore();
      }
    }
    this.animFrame = requestAnimationFrame(() => this.processFrame());
  }

  start() {
    this.running = true;
    this.processFrame();
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  setOverlayImage(img) {
    this.overlayImage = img;
  }

  setFilterEnabled(val) {
    this.filterEnabled = val;
  }

  setBlurBackground(val) {
    this.blurBackground = val;
  }

  getCanvasStream(fps = 30) {
    return this.canvasEl.captureStream(fps);
  }

  destroy() {
    this.stop();
    if (this.faceMesh) {
      this.faceMesh.close?.();
      this.faceMesh = null;
    }
  }
}
