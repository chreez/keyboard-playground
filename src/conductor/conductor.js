// Conductor Controller
// Main logic for conductor mode - orchestrates hand tracking, gestures, and audio/visual systems

import AudioSystem from '../audio/AudioSystem.js';
import EmojiAnimator from '../animation/EmojiAnimator.js';
import HandTracker from '../tracking/HandTracker.js';
import { GestureRecognizer } from './gestures.js';
import { MusicTheoryEngine } from '../conductor-mode/core/musicTheoryEngine.js';
import { HandNoteMapper } from '../conductor-mode/core/handNoteMapper.js';
import { EducationalRenderer } from '../conductor-mode/visuals/educationalRenderer.js';
import { AITeacher } from '../conductor-mode/educational/aiTeacher.js';
import { DiscoverySystem } from '../conductor-mode/educational/discoverySystem.js';

export class ConductorController {
  constructor(isDebugMode = false) {
    this.isDebugMode = isDebugMode;
    this.isInitialized = false;
    this.isRunning = false;
    this.isPaused = false;
    
    // Event system
    this.eventListeners = {};
    
    // Core systems (to be initialized)
    this.handTracker = null;
    this.gestureRecognizer = null;
    this.audioSystem = null;
    this.emojiAnimator = null;
    this.musicTheoryEngine = null;
    this.handNoteMapper = null;
    this.educationalRenderer = null;
    this.aiTeacher = null;
    this.discoverySystem = null;
    
    // State
    this.currentTheme = 'piano';
    this.activeGestures = [];
    this.handPositions = [];
    this.lastGestureTime = 0;
    this.gestureCooldown = 200; // ms
    this.activeNotes = new Map(); // MIDI note -> { timestamp, velocity, hand }
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
      console.log('Initializing Conductor Controller...');
      
      // Initialize core systems
      await this.initializeCoreSystems();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('Conductor Controller initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Conductor Controller:', error);
      throw error;
    }
  }

  async initializeCoreSystems() {
    console.log('Initializing core systems...');
    
    // Initialize real hand tracking system
    this.handTracker = new HandTracker();
    await this.handTracker.init({
      maxHands: 2,
      minDetectionConfidence: this.config.handTracking.confidence,
      minTrackingConfidence: this.config.handTracking.confidence,
      showLandmarks: this.isDebugMode, // Show landmarks only in debug mode
      gestureMode: 'basic'
    });
    
    // Set up hand tracking event listeners
    this.handTracker.on('handsDetected', (hands) => {
      this.handleHandsDetected(hands);
    });
    
    this.handTracker.on('handsLost', () => {
      this.handleHandsLost();
    });
    
    // Apply camera blur in production mode
    if (!this.isDebugMode) {
      this.applyCameraBlur();
    }
    
    // Configure trail effects for conductor mode
    this.configureTrailEffects();
    
    // Initialize real gesture recognizer
    this.gestureRecognizer = new GestureRecognizer({
      confidenceThreshold: this.config.gestures.confidenceThreshold,
      cooldownPeriod: this.config.gestures.cooldown,
      velocityThreshold: this.config.gestures.velocityThreshold
    });
    
    // Initialize real audio system
    this.audioSystem = new AudioSystem();
    await this.audioSystem.initialize();
    
    // Set default theme
    this.audioSystem.setTheme(2); // Piano theme
    
    // Initialize emoji animator with canvas
    const canvas = this.createEmojiCanvas();
    this.emojiAnimator = new EmojiAnimator(canvas);
    this.emojiAnimator.start();
    
    // Initialize music theory engine
    this.musicTheoryEngine = new MusicTheoryEngine();
    
    // Initialize hand-to-note mapper
    this.handNoteMapper = new HandNoteMapper();
    
    // Initialize educational renderer
    this.educationalRenderer = new EducationalRenderer();
    await this.educationalRenderer.init();
    
    // Initialize AI teacher
    this.aiTeacher = new AITeacher();
    await this.aiTeacher.init();
    
    // Set up AI teacher event handlers
    this.aiTeacher.onSuggestionReceived((suggestion) => {
      this.handleAISuggestion(suggestion);
    });
    
    this.aiTeacher.onCelebrationTriggered((celebration) => {
      this.handleAICelebration(celebration);
    });
    
    this.aiTeacher.onErrorOccurred((error) => {
      console.error('AI Teacher error:', error);
    });
    
    // Initialize discovery system
    this.discoverySystem = new DiscoverySystem();
    
    // Set up discovery system event handlers
    this.discoverySystem.onDiscoveryMade((discovery) => {
      this.handleDiscoveryMade(discovery);
    });
    
    this.discoverySystem.onAchievementUnlocked((achievement) => {
      this.handleAchievementUnlocked(achievement);
    });
    
    this.discoverySystem.onCelebrationTriggered((celebration) => {
      this.handleCelebrationTriggered(celebration);
    });
    
    this.discoverySystem.onMilestoneReached((milestone) => {
      this.handleMilestoneReached(milestone);
    });
    
    console.log('Core systems initialized');
  }

  createEmojiCanvas() {
    // Create canvas for emoji animations
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
      z-index: 2;
    `;
    document.body.appendChild(canvas);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
    return canvas;
  }

  handleHandsDetected(hands) {
    this.handPositions = hands;
    
    // Update note mappings for each hand
    this.updateNoteMappings(hands);
    
    // Update UI with hand tracking data
    this.emit('handsDetected', {
      handsDetected: hands.length,
      confidence: hands.length > 0 ? hands[0].confidence : 0,
      activeGestures: this.activeGestures.map(g => g.type),
      noteMappings: this.currentNoteMappings
    });
  }

  handleHandsLost() {
    this.handPositions = [];
    this.activeGestures = [];
    this.currentNoteMappings = { left: null, right: null };
    this.activeNotes.clear();
    
    // Update UI
    this.emit('handsLost');
  }

  setupEventListeners() {
    // Set up keyboard event listeners for theme switching, etc.
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardInput(event);
    });
    
    console.log('Event listeners set up');
  }

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

  setTheme(theme) {
    if (this.currentTheme === theme) return;
    
    this.currentTheme = theme;
    
    // Map theme names to audio system theme numbers
    const themeMapping = {
      'piano': 2,
      'guitar': 3,
      'drums': 2, // Use piano for drums (could be extended)
      'strings': 2 // Use piano for strings (could be extended)
    };
    
    // Update audio system
    if (this.audioSystem) {
      this.audioSystem.setTheme(themeMapping[theme] || 2);
    }
    
    // Emit theme change event
    this.emit('themeChanged', theme);
    
    console.log(`Theme changed to: ${theme}`);
  }

  triggerSpecialEffect() {
    // Trigger a special visual/audio effect
    console.log('Special effect triggered');
  }

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
      
      // Start hand tracking
      if (this.handTracker) {
        await this.handTracker.start();
      }
      
      // Start educational renderer
      if (this.educationalRenderer) {
        this.educationalRenderer.start();
      }
      
      // Start the main loop
      this.isRunning = true;
      this.startMainLoop();
      
      console.log('Conductor Controller started successfully');
      
    } catch (error) {
      console.error('Failed to start Conductor Controller:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.warn('ConductorController not running');
      return;
    }
    
    try {
      console.log('Stopping Conductor Controller...');
      
      this.isRunning = false;
      
      // Stop hand tracking
      if (this.handTracker) {
        await this.handTracker.stop();
      }
      
      // Stop educational renderer
      if (this.educationalRenderer) {
        this.educationalRenderer.stop();
      }
      
      // Stop AI teacher
      if (this.aiTeacher) {
        this.aiTeacher.destroy();
      }
      
      console.log('Conductor Controller stopped');
      
    } catch (error) {
      console.error('Failed to stop Conductor Controller:', error);
      throw error;
    }
  }

  pause() {
    if (!this.isRunning) return;
    
    this.isPaused = true;
    console.log('Conductor Controller paused');
  }

  resume() {
    if (!this.isRunning) return;
    
    this.isPaused = false;
    console.log('Conductor Controller resumed');
  }

  startMainLoop() {
    const loop = () => {
      if (!this.isRunning) return;
      
      if (!this.isPaused) {
        this.update();
      }
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  update() {
    // Main update loop
    
    // Get current hand data from our cached positions
    const hands = this.handPositions || [];
    
    // Process gestures
    this.processGestures(hands);
    
    // Update parameters based on hand positions
    this.updateParameters(hands);
    
    // Update visual effects
    this.updateVisualEffects(hands);
  }

  processGestures(hands) {
    if (!hands || hands.length === 0) {
      this.activeGestures = [];
      return;
    }
    
    const now = performance.now();
    
    // Check cooldown
    if (now - this.lastGestureTime < this.gestureCooldown) {
      return;
    }
    
    // Process gestures for each hand
    const detectedGestures = [];
    hands.forEach((hand, index) => {
      const gesture = this.gestureRecognizer?.recognizeGesture(hand);
      
      if (gesture && gesture.confidence > this.config.gestures.confidenceThreshold) {
        detectedGestures.push({
          ...gesture,
          hand: hand,
          handIndex: index,
          handedness: hand.handedness
        });
        
        this.handleGesture(gesture, hand, index);
        this.lastGestureTime = now;
        
        // Trigger cooldown visualization
        this.triggerGestureCooldown();
      }
    });
    
    this.activeGestures = detectedGestures;
  }

  handleGesture(gesture, hand, handIndex) {
    console.log(`Gesture detected: ${gesture.type} (confidence: ${gesture.confidence})`);
    
    // Determine spawn position
    const spawnPosition = this.getSpawnPosition(hand);
    
    // Map gesture to character and sound
    const mapping = this.getGestureMapping(gesture, hand, handIndex);
    
    // Trigger audio - use sustained notes for palm gestures
    if (this.audioSystem && mapping.sound) {
      if (gesture.type === 'palm') {
        // Palm gestures trigger sustained notes
        this.audioSystem.startSustainedNote(mapping.sound.character);
      } else {
        // Other gestures trigger regular notes
        this.audioSystem.playThemeSound(mapping.sound.character);
      }
    }
    
    // Trigger visual
    if (this.emojiAnimator && mapping.visual) {
      this.emojiAnimator.spawnEmoji(
        mapping.visual.character,
        spawnPosition.x,
        spawnPosition.y
      );
    }
    
    // Emit gesture event
    this.emit('gestureDetected', gesture);
  }

  getSpawnPosition(hand) {
    // Convert hand landmarks to screen coordinates
    // Use the center of the hand (wrist position) as spawn point
    if (!hand.landmarks || hand.landmarks.length === 0) {
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };
    }
    
    const wrist = hand.landmarks[0]; // WRIST is at index 0
    
    // MediaPipe coordinates are normalized (0-1)
    // Mirror X coordinate to match video display
    const x = (1 - wrist.x) * window.innerWidth;
    const y = wrist.y * window.innerHeight;
    
    return { x, y };
  }

  getGestureMapping(gesture, hand, handIndex) {
    // Map gestures to characters and sounds based on specification
    const mappings = {
      'point': {
        characters: ['1', '2', '3', '4', '5'],
        soundType: 'lead'
      },
      'palm': {
        characters: ['A', 'E', 'I', 'O', 'U'],
        soundType: 'sustained'
      },
      'fist': {
        characters: ['!', '*', '#', '$', '&'],
        soundType: 'percussion'
      },
      'peace': {
        characters: ['H', 'J', 'L', 'Y'],
        soundType: 'major'
      },
      'thumbsUp': {
        characters: ['P', 'W', 'Z'],
        soundType: 'fanfare'
      },
      'pinch': {
        characters: ['*'],
        soundType: 'arpeggio'
      }
    };
    
    const mapping = mappings[gesture.type];
    if (!mapping) return {};
    
    // Select character based on hand height for pointing, random for others
    let character;
    if (gesture.type === 'point') {
      const handHeight = hand.landmarks[0].y; // Wrist Y position (0 = top, 1 = bottom)
      const heightIndex = Math.floor((1 - handHeight) * mapping.characters.length);
      character = mapping.characters[Math.max(0, Math.min(heightIndex, mapping.characters.length - 1))];
    } else {
      character = mapping.characters[Math.floor(Math.random() * mapping.characters.length)];
    }
    
    return {
      visual: {
        character: character
      },
      sound: {
        character: character,
        velocity: this.calculateVelocity(gesture, hand)
      }
    };
  }

  calculateVelocity(gesture, hand) {
    // Calculate velocity based on gesture strength and hand movement
    let velocity = Math.floor(gesture.confidence * 127);
    
    // Adjust velocity based on hand distance from camera (Z coordinate)
    if (hand.landmarks && hand.landmarks[0]) {
      const distance = hand.landmarks[0].z || 0;
      // Closer hands = louder (more negative Z means closer)
      velocity = Math.max(20, Math.min(127, velocity + (distance * -100)));
    }
    
    return velocity;
  }

  updateParameters(hands) {
    // Update left hand parameters (octave, effects, volume)
    if (!hands || hands.length === 0) return;
    
    // Find left hand
    const leftHand = hands.find(hand => hand.handedness === 'left');
    if (!leftHand || !leftHand.landmarks) return;
    
    const wrist = leftHand.landmarks[0];
    
    // Height = Octave mapping (bottom = C2, top = C5)
    const height = 1 - wrist.y; // Invert Y so top = 1, bottom = 0
    const octaveRange = this.config.parameters.leftHandOctaveRange;
    const octave = Math.floor(height * (octaveRange[1] - octaveRange[0])) + octaveRange[0];
    
    // Distance = Volume control (near = loud, far = quiet)
    const distance = Math.abs(wrist.z || 0);
    const volumeRange = this.config.parameters.volumeDistanceRange;
    const volume = Math.max(volumeRange[0], Math.min(volumeRange[1], 1 - distance));
    
    // Store parameters for use in audio system
    this.leftHandParameters = {
      octave: octave,
      volume: volume,
      height: height,
      distance: distance
    };
    
    // Update audio system master volume if available
    if (this.audioSystem && this.audioSystem.setMasterVolume) {
      this.audioSystem.setMasterVolume(volume);
    }
  }

  applyCameraBlur() {
    // Apply blur effect to camera video for privacy and aesthetics
    setTimeout(() => {
      if (this.handTracker && this.handTracker.videoElement) {
        const blurRadius = this.config.visuals.cameraBlur;
        this.handTracker.videoElement.style.filter = `blur(${blurRadius}px)`;
        console.log(`Applied camera blur: ${blurRadius}px`);
      }
    }, 1000); // Wait for video element to be ready
  }

  configureTrailEffects() {
    // Configure trail effects for conductor mode with gradient colors
    if (this.handTracker) {
      const themeColors = this.getThemeColors();
      
      this.handTracker.trailConfig = {
        ...this.handTracker.trailConfig,
        style: 'gradient',
        color: themeColors.primary,
        gradientColors: themeColors.gradient,
        maxLength: this.config.visuals.trailLength,
        fadeDuration: 800, // Longer fade for more elegant effect
        particleSize: 12, // Larger particles for better visibility
        velocityMultiplier: 2.0 // More responsive to movement
      };
      
      console.log('Trail effects configured for conductor mode');
    }
  }

  getThemeColors() {
    // Get gradient colors based on current theme
    const themeColorMap = {
      'piano': {
        primary: '#667eea',
        gradient: ['#667eea', '#764ba2', '#f093fb']
      },
      'guitar': {
        primary: '#f093fb',
        gradient: ['#f093fb', '#f5576c', '#ffeaa7']
      },
      'drums': {
        primary: '#ff6b6b',
        gradient: ['#ff6b6b', '#ee5a24', '#feca57']
      },
      'strings': {
        primary: '#4ecdc4',
        gradient: ['#4ecdc4', '#44a08d', '#096dd9']
      }
    };
    
    return themeColorMap[this.currentTheme] || themeColorMap['piano'];
  }

  updateVisualEffects(hands) {
    // Update trail effects and other visuals
    // Trail effects are handled by the HandTracker automatically
    // Additional visual effects can be added here
  }

  recalibrateHandTracking() {
    console.log('Recalibrating hand tracking...');
    // This would reinitialize the hand tracking system
  }

  handleKeyboardFallback(key) {
    // Keyboard fallback for accessibility when hand tracking fails
    console.log(`Keyboard fallback: ${key}`);
    
    // Trigger audio and visual feedback for typed keys
    if (this.audioSystem) {
      this.audioSystem.playThemeSound(key);
    }
    
    // Spawn emoji at center of screen
    if (this.emojiAnimator) {
      this.emojiAnimator.spawnEmoji(
        key,
        window.innerWidth / 2,
        window.innerHeight / 2
      );
    }
  }

  triggerGestureCooldown() {
    // Emit cooldown event for UI visualization
    this.emit('gestureCooldown', {
      duration: this.gestureCooldown
    });
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  updateNoteMappings(hands) {
    if (!this.handNoteMapper || !hands || hands.length === 0) {
      this.currentNoteMappings = { left: null, right: null };
      return;
    }

    // Clear current mappings
    this.currentNoteMappings = { left: null, right: null };

    // Update note mappings for each hand
    hands.forEach(hand => {
      if (!hand.landmarks || hand.landmarks.length === 0) return;

      const handedness = hand.handedness?.toLowerCase() || 'unknown';
      if (handedness !== 'left' && handedness !== 'right') return;

      // Map hand position to note
      const noteMapping = this.handNoteMapper.mapHandToNote(
        hand.landmarks,
        handedness,
        window.innerWidth,
        window.innerHeight
      );

      if (noteMapping) {
        this.currentNoteMappings[handedness] = noteMapping;

        // Check if note should be triggered
        const currentGesture = this.activeGestures.find(g => g.handedness === handedness);
        if (this.handNoteMapper.shouldTriggerNote(noteMapping, currentGesture)) {
          this.triggerNote(noteMapping, currentGesture);
        }
      }
    });

    // Analyze current musical context
    this.analyzeMusicalContext();
  }

  triggerNote(noteMapping, gestureState) {
    const { midi, velocity, handedness } = noteMapping;
    
    // Store active note
    this.activeNotes.set(midi, {
      timestamp: Date.now(),
      velocity,
      handedness,
      gestureState
    });
    
    // Track note with discovery system
    if (this.discoverySystem) {
      this.discoverySystem.trackNotePlayed();
    }

    // Trigger audio
    if (this.audioSystem) {
      // For now, map MIDI to characters for existing audio system
      const character = this.midiToCharacter(midi);
      if (gestureState?.type === 'palm') {
        this.audioSystem.startSustainedNote(character);
      } else {
        this.audioSystem.playThemeSound(character);
      }
    }

    // Trigger visual feedback
    if (this.emojiAnimator) {
      const position = this.handNoteMapper.getVisualPosition(
        noteMapping,
        window.innerWidth,
        window.innerHeight
      );
      
      if (position) {
        const emoji = this.getNoteEmoji(noteMapping);
        this.emojiAnimator.spawnEmoji(emoji, position.x, position.y);
      }
    }

    // Emit note event
    this.emit('noteTriggered', {
      midi,
      note: noteMapping.note,
      octave: noteMapping.octave,
      velocity,
      handedness
    });
  }

  midiToCharacter(midi) {
    // Simple mapping for compatibility with existing audio system
    const noteIndex = midi % 12;
    const characters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return characters[noteIndex];
  }

  getNoteEmoji(noteMapping) {
    // Return emoji based on note characteristics
    const { note, octave, handedness } = noteMapping;
    
    // Different emojis for different hands
    const leftHandEmojis = ['🎹', '🎼', '🎵', '🎶', '🎤'];
    const rightHandEmojis = ['🎺', '🎻', '🎸', '🎷', '🎨'];
    
    const emojis = handedness === 'left' ? leftHandEmojis : rightHandEmojis;
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  analyzeMusicalContext() {
    if (!this.musicTheoryEngine || this.activeNotes.size === 0) return;

    // Get current active MIDI notes
    const activeNoteNumbers = Array.from(this.activeNotes.keys());
    
    // Analyze current musical context
    const analysis = this.musicTheoryEngine.analyzeCurrentNotes(activeNoteNumbers);
    
    // Update AI teacher with current context
    if (this.aiTeacher) {
      this.aiTeacher.handleNoteChange(activeNoteNumbers);
      
      // Handle chord detection
      if (analysis.chord) {
        this.aiTeacher.handleChordDetection(analysis.chord);
      }
      
      // Handle interval detection
      if (analysis.intervals && analysis.intervals.length > 0) {
        this.aiTeacher.handleIntervalDetection(analysis.intervals[0]);
      }
      
      // Trigger analysis
      this.aiTeacher.analyzeMusicalMoment();
    }
    
    // Update educational renderer
    if (this.educationalRenderer) {
      this.educationalRenderer.updateAnalysis(analysis);
      this.educationalRenderer.updateHandMappings(this.currentNoteMappings);
      this.educationalRenderer.updateProgressStats(this.musicTheoryEngine.getProgressStats());
    }
    
    // Emit analysis results
    this.emit('musicalAnalysis', analysis);
    
    // Handle discoveries
    if (analysis.discoveries && analysis.discoveries.length > 0) {
      analysis.discoveries.forEach(discovery => {
        this.handleDiscovery(discovery);
      });
    }
  }

  handleDiscovery(discovery) {
    console.log('Musical discovery:', discovery);
    
    // Process discovery through discovery system
    const processedDiscovery = this.discoverySystem?.processDiscovery(discovery);
    
    // Only proceed with new discoveries
    if (!processedDiscovery) return;
    
    // Notify AI teacher of discovery
    if (this.aiTeacher) {
      this.aiTeacher.handleDiscovery(processedDiscovery);
    }
    
    // Add discovery to educational renderer
    if (this.educationalRenderer) {
      this.educationalRenderer.addDiscovery(processedDiscovery);
    }
    
    // Trigger celebration visual effects
    if (this.emojiAnimator && processedDiscovery.celebration) {
      const celebrationEmojis = processedDiscovery.teachingMoment?.celebration || ['🎉', '✨', '🌟'];
      
      // Spawn celebration emojis at random positions
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          const emoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
          this.emojiAnimator.spawnEmoji(emoji, x, y);
        }, i * 100);
      }
    }
    
    // Show teaching moment
    if (this.educationalRenderer && processedDiscovery.teachingMoment) {
      this.educationalRenderer.showTeachingMoment(processedDiscovery.teachingMoment);
    }
    
    // Emit discovery event for UI
    this.emit('discovery', processedDiscovery);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  // Handle AI teacher suggestion
  handleAISuggestion(suggestion) {
    console.log('AI suggestion:', suggestion);
    
    // Show suggestion in educational renderer
    if (this.educationalRenderer) {
      this.educationalRenderer.showTeachingMoment(suggestion);
    }
    
    // Emit suggestion event
    this.emit('aiSuggestion', suggestion);
  }

  // Handle AI teacher celebration
  handleAICelebration(celebration) {
    console.log('AI celebration:', celebration);
    
    // Trigger enhanced celebration effects
    if (this.emojiAnimator && celebration.celebration) {
      const celebrationEmojis = celebration.celebration;
      
      // Spawn more celebration emojis for AI-triggered celebrations
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          const emoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
          this.emojiAnimator.spawnEmoji(emoji, x, y);
        }, i * 150);
      }
    }
    
    // Emit celebration event
    this.emit('aiCelebration', celebration);
  }

  // Handle discovery system events
  handleDiscoveryMade(discovery) {
    console.log('Discovery made:', discovery);
    
    // Update educational renderer with progress
    if (this.educationalRenderer) {
      this.educationalRenderer.updateProgressStats(this.discoverySystem.getProgress());
    }
    
    // Emit discovery made event
    this.emit('discoveryMade', discovery);
  }

  handleAchievementUnlocked(achievement) {
    console.log('Achievement unlocked:', achievement);
    
    // Trigger special achievement celebration
    if (this.emojiAnimator) {
      const achievementEmojis = ['🏆', '🎖️', '🌟', '✨', achievement.emoji];
      
      // Spawn achievement emojis in a burst
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          const emoji = achievementEmojis[Math.floor(Math.random() * achievementEmojis.length)];
          this.emojiAnimator.spawnEmoji(emoji, x, y);
        }, i * 100);
      }
    }
    
    // Emit achievement event
    this.emit('achievementUnlocked', achievement);
  }

  handleCelebrationTriggered(celebration) {
    console.log('Celebration triggered:', celebration);
    
    // Emit celebration event
    this.emit('celebration', celebration);
  }

  handleMilestoneReached(milestone) {
    console.log('Milestone reached:', milestone);
    
    // Trigger milestone celebration
    if (this.emojiAnimator && milestone.celebration) {
      const milestoneEmojis = milestone.celebration;
      
      // Spawn milestone emojis in a special pattern
      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          const x = Math.random() * window.innerWidth;
          const y = Math.random() * window.innerHeight;
          const emoji = milestoneEmojis[Math.floor(Math.random() * milestoneEmojis.length)];
          this.emojiAnimator.spawnEmoji(emoji, x, y);
        }, i * 80);
      }
    }
    
    // Emit milestone event
    this.emit('milestoneReached', milestone);
  }

  // Get current progress
  getProgress() {
    return this.discoverySystem?.getProgress() || null;
  }

  // Get session stats
  getSessionStats() {
    return this.discoverySystem?.getSessionStats() || null;
  }

  // Get recent discoveries
  getRecentDiscoveries() {
    return this.discoverySystem?.getRecentDiscoveries() || [];
  }

  // Get achievements
  getAchievements() {
    return this.discoverySystem?.getUnlockedAchievements() || [];
  }

  // Export progress
  exportProgress() {
    return this.discoverySystem?.exportProgress() || null;
  }
}