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
      console.warn('ConductorApp already initialized');
      return;
    }

    try {
      console.log('Initializing Conductor Mode...');
      
      // Initialize UI controller first
      this.uiController = new UIController(this.isDebugMode);
      await this.uiController.init();
      
      // Initialize conductor controller
      this.conductorController = new ConductorController(this.isDebugMode);
      await this.conductorController.init();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Start the welcome sequence
      this.startWelcomeSequence();
      
      this.isInitialized = true;
      console.log('Conductor Mode initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Conductor Mode:', error);
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
    }
  }

  handleKeyPress(event) {
    const key = event.key.toLowerCase();
    
    switch (key) {
      case 'escape':
        this.handleExit();
        break;
      case 'h':
        this.uiController.toggleGestureHints();
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
    }
  }

  startWelcomeSequence() {
    // Show welcome screen for 3 seconds, then transition to main interface
    setTimeout(() => {
      this.transitionToMainInterface();
    }, 3000);
  }

  transitionToMainInterface() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const conductorInterface = document.getElementById('conductor-interface');
    
    if (welcomeScreen && conductorInterface) {
      // Fade out welcome screen
      welcomeScreen.classList.add('fade-out');
      
      setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        conductorInterface.classList.remove('hidden');
        conductorInterface.classList.add('fade-in');
        
        // Start the conductor system
        this.conductorController.start();
      }, 500);
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
    console.error('Conductor Mode initialization failed:', error);
    
    // Show error message to user
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.innerHTML = `
        <div class="welcome-title">⚠️ Initialization Error</div>
        <div class="welcome-subtitle">Unable to start Conductor Mode</div>
        <div class="welcome-instructions">
          ${error.message}<br><br>
          Press ESC to exit
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