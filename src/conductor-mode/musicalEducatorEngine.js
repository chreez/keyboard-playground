import { MusicTheoryEngine } from './core/musicTheoryEngine.js';
import { InteractiveObjectSystem } from './objects/interactiveObjectSystem.js';
import { AITeacher } from './educational/aiTeacher.js';
import { EducationalRenderer } from './visuals/educationalRenderer.js';
import { DiscoverySystem } from './educational/discoverySystem.js';
import { ProgressTracker } from './educational/progressTracker.js';
import HandTracker from '../tracking/HandTracker.js';
import AudioSystem from '../audio/AudioSystem.js';
import EmojiAnimator from '../animation/EmojiAnimator.js';

export class MusicalEducatorEngine {
  constructor(options = {}) {
    this.isInitialized = false;
    this.isRunning = false;
    this.isPaused = false;
    
    // Configuration
    this.config = {
      canvas: options.canvas || { width: 1920, height: 1080 },
      handTracking: {
        enabled: true,
        maxHands: 2,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8
      },
      audio: {
        enabled: true,
        masterVolume: 0.8,
        theme: 'piano'
      },
      visuals: {
        enabled: true,
        showParticles: true,
        showConnections: true,
        showBoundaries: false
      },
      education: {
        enabled: true,
        aiTeacherEnabled: true,
        discoveryTrackingEnabled: true,
        progressTrackingEnabled: true
      },
      debug: options.debug || false
    };
    
    // Core systems (initialized in init())
    this.systems = {
      hands: null,           // DualHandTracker
      objects: null,         // InteractiveObjectSystem  
      collision: null,       // CollisionDetector (part of objects system)
      theory: null,          // MusicTheoryEngine
      ai: null,              // AITeacherSystem
      visuals: null,         // EducationalRenderer
      audio: null,           // PianoAudioSystem
      progress: null,        // LearningTracker
      discovery: null,       // DiscoverySystem
      emoji: null            // EmojiAnimator
    };
    
    // State tracking
    this.state = {
      currentHands: [],
      activeNotes: new Map(),
      currentAnalysis: null,
      recentDiscoveries: [],
      sessionStartTime: null,
      lastUpdateTime: 0,
      frameCount: 0
    };
    
    // Performance monitoring
    this.performance = {
      averageFrameTime: 0,
      frameTimeHistory: [],
      maxFrameTimeHistory: 100,
      targetFPS: 60,
      actualFPS: 0
    };
    
    // Event system
    this.eventListeners = {
      systemReady: [],
      handDetected: [],
      handLost: [],
      noteTriggered: [],
      chordDetected: [],
      intervalDetected: [],
      discoveryMade: [],
      teachingMoment: [],
      error: []
    };
    
    // Educational state
    this.educationalState = {
      currentLevel: 'beginner',
      totalDiscoveries: 0,
      sessionDiscoveries: 0,
      currentChallenge: null,
      teachingQueue: []
    };
  }
  
