// Conductor Controller
// Main logic for conductor mode - orchestrates the new Musical Educator Engine

import { MusicalEducatorEngine } from '../conductor-mode/musicalEducatorEngine.js';
import { GestureRecognizer } from './gestures.js';

export class ConductorController {
  constructor(isDebugMode = false) {
    this.isDebugMode = isDebugMode;
    this.isInitialized = false;
    this.isRunning = false;
    this.isPaused = false;
    
    // Event system
    this.eventListeners = {};
    
    // Main engine
    this.musicalEngine = null;
    
    // Legacy gesture recognizer for fallback
    this.gestureRecognizer = null;
    
    // State
    this.currentTheme = 'piano';
    this.activeGestures = [];
    this.handPositions = [];
    this.lastGestureTime = 0;
    this.gestureCooldown = 200; // ms
    
    // Legacy state for compatibility
    this.activeNotes = new Map();
    this.currentNoteMappings = { left: null, right: null };
    
    // Configuration
    this.config = {
      handTracking: {
        enabled: true,
        confidence: 0.8,
        smoothing: 0.3
      },
      gestures: {
        cooldown: 200,
        confidenceThreshold: 0.8,
        velocityThreshold: 150
      },
      parameters: {
        leftHandOctaveRange: [2, 5],
        volumeDistanceRange: [0.3, 2.0],
        effectIntensityRange: [0, 1]
      },
      visuals: {
        trailEffect: true,
        trailLength: 15,
        trailStyle: 'gradient',
        cameraBlur: 5,
        spawnEffects: true,
        gestureGlow: true
      }
    };
  }

  async init() {
    if (this.isInitialized) {
      console.warn('ConductorController already initialized');
      return;
    }

    try {
      console.log('Initializing Conductor Controller with Musical Educator Engine...');
      
      // Initialize the new Musical Educator Engine
      this.musicalEngine = new MusicalEducatorEngine({
        debug: this.isDebugMode,
        canvas: { width: window.innerWidth, height: window.innerHeight }
      });
      
      await this.musicalEngine.init();
      
      // Initialize legacy gesture recognizer for fallback
      this.gestureRecognizer = new GestureRecognizer({
        confidenceThreshold: this.config.gestures.confidenceThreshold,
        cooldownPeriod: this.config.gestures.cooldown,
        velocityThreshold: this.config.gestures.velocityThreshold
      });
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('Conductor Controller initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Conductor Controller:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Musical Engine Events
    if (this.musicalEngine) {
      this.musicalEngine.on('systemReady', (data) => {
        console.log('Musical Educator Engine ready:', data);
        this.emit('systemReady', data);
      });
      
      this.musicalEngine.on('handDetected', (data) => {
        this.handleHandsDetected(data.hands);
        this.emit('handsDetected', data);
      });
      
      this.musicalEngine.on('handLost', (data) => {
        this.handleHandsLost();
        this.emit('handsLost', data);
      });
      
      this.musicalEngine.on('noteTriggered', (data) => {
        this.handleNoteTriggered(data);
        this.emit('noteTriggered', data);
      });
      
      this.musicalEngine.on('chordDetected', (data) => {
        this.emit('chordDetected', data);
      });
      
      this.musicalEngine.on('intervalDetected', (data) => {
        this.emit('intervalDetected', data);
      });
      
      this.musicalEngine.on('discoveryMade', (data) => {
        this.emit('discoveryMade', data);
      });
      
      this.musicalEngine.on('error', (data) => {
        console.error('Musical Engine error:', data);
        this.emit('error', data);
      });
    }
    
    // Set up keyboard event listeners for theme switching, etc.
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardInput(event);
    });
    
    console.log('Event listeners set up');
  }

  // Handle hands detected (legacy compatibility)
  handleHandsDetected(hands) {
    this.handPositions = hands;
    
    // Update legacy state for UI compatibility
    this.currentNoteMappings = { left: null, right: null };
    
    // Extract hand mappings if available
    hands.forEach(hand => {
      if (hand.handedness) {
        this.currentNoteMappings[hand.handedness.toLowerCase()] = {
          hand: hand,
          position: hand.landmarks ? hand.landmarks[0] : null
        };
      }
    });
  }
  
  // Handle hands lost (legacy compatibility)
  handleHandsLost() {
    this.handPositions = [];
    this.activeGestures = [];
    this.currentNoteMappings = { left: null, right: null };
    this.activeNotes.clear();
  }
  
