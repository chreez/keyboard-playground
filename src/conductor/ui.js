// UI Controller for Conductor Mode
// Handles production vs debug mode UI states

export class UIController {
  constructor(isDebugMode = false) {
    this.isDebugMode = isDebugMode;
    this.isMinimalMode = false;
    this.hintsVisible = true;
    this.debugOverlayVisible = false;
    this.isInitialized = false;
    
    // UI element references
    this.elements = {
      welcomeScreen: null,
      conductorInterface: null,
      debugOverlay: null,
      themeIndicator: null,
      activeGesture: null,
      gestureHints: null,
      exitButton: null
    };
    
    // Debug data
    this.debugData = {
      fps: 0,
      cpu: 0,
      memory: 0,
      handsDetected: 0,
      confidence: 0,
      activeGestures: [],
      audioContext: 'inactive',
      activeNotes: 0
    };
    
    // Animation frame for debug updates
    this.debugUpdateFrame = null;
  }

  async init() {
    if (this.isInitialized) {
      console.warn('UIController already initialized');
      return;
    }

    try {
      console.log(`UIController initializing in ${this.isDebugMode ? 'DEBUG' : 'PRODUCTION'} mode`);
      
      // Get references to UI elements
      this.cacheUIElements();
      
      // Set up initial UI state
      this.setupInitialState();
      
      // Start debug monitoring if in debug mode
      if (this.isDebugMode) {
        this.startDebugMonitoring();
      }
      
      this.isInitialized = true;
      console.log('UIController initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize UIController:', error);
      throw error;
    }
  }

  cacheUIElements() {
    this.elements.welcomeScreen = document.getElementById('welcome-screen');
    this.elements.conductorInterface = document.getElementById('conductor-interface');
    this.elements.debugOverlay = document.getElementById('debug-overlay');
    this.elements.themeIndicator = document.getElementById('theme-indicator');
    this.elements.activeGesture = document.getElementById('active-gesture');
    this.elements.gestureHints = document.getElementById('gesture-hints');
    this.elements.exitButton = document.getElementById('exit-button');
  }

  setupInitialState() {
    // Set up debug overlay visibility
    if (this.isDebugMode && this.elements.debugOverlay) {
      this.elements.debugOverlay.classList.add('active');
      this.debugOverlayVisible = true;
    }
    
    // Set up initial theme
    this.updateThemeIndicator('piano');
    
    // Set up gesture hints
    this.updateGestureHints();
    
    console.log('Initial UI state configured');
  }

  updateThemeIndicator(theme) {
    if (!this.elements.themeIndicator) return;
    
    const themeMap = {
      'piano': '🎹 Piano',
      'guitar': '🎸 Guitar',
      'drums': '🥁 Drums',
      'strings': '🎻 Strings'
    };
    
    this.elements.themeIndicator.textContent = themeMap[theme] || '🎹 Piano';
  }

  showActiveGesture(gesture) {
    if (!this.elements.activeGesture) return;
    
    const gestureMap = {
      'point': '👉 Point',
      'palm': '✋ Open Palm',
      'fist': '✊ Fist',
      'peace': '✌️ Peace',
      'thumbsUp': '👍 Thumbs Up',
      'pinch': '🤏 Pinch'
    };
    
    this.elements.activeGesture.textContent = gestureMap[gesture.type] || gesture.type;
    this.elements.activeGesture.classList.remove('hidden');
    
    // Hide after 1 second
    setTimeout(() => {
      this.elements.activeGesture.classList.add('hidden');
    }, 1000);
  }

  toggleGestureHints() {
    if (!this.elements.gestureHints) return;
    
    this.hintsVisible = !this.hintsVisible;
    this.elements.gestureHints.style.opacity = this.hintsVisible ? '0.7' : '0';
    
    console.log(`Gesture hints ${this.hintsVisible ? 'shown' : 'hidden'}`);
  }

  toggleMinimalMode() {
    this.isMinimalMode = !this.isMinimalMode;
    
    const elementsToHide = [
      this.elements.themeIndicator,
      this.elements.gestureHints
    ];
    
    elementsToHide.forEach(element => {
      if (element) {
        element.style.opacity = this.isMinimalMode ? '0' : '1';
      }
    });
    
    console.log(`Minimal mode ${this.isMinimalMode ? 'enabled' : 'disabled'}`);
  }