  // Initialize all systems
  async init() {
    if (this.isInitialized) {
      console.warn('MusicalEducatorEngine already initialized');
      return;
    }
    
    try {
      console.log('🎵 [MusicalEducatorEngine] Starting initialization...');
      console.log('🎵 [MusicalEducatorEngine] Config:', JSON.stringify(this.config, null, 2));
      
      this.state.sessionStartTime = Date.now();
      
      // Initialize systems in dependency order
      console.log('🎵 [MusicalEducatorEngine] Initializing core systems...');
      await this.initializeCoreSystemsSequentially();
      
      // Setup inter-system communication
      console.log('🎵 [MusicalEducatorEngine] Setting up system communication...');
      this.setupSystemCommunication();
      
      // Setup event handlers
      console.log('🎵 [MusicalEducatorEngine] Setting up event handlers...');
      this.setupEventHandlers();
      
      this.isInitialized = true;
      console.log('🎵 [MusicalEducatorEngine] ✅ Initialization complete!');
      console.log('🎵 [MusicalEducatorEngine] Active systems:', Object.keys(this.systems).filter(key => this.systems[key] !== null));
      
      this.emit('systemReady', {
        timestamp: Date.now(),
        systems: Object.keys(this.systems).filter(key => this.systems[key] !== null)
      });
      
    } catch (error) {
      console.error('🎵 [MusicalEducatorEngine] ❌ INITIALIZATION FAILED:', error);
      console.error('🎵 [MusicalEducatorEngine] Error stack:', error.stack);
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }
  
  // Initialize core systems in sequence
  async initializeCoreSystemsSequentially() {
    try {
      // 1. Initialize Hand Tracking
      console.log('🎵 [MusicalEducatorEngine] 1/6 Initializing Hand Tracking...');
      console.log('🎵 [MusicalEducatorEngine] Hand tracking config:', {
        maxHands: this.config.handTracking.maxHands,
        minDetectionConfidence: this.config.handTracking.minDetectionConfidence,
        minTrackingConfidence: this.config.handTracking.minTrackingConfidence,
        showLandmarks: this.config.debug
      });
      
      this.systems.hands = new HandTracker();
      console.log('🎵 [MusicalEducatorEngine] Created HandTracker instance');
      
      await this.systems.hands.init({
        maxHands: this.config.handTracking.maxHands,
        minDetectionConfidence: this.config.handTracking.minDetectionConfidence,
        minTrackingConfidence: this.config.handTracking.minTrackingConfidence,
        showLandmarks: this.config.debug
      });
      console.log('🎵 [MusicalEducatorEngine] ✅ Hand Tracking initialized');
    
      // 2. Initialize Interactive Object System
      console.log('🎵 [MusicalEducatorEngine] 2/6 Initializing Interactive Object System...');
      this.systems.objects = new InteractiveObjectSystem({
        canvas: this.config.canvas,
        confidenceThreshold: this.config.handTracking.minDetectionConfidence,
        enableCollisionFeedback: true,
        soundEnabled: this.config.audio.enabled
      });
      await this.systems.objects.init();
      console.log('🎵 [MusicalEducatorEngine] ✅ Interactive Object System initialized');
    
      // 3. Initialize Music Theory Engine
      console.log('🎵 [MusicalEducatorEngine] 3/6 Initializing Music Theory Engine...');
      this.systems.theory = new MusicTheoryEngine();
      console.log('🎵 [MusicalEducatorEngine] ✅ Music Theory Engine initialized');
    
      // 4. Initialize Audio System
      if (this.config.audio.enabled) {
        console.log('🎵 [MusicalEducatorEngine] 4/6 Initializing Audio System...');
        console.log('🎵 [MusicalEducatorEngine] Audio config:', {
          enabled: this.config.audio.enabled,
          masterVolume: this.config.audio.masterVolume,
          theme: this.config.audio.theme
        });
        
        this.systems.audio = new AudioSystem();
        console.log('🎵 [MusicalEducatorEngine] Created AudioSystem instance');
        
        await this.systems.audio.initialize();
        console.log('🎵 [MusicalEducatorEngine] AudioSystem initialized, setting theme...');
        
        this.systems.audio.setTheme(2); // Piano theme
        console.log('🎵 [MusicalEducatorEngine] Theme set to piano (2)');
        
        console.log('🎵 [MusicalEducatorEngine] Setting master volume:', this.config.audio.masterVolume);
        this.systems.audio.setMasterVolume(this.config.audio.masterVolume);
        console.log('🎵 [MusicalEducatorEngine] ✅ Audio System fully initialized');
      } else {
        console.log('🎵 [MusicalEducatorEngine] ⚠️  Audio System disabled in config');
      }
    
      // 5. Initialize Visual Systems
      if (this.config.visuals.enabled) {
        console.log('🎵 [MusicalEducatorEngine] 5/6 Initializing Visual Systems...');
        
        // Educational Renderer
        this.systems.visuals = new EducationalRenderer();
        await this.systems.visuals.init();
        console.log('🎵 [MusicalEducatorEngine] ✅ Educational Renderer initialized');
        
        // Emoji Animator
        const emojiCanvas = this.createEmojiCanvas();
        this.systems.emoji = new EmojiAnimator(emojiCanvas);
        this.systems.emoji.start();
        console.log('🎵 [MusicalEducatorEngine] ✅ Emoji Animator initialized');
      } else {
        console.log('🎵 [MusicalEducatorEngine] ⚠️  Visual Systems disabled in config');
      }
    
      // 6. Initialize Educational Systems
      if (this.config.education.enabled) {
        console.log('🎵 [MusicalEducatorEngine] 6/6 Initializing Educational Systems...');
        
        // Discovery System
        if (this.config.education.discoveryTrackingEnabled) {
          this.systems.discovery = new DiscoverySystem();
          console.log('🎵 [MusicalEducatorEngine] ✅ Discovery System initialized');
        }
        
        // Progress Tracker
        if (this.config.education.progressTrackingEnabled) {
          this.systems.progress = new ProgressTracker();
          console.log('🎵 [MusicalEducatorEngine] ✅ Progress Tracker initialized');
        }
        
        // AI Teacher (initialize last due to dependencies)
        if (this.config.education.aiTeacherEnabled) {
          this.systems.ai = new AITeacher();
          await this.systems.ai.init();
          console.log('🎵 [MusicalEducatorEngine] ✅ AI Teacher initialized');
        }
      } else {
        console.log('🎵 [MusicalEducatorEngine] ⚠️  Educational Systems disabled in config');
      }
      
      console.log('🎵 [MusicalEducatorEngine] ✅ All systems initialized successfully');
    } catch (error) {
      console.error('🎵 [MusicalEducatorEngine] ❌ System initialization failed:', error);
      console.error('🎵 [MusicalEducatorEngine] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        systemsInitialized: Object.keys(this.systems).filter(key => this.systems[key] !== null)
      });
      
      // Try to determine which system failed
      const failedSystem = this.determineFailedSystem(error);
      if (failedSystem) {
        console.error('🎵 [MusicalEducatorEngine] Failed during:', failedSystem);
      }
      
      throw error;
    }
  }