  // Handle note triggered from musical engine
  handleNoteTriggered(noteData) {
    // Update legacy active notes for UI compatibility
    this.activeNotes.set(noteData.midiNote, {
      timestamp: Date.now(),
      velocity: noteData.velocity || 80,
      hand: noteData.handData?.handedness || 'unknown'
    });
  }
  // Handle keyboard input
  handleKeyboardInput(event) {
    const key = event.key.toLowerCase();
    
    // Handle theme switching
    if (key >= '1' && key <= '4') {
      const themes = ['piano', 'guitar', 'drums', 'strings'];
      const themeIndex = parseInt(key) - 1;
      if (themes[themeIndex]) {
        this.setTheme(themes[themeIndex]);
      }
    }
    
    // Handle other keyboard inputs
    switch (key) {
      case ' ':
        // Space bar - trigger special effect
        this.triggerSpecialEffect();
        break;
    }
  }
  
  // Set theme
  setTheme(theme) {
    if (this.currentTheme === theme) return;
    
    this.currentTheme = theme;
    
    // Update musical engine if available
    if (this.musicalEngine && this.musicalEngine.systems.audio) {
      const themeMapping = {
        'piano': 2,
        'guitar': 3,
        'drums': 2,
        'strings': 2
      };
      
      this.musicalEngine.systems.audio.setTheme(themeMapping[theme] || 2);
    }
    
    // Emit theme change event
    this.emit('themeChanged', theme);
    
    console.log(`Theme changed to: ${theme}`);
  }
  
  // Trigger special effect
  triggerSpecialEffect() {
    console.log('Special effect triggered');
  }
  // Start the controller
  async start() {
    if (!this.isInitialized) {
      throw new Error('ConductorController not initialized');
    }
    
    if (this.isRunning) {
      console.warn('ConductorController already running');
      return;
    }
    
    try {
      console.log('Starting Conductor Controller...');
      
      // Start the musical engine
      if (this.musicalEngine) {
        await this.musicalEngine.start();
      }
      
      this.isRunning = true;
      
      console.log('Conductor Controller started successfully');
      
    } catch (error) {
      console.error('Failed to start Conductor Controller:', error);
      throw error;
    }
  }
  
  // Stop the controller
  async stop() {
    if (!this.isRunning) {
      console.warn('ConductorController not running');
      return;
    }
    
    try {
      console.log('Stopping Conductor Controller...');
      
      this.isRunning = false;
      
      // Stop the musical engine
      if (this.musicalEngine) {
        await this.musicalEngine.stop();
      }
      
      console.log('Conductor Controller stopped');
      
    } catch (error) {
      console.error('Failed to stop Conductor Controller:', error);
      throw error;
    }
  }
  
  // Pause
  pause() {
    if (!this.isRunning) return;
    
    this.isPaused = true;
    if (this.musicalEngine) {
      this.musicalEngine.pause();
    }
    console.log('Conductor Controller paused');
  }
  
  // Resume
  resume() {
    if (!this.isRunning) return;
    
    this.isPaused = false;
    if (this.musicalEngine) {
      this.musicalEngine.resume();
    }
    console.log('Conductor Controller resumed');
  }
  // Get system status
  getSystemStatus() {
    if (this.musicalEngine) {
      return this.musicalEngine.getSystemStatus();
    }
    
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentTheme: this.currentTheme,
      handPositions: this.handPositions.length,
      activeNotes: this.activeNotes.size
    };
  }
  
  // Get progress (legacy compatibility)
  getProgress() {
    if (this.musicalEngine && this.musicalEngine.systems.discovery) {
      return this.musicalEngine.systems.discovery.getProgress();
    }
    return null;
  }
  
  // Get session stats (legacy compatibility)
  getSessionStats() {
    if (this.musicalEngine && this.musicalEngine.systems.discovery) {
      return this.musicalEngine.systems.discovery.getSessionStats();
    }
    return null;
  }
  
  // Get recent discoveries (legacy compatibility)
  getRecentDiscoveries() {
    if (this.musicalEngine) {
      return this.musicalEngine.state.recentDiscoveries || [];
    }
    return [];
  }
  
  // Get achievements (legacy compatibility)
  getAchievements() {
    if (this.musicalEngine && this.musicalEngine.systems.discovery) {
      return this.musicalEngine.systems.discovery.getUnlockedAchievements();
    }
    return [];
  }
  
  // Export progress (legacy compatibility)
  exportProgress() {
    if (this.musicalEngine && this.musicalEngine.systems.discovery) {
      return this.musicalEngine.systems.discovery.exportProgress();
    }
    return null;
  }
  // Event system
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }
}