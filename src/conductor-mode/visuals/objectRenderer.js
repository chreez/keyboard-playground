import { ParticleSystem } from './particleSystem.js';

export class ObjectRenderer {
  constructor(objectSystem, options = {}) {
    this.objectSystem = objectSystem;
    this.canvas = options.canvas || null;
    this.ctx = null;
    this.isRunning = false;
    this.animationFrame = null;
    this.background = options.background || 'rgba(0,0,0,0)';
    this.particleSystem = new ParticleSystem();
  }

  init() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      document.body.appendChild(this.canvas);
    }
    this.resize();
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      this.render();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // update particle system
    this.particleSystem.update(16); // approx frame delta

    if (!this.objectSystem) return;
    const objects = this.objectSystem.getAllObjects();
    objects.forEach(obj => {
      const v = obj.getVisualProperties();
      ctx.save();
      ctx.translate(v.position.x, v.position.y);
      ctx.rotate(v.rotation);
      ctx.globalAlpha = v.opacity;
      ctx.fillStyle = v.color;
      ctx.strokeStyle = v.glowColor;
      ctx.lineWidth = v.glowIntensity * 10;
      ctx.beginPath();
      ctx.arc(0, 0, v.size / 2, 0, Math.PI * 2);
      ctx.fill();
      if (v.glowIntensity > 0) {
        ctx.stroke();
      }
      ctx.restore();

      // particles
      if (Array.isArray(v.particles)) {
        v.particles.forEach(p => this.particleSystem.add({ ...p }));
      }
    });

    // draw global particles
    this.particleSystem.draw(ctx);
  }

  setObjectSystem(system) {
    this.objectSystem = system;
  }
}
export default ObjectRenderer;
