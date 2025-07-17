// Conductor Mode Entry Point
// This is the main entry point for the conductor application

import { UIController } from './ui.js';
import { ConductorController } from './conductor.js';

class ConductorApp {
  constructor() {
    this.isDebugMode = this.detectDebugMode();
    this.uiController = null;
    this.conductorController = null;
    this.isInitialized = false;
    
    console.log(`Conductor Mode starting in ${this.isDebugMode ? 'DEBUG' : 'PRODUCTION'} mode`);
  }

  detectDebugMode() {
    // Check environment variables and URL parameters
    const isDevEnvironment = process.env.NODE_ENV === 'development';
    const hasDebugParam = window.location.search.includes('debug=true');
    const isDev = window.location.hostname === 'localhost' && window.location.port === '3004';
    
    return isDevEnvironment || hasDebugParam || isDev;
  }

  async init() {
    if (this.isInitialized) {
      console.warn('🎵 [ConductorApp] Already initialized');
      return;
    }

    try {
      console.log('🎵 [ConductorApp] 🚀 Starting Conductor Mode initialization...');
      console.log('🎵 [ConductorApp] Debug mode:', this.isDebugMode);
      
      // Initialize UI controller first
      console.log('🎵 [ConductorApp] 1/3 Initializing UI Controller...');
      this.uiController = new UIController(this.isDebugMode);
      await this.uiController.init();
      console.log('🎵 [ConductorApp] ✅ UI Controller initialized');
      
      // Initialize conductor controller
      console.log('🎵 [ConductorApp] 2/3 Initializing Conductor Controller...');
      this.conductorController = new ConductorController(this.isDebugMode);
      await this.conductorController.init();
      console.log('🎵 [ConductorApp] ✅ Conductor Controller initialized');
      
      // Set up event listeners
      console.log('🎵 [ConductorApp] 3/3 Setting up event listeners...');
      this.setupEventListeners();
      console.log('🎵 [ConductorApp] ✅ Event listeners set up');
      
      // Start the welcome sequence
      console.log('🎵 [ConductorApp] Starting welcome sequence...');
      this.startWelcomeSequence();
      
      this.isInitialized = true;
      console.log('🎵 [ConductorApp] 🎉 Conductor Mode initialized successfully!');
      
    } catch (error) {
      console.error('🎵 [ConductorApp] ❌ INITIALIZATION FAILED:', error);
      console.error('🎵 [ConductorApp] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        uiControllerExists: !!this.uiController,
        conductorControllerExists: !!this.conductorController
      });
      this.handleInitializationError(error);
    }
  }

  setupEventListeners() {
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleKeyPress(event);
    });

    // Handle exit button
    const exitButton = document.getElementById('exit-button');
    if (exitButton) {
      exitButton.addEventListener('click', () => {
        this.handleExit();
      });
    }

    // Handle conductor events
    if (this.conductorController) {
      this.conductorController.on('gestureDetected', (gesture) => {
        this.uiController.showActiveGesture(gesture);
      });
      
      this.conductorController.on('themeChanged', (theme) => {
        this.uiController.updateThemeIndicator(theme);
      });
      
      this.conductorController.on('handsDetected', (data) => {
        this.uiController.updateHandTrackingData(data);
      });
      
      this.conductorController.on('handsLost', () => {
        this.uiController.updateHandTrackingData({ handsDetected: 0 });
      });
      
      this.conductorController.on('gestureCooldown', (data) => {
        this.uiController.showGestureCooldown(data.duration);
      });
    }
  }

  handleKeyPress(event) {
    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'escape':
        this.handleExit();
        break;
      case 'h':
        this.uiController.toggleGestureHelp();
        break;
      case 'm':
        this.uiController.toggleMinimalMode();
        break;
        
      // Debug mode keys
      case 'd':
        if (this.isDebugMode) {
          this.uiController.toggleDebugOverlay();
        }
        break;
      case 's':
        if (this.isDebugMode) {
          this.uiController.toggleSkeletonOverlay();
        }
        break;
      case 't':
        if (this.isDebugMode) {
          this.uiController.toggleTrailDebug();
        }
        break;
      case 'g':
        if (this.isDebugMode) {
          this.uiController.toggleGestureConfidence();
        }
        break;
      case 'f':
        if (this.isDebugMode) {
          this.uiController.toggleFPSCounter();
        }
        break;
      case 'l':
        if (this.isDebugMode) {
          this.uiController.toggleConsoleLogging();
        }
        break;
      case ' ':
        if (this.isDebugMode) {
          event.preventDefault();
          this.conductorController.recalibrateHandTracking();
        }
        break;
      case '1':
        this.conductorController.setTheme('piano');
        break;
      case '2':
        this.conductorController.setTheme('guitar');
        break;
      case '3':
        this.conductorController.setTheme('drums');
        break;
      case '4':
        this.conductorController.setTheme('strings');
        break;
      
      // Keyboard fallback for accessibility
      default:
        // Let other keys trigger sounds through the keyboard fallback
        if (this.conductorController && this.conductorController.handleKeyboardFallback) {
          this.conductorController.handleKeyboardFallback(key);
        }
        break;
    }
  }

  startWelcomeSequence() {
    // Show welcome screen for 3 seconds, then transition to main interface
    setTimeout(() => {
      this.transitionToMainInterface();
    }, 3000);
  }

  transitionToMainInterface() {
    console.log('🎵 [ConductorApp] Transitioning to main interface...');
    
    const welcomeScreen = document.getElementById('welcome-screen');
    const conductorInterface = document.getElementById('conductor-interface');
    
    if (welcomeScreen && conductorInterface) {
      console.log('🎵 [ConductorApp] UI elements found, starting transition...');
      
      // Fade out welcome screen
      welcomeScreen.classList.add('fade-out');
      
      setTimeout(async () => {
        try {
          welcomeScreen.classList.add('hidden');
          conductorInterface.classList.remove('hidden');
          conductorInterface.classList.add('fade-in');
          
          // Start the conductor system
          console.log('🎵 [ConductorApp] Starting conductor system...');
          await this.conductorController.start();
          console.log('🎵 [ConductorApp] ✅ Conductor system started successfully!');
        } catch (error) {
          console.error('🎵 [ConductorApp] ❌ Failed to start conductor system:', error);
          this.handleStartupError(error);
        }
      }, 500);
    } else {
      console.error('🎵 [ConductorApp] ❌ Required UI elements not found:', {
        welcomeScreen: !!welcomeScreen,
        conductorInterface: !!conductorInterface
      });
    }
  }

  handleExit() {
    console.log('Exiting Conductor Mode...');
    
    // Clean up resources
    if (this.conductorController) {
      this.conductorController.stop();
    }
    
    if (this.uiController) {
      this.uiController.cleanup();
    }
    
    // Close the window
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    } else {
      window.close();
    }
  }

  handleInitializationError(error) {
    console.error('🎵 [ConductorApp] ❌ Initialization failed:', error);
    
    // Show detailed error message to user
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.innerHTML = `
        <div class="welcome-title">⚠️ Initialization Error</div>
        <div class="welcome-subtitle">Unable to start Conductor Mode</div>
        <div class="welcome-instructions">
          ${error.message}<br><br>
          ${this.isDebugMode ? `<small>Debug info: ${error.stack}</small><br><br>` : ''}
          Press ESC to exit
        </div>
      `;
    }
  }
  
  handleStartupError(error) {
    console.error('🎵 [ConductorApp] ❌ Startup failed:', error);
    
    // Show error in conductor interface
    const conductorInterface = document.getElementById('conductor-interface');
    if (conductorInterface) {
      conductorInterface.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: white; background: rgba(0,0,0,0.8);">
          <h2>⚠️ Startup Error</h2>
          <p>Failed to start the Musical Educator Engine</p>
          <p><small>${error.message}</small></p>
          ${this.isDebugMode ? `<pre style="font-size: 10px; max-width: 80%; overflow: auto;">${error.stack}</pre>` : ''}
          <p>Press ESC to exit</p>
        </div>
      `;
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ConductorApp();
  app.init();
  
  // Make app available globally for debugging
  window.conductorApp = app;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (window.conductorApp) {
    if (document.hidden) {
      // Page is hidden, pause intensive operations
      window.conductorApp.conductorController?.pause();
    } else {
      // Page is visible, resume operations
      window.conductorApp.conductorController?.resume();
    }
  }
});