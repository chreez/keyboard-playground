class EmojiAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emojis = [];
    this.lastTime = 0;
    this.isRunning = false;
    this.maxEmojis = 20; // Performance limit
    
    // Targeting system configuration
    this.padding = 0.1; // 10% padding from edges
    this.centerBias = 0.7; // 70% bias toward center
    
    // Animation system
    this.animationTypes = {
      FLOAT: 'float',
      BOUNCE: 'bounce',
      SPIRAL: 'spiral',
      PULSE: 'pulse',
      WIGGLE: 'wiggle',
      BURST: 'burst',
      DRIFT: 'drift',
      SWING: 'swing',
      TYPEWRITER: 'typewriter',
      HOP: 'hop',
      COMPLEX: 'complex' // Multi-emoji complex animations
    };
    
    // Performance monitoring
    this.performanceMode = 'high'; // high, medium, low
    this.frameCount = 0;
    this.lastFPSCheck = 0;
    
    // Complex animation system
    this.complexAnimations = [];
    this.smokeParticles = [];
    
    this.initializeAnimationMappings();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  spawnEmoji(key, targetX = null, targetY = null) {
    // Limit concurrent emojis for performance
    if (this.emojis.length >= this.maxEmojis) {
      this.emojis.shift(); // Remove oldest emoji
    }

    const emojiSet = this.getEmojiSet(key);
    const randomEmoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
    
    // Use targeting system if no position specified
    let spawnX, spawnY;
    if (targetX !== null && targetY !== null) {
      spawnX = targetX;
      spawnY = targetY;
    } else {
      const targetPosition = this.generateTargetPosition();
      spawnX = targetPosition.x;
      spawnY = targetPosition.y;
    }

    // Select animation type based on character
    const animationType = this.selectAnimationType(key, randomEmoji);
    
    // Handle complex animations separately
    if (animationType === this.animationTypes.COMPLEX) {
      this.spawnComplexAnimation(key, randomEmoji, spawnX, spawnY);
      return;
    }
    
    const emoji = {
      emoji: randomEmoji,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 120, // Random horizontal velocity
      vy: -Math.random() * 100 - 80,   // Gentle upward bias
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 4,
      scale: 0.8 + Math.random() * 0.4, // Slightly larger emojis
      opacity: 1,
      lifetime: 6000, // 6 seconds for more viewing time
      age: 0,
      size: 52, // Slightly larger size
      
      // Animation system properties
      animationType: animationType,
      animationState: this.createAnimationState(animationType, spawnX, spawnY),
      character: key
    };

    this.emojis.push(emoji);
  }

  generateTargetPosition() {
    // Calculate padded boundaries
    const paddingX = this.canvas.width * this.padding;
    const paddingY = this.canvas.height * this.padding;
    const minX = paddingX;
    const maxX = this.canvas.width - paddingX;
    const minY = paddingY;
    const maxY = this.canvas.height - paddingY;
    
    // Center-biased distribution
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    let x, y;
    
    if (Math.random() < this.centerBias) {
      // Center-biased spawn (weighted toward center)
      const biasRange = Math.min(this.canvas.width, this.canvas.height) * 0.3; // 30% of screen for center bias
      x = centerX + (Math.random() - 0.5) * biasRange;
      y = centerY + (Math.random() - 0.5) * biasRange;
      
      // Clamp to padded boundaries
      x = Math.max(minX, Math.min(maxX, x));
      y = Math.max(minY, Math.min(maxY, y));
    } else {
      // Random spawn within padded area
      x = minX + Math.random() * (maxX - minX);
      y = minY + Math.random() * (maxY - minY);
    }
    
    return { x, y };
  }

  getEmojiSet(key) {
    const emojiMap = {
      'A': ['🐜', '🍎', '🍏'],
      'B': ['🐻', '⚽', '🏀'],
      'C': ['🐱', '🚗', '🏎️'],
      'D': ['🐶', '🦴', '🎾'],
      'E': ['🐘', '🥚', '⚡'],
      'F': ['🐟', '🔥', '🌸'],
      'G': ['🐐', '🎸', '🍇'],
      'H': ['🐴', '🏠', '💖'],
      'I': ['🐛', '🧊', '💡'],
      'J': ['🐆', '👖', '💎'],
      'K': ['🐨', '🔑', '🪁'],
      'L': ['🦁', '🍃', '💕'],
      'M': ['🐭', '🎵', '🌙'],
      'N': ['🦎', '📝', '🌰'],
      'O': ['🦉', '🍊', '⭕'],
      'P': ['🐷', '🍕', '🎪'],
      'Q': ['🦆', '👑', '❓'],
      'R': ['🐰', '🌧️', '🌹'],
      'S': ['🐍', '⭐', '☀️'],
      'T': ['🐅', '🌳', '🏆'],
      'U': ['🦄', '☂️', '🌙'],
      'V': ['🦅', '🎻', '🌋'],
      'W': ['🐺', '🌊', '🍉'],
      'X': ['🦎', '❌', '💀'],
      'Y': ['🦘', '🧶', '⚡'],
      'Z': ['🦓', '⚡', '〰️'],
      // Numbers 0-9
      '0': ['🥯', '⭕', '🔮'], // Zero, circle, crystal ball
      '1': ['🥇', '👆', '🕐'], // First place, one finger, one o'clock
      '2': ['✌️', '👥', '🕑'], // Peace sign, two people, two o'clock
      '3': ['🥉', '👌', '🕒'], // Third place, OK sign, three o'clock
      '4': ['🍀', '🧩', '🕓'], // Four-leaf clover, puzzle, four o'clock
      '5': ['🖐️', '⭐', '🕔'], // Hand, star, five o'clock
      '6': ['🎲', '🏠', '🕕'], // Dice, house, six o'clock
      '7': ['🎰', '🌈', '🕖'], // Lucky seven, rainbow, seven o'clock
      '8': ['🎱', '♾️', '🕗'], // Eight ball, infinity, eight o'clock
      '9': ['🐱', '☁️', '🕘'], // Nine lives, cloud nine, nine o'clock
      // Common symbols
      ' ': ['💨', '🌌', '👻'], // Wind, space, ghost
      '.': ['⚫', '🔴', '🟠'], // Dots and circles
      ',': ['📝', '⏸️', '🍃'], // Writing, pause, leaf
      '!': ['❗', '⚠️', '💥'], // Exclamation marks
      '?': ['❓', '🤔', '🔍'], // Question marks
      ';': ['😉', '👁️', '🔗'], // Wink, eye, link
      ':': ['😊', '👀', '⚖️'], // Colon faces
      "'": ['✨', '💬', '📜'], // Sparkle, speech, scroll
      '"': ['💭', '📖', '🗣️'], // Thought bubble, book, speaking
      '-': ['➖', '✂️', '🔗'], // Minus, scissors, link
      '=': ['⚖️', '🟰', '⚗️'], // Balance, equals, chemistry
      '+': ['➕', '🩹', '⚕️'], // Plus, bandage, medical
      '*': ['⭐', '✨', '🌟'], // Stars
      '/': ['➗', '🔪', '⚡'], // Division, knife, lightning
      '\\': ['↖️', '🪃', '📐'], // Arrow, boomerang, ruler
      '(': ['🤗', '🫂', '👐'], // Hug, embrace, open hands
      ')': ['😊', '🙌', '👏'], // Smile, celebration, clap
      '[': ['📦', '🗃️', '📚'], // Box, filing cabinet, books
      ']': ['✅', '🎯', '🏁'], // Check, target, finish
      '{': ['🌸', '💮', '🏵️'], // Flowers, decorative
      '}': ['🎉', '🎊', '✨'], // Celebration, confetti, sparkles
      '<': ['⬅️', '◀️', '👈'], // Left arrows
      '>': ['➡️', '▶️', '👉'], // Right arrows
      '@': ['📧', '🌐', '📍'], // Email, web, location
      '#': ['🏷️', '🎵', '#️⃣'], // Tag, music, number
      '$': ['💰', '💴', '💵'], // Money
      '%': ['📊', '🔋', '💯'], // Percentage, battery, hundred
      '^': ['⬆️', '🔺', '🏔️'], // Up arrow, triangle, mountain
      '&': ['🤝', '🔗', '➕'], // Handshake, link, and
      '|': ['📏', '🔌', '⚡'], // Ruler, plug, pipe
      '~': ['🌊', '〰️', '🐍'], // Wave, wavy line, snake
      '`': ['💭', '✒️', '📝'] // Backtick, pen, writing
    };

    return emojiMap[key] || ['❓'];
  }

  animate(currentTime = 0) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Performance monitoring
    this.monitorPerformance();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw emojis
    for (let i = this.emojis.length - 1; i >= 0; i--) {
      const emoji = this.emojis[i];
      
      // Update age
      emoji.age += deltaTime;

      // Update animation-specific physics
      this.updateAnimation(emoji, deltaTime);

      // Update opacity (fade out towards end of lifetime)
      emoji.opacity = Math.max(0, 1 - (emoji.age / emoji.lifetime));

      // Remove if expired or off screen
      if (emoji.age >= emoji.lifetime || 
          emoji.y > this.canvas.height + 100 ||
          emoji.opacity <= 0) {
        this.emojis.splice(i, 1);
        continue;
      }

      // Draw emoji
      this.drawEmoji(emoji);
    }
    
    // Update and draw complex animations
    this.updateComplexAnimations(deltaTime);
    
    // Update and draw smoke particles
    this.updateSmokeParticles(deltaTime);

    requestAnimationFrame((time) => this.animate(time));
  }

  drawEmoji(emoji) {
    this.ctx.save();
    
    this.ctx.globalAlpha = emoji.opacity;
    this.ctx.translate(emoji.x, emoji.y);
    this.ctx.rotate(emoji.rotation);
    this.ctx.scale(emoji.scale, emoji.scale);
    
    this.ctx.font = `${emoji.size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.ctx.fillText(emoji.emoji, 0, 0);
    
    this.ctx.restore();
  }

  dispose() {
    this.stop();
    this.emojis = [];
    this.complexAnimations = [];
    this.smokeParticles = [];
  }

  // Get current emoji count for performance monitoring
  getEmojiCount() {
    return this.emojis.length;
  }

  // Animation system methods
  initializeAnimationMappings() {
    this.characterAnimations = {
      // Letters (A-Z)
      'A': [this.animationTypes.HOP, this.animationTypes.FLOAT], // Ant hops, Apple floats
      'B': [this.animationTypes.BOUNCE, this.animationTypes.FLOAT], // Ball bounces, Bear floats
      'C': [this.animationTypes.COMPLEX, this.animationTypes.WIGGLE], // Car complex, Cat wiggle
      'D': [this.animationTypes.WIGGLE, this.animationTypes.BOUNCE], // Dog wiggle, Ball bounces
      'E': [this.animationTypes.FLOAT, this.animationTypes.BURST], // Elephant float, Energy burst
      'F': [this.animationTypes.WIGGLE, this.animationTypes.BURST], // Fish wiggle, Fire burst
      'G': [this.animationTypes.HOP, this.animationTypes.FLOAT], // Goat hop, Grapes float
      'H': [this.animationTypes.FLOAT, this.animationTypes.PULSE], // Horse float, Heart pulse
      'I': [this.animationTypes.WIGGLE, this.animationTypes.DRIFT], // Insect wiggle, Ice drift
      'J': [this.animationTypes.BOUNCE, this.animationTypes.FLOAT], // Jaguar bounce, Jeans float
      'K': [this.animationTypes.DRIFT, this.animationTypes.SWING], // Koala drift, Key swing
      'L': [this.animationTypes.FLOAT, this.animationTypes.PULSE], // Lion float, Leaf pulse
      'M': [this.animationTypes.HOP, this.animationTypes.DRIFT], // Mouse hop, Moon drift
      'N': [this.animationTypes.WIGGLE, this.animationTypes.TYPEWRITER], // Newt wiggle, Note typewriter
      'O': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Owl float, Orange float
      'P': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Pig float, Pizza float
      'Q': [this.animationTypes.DRIFT, this.animationTypes.FLOAT], // Quail drift, Question float
      'R': [this.animationTypes.HOP, this.animationTypes.DRIFT], // Rabbit hop, Rain drift
      'S': [this.animationTypes.WIGGLE, this.animationTypes.SPIRAL], // Snake wiggle, Star spiral
      'T': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Tiger float, Tree float
      'U': [this.animationTypes.SPIRAL, this.animationTypes.DRIFT], // Unicorn spiral, Umbrella drift
      'V': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Vulture float, Violin float
      'W': [this.animationTypes.FLOAT, this.animationTypes.WIGGLE], // Wolf float, Wave wiggle
      'X': [this.animationTypes.WIGGLE, this.animationTypes.BURST], // Xenops wiggle, X-mark burst
      'Y': [this.animationTypes.HOP, this.animationTypes.FLOAT], // Yak hop, Yarn float
      'Z': [this.animationTypes.FLOAT, this.animationTypes.WIGGLE], // Zebra float, Zigzag wiggle
      
      // Numbers (0-9)
      '0': [this.animationTypes.DRIFT, this.animationTypes.SPIRAL], // Circle drift, Crystal spiral
      '1': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // First float, Finger float
      '2': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Peace float, People float
      '3': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Medal float, OK float
      '4': [this.animationTypes.DRIFT, this.animationTypes.FLOAT], // Clover drift, Puzzle float
      '5': [this.animationTypes.FLOAT, this.animationTypes.SPIRAL], // Hand float, Star spiral
      '6': [this.animationTypes.BOUNCE, this.animationTypes.FLOAT], // Dice bounce, House float
      '7': [this.animationTypes.SPIRAL, this.animationTypes.DRIFT], // Lucky spiral, Rainbow drift
      '8': [this.animationTypes.BOUNCE, this.animationTypes.SPIRAL], // Ball bounce, Infinity spiral
      '9': [this.animationTypes.DRIFT, this.animationTypes.DRIFT], // Lives drift, Cloud drift
      
      // Symbols
      ' ': [this.animationTypes.DRIFT, this.animationTypes.DRIFT], // Wind drift, Space drift
      '.': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Dots float
      ',': [this.animationTypes.TYPEWRITER, this.animationTypes.DRIFT], // Writing typewriter, Pause drift
      '!': [this.animationTypes.BURST, this.animationTypes.PULSE], // Exclamation burst, Warning pulse
      '?': [this.animationTypes.FLOAT, this.animationTypes.WIGGLE], // Question float, Search wiggle
      ';': [this.animationTypes.PULSE, this.animationTypes.FLOAT], // Wink pulse, Eye float
      ':': [this.animationTypes.PULSE, this.animationTypes.FLOAT], // Smile pulse, Eyes float
      "'": [this.animationTypes.TYPEWRITER, this.animationTypes.DRIFT], // Speech typewriter, Sparkle drift
      '"': [this.animationTypes.TYPEWRITER, this.animationTypes.FLOAT], // Quote typewriter, Book float
      '-': [this.animationTypes.SWING, this.animationTypes.FLOAT], // Minus swing, Cut float
      '=': [this.animationTypes.SWING, this.animationTypes.FLOAT], // Balance swing, Equals float
      '+': [this.animationTypes.PULSE, this.animationTypes.FLOAT], // Plus pulse, Medical float
      '*': [this.animationTypes.SPIRAL, this.animationTypes.BURST], // Star spiral, Sparkle burst
      '/': [this.animationTypes.FLOAT, this.animationTypes.BURST], // Division float, Lightning burst
      '\\': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Arrow float, Boomerang float
      '(': [this.animationTypes.PULSE, this.animationTypes.FLOAT], // Hug pulse, Embrace float
      ')': [this.animationTypes.PULSE, this.animationTypes.FLOAT], // Smile pulse, Celebration float
      '[': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Box float, Books float
      ']': [this.animationTypes.BURST, this.animationTypes.FLOAT], // Check burst, Target float
      '{': [this.animationTypes.SPIRAL, this.animationTypes.PULSE], // Flower spiral, Decoration pulse
      '}': [this.animationTypes.BURST, this.animationTypes.SPIRAL], // Celebration burst, Confetti spiral
      '<': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Left arrows float
      '>': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Right arrows float
      '@': [this.animationTypes.TYPEWRITER, this.animationTypes.FLOAT], // Email typewriter, Web float
      '#': [this.animationTypes.FLOAT, this.animationTypes.SPIRAL], // Tag float, Music spiral
      '$': [this.animationTypes.FLOAT, this.animationTypes.DRIFT], // Money float, Cash drift
      '%': [this.animationTypes.FLOAT, this.animationTypes.PULSE], // Percent float, Battery pulse
      '^': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Up arrows float, Mountain float
      '&': [this.animationTypes.SWING, this.animationTypes.FLOAT], // Handshake swing, Link float
      '|': [this.animationTypes.FLOAT, this.animationTypes.FLOAT], // Ruler float, Pipe float
      '~': [this.animationTypes.WIGGLE, this.animationTypes.WIGGLE], // Wave wiggle, Snake wiggle
      '`': [this.animationTypes.TYPEWRITER, this.animationTypes.FLOAT] // Backtick typewriter, Pen float
    };
  }

  selectAnimationType(character, emoji) {
    const animations = this.characterAnimations[character] || [this.animationTypes.FLOAT];
    
    // Performance-based selection
    if (this.performanceMode === 'low') {
      // Favor simpler animations
      const simpleAnimations = animations.filter(type => 
        type === this.animationTypes.FLOAT || 
        type === this.animationTypes.DRIFT ||
        type === this.animationTypes.PULSE
      );
      if (simpleAnimations.length > 0) {
        return simpleAnimations[Math.floor(Math.random() * simpleAnimations.length)];
      }
    }
    
    // Weighted selection: 70% primary, 25% secondary, 5% fallback
    const rand = Math.random();
    if (rand < 0.7) {
      return animations[0];
    } else if (rand < 0.95 && animations.length > 1) {
      return animations[1];
    } else {
      return this.animationTypes.FLOAT;
    }
  }

  createAnimationState(animationType, startX, startY) {
    switch (animationType) {
      case this.animationTypes.BOUNCE:
        return {
          bounceDecay: 0.8,
          lastBounceY: startY,
          bounceCount: 0,
          maxBounces: 5,
          minBounceHeight: 20
        };
      
      case this.animationTypes.SPIRAL:
        return {
          spiralRadius: 30 + Math.random() * 50,
          spiralSpeed: 2 + Math.random() * 4,
          spiralAngle: 0,
          spiralCenterX: startX,
          spiralCenterY: startY,
          direction: Math.random() > 0.5 ? 1 : -1
        };
      
      case this.animationTypes.PULSE:
        return {
          pulseFrequency: 2 + Math.random() * 2,
          pulseAmplitude: 0.2 + Math.random() * 0.3,
          pulsePhase: 0,
          baseScale: 1.0
        };
      
      case this.animationTypes.WIGGLE:
        return {
          wiggleAmplitude: 15 + Math.random() * 25,
          wiggleFrequency: 3 + Math.random() * 5,
          wigglePhase: Math.random() * Math.PI * 2,
          originalX: startX,
          damping: 0.98
        };
      
      case this.animationTypes.BURST:
        return {
          burstScale: 1.8,
          burstDuration: 300,
          pauseDuration: 200,
          burstPhase: 'expanding', // expanding, pausing, moving
          burstStartTime: 0
        };
      
      case this.animationTypes.DRIFT:
        return {
          driftSpeed: 20 + Math.random() * 20,
          randomDrift: 10,
          driftX: 0,
          driftY: 0
        };
      
      case this.animationTypes.SWING:
        return {
          swingAngle: 45,
          swingSpeed: 3,
          swingPhase: 0,
          swingDamping: 0.995,
          pivotX: startX,
          pivotY: startY - 30
        };
      
      case this.animationTypes.TYPEWRITER:
        return {
          typePause: 400,
          typePhase: 'typing', // typing, moving
          typeStartTime: 0,
          originalScale: 1.0
        };
      
      case this.animationTypes.HOP:
        return {
          hopHeight: 40,
          hopDistance: 30,
          hopPhase: 0,
          hopFrequency: 3,
          hopCount: 0,
          maxHops: 8
        };
      
      default:
        return {}; // Float animation needs no special state
    }
  }

  updateAnimation(emoji, deltaTime) {
    const dt = deltaTime / 1000;
    
    switch (emoji.animationType) {
      case this.animationTypes.BOUNCE:
        this.updateBounceAnimation(emoji, dt);
        break;
      
      case this.animationTypes.SPIRAL:
        this.updateSpiralAnimation(emoji, dt);
        break;
      
      case this.animationTypes.PULSE:
        this.updatePulseAnimation(emoji, dt);
        break;
      
      case this.animationTypes.WIGGLE:
        this.updateWiggleAnimation(emoji, dt);
        break;
      
      case this.animationTypes.BURST:
        this.updateBurstAnimation(emoji, dt);
        break;
      
      case this.animationTypes.DRIFT:
        this.updateDriftAnimation(emoji, dt);
        break;
      
      case this.animationTypes.SWING:
        this.updateSwingAnimation(emoji, dt);
        break;
      
      case this.animationTypes.TYPEWRITER:
        this.updateTypewriterAnimation(emoji, dt);
        break;
      
      case this.animationTypes.HOP:
        this.updateHopAnimation(emoji, dt);
        break;
      
      case this.animationTypes.COMPLEX:
        // Complex animations are handled separately
        break;
      
      default:
        this.updateFloatAnimation(emoji, dt);
        break;
    }
  }

  updateFloatAnimation(emoji, dt) {
    // Original float behavior
    emoji.x += emoji.vx * dt;
    emoji.y += emoji.vy * dt;
    emoji.vy += 200 * dt; // Gravity
    emoji.rotation += emoji.rotationSpeed * dt;
  }

  updateBounceAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    // Update position
    emoji.x += emoji.vx * dt;
    emoji.y += emoji.vy * dt;
    emoji.vy += 200 * dt; // Gravity
    emoji.rotation += emoji.rotationSpeed * dt;
    
    // Check for bounce
    if (emoji.y > this.canvas.height - 100 && emoji.vy > 0 && state.bounceCount < state.maxBounces) {
      const bounceHeight = Math.abs(emoji.vy) * state.bounceDecay;
      if (bounceHeight > state.minBounceHeight) {
        emoji.vy = -bounceHeight;
        emoji.y = this.canvas.height - 100;
        state.bounceCount++;
        state.bounceDecay *= 0.9; // Reduce energy each bounce
      }
    }
  }

  updateSpiralAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    // Update spiral motion
    state.spiralAngle += state.spiralSpeed * dt * state.direction;
    
    // Calculate spiral position
    const spiralX = Math.cos(state.spiralAngle) * state.spiralRadius;
    const spiralY = Math.sin(state.spiralAngle) * state.spiralRadius * 0.5; // Flattened spiral
    
    // Update position (spiral + upward movement)
    emoji.x = state.spiralCenterX + spiralX;
    emoji.y = state.spiralCenterY + spiralY + emoji.vy * dt;
    
    // Update center position for upward movement
    state.spiralCenterY += emoji.vy * dt;
    emoji.vy += 200 * dt; // Gravity
    
    // Rotation based on spiral movement
    emoji.rotation += state.spiralSpeed * dt * state.direction;
  }

  updatePulseAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    // Update pulse
    state.pulsePhase += state.pulseFrequency * dt;
    const pulseScale = 1 + Math.sin(state.pulsePhase) * state.pulseAmplitude;
    emoji.scale = state.baseScale * pulseScale;
    
    // Regular float movement
    emoji.x += emoji.vx * dt;
    emoji.y += emoji.vy * dt;
    emoji.vy += 200 * dt; // Gravity
    emoji.rotation += emoji.rotationSpeed * dt;
  }

  updateWiggleAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    // Update wiggle motion
    state.wigglePhase += state.wiggleFrequency * dt;
    const wiggleOffset = Math.sin(state.wigglePhase) * state.wiggleAmplitude;
    
    // Apply wiggle to horizontal position
    emoji.x = state.originalX + wiggleOffset;
    
    // Update original position for overall movement
    state.originalX += emoji.vx * dt;
    emoji.y += emoji.vy * dt;
    emoji.vy += 200 * dt; // Gravity
    
    // Reduce wiggle amplitude over time
    state.wiggleAmplitude *= state.damping;
    
    // Rotation based on wiggle
    emoji.rotation += Math.sin(state.wigglePhase) * 0.1;
  }

  updateBurstAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    if (state.burstPhase === 'expanding') {
      state.burstStartTime += dt * 1000;
      
      if (state.burstStartTime < state.burstDuration) {
        // Expanding phase
        const progress = state.burstStartTime / state.burstDuration;
        emoji.scale = 1 + (state.burstScale - 1) * progress;
      } else {
        // Switch to pausing phase
        state.burstPhase = 'pausing';
        state.burstStartTime = 0;
      }
    } else if (state.burstPhase === 'pausing') {
      state.burstStartTime += dt * 1000;
      
      if (state.burstStartTime >= state.pauseDuration) {
        // Switch to moving phase
        state.burstPhase = 'moving';
        emoji.scale = 1; // Reset to normal scale
      }
    } else {
      // Moving phase - regular float animation
      this.updateFloatAnimation(emoji, dt);
    }
  }

  updateDriftAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    // Add random drift
    state.driftX += (Math.random() - 0.5) * state.randomDrift * dt;
    state.driftY += (Math.random() - 0.5) * state.randomDrift * dt;
    
    // Apply drift with reduced gravity
    emoji.x += (emoji.vx + state.driftX) * dt;
    emoji.y += (emoji.vy + state.driftY) * dt;
    emoji.vy += 50 * dt; // Reduced gravity for floating effect
    
    // Gentle rotation
    emoji.rotation += emoji.rotationSpeed * dt * 0.5;
  }

  updateSwingAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    // Update swing motion
    state.swingPhase += state.swingSpeed * dt;
    const swingOffset = Math.sin(state.swingPhase) * state.swingAngle;
    
    // Calculate position relative to pivot
    const distance = 50; // Length of swing
    const angle = (swingOffset * Math.PI) / 180;
    
    emoji.x = state.pivotX + Math.sin(angle) * distance;
    emoji.y = state.pivotY + Math.cos(angle) * distance;
    
    // Update pivot position for upward movement
    state.pivotY += emoji.vy * dt;
    emoji.vy += 200 * dt; // Gravity
    
    // Damping
    state.swingAngle *= state.swingDamping;
    
    // Rotation based on swing
    emoji.rotation = angle;
  }

  updateTypewriterAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    if (state.typePhase === 'typing') {
      state.typeStartTime += dt * 1000;
      
      // Blinking effect during typing
      emoji.scale = state.originalScale * (1 + Math.sin(state.typeStartTime * 0.01) * 0.1);
      
      if (state.typeStartTime >= state.typePause) {
        state.typePhase = 'moving';
        emoji.scale = state.originalScale;
      }
    } else {
      // Moving phase
      this.updateFloatAnimation(emoji, dt);
    }
  }

  updateHopAnimation(emoji, dt) {
    const state = emoji.animationState;
    
    if (state.hopCount < state.maxHops) {
      // Update hop motion
      state.hopPhase += state.hopFrequency * dt;
      
      // Create hopping motion
      const hopProgress = state.hopPhase % 1;
      const hopArc = Math.sin(hopProgress * Math.PI) * state.hopHeight;
      
      // Move forward with each hop
      emoji.x += state.hopDistance * state.hopFrequency * dt;
      emoji.y += emoji.vy * dt - hopArc * dt;
      
      // Count completed hops
      if (hopProgress > 0.9 && state.hopPhase > state.hopCount + 1) {
        state.hopCount++;
      }
    } else {
      // After hopping, switch to float
      this.updateFloatAnimation(emoji, dt);
    }
    
    // Rotation based on hopping
    emoji.rotation += emoji.rotationSpeed * dt;
  }

  monitorPerformance() {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFPSCheck > 1000) {
      const fps = this.frameCount;
      this.frameCount = 0;
      this.lastFPSCheck = now;
      
      // Adjust performance mode based on FPS
      if (fps < 45 && this.performanceMode === 'high') {
        this.performanceMode = 'medium';
        console.log('Animation performance: switched to medium mode');
      } else if (fps < 30 && this.performanceMode === 'medium') {
        this.performanceMode = 'low';
        console.log('Animation performance: switched to low mode');
      } else if (fps > 55 && this.performanceMode === 'low') {
        this.performanceMode = 'medium';
      } else if (fps > 58 && this.performanceMode === 'medium') {
        this.performanceMode = 'high';
      }
    }
  }

  // Complex Animation System
  spawnComplexAnimation(character, emoji, x, y) {
    if (character === 'C' && (emoji === '🚗' || emoji === '🏎️')) {
      this.spawnCarWithSmoke(emoji, x, y);
    }
    // Add more complex animations here for other characters
  }

  spawnCarWithSmoke(carEmoji, x, y) {
    const carAnimation = {
      id: Date.now() + Math.random(),
      type: 'car_with_smoke',
      car: {
        emoji: carEmoji,
        x: x,
        y: y,
        vx: 200 + Math.random() * 100, // Fast horizontal movement
        vy: -50 + Math.random() * 30,   // Slight upward movement
        rotation: 0,
        rotationSpeed: 0,
        scale: 1.0,
        opacity: 1,
        size: 56
      },
      smokeSpawnTimer: 0,
      smokeSpawnInterval: 80, // Spawn smoke every 80ms
      age: 0,
      lifetime: 8000 // 8 seconds
    };
    
    this.complexAnimations.push(carAnimation);
  }

  updateComplexAnimations(deltaTime) {
    for (let i = this.complexAnimations.length - 1; i >= 0; i--) {
      const animation = this.complexAnimations[i];
      animation.age += deltaTime;
      
      if (animation.type === 'car_with_smoke') {
        this.updateCarWithSmoke(animation, deltaTime);
      }
      
      // Remove expired animations
      if (animation.age >= animation.lifetime) {
        this.complexAnimations.splice(i, 1);
      }
    }
  }

  updateCarWithSmoke(animation, deltaTime) {
    const dt = deltaTime / 1000;
    const car = animation.car;
    
    // Update car position
    car.x += car.vx * dt;
    car.y += car.vy * dt;
    car.vy += 50 * dt; // Light gravity
    
    // Update opacity (fade out towards end)
    car.opacity = Math.max(0, 1 - (animation.age / animation.lifetime));
    
    // Spawn smoke particles
    animation.smokeSpawnTimer += deltaTime;
    if (animation.smokeSpawnTimer >= animation.smokeSpawnInterval) {
      this.spawnSmokeParticle(car.x - 20, car.y + 10); // Behind the car
      animation.smokeSpawnTimer = 0;
    }
    
    // Draw car
    this.drawComplexEmoji(car);
  }

  spawnSmokeParticle(x, y) {
    const smokeParticle = {
      emoji: '💨',
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vx: -30 + Math.random() * 20, // Drift backward
      vy: -20 + Math.random() * 40, // Slight upward drift
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 2,
      scale: 0.3 + Math.random() * 0.4, // Smaller smoke particles
      opacity: 0.8,
      lifetime: 2000 + Math.random() * 1000, // 2-3 seconds
      age: 0,
      size: 32,
      expansionRate: 0.5 // Smoke expands over time
    };
    
    this.smokeParticles.push(smokeParticle);
  }

  updateSmokeParticles(deltaTime) {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const particle = this.smokeParticles[i];
      const dt = deltaTime / 1000;
      
      // Update particle
      particle.age += deltaTime;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 30 * dt; // Light gravity
      particle.rotation += particle.rotationSpeed * dt;
      
      // Expand and fade smoke
      const ageRatio = particle.age / particle.lifetime;
      particle.scale += particle.expansionRate * dt;
      particle.opacity = Math.max(0, 0.8 * (1 - ageRatio));
      
      // Remove expired particles
      if (particle.age >= particle.lifetime || particle.opacity <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }
      
      // Draw smoke particle
      this.drawComplexEmoji(particle);
    }
  }

  drawComplexEmoji(emojiObj) {
    this.ctx.save();
    
    this.ctx.globalAlpha = emojiObj.opacity;
    this.ctx.translate(emojiObj.x, emojiObj.y);
    this.ctx.rotate(emojiObj.rotation);
    this.ctx.scale(emojiObj.scale, emojiObj.scale);
    
    this.ctx.font = `${emojiObj.size}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.ctx.fillText(emojiObj.emoji, 0, 0);
    
    this.ctx.restore();
  }
}

export default EmojiAnimator;