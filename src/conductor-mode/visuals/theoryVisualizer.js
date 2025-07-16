import { INTERVALS, CHORD_TYPES, SCALES } from '../core/musicalConstants.js';

export class TheoryVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.animationId = null;
    this.isRunning = false;
    
    // Visual elements
    this.intervalBridges = [];
    this.chordShapes = [];
    this.scaleIndicators = [];
    this.discoveryAnimations = [];
    this.pulseAnimations = [];
    
    // Animation settings
    this.animationSpeed = 0.016; // 60fps
    this.bridgeWidth = 8;
    this.bridgeOpacity = 0.8;
    this.pulseRadius = 100;
    this.pulseSpeed = 2;
    
    // Colors
    this.bridgeColors = {
      perfect: '#FFD700',
      major: '#4ECDC4',
      minor: '#87CEEB',
      diminished: '#FF6B6B',
      augmented: '#FF9FF3'
    };
    
    this.chordColors = {
      major: '#FFD700',
      minor: '#87CEEB',
      diminished: '#FF6B6B',
      augmented: '#FF9FF3',
      sus2: '#96CEB4',
      sus4: '#FECA57'
    };
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate() {
    if (!this.isRunning) return;
    
    this.clear();
    this.update();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update() {
    // Update bridge animations
    this.intervalBridges = this.intervalBridges.filter(bridge => {
      bridge.age += this.animationSpeed;
      return bridge.age < bridge.duration;
    });
    
    // Update chord shape animations
    this.chordShapes = this.chordShapes.filter(shape => {
      shape.age += this.animationSpeed;
      return shape.age < shape.duration;
    });
    
    // Update discovery animations
    this.discoveryAnimations = this.discoveryAnimations.filter(animation => {
      animation.age += this.animationSpeed;
      animation.scale = Math.sin(animation.age * this.pulseSpeed) * 0.5 + 1;
      return animation.age < animation.duration;
    });
    
    // Update pulse animations
    this.pulseAnimations = this.pulseAnimations.filter(pulse => {
      pulse.age += this.animationSpeed;
      pulse.radius = pulse.age * pulse.speed;
      pulse.opacity = Math.max(0, 1 - pulse.age / pulse.duration);
      return pulse.age < pulse.duration;
    });
  }

  render() {
    // Render interval bridges
    this.intervalBridges.forEach(bridge => this.renderIntervalBridge(bridge));
    
    // Render chord shapes
    this.chordShapes.forEach(shape => this.renderChordShape(shape));
    
    // Render discovery animations
    this.discoveryAnimations.forEach(animation => this.renderDiscoveryAnimation(animation));
    
    // Render pulse animations
    this.pulseAnimations.forEach(pulse => this.renderPulseAnimation(pulse));
  }

  // Visualize interval between two hand positions
  showInterval(leftHand, rightHand, intervalInfo) {
    if (!leftHand || !rightHand || !intervalInfo) return;
    
    const leftPos = this.handToScreenPos(leftHand);
    const rightPos = this.handToScreenPos(rightHand);
    
    // Create interval bridge
    const bridge = {
      start: leftPos,
      end: rightPos,
      interval: intervalInfo,
      color: this.getIntervalColor(intervalInfo),
      age: 0,
      duration: 2.0, // 2 seconds
      width: this.bridgeWidth,
      opacity: this.bridgeOpacity
    };
    
    this.intervalBridges.push(bridge);
    
    // Add discovery animation if it's a new interval
    this.addDiscoveryAnimation(leftPos, rightPos, intervalInfo.emoji);
  }

  // Visualize chord shape
  showChord(hands, chordInfo) {
    if (!hands || hands.length < 2 || !chordInfo) return;
    
    const positions = hands.map(hand => this.handToScreenPos(hand));
    const centerPos = this.calculateCenterPosition(positions);
    
    // Create chord shape
    const shape = {
      positions,
      center: centerPos,
      chord: chordInfo,
      color: this.chordColors[chordInfo.type] || '#FFFFFF',
      age: 0,
      duration: 3.0, // 3 seconds
      scale: 1,
      opacity: 0.8
    };
    
    this.chordShapes.push(shape);
    
    // Add chord discovery animation
    this.addDiscoveryAnimation(centerPos, centerPos, chordInfo.emoji);
    
    // Add pulse animation
    this.addPulseAnimation(centerPos, chordInfo.color);
  }

  // Visualize scale pattern
  showScale(hands, scaleInfo) {
    if (!hands || hands.length === 0 || !scaleInfo) return;
    
    const positions = hands.map(hand => this.handToScreenPos(hand));
    
    // Create scale indicator
    const indicator = {
      positions,
      scale: scaleInfo,
      color: scaleInfo.color || '#FFFFFF',
      age: 0,
      duration: 4.0, // 4 seconds
      opacity: 0.6
    };
    
    this.scaleIndicators.push(indicator);
  }

  // Render interval bridge between hands
  renderIntervalBridge(bridge) {
    const { start, end, interval, color, age, duration, width, opacity } = bridge;
    
    // Calculate animation progress
    const progress = age / duration;
    const currentOpacity = opacity * (1 - progress);
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, this.addAlpha(color, currentOpacity));
    gradient.addColorStop(0.5, this.addAlpha('#FFFFFF', currentOpacity * 0.8));
    gradient.addColorStop(1, this.addAlpha(color, currentOpacity));
    
    // Draw bridge
    this.ctx.save();
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    
    // Draw interval label
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    this.ctx.fillStyle = this.addAlpha('#FFFFFF', currentOpacity);
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(interval.name, midX, midY - 20);
    
    // Draw interval emoji
    this.ctx.font = '24px Arial';
    this.ctx.fillText(interval.emoji, midX, midY + 10);
    
    this.ctx.restore();
  }

  // Render chord shape visualization
  renderChordShape(shape) {
    const { positions, center, chord, color, age, duration, opacity } = shape;
    
    // Calculate animation progress
    const progress = age / duration;
    const currentOpacity = opacity * (1 - progress);
    const currentScale = 1 + Math.sin(age * 4) * 0.1; // Gentle pulsing
    
    this.ctx.save();
    this.ctx.translate(center.x, center.y);
    this.ctx.scale(currentScale, currentScale);
    this.ctx.translate(-center.x, -center.y);
    
    // Draw chord connections
    this.ctx.strokeStyle = this.addAlpha(color, currentOpacity * 0.6);
    this.ctx.lineWidth = 3;
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        this.ctx.beginPath();
        this.ctx.moveTo(positions[i].x, positions[i].y);
        this.ctx.lineTo(positions[j].x, positions[j].y);
        this.ctx.stroke();
      }
    }
    
    // Draw chord shape (polygon)
    if (positions.length >= 3) {
      this.ctx.fillStyle = this.addAlpha(color, currentOpacity * 0.3);
      this.ctx.beginPath();
      this.ctx.moveTo(positions[0].x, positions[0].y);
      for (let i = 1; i < positions.length; i++) {
        this.ctx.lineTo(positions[i].x, positions[i].y);
      }
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // Draw chord label
    this.ctx.fillStyle = this.addAlpha('#FFFFFF', currentOpacity);
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${chord.root} ${chord.symbol}`, center.x, center.y - 40);
    
    // Draw chord emoji
    this.ctx.font = '32px Arial';
    this.ctx.fillText(chord.emoji, center.x, center.y);
    
    // Draw chord description
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = this.addAlpha('#CCCCCC', currentOpacity);
    this.ctx.fillText(chord.description, center.x, center.y + 30);
    
    this.ctx.restore();
  }

  // Render discovery animation
  renderDiscoveryAnimation(animation) {
    const { x, y, emoji, scale, age, duration } = animation;
    
    // Calculate animation progress
    const progress = age / duration;
    const currentOpacity = 1 - progress;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    
    // Draw discovery emoji
    this.ctx.fillStyle = this.addAlpha('#FFFFFF', currentOpacity);
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(emoji, 0, 0);
    
    // Draw discovery glow
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 20 * scale;
    this.ctx.fillText(emoji, 0, 0);
    
    this.ctx.restore();
  }

  // Render pulse animation
  renderPulseAnimation(pulse) {
    const { x, y, radius, opacity, color } = pulse;
    
    this.ctx.save();
    this.ctx.strokeStyle = this.addAlpha(color, opacity);
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // Helper: Convert hand position to screen coordinates
  handToScreenPos(hand) {
    // Assuming hand has a position property with normalized coordinates
    const x = hand.position ? hand.position.x * this.canvas.width : this.canvas.width / 2;
    const y = hand.position ? hand.position.y * this.canvas.height : this.canvas.height / 2;
    return { x, y };
  }

  // Helper: Calculate center position of multiple points
  calculateCenterPosition(positions) {
    if (positions.length === 0) return { x: 0, y: 0 };
    
    const sum = positions.reduce((acc, pos) => ({
      x: acc.x + pos.x,
      y: acc.y + pos.y
    }), { x: 0, y: 0 });
    
    return {
      x: sum.x / positions.length,
      y: sum.y / positions.length
    };
  }

  // Helper: Get interval color based on interval type
  getIntervalColor(intervalInfo) {
    const quality = intervalInfo.quality?.toLowerCase();
    return this.bridgeColors[quality] || '#FFFFFF';
  }

  // Helper: Add alpha channel to color
  addAlpha(color, alpha) {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  // Add discovery animation
  addDiscoveryAnimation(startPos, endPos, emoji) {
    const centerX = (startPos.x + endPos.x) / 2;
    const centerY = (startPos.y + endPos.y) / 2;
    
    const animation = {
      x: centerX,
      y: centerY,
      emoji,
      scale: 1,
      age: 0,
      duration: 1.5 // 1.5 seconds
    };
    
    this.discoveryAnimations.push(animation);
  }

  // Add pulse animation
  addPulseAnimation(position, color) {
    const pulse = {
      x: position.x,
      y: position.y,
      radius: 0,
      opacity: 1,
      color: color || '#FFD700',
      speed: 100,
      age: 0,
      duration: 1.0 // 1 second
    };
    
    this.pulseAnimations.push(pulse);
  }

  // Public API for triggering visualizations
  visualizeInterval(leftHand, rightHand, intervalInfo) {
    this.showInterval(leftHand, rightHand, intervalInfo);
  }

  visualizeChord(hands, chordInfo) {
    this.showChord(hands, chordInfo);
  }

  visualizeScale(hands, scaleInfo) {
    this.showScale(hands, scaleInfo);
  }

  // Clear all visualizations
  clearAll() {
    this.intervalBridges = [];
    this.chordShapes = [];
    this.scaleIndicators = [];
    this.discoveryAnimations = [];
    this.pulseAnimations = [];
  }
}