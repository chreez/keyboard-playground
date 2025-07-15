class BackgroundVisualizer {
  constructor(canvas, container) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container; // DOM element for CSS background effects
    this.isRunning = false;
    this.lastTime = 0;
    this.targetFPS = 30; // Half of emoji animation rate for performance
    this.frameInterval = 1000 / this.targetFPS;
    
    // Visual state
    this.currentMood = 'neutral';
    this.moodTransitionProgress = 0;
    this.transitionDuration = 2000; // 2 seconds for mood transitions
    this.lastMoodChange = 0;
    
    // Particle system
    this.particles = [];
    this.maxParticles = 50;
    this.particlePool = [];
    
    // Background effects
    this.backgroundColors = this.initializeBackgroundColors();
    this.currentColors = this.backgroundColors.neutral;
    this.targetColors = this.backgroundColors.neutral;
    
    // Performance monitoring
    this.performanceMode = 'high'; // high, medium, low
    this.frameCount = 0;
    this.lastFPSCheck = 0;
    
    this.setupParticlePool();
    this.setupCanvasResizing();
  }

  initializeBackgroundColors() {
    return {
      neutral: {
        primary: { r: 0, g: 0, b: 0 },
        secondary: { r: 5, g: 5, b: 10 },
        accent: { r: 10, g: 10, b: 20 }
      },
      calm: {
        primary: { r: 0, g: 5, b: 20 },
        secondary: { r: 10, g: 20, b: 40 },
        accent: { r: 20, g: 30, b: 60 }
      },
      energetic: {
        primary: { r: 20, g: 5, b: 0 },
        secondary: { r: 40, g: 15, b: 5 },
        accent: { r: 60, g: 25, b: 10 }
      },
      playful: {
        primary: { r: 10, g: 15, b: 0 },
        secondary: { r: 25, g: 35, b: 10 },
        accent: { r: 40, g: 55, b: 20 }
      },
      intense: {
        primary: { r: 25, g: 0, b: 0 },
        secondary: { r: 50, g: 10, b: 10 },
        accent: { r: 75, g: 20, b: 20 }
      },
      frantic: {
        primary: { r: 30, g: 0, b: 10 },
        secondary: { r: 60, g: 5, b: 20 },
        accent: { r: 90, g: 10, b: 30 }
      },
      // Musical moods (Theme 2)
      bright: {
        primary: { r: 5, g: 10, b: 25 },
        secondary: { r: 15, g: 25, b: 50 },
        accent: { r: 25, g: 40, b: 75 }
      },
      melancholic: {
        primary: { r: 15, g: 5, b: 20 },
        secondary: { r: 30, g: 15, b: 35 },
        accent: { r: 45, g: 25, b: 50 }
      },
      excited: {
        primary: { r: 25, g: 15, b: 0 },
        secondary: { r: 50, g: 35, b: 10 },
        accent: { r: 75, g: 55, b: 20 }
      },
      serene: {
        primary: { r: 0, g: 15, b: 15 },
        secondary: { r: 5, g: 30, b: 30 },
        accent: { r: 10, g: 45, b: 45 }
      },
      // Guitar theme moods
      'guitar-clean': {
        primary: { r: 10, g: 15, b: 25 },
        secondary: { r: 20, g: 30, b: 45 },
        accent: { r: 30, g: 45, b: 65 }
      },
      'guitar-warm': {
        primary: { r: 25, g: 15, b: 5 },
        secondary: { r: 45, g: 30, b: 15 },
        accent: { r: 65, g: 45, b: 25 }
      },
      'guitar-driven': {
        primary: { r: 30, g: 10, b: 0 },
        secondary: { r: 55, g: 25, b: 10 },
        accent: { r: 80, g: 40, b: 20 }
      },
      'guitar-heavy': {
        primary: { r: 35, g: 5, b: 5 },
        secondary: { r: 60, g: 15, b: 15 },
        accent: { r: 85, g: 25, b: 25 }
      }
    };
  }

  setupParticlePool() {
    // Pre-create particles for performance
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  setupCanvasResizing() {
    const resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  updateMood(mood, beatAnalysis = null) {
    if (mood === this.currentMood) return;
    
    this.currentMood = mood;
    this.lastMoodChange = Date.now();
    this.moodTransitionProgress = 0;
    
    // Update target colors with octave-based modifications
    this.targetColors = this.getOctaveModifiedColors(mood, beatAnalysis);
    
    // Update particle behavior based on mood
    this.updateParticleSystemForMood(mood, beatAnalysis);
    
    // Update CSS background if needed
    this.updateCSSBackground(mood);
  }

  getOctaveModifiedColors(mood, beatAnalysis) {
    const baseColors = this.backgroundColors[mood] || this.backgroundColors.neutral;
    
    // If no octave information, return base colors
    if (!beatAnalysis || !beatAnalysis.currentOctave) {
      return baseColors;
    }
    
    // Create modified colors based on octave
    const octave = beatAnalysis.currentOctave;
    const modifiedColors = JSON.parse(JSON.stringify(baseColors)); // Deep copy
    
    // Octave-based color temperature adjustments
    if (octave <= 2) {
      // Very low octaves - darker, warmer colors
      modifiedColors.primary.r = Math.min(255, modifiedColors.primary.r + 5);
      modifiedColors.primary.g = Math.max(0, modifiedColors.primary.g - 3);
      modifiedColors.primary.b = Math.max(0, modifiedColors.primary.b - 5);
    } else if (octave === 3) {
      // Low octaves - slightly warmer
      modifiedColors.primary.r = Math.min(255, modifiedColors.primary.r + 3);
      modifiedColors.primary.g = Math.max(0, modifiedColors.primary.g - 1);
      modifiedColors.primary.b = Math.max(0, modifiedColors.primary.b - 2);
    } else if (octave === 4) {
      // Mid octaves - neutral (no change)
      // Keep base colors unchanged
    } else if (octave === 5) {
      // High octaves - brighter, cooler colors
      modifiedColors.primary.r = Math.max(0, modifiedColors.primary.r - 2);
      modifiedColors.primary.g = Math.min(255, modifiedColors.primary.g + 3);
      modifiedColors.primary.b = Math.min(255, modifiedColors.primary.b + 8);
    } else if (octave >= 6) {
      // Very high octaves - bright, cool colors
      modifiedColors.primary.r = Math.max(0, modifiedColors.primary.r - 5);
      modifiedColors.primary.g = Math.min(255, modifiedColors.primary.g + 5);
      modifiedColors.primary.b = Math.min(255, modifiedColors.primary.b + 15);
    }
    
    // Apply similar modifications to secondary and accent colors
    ['secondary', 'accent'].forEach(type => {
      if (octave <= 2) {
        modifiedColors[type].r = Math.min(255, modifiedColors[type].r + 8);
        modifiedColors[type].g = Math.max(0, modifiedColors[type].g - 3);
        modifiedColors[type].b = Math.max(0, modifiedColors[type].b - 8);
      } else if (octave === 3) {
        modifiedColors[type].r = Math.min(255, modifiedColors[type].r + 5);
        modifiedColors[type].g = Math.max(0, modifiedColors[type].g - 1);
        modifiedColors[type].b = Math.max(0, modifiedColors[type].b - 3);
      } else if (octave === 5) {
        modifiedColors[type].r = Math.max(0, modifiedColors[type].r - 3);
        modifiedColors[type].g = Math.min(255, modifiedColors[type].g + 5);
        modifiedColors[type].b = Math.min(255, modifiedColors[type].b + 12);
      } else if (octave >= 6) {
        modifiedColors[type].r = Math.max(0, modifiedColors[type].r - 8);
        modifiedColors[type].g = Math.min(255, modifiedColors[type].g + 8);
        modifiedColors[type].b = Math.min(255, modifiedColors[type].b + 20);
      }
    });
    
    return modifiedColors;
  }

  updateParticleSystemForMood(mood, beatAnalysis) {
    // Clear existing particles and create new ones based on mood
    this.particles = [];
    
    const moodConfigs = {
      calm: { count: 8, speed: 0.2, size: 1, type: 'float' },
      energetic: { count: 20, speed: 1.5, size: 2, type: 'burst' },
      playful: { count: 15, speed: 1, size: 1.5, type: 'bounce' },
      intense: { count: 30, speed: 2, size: 2.5, type: 'pulse' },
      frantic: { count: 40, speed: 3, size: 3, type: 'chaos' },
      bright: { count: 12, speed: 0.8, size: 1.2, type: 'sparkle' },
      melancholic: { count: 6, speed: 0.3, size: 0.8, type: 'drift' },
      excited: { count: 25, speed: 2.2, size: 2, type: 'explosion' },
      serene: { count: 5, speed: 0.1, size: 0.5, type: 'flow' },
      // Guitar theme moods
      'guitar-clean': { count: 10, speed: 0.4, size: 1.1, type: 'float' },
      'guitar-warm': { count: 15, speed: 0.8, size: 1.5, type: 'drift' },
      'guitar-driven': { count: 25, speed: 1.8, size: 2.2, type: 'pulse' },
      'guitar-heavy': { count: 35, speed: 2.5, size: 2.8, type: 'chaos' }
    };
    
    const config = moodConfigs[mood] || moodConfigs.calm;
    
    // Adjust particle count based on performance mode
    const performanceMultiplier = this.performanceMode === 'high' ? 1 : 
                                  this.performanceMode === 'medium' ? 0.7 : 0.5;
    
    const particleCount = Math.floor(config.count * performanceMultiplier);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticleFromPool();
      if (particle) {
        this.configureParticle(particle, config, beatAnalysis);
        this.particles.push(particle);
      }
    }
  }

  configureParticle(particle, config, beatAnalysis) {
    particle.x = Math.random() * this.canvas.width;
    particle.y = Math.random() * this.canvas.height;
    particle.vx = (Math.random() - 0.5) * config.speed;
    particle.vy = (Math.random() - 0.5) * config.speed;
    particle.size = config.size * (0.8 + Math.random() * 0.4);
    particle.opacity = 0.1 + Math.random() * 0.3;
    particle.color = this.getParticleColor(config.type);
    particle.type = config.type;
    particle.age = 0;
    particle.maxAge = 3000 + Math.random() * 2000;
    particle.pulsePhase = Math.random() * Math.PI * 2;
    
    // Add tempo-based effects if beat analysis is available
    if (beatAnalysis) {
      particle.tempo = beatAnalysis.tempo || 0;
      particle.intensity = beatAnalysis.intensity || 0;
    }
  }

  getParticleColor(type) {
    const colors = {
      float: { r: 100, g: 150, b: 200 },
      burst: { r: 255, g: 100, b: 50 },
      bounce: { r: 150, g: 200, b: 100 },
      pulse: { r: 200, g: 50, b: 50 },
      chaos: { r: 255, g: 200, b: 50 },
      sparkle: { r: 200, g: 200, b: 255 },
      drift: { r: 150, g: 100, b: 200 },
      explosion: { r: 255, g: 150, b: 100 },
      flow: { r: 100, g: 200, b: 200 }
    };
    
    return colors[type] || colors.float;
  }

  createParticle() {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      size: 1, opacity: 1, color: { r: 255, g: 255, b: 255 },
      type: 'float', age: 0, maxAge: 3000,
      pulsePhase: 0, tempo: 0, intensity: 0,
      inUse: false
    };
  }

  getParticleFromPool() {
    const particle = this.particlePool.find(p => !p.inUse);
    if (particle) {
      particle.inUse = true;
      return particle;
    }
    return null;
  }

  returnParticleToPool(particle) {
    particle.inUse = false;
  }

  animate(currentTime = 0) {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    
    // Frame rate limiting
    if (deltaTime < this.frameInterval) {
      requestAnimationFrame((time) => this.animate(time));
      return;
    }
    
    this.lastTime = currentTime;
    
    // Performance monitoring
    this.monitorPerformance();
    
    // Update mood transition
    this.updateMoodTransition(deltaTime);
    
    // Update background
    this.updateBackground();
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render background effects
    this.renderBackgroundEffects();
    
    // Render particles
    this.renderParticles();
    
    requestAnimationFrame((time) => this.animate(time));
  }

  monitorPerformance() {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFPSCheck > 1000) {
      const fps = this.frameCount;
      this.frameCount = 0;
      this.lastFPSCheck = now;
      
      // Adjust performance mode based on FPS
      if (fps < 20 && this.performanceMode === 'high') {
        this.performanceMode = 'medium';
        this.reduceParticleCount(0.7);
      } else if (fps < 15 && this.performanceMode === 'medium') {
        this.performanceMode = 'low';
        this.reduceParticleCount(0.5);
      } else if (fps > 25 && this.performanceMode === 'low') {
        this.performanceMode = 'medium';
      } else if (fps > 28 && this.performanceMode === 'medium') {
        this.performanceMode = 'high';
      }
    }
  }

  reduceParticleCount(factor) {
    const targetCount = Math.floor(this.particles.length * factor);
    while (this.particles.length > targetCount) {
      const particle = this.particles.pop();
      this.returnParticleToPool(particle);
    }
  }

  updateMoodTransition(deltaTime) {
    if (this.moodTransitionProgress < 1) {
      this.moodTransitionProgress += deltaTime / this.transitionDuration;
      this.moodTransitionProgress = Math.min(1, this.moodTransitionProgress);
      
      // Interpolate colors
      this.currentColors = this.interpolateColors(
        this.currentColors,
        this.targetColors,
        this.moodTransitionProgress
      );
    }
  }

  interpolateColors(from, to, progress) {
    const easeProgress = this.easeInOutCubic(progress);
    
    return {
      primary: this.interpolateColor(from.primary, to.primary, easeProgress),
      secondary: this.interpolateColor(from.secondary, to.secondary, easeProgress),
      accent: this.interpolateColor(from.accent, to.accent, easeProgress)
    };
  }

  interpolateColor(from, to, progress) {
    return {
      r: Math.round(from.r + (to.r - from.r) * progress),
      g: Math.round(from.g + (to.g - from.g) * progress),
      b: Math.round(from.b + (to.b - from.b) * progress)
    };
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  updateBackground() {
    // Update CSS background for smooth color transitions
    const primary = this.currentColors.primary;
    const secondary = this.currentColors.secondary;
    
    if (this.container) {
      this.container.style.background = `radial-gradient(circle at center, 
        rgb(${primary.r}, ${primary.g}, ${primary.b}) 0%, 
        rgb(${secondary.r}, ${secondary.g}, ${secondary.b}) 100%)`;
    }
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update age
      particle.age += deltaTime;
      
      // Remove expired particles
      if (particle.age >= particle.maxAge) {
        this.returnParticleToPool(particle);
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update position based on particle type
      this.updateParticlePosition(particle, deltaTime);
      
      // Update opacity based on age
      const ageRatio = particle.age / particle.maxAge;
      particle.opacity = Math.max(0, 1 - ageRatio);
    }
  }

  updateParticlePosition(particle, deltaTime) {
    const dt = deltaTime / 1000;
    
    switch (particle.type) {
      case 'float':
        particle.x += particle.vx * dt * 20;
        particle.y += particle.vy * dt * 20;
        break;
      
      case 'burst':
      case 'explosion':
        particle.x += particle.vx * dt * 50;
        particle.y += particle.vy * dt * 50;
        particle.vx *= 0.98; // Gradual slowdown
        particle.vy *= 0.98;
        break;
      
      case 'bounce':
        particle.x += particle.vx * dt * 30;
        particle.y += particle.vy * dt * 30;
        // Bounce off edges
        if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -0.8;
        break;
      
      case 'pulse':
        particle.pulsePhase += dt * 5;
        particle.x += Math.sin(particle.pulsePhase) * 0.5;
        particle.y += Math.cos(particle.pulsePhase) * 0.5;
        break;
      
      case 'chaos':
        particle.x += particle.vx * dt * 100 * Math.random();
        particle.y += particle.vy * dt * 100 * Math.random();
        particle.vx = (Math.random() - 0.5) * 2;
        particle.vy = (Math.random() - 0.5) * 2;
        break;
      
      case 'sparkle':
        particle.x += particle.vx * dt * 25;
        particle.y += particle.vy * dt * 25;
        particle.size = 1 + Math.sin(particle.age * 0.01) * 0.5;
        break;
      
      case 'drift':
        particle.x += particle.vx * dt * 10;
        particle.y += particle.vy * dt * 10;
        particle.vy += dt * 2; // Slight gravity
        break;
      
      case 'flow':
        particle.x += particle.vx * dt * 15;
        particle.y += particle.vy * dt * 15;
        particle.vx += (Math.random() - 0.5) * 0.1;
        particle.vy += (Math.random() - 0.5) * 0.1;
        break;
    }
    
    // Wrap around screen edges for most types
    if (particle.type !== 'bounce') {
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
    }
  }

  renderBackgroundEffects() {
    // Render subtle background patterns based on mood
    if (this.performanceMode === 'high') {
      this.renderBackgroundPattern();
    }
  }

  renderBackgroundPattern() {
    const accent = this.currentColors.accent;
    this.ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.03)`;
    
    // Simple geometric pattern
    const patternSize = 100;
    for (let x = 0; x < this.canvas.width; x += patternSize) {
      for (let y = 0; y < this.canvas.height; y += patternSize) {
        this.ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  renderParticles() {
    for (const particle of this.particles) {
      this.ctx.save();
      
      const color = particle.color;
      this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${particle.opacity})`;
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }
  }

  updateCSSBackground(mood) {
    // Additional CSS effects can be added here
    if (this.container) {
      this.container.setAttribute('data-mood', mood);
    }
  }

  dispose() {
    this.stop();
    this.particles = [];
    this.particlePool = [];
    
    if (this.container) {
      this.container.style.background = 'black';
      this.container.removeAttribute('data-mood');
    }
  }

  // Debug methods
  getPerformanceStats() {
    return {
      mode: this.performanceMode,
      particleCount: this.particles.length,
      poolSize: this.particlePool.length,
      currentMood: this.currentMood,
      transitionProgress: this.moodTransitionProgress
    };
  }
}

export default BackgroundVisualizer;