  determineFailedSystem(error) {
    const message = error.message.toLowerCase();
    if (message.includes('handtracker') || message.includes('hand tracking')) {
      return 'Hand Tracking System';
    }
    if (message.includes('interactiveobjectsystem') || message.includes('objects')) {
      return 'Interactive Object System';
    }
    if (message.includes('musictheoryengine') || message.includes('theory')) {
      return 'Music Theory Engine';
    }
    if (message.includes('audiosystem') || message.includes('audio') || message.includes('setmastervolume')) {
      return 'Audio System';
    }
    if (message.includes('educationalrenderer') || message.includes('visuals')) {
      return 'Visual Systems';
    }
    if (message.includes('emojianimator') || message.includes('emoji')) {
      return 'Emoji Animation System';
    }
    if (message.includes('aiteacher') || message.includes('discovery') || message.includes('progress')) {
      return 'Educational Systems';
    }
    return null;
  }
  
  // Setup communication between systems
  setupSystemCommunication() {
    // Object system sound triggers -> Audio system
    if (this.systems.objects && this.systems.audio) {
      this.systems.objects.on('soundTrigger', (soundData) => {
        this.handleSoundTrigger(soundData);
      });
    }
    
    // Object interactions -> Theory engine
    if (this.systems.objects && this.systems.theory) {
      this.systems.objects.on('objectInteraction', (interaction) => {
        this.handleObjectInteraction(interaction);
      });
    }
    
    // Theory analysis -> Discovery system
    if (this.systems.theory && this.systems.discovery) {
      // Will be connected in handleMusicalAnalysis
    }
    
    // Discoveries -> AI Teacher
    if (this.systems.discovery && this.systems.ai) {
      this.systems.discovery.onDiscoveryMade((discovery) => {
        this.systems.ai.handleDiscovery(discovery);
      });
    }
    
    // AI suggestions -> Visual system
    if (this.systems.ai && this.systems.visuals) {
      this.systems.ai.onSuggestionReceived((suggestion) => {
        this.systems.visuals.showTeachingMoment(suggestion);
      });
    }
    
    console.log('System communication established');
  }
  
