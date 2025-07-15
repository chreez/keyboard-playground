class EmojiAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emojis = [];
    this.lastTime = 0;
    this.isRunning = false;
    this.maxEmojis = 20; // Performance limit
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  spawnEmoji(key, x = null, y = null) {
    // Limit concurrent emojis for performance
    if (this.emojis.length >= this.maxEmojis) {
      this.emojis.shift(); // Remove oldest emoji
    }

    const emojiSet = this.getEmojiSet(key);
    const randomEmoji = emojiSet[Math.floor(Math.random() * emojiSet.length)];
    
    // Default spawn at bottom center if no position specified
    const spawnX = x !== null ? x : this.canvas.width / 2 + (Math.random() - 0.5) * 200;
    const spawnY = y !== null ? y : this.canvas.height - 50;

    const emoji = {
      emoji: randomEmoji,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 100, // Random horizontal velocity
      vy: -Math.random() * 150 - 100,  // Upward velocity
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 5,
      scale: 0.5 + Math.random() * 0.5,
      opacity: 1,
      lifetime: 5000, // 5 seconds
      age: 0,
      size: 48
    };

    this.emojis.push(emoji);
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

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw emojis
    for (let i = this.emojis.length - 1; i >= 0; i--) {
      const emoji = this.emojis[i];
      
      // Update physics
      emoji.age += deltaTime;
      emoji.x += emoji.vx * deltaTime / 1000;
      emoji.y += emoji.vy * deltaTime / 1000;
      emoji.vy += 200 * deltaTime / 1000; // Gravity
      emoji.rotation += emoji.rotationSpeed * deltaTime / 1000;

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
  }

  // Get current emoji count for performance monitoring
  getEmojiCount() {
    return this.emojis.length;
  }
}

export default EmojiAnimator;