  // Debug mode methods
  toggleDebugOverlay() {
    if (!this.isDebugMode || !this.elements.debugOverlay) return;
    
    this.debugOverlayVisible = !this.debugOverlayVisible;
    this.elements.debugOverlay.classList.toggle('active', this.debugOverlayVisible);
    
    console.log(`Debug overlay ${this.debugOverlayVisible ? 'shown' : 'hidden'}`);
  }

  toggleSkeletonOverlay() {
    if (!this.isDebugMode) return;
    
    // This would be implemented to show/hide hand skeleton
    console.log('Skeleton overlay toggled');
  }

  toggleTrailDebug() {
    if (!this.isDebugMode) return;
    
    // This would be implemented to show/hide trail debug info
    console.log('Trail debug toggled');
  }

  toggleGestureConfidence() {
    if (!this.isDebugMode) return;
    
    // This would be implemented to show/hide gesture confidence meters
    console.log('Gesture confidence display toggled');
  }

  toggleFPSCounter() {
    if (!this.isDebugMode) return;
    
    // This would be implemented to show/hide FPS counter
    console.log('FPS counter toggled');
  }

  toggleConsoleLogging() {
    if (!this.isDebugMode) return;
    
    // This would be implemented to enable/disable detailed console logging
    console.log('Console logging toggled');
  }

  startDebugMonitoring() {
    if (!this.isDebugMode) return;
    
    const updateDebugInfo = () => {
      this.updateDebugDisplay();
      this.debugUpdateFrame = requestAnimationFrame(updateDebugInfo);
    };
    
    updateDebugInfo();
  }

  updateDebugDisplay() {
    if (!this.debugOverlayVisible) return;
    
    // Update FPS
    this.debugData.fps = this.calculateFPS();
    
    // Update performance metrics
    this.debugData.cpu = this.estimateCPUUsage();
    this.debugData.memory = this.getMemoryUsage();
    
    // Update debug display elements
    this.updateDebugElement('debug-fps', `FPS: ${this.debugData.fps}`);
    this.updateDebugElement('debug-cpu', `CPU: ${this.debugData.cpu}%`);
    this.updateDebugElement('debug-memory', `Memory: ${this.debugData.memory}MB`);
    this.updateDebugElement('debug-hands', `Hands Detected: ${this.debugData.handsDetected}`);
    this.updateDebugElement('debug-confidence', `Confidence: ${this.debugData.confidence}%`);
    this.updateDebugElement('debug-gestures', `Active Gestures: ${this.debugData.activeGestures.join(', ')}`);
    this.updateDebugElement('debug-audio', `Audio Context: ${this.debugData.audioContext}`);
    this.updateDebugElement('debug-notes', `Active Notes: ${this.debugData.activeNotes}`);
  }

  updateDebugElement(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  }

  calculateFPS() {
    // Simple FPS calculation
    const now = performance.now();
    if (!this.lastFrameTime) {
      this.lastFrameTime = now;
      return 0;
    }
    
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    return Math.round(1000 / delta);
  }

  estimateCPUUsage() {
    // Simple CPU usage estimation
    return Math.floor(Math.random() * 30) + 10; // Mock data for now
  }

  getMemoryUsage() {
    // Get memory usage if available
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  updateGestureHints() {
    if (!this.elements.gestureHints) return;
    
    const hints = [
      '✋ Open hand for sustained notes',
      '👉 Point to play melodies',
      '✊ Make a fist for drums'
    ];
    
    this.elements.gestureHints.innerHTML = hints
      .map(hint => `<div class="hint-text">${hint}</div>`)
      .join('');
  }

  // Public methods for external updates
  updateHandTrackingData(data) {
    this.debugData.handsDetected = data.handsDetected || 0;
    this.debugData.confidence = Math.round((data.confidence || 0) * 100);
    this.debugData.activeGestures = data.activeGestures || [];
  }

  updateAudioData(data) {
    this.debugData.audioContext = data.contextState || 'inactive';
    this.debugData.activeNotes = data.activeNotes || 0;
  }

  cleanup() {
    if (this.debugUpdateFrame) {
      cancelAnimationFrame(this.debugUpdateFrame);
    }
    
    console.log('UIController cleaned up');
  }
}