  // Setup event handlers
  setupEventHandlers() {
    // Hand tracking events
    if (this.systems.hands) {
      this.systems.hands.on('handsDetected', (hands) => {
        this.handleHandsDetected(hands);
      });
      
      this.systems.hands.on('handsLost', () => {
        this.handleHandsLost();
      });
    }
    
    // Object system events
    if (this.systems.objects) {
      this.systems.objects.on('handEnterBounds', (data) => {
        console.log('Hand entered bounds:', data.handId);
      });
      
      this.systems.objects.on('handLeaveBounds', (data) => {
        console.log('Hand left bounds:', data.handId);
        this.clearActiveNotes();
      });
    }
    
    // Discovery system events
    if (this.systems.discovery) {
      this.systems.discovery.onDiscoveryMade((discovery) => {
        this.handleDiscoveryMade(discovery);
      });
      
      this.systems.discovery.onCelebrationTriggered((celebration) => {
        this.handleCelebration(celebration);
      });
    }
    
    console.log('Event handlers established');
  }
  
  // Create emoji canvas for visual effects
  createEmojiCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.canvas.width;
    canvas.height = this.config.canvas.height;
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
  
  // Start the engine
  async start() {
    if (!this.isInitialized) {
      throw new Error('MusicalEducatorEngine not initialized');
    }
    
    if (this.isRunning) {
      console.warn('🎵 [MusicalEducatorEngine] Already running');
      return;
    }
    
    try {
      console.log('🎵 [MusicalEducatorEngine] 🚀 Starting engine...');
      
      // Start hand tracking
      if (this.systems.hands) {
        console.log('🎵 [MusicalEducatorEngine] Starting hand tracking...');
        await this.systems.hands.start();
        console.log('🎵 [MusicalEducatorEngine] ✅ Hand tracking started');
      }
      
      // Start object system
      if (this.systems.objects) {
        console.log('🎵 [MusicalEducatorEngine] Starting object system...');
        this.systems.objects.start();
        console.log('🎵 [MusicalEducatorEngine] ✅ Object system started');
      }
      
      // Start visual systems
      if (this.systems.visuals) {
        console.log('🎵 [MusicalEducatorEngine] Starting visual systems...');
        this.systems.visuals.start();
        console.log('🎵 [MusicalEducatorEngine] ✅ Visual systems started');
      }
      
      // Start main loop
      this.isRunning = true;
      this.startMainLoop();
      
      console.log('🎵 [MusicalEducatorEngine] 🎉 Engine started successfully!');
      
    } catch (error) {
      console.error('🎵 [MusicalEducatorEngine] ❌ STARTUP FAILED:', error);
      console.error('🎵 [MusicalEducatorEngine] Error stack:', error.stack);
      this.emit('error', { type: 'startup', error });
      throw error;
    }
  }
  
  // Stop the engine
  async stop() {
    if (!this.isRunning) {
      console.warn('MusicalEducatorEngine not running');
      return;
    }
    
    try {
      console.log('Stopping Musical Educator Engine...');
      
      this.isRunning = false;
      
      // Stop hand tracking
      if (this.systems.hands) {
        await this.systems.hands.stop();
      }
      
      // Stop object system
      if (this.systems.objects) {
        this.systems.objects.stop();
      }
      
      // Stop visual systems
      if (this.systems.visuals) {
        this.systems.visuals.stop();
      }
      
      // Clear active notes
      this.clearActiveNotes();
      
      console.log('Musical Educator Engine stopped');
      
    } catch (error) {
      console.error('Failed to stop Musical Educator Engine:', error);
      this.emit('error', { type: 'shutdown', error });
      throw error;
    }
  }
  
