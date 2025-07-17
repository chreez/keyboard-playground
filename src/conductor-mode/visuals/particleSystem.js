export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  add(particle) {
    this.particles.push(particle);
  }

  update(delta) {
    this.particles = this.particles.filter(p => {
      p.life -= delta;
      p.position.x += p.velocity.x * delta;
      p.position.y += p.velocity.y * delta;
      p.position.z += (p.velocity.z || 0) * delta;
      p.opacity = Math.max(0, p.life / p.maxLife);
      return p.life > 0;
    });
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.translate(p.position.x, p.position.y);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color || '#fff';
      ctx.beginPath();
      ctx.arc(0,0,p.size || 3,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
  }
}
export default ParticleSystem;
