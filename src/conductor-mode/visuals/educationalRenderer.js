import { TheoryVisualizer } from './theoryVisualizer.js';
import { MUSICAL_CONSTANTS } from '../core/musicalConstants.js';

export class EducationalRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.theoryVisualizer = null;
    this.isInitialized = false;
    this.isRunning = false;
    
    // UI elements
    this.currentAnalysis = null;
    this.handMappings = { left: null, right: null };
    this.discoveries = [];
    this.progressStats = null;
    
    // UI layout
    this.layout = {
      header: { height: 80 },
      handAreas: { split: 0.5 },
      piano: { height: 120 },
      footer: { height: 60 }
    };
    
    // Animation state
    this.animationFrame = null;
    this.lastFrameTime = 0;
    this.fps = 60;
    this.frameInterval = 1000 / this.fps;
    
    // UI styles
    this.styles = {
      background: '#1a1a2e',
      primary: '#16213e',
      secondary: '#0f3460',
      accent: '#e94560',
      text: '#ffffff',
      textSecondary: '#cccccc',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    };
  }

  async init() {
    if (this.isInitialized) return;
    
    // Create main canvas
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    // Initialize theory visualizer
    this.theoryVisualizer = new TheoryVisualizer(this.canvas);
    
    // Set up event listeners
    this.setupEventListeners();
    
    this.isInitialized = true;
    console.log('Educational renderer initialized');
  }

  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 10;
      background: ${this.styles.background};
    `;
    document.body.appendChild(canvas);
    return canvas;
  }

  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  start() {
    if (!this.isInitialized || this.isRunning) return;
    
    this.isRunning = true;
    this.theoryVisualizer.start();
    this.startRenderLoop();
    
    console.log('Educational renderer started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.theoryVisualizer.stop();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    console.log('Educational renderer stopped');
  }

  startRenderLoop() {
    const render = (currentTime) => {
      if (!this.isRunning) return;
      
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        this.render();
        this.lastFrameTime = currentTime;
      }
      
      this.animationFrame = requestAnimationFrame(render);
    };
    
    this.animationFrame = requestAnimationFrame(render);
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw main UI sections
    this.drawHeader();
    this.drawHandAreas();
    this.drawPianoVisualization();
    this.drawFooter();
    
    // Theory visualizer renders on top
    // (handled by its own animation loop)
  }

  drawBackground() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, this.styles.background);
    gradient.addColorStop(1, this.styles.primary);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawHeader() {
    const headerHeight = this.layout.header.height;
    const y = 0;
    
    // Header background
    this.ctx.fillStyle = this.styles.primary;
    this.ctx.fillRect(0, y, this.canvas.width, headerHeight);
    
    // Current theory analysis
    if (this.currentAnalysis) {
      this.drawCurrentAnalysis(y + 10);
    }
    
    // Progress indicators
    if (this.progressStats) {
      this.drawProgressIndicators(y + 40);
    }
  }

  drawCurrentAnalysis(y) {
    const { chord, intervals } = this.currentAnalysis;
    
    // Draw chord information
    if (chord) {
      this.ctx.fillStyle = this.styles.text;
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `🎼 Current Chord: ${chord.root} ${chord.name}! ${chord.emoji}`,
        this.canvas.width / 2,
        y
      );
    }
    
    // Draw interval information
    if (intervals && intervals.length > 0) {
      const interval = intervals[0]; // Show first interval
      this.ctx.fillStyle = this.styles.textSecondary;
      this.ctx.font = '16px Arial';
      this.ctx.fillText(
        `Interval: ${interval.name} ${interval.emoji}`,
        this.canvas.width / 2,
        y + 25
      );
    }
  }

  drawProgressIndicators(y) {
    if (!this.progressStats) return;
    
    const { intervals, chords, scales } = this.progressStats;
    const indicatorWidth = 150;
    const indicatorHeight = 8;
    const spacing = 20;
    const totalWidth = (indicatorWidth + spacing) * 3 - spacing;
    const startX = (this.canvas.width - totalWidth) / 2;
    
    // Draw progress bars
    this.drawProgressBar(startX, y, indicatorWidth, indicatorHeight, 
                        intervals.discovered, intervals.total, 'Intervals');
    this.drawProgressBar(startX + indicatorWidth + spacing, y, indicatorWidth, indicatorHeight, 
                        chords.discovered, chords.total, 'Chords');
    this.drawProgressBar(startX + (indicatorWidth + spacing) * 2, y, indicatorWidth, indicatorHeight, 
                        scales.discovered, scales.total, 'Scales');
  }

  drawProgressBar(x, y, width, height, current, total, label) {
    const progress = total > 0 ? current / total : 0;
    
    // Background
    this.ctx.fillStyle = this.styles.secondary;
    this.ctx.fillRect(x, y, width, height);
    
    // Progress fill
    this.ctx.fillStyle = this.styles.success;
    this.ctx.fillRect(x, y, width * progress, height);
    
    // Label
    this.ctx.fillStyle = this.styles.textSecondary;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${label} (${current}/${total})`, x + width / 2, y + height + 15);
  }

  drawHandAreas() {
    const headerHeight = this.layout.header.height;
    const pianoHeight = this.layout.piano.height;
    const footerHeight = this.layout.footer.height;
    const availableHeight = this.canvas.height - headerHeight - pianoHeight - footerHeight;
    
    const leftArea = {
      x: 0,
      y: headerHeight,
      width: this.canvas.width * this.layout.handAreas.split,
      height: availableHeight
    };
    
    const rightArea = {
      x: this.canvas.width * this.layout.handAreas.split,
      y: headerHeight,
      width: this.canvas.width * (1 - this.layout.handAreas.split),
      height: availableHeight
    };
    
    // Draw hand areas
    this.drawHandArea(leftArea, 'left');
    this.drawHandArea(rightArea, 'right');
    
    // Draw hand mappings
    this.drawHandMapping(leftArea, 'left');
    this.drawHandMapping(rightArea, 'right');
  }

  drawHandArea(area, handedness) {
    const { x, y, width, height } = area;
    
    // Area background
    this.ctx.fillStyle = this.styles.secondary;
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillRect(x, y, width, height);
    this.ctx.globalAlpha = 1;
    
    // Area border
    this.ctx.strokeStyle = this.styles.accent;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
    
    // Hand label
    this.ctx.fillStyle = this.styles.text;
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${handedness === 'left' ? '👋 Left Hand' : 'Right Hand 👋'}`,
      x + width / 2,
      y + 30
    );
    
    // Range indicator
    const range = MUSICAL_CONSTANTS.HAND_RANGES[handedness];
    this.ctx.fillStyle = this.styles.textSecondary;
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      `${range.startNote} - ${range.endNote}`,
      x + width / 2,
      y + 50
    );
  }

  drawHandMapping(area, handedness) {
    const mapping = this.handMappings[handedness];
    if (!mapping) return;
    
    const { x, y, width, height } = area;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Current note indicator
    this.ctx.fillStyle = this.styles.success;
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${mapping.note}${mapping.octave}`,
      centerX,
      centerY
    );
    
    // Velocity indicator
    const velocityBarWidth = 100;
    const velocityBarHeight = 8;
    const velocityX = centerX - velocityBarWidth / 2;
    const velocityY = centerY + 40;
    
    this.ctx.fillStyle = this.styles.secondary;
    this.ctx.fillRect(velocityX, velocityY, velocityBarWidth, velocityBarHeight);
    
    this.ctx.fillStyle = this.styles.accent;
    this.ctx.fillRect(velocityX, velocityY, velocityBarWidth * mapping.velocity, velocityBarHeight);
    
    // Velocity label
    this.ctx.fillStyle = this.styles.textSecondary;
    this.ctx.font = '12px Arial';
    this.ctx.fillText(
      `Volume: ${Math.round(mapping.velocity * 100)}%`,
      centerX,
      velocityY + velocityBarHeight + 15
    );
  }

  drawPianoVisualization() {
    const pianoHeight = this.layout.piano.height;
    const footerHeight = this.layout.footer.height;
    const y = this.canvas.height - pianoHeight - footerHeight;
    
    // Piano background
    this.ctx.fillStyle = this.styles.primary;
    this.ctx.fillRect(0, y, this.canvas.width, pianoHeight);
    
    // Piano keys
    this.drawPianoKeys(y, pianoHeight);
    
    // Active notes
    this.drawActiveNotes(y, pianoHeight);
  }

  drawPianoKeys(y, height) {
    const keyWidth = this.canvas.width / 88; // 88 piano keys
    const whiteKeyHeight = height * 0.8;
    const blackKeyHeight = height * 0.5;
    
    // Draw white keys
    for (let i = 0; i < 88; i++) {
      const midiNote = 21 + i; // A0 = 21
      const isBlackKey = this.isBlackKey(midiNote);
      
      if (!isBlackKey) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(i * keyWidth, y, keyWidth - 1, whiteKeyHeight);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(i * keyWidth, y, keyWidth - 1, whiteKeyHeight);
      }
    }
    
    // Draw black keys
    for (let i = 0; i < 88; i++) {
      const midiNote = 21 + i;
      const isBlackKey = this.isBlackKey(midiNote);
      
      if (isBlackKey) {
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(i * keyWidth + keyWidth * 0.7, y, keyWidth * 0.6, blackKeyHeight);
      }
    }
  }

  drawActiveNotes(y, height) {
    if (!this.currentAnalysis || !this.currentAnalysis.notes) return;
    
    const keyWidth = this.canvas.width / 88;
    const whiteKeyHeight = height * 0.8;
    const blackKeyHeight = height * 0.5;
    
    this.currentAnalysis.notes.forEach(note => {
      const keyIndex = note.midi - 21; // A0 = 21
      const isBlackKey = this.isBlackKey(note.midi);
      
      // Highlight active key
      this.ctx.fillStyle = this.styles.accent;
      this.ctx.globalAlpha = 0.7;
      
      if (isBlackKey) {
        this.ctx.fillRect(keyIndex * keyWidth + keyWidth * 0.7, y, keyWidth * 0.6, blackKeyHeight);
      } else {
        this.ctx.fillRect(keyIndex * keyWidth, y, keyWidth - 1, whiteKeyHeight);
      }
      
      this.ctx.globalAlpha = 1;
    });
  }

  drawFooter() {
    const footerHeight = this.layout.footer.height;
    const y = this.canvas.height - footerHeight;
    
    // Footer background
    this.ctx.fillStyle = this.styles.primary;
    this.ctx.fillRect(0, y, this.canvas.width, footerHeight);
    
    // Recent discoveries
    if (this.discoveries.length > 0) {
      this.drawRecentDiscoveries(y + 20);
    }
  }

  drawRecentDiscoveries(y) {
    const recentDiscoveries = this.discoveries.slice(-3); // Last 3 discoveries
    
    this.ctx.fillStyle = this.styles.textSecondary;
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    
    const discoveryText = recentDiscoveries.map(d => 
      `${d.subtype} ${d.type === 'chord' ? '🎵' : d.type === 'interval' ? '🎶' : '🎼'}`
    ).join(' • ');
    
    this.ctx.fillText(
      `Recent discoveries: ${discoveryText}`,
      this.canvas.width / 2,
      y
    );
  }

  // Helper: Check if MIDI note is a black key
  isBlackKey(midiNote) {
    const noteInOctave = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  }

  // Public API methods
  updateAnalysis(analysis) {
    this.currentAnalysis = analysis;
    
    // Update theory visualizer
    if (analysis.chord && this.handMappings.left && this.handMappings.right) {
      const hands = [this.handMappings.left, this.handMappings.right];
      this.theoryVisualizer.visualizeChord(hands, analysis.chord);
    }
    
    if (analysis.intervals && analysis.intervals.length > 0) {
      const interval = analysis.intervals[0];
      this.theoryVisualizer.visualizeInterval(
        this.handMappings.left,
        this.handMappings.right,
        interval
      );
    }
  }

  updateHandMappings(mappings) {
    this.handMappings = mappings;
  }

  updateProgressStats(stats) {
    this.progressStats = stats;
  }

  addDiscovery(discovery) {
    this.discoveries.push(discovery);
    
    // Trigger discovery visualization
    if (this.handMappings.left && this.handMappings.right) {
      // Theory visualizer will handle discovery animations
    }
  }

  // Show teaching moment
  showTeachingMoment(message) {
    // This could be expanded to show temporary UI overlays
    console.log('Teaching moment:', message);
  }
}