  // Main update loop
  startMainLoop() {
    const loop = (timestamp) => {
      if (!this.isRunning) return;
      
      const deltaTime = timestamp - this.state.lastUpdateTime;
      this.state.lastUpdateTime = timestamp;
      this.state.frameCount++;
      
      if (!this.isPaused) {
        this.update(deltaTime);
      }
      
      // Update performance metrics
      this.updatePerformanceMetrics(deltaTime);
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }
  
  // Main update function
  update(deltaTime) {
    // Update object system with current hands
    if (this.systems.objects) {
      this.systems.objects.update(deltaTime, this.state.currentHands);
    }
    
    // Update visual systems
    if (this.systems.visuals) {
      this.systems.visuals.update(deltaTime);
    }
    
    // Update AI teacher
    if (this.systems.ai) {
      this.systems.ai.update(deltaTime);
    }
    
    // Update discovery system
    if (this.systems.discovery) {
      this.systems.discovery.update(deltaTime);
    }
  }
  
  // Handle hands detected
  handleHandsDetected(hands) {
    this.state.currentHands = hands;
    
    this.emit('handDetected', {
      handCount: hands.length,
      hands: hands,
      timestamp: Date.now()
    });
  }
  
  // Handle hands lost
  handleHandsLost() {
    this.state.currentHands = [];
    this.clearActiveNotes();
    
    this.emit('handLost', {
      timestamp: Date.now()
    });
  }
  
  // Handle sound trigger from object interaction
  handleSoundTrigger(soundData) {
    if (!this.systems.audio) return;
    
    // Store active note
    this.state.activeNotes.set(soundData.midiNote, {
      ...soundData,
      timestamp: Date.now()
    });
    
    // Play sound
    this.playNoteSound(soundData);
    
    // Trigger visual effects
    this.triggerVisualEffects(soundData);
    
    // Analyze musical context
    this.analyzeCurrentMusicalContext();
    
    this.emit('noteTriggered', soundData);
  }
  
  // Handle object interaction
  handleObjectInteraction(interaction) {
    // Track interaction for discovery system
    if (this.systems.discovery) {
      this.systems.discovery.trackInteraction(interaction);
    }
    
    // Update progress
    if (this.systems.progress) {
      this.systems.progress.trackObjectInteraction(interaction);
    }
  }
  
  // Play note sound
  playNoteSound(soundData) {
    // Convert MIDI to character for existing audio system
    const character = this.midiToCharacter(soundData.midiNote);
    
    if (soundData.isChordNote) {
      // Play chord notes with slight delay
      setTimeout(() => {
        this.systems.audio.playThemeSound(character);
      }, (soundData.chordIndex || 0) * 50);
    } else if (soundData.isScaleNote) {
      // Play scale notes in sequence
      setTimeout(() => {
        this.systems.audio.playThemeSound(character);
      }, (soundData.scaleIndex || 0) * 150);
    } else {
      // Play single note immediately
      this.systems.audio.playThemeSound(character);
    }
  }
  
  // Convert MIDI to character for audio system
  midiToCharacter(midiNote) {
    const noteIndex = midiNote % 12;
    const characters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return characters[noteIndex];
  }
  
  // Trigger visual effects
  triggerVisualEffects(soundData) {
    if (!this.systems.emoji) return;
    
    // Get visual position from object
    const position = soundData.object ? 
      soundData.object.position : 
      { x: this.config.canvas.width / 2, y: this.config.canvas.height / 2 };
    
    // Convert world coordinates to screen coordinates
    const screenX = position.x;
    const screenY = position.y;
    
    // Get appropriate emoji
    const emoji = this.getNoteEmoji(soundData);
    
    // Spawn emoji
    this.systems.emoji.spawnEmoji(emoji, screenX, screenY);
  }
  
  // Get emoji for note
  getNoteEmoji(soundData) {
    if (soundData.isChordNote) {
      const chordEmojis = ['🎹', '🎼', '🎵', '🎶', '✨'];
      return chordEmojis[Math.floor(Math.random() * chordEmojis.length)];
    }
    
    if (soundData.isScaleNote) {
      const scaleEmojis = ['🌈', '⭐', '🎵', '🎶', '🌟'];
      return scaleEmojis[Math.floor(Math.random() * scaleEmojis.length)];
    }
    
    const noteEmojis = ['🎵', '🎶', '♪', '♫', '🎤'];
    return noteEmojis[Math.floor(Math.random() * noteEmojis.length)];
  }
  
  // Analyze current musical context
  analyzeCurrentMusicalContext() {
    if (!this.systems.theory) return;
    
    // Get current active MIDI notes
    const activeNotes = Array.from(this.state.activeNotes.keys());
    
    if (activeNotes.length === 0) return;
    
    // Analyze with theory engine
    const analysis = this.systems.theory.analyzeCurrentNotes(activeNotes);
    this.state.currentAnalysis = analysis;
    
    // Update visual display
    if (this.systems.visuals) {
      this.systems.visuals.updateAnalysis(analysis);
    }
    
    // Process discoveries
    if (analysis.discoveries && analysis.discoveries.length > 0) {
      analysis.discoveries.forEach(discovery => {
        this.handleDiscoveryFromAnalysis(discovery);
      });
    }
    
    // Emit specific events
    if (analysis.chord) {
      this.emit('chordDetected', analysis.chord);
    }
    
    if (analysis.intervals && analysis.intervals.length > 0) {
      this.emit('intervalDetected', analysis.intervals[0]);
    }
  }
  
  // Handle discovery from musical analysis
  handleDiscoveryFromAnalysis(discovery) {
    if (this.systems.discovery) {
      const processedDiscovery = this.systems.discovery.processDiscovery(discovery);
      
      if (processedDiscovery) {
        this.handleDiscoveryMade(processedDiscovery);
      }
    }
  }
  
  // Handle discovery made
  handleDiscoveryMade(discovery) {
    this.state.recentDiscoveries.push(discovery);
    this.educationalState.totalDiscoveries++;
    this.educationalState.sessionDiscoveries++;
    
    // Limit recent discoveries
    if (this.state.recentDiscoveries.length > 10) {
      this.state.recentDiscoveries.shift();
    }
    
    // Trigger celebration
    this.triggerDiscoveryCelebration(discovery);
    
    this.emit('discoveryMade', discovery);
  }
  
  // Trigger discovery celebration
  triggerDiscoveryCelebration(discovery) {
    if (!this.systems.emoji) return;
    
    const celebrationEmojis = discovery.teachingMoment?.celebration || ['🎉', '✨', '🌟'];
    
    // Spawn celebration emojis
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random() * this.config.canvas.width;
        const y = Math.random() * this.config.canvas.height;
        const emoji = celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)];
        this.systems.emoji.spawnEmoji(emoji, x, y);
      }, i * 100);
    }
  }
  
  // Handle celebration
  handleCelebration(celebration) {
    // Trigger enhanced visual effects
    this.triggerDiscoveryCelebration(celebration);
  }
  
  // Clear active notes
  clearActiveNotes() {
    this.state.activeNotes.clear();
    
    if (this.systems.visuals) {
      this.systems.visuals.updateAnalysis(null);
    }
  }
  
  // Update performance metrics
  updatePerformanceMetrics(deltaTime) {
    // Add to frame time history
    this.performance.frameTimeHistory.push(deltaTime);
    
    // Limit history size
    if (this.performance.frameTimeHistory.length > this.performance.maxFrameTimeHistory) {
      this.performance.frameTimeHistory.shift();
    }
    
    // Calculate average frame time
    const avgFrameTime = this.performance.frameTimeHistory.reduce((sum, time) => sum + time, 0) / 
                        this.performance.frameTimeHistory.length;
    
    this.performance.averageFrameTime = avgFrameTime;
    this.performance.actualFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
  
  // Get system status
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      sessionDuration: this.state.sessionStartTime ? Date.now() - this.state.sessionStartTime : 0,
      frameCount: this.state.frameCount,
      performance: this.performance,
      educationalState: this.educationalState,
      systemsStatus: {
        hands: !!this.systems.hands,
        objects: !!this.systems.objects,
        theory: !!this.systems.theory,
        audio: !!this.systems.audio,
        visuals: !!this.systems.visuals,
        ai: !!this.systems.ai,
        discovery: !!this.systems.discovery,
        progress: !!this.systems.progress,
        emoji: !!this.systems.emoji
      }
    };
  }
  
  // Event system
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    }
  }
  
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }
  
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }
  
  // Pause/Resume
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    this.isPaused = false;
  }
  
  // Configure engine
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update subsystems
    if (this.systems.objects) {
      this.systems.objects.configure(newConfig);
    }
    
    if (this.systems.audio && newConfig.audio) {
      if (newConfig.audio.masterVolume !== undefined) {
        this.systems.audio.setMasterVolume(newConfig.audio.masterVolume);
      }
    }
  }
  
  // Cleanup and destroy
  async destroy() {
    await this.stop();
    
    // Destroy all systems
    Object.values(this.systems).forEach(system => {
      if (system && typeof system.destroy === 'function') {
        system.destroy();
      }
    });
    
    // Clear state
    this.state = {
      currentHands: [],
      activeNotes: new Map(),
      currentAnalysis: null,
      recentDiscoveries: [],
      sessionStartTime: null,
      lastUpdateTime: 0,
      frameCount: 0
    };
    
    this.isInitialized = false;
    console.log('Musical Educator Engine destroyed');
  }
}