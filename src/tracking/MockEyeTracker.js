class MockEyeTracker {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    this.gazeData = { x: 0, y: 0, confidence: 0.8 };
    this.eventListeners = {};
    this.calibrationPoints = [];
    this.currentCalibrationPoint = 0;
    this.showCrosshair = true;
    this.showConfidence = true;
    
    // DOM elements
    this.crosshair = null;
    this.confidenceIndicator = null;
    this.calibrationUI = null;
    
    // Mock tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.updateRate = 60;
    
    // Bind methods
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleCalibrationClick = this.handleCalibrationClick.bind(this);
    this.updateGazeData = this.updateGazeData.bind(this);
  }

  async init(options = {}) {
    if (this.isInitialized) {
      console.warn('MockEyeTracker already initialized');
      return;
    }

    this.showCrosshair = options.showCrosshair !== false;
    this.showConfidence = options.showConfidence !== false;

    try {
      console.log('MockEyeTracker: Simulating camera access...');
      
      // Simulate camera access delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.isInitialized = true;
      this.createUI();
      
      // Set up mouse tracking as a mock for eye tracking
      document.addEventListener('mousemove', this.handleMouseMove);
      
      console.log('MockEyeTracker initialized successfully (using mouse simulation)');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize MockEyeTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('MockEyeTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      console.warn('MockEyeTracker already tracking');
      return;
    }

    try {
      this.isTracking = true;
      this.showUI();
      
      // Start mock gaze updates
      this.gazeUpdateInterval = setInterval(this.updateGazeData, 1000 / 60); // 60 FPS
      
      console.log('MockEyeTracker started (mouse simulation)');
      this.emit('started');
    } catch (error) {
      console.error('Failed to start MockEyeTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isTracking) {
      console.warn('MockEyeTracker not currently tracking');
      return;
    }

    try {
      this.isTracking = false;
      this.hideUI();
      
      if (this.gazeUpdateInterval) {
        clearInterval(this.gazeUpdateInterval);
        this.gazeUpdateInterval = null;
      }
      
      console.log('MockEyeTracker stopped');
      this.emit('stopped');
    } catch (error) {
      console.error('Failed to stop MockEyeTracker:', error);
      this.emit('error', error);
    }
  }

  handleMouseMove(event) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  updateGazeData() {
    if (!this.isTracking) return;

    // Add some randomness to simulate eye tracking inaccuracy
    const jitter = 20;
    const x = this.mouseX + (Math.random() - 0.5) * jitter;
    const y = this.mouseY + (Math.random() - 0.5) * jitter;
    
    // Simulate varying confidence
    const confidence = 0.7 + Math.random() * 0.3;
    
    this.gazeData = {
      x: x,
      y: y,
      confidence: confidence,
      timestamp: Date.now()
    };

    // Update UI
    this.updateCrosshair(x, y);
    this.updateConfidenceIndicator(confidence);
    
    // Emit event
    this.emit('gazeUpdate', this.gazeData);
  }

  async startCalibration() {
    if (!this.isInitialized) {
      throw new Error('MockEyeTracker not initialized');
    }

    if (this.isCalibrating) {
      console.warn('Calibration already in progress');
      return;
    }

    this.isCalibrating = true;
    this.currentCalibrationPoint = 0;
    this.setupCalibrationPoints();
    this.showCalibrationUI();
    
    console.log('Mock calibration started');
    this.emit('calibrationStarted');
  }

  setupCalibrationPoints() {
    const padding = 0.1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.calibrationPoints = [
      { x: width * padding, y: height * padding },
      { x: width * 0.5, y: height * padding },
      { x: width * (1 - padding), y: height * padding },
      { x: width * padding, y: height * 0.5 },
      { x: width * 0.5, y: height * 0.5 },
      { x: width * (1 - padding), y: height * 0.5 },
      { x: width * padding, y: height * (1 - padding) },
      { x: width * 0.5, y: height * (1 - padding) },
      { x: width * (1 - padding), y: height * (1 - padding) }
    ];
  }

  createUI() {
    // Create crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.id = 'eye-tracker-crosshair';
    this.crosshair.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      background: rgba(0, 255, 0, 0.8);
      border: 2px solid rgba(0, 255, 0, 1);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      display: none;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease;
    `;
    document.body.appendChild(this.crosshair);

    // Create confidence indicator
    this.confidenceIndicator = document.createElement('div');
    this.confidenceIndicator.id = 'eye-tracker-confidence';
    this.confidenceIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      display: none;
      border: 2px solid white;
    `;
    document.body.appendChild(this.confidenceIndicator);

    // Create calibration UI container
    this.calibrationUI = document.createElement('div');
    this.calibrationUI.id = 'eye-tracker-calibration';
    this.calibrationUI.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      pointer-events: none;
      z-index: 9999;
      display: none;
    `;
    document.body.appendChild(this.calibrationUI);
  }

  showUI() {
    if (this.showCrosshair && this.crosshair) {
      this.crosshair.style.display = 'block';
    }
    if (this.showConfidence && this.confidenceIndicator) {
      this.confidenceIndicator.style.display = 'block';
    }
  }

  hideUI() {
    if (this.crosshair) {
      this.crosshair.style.display = 'none';
    }
    if (this.confidenceIndicator) {
      this.confidenceIndicator.style.display = 'none';
    }
  }

  showCalibrationUI() {
    if (!this.calibrationUI) return;
    
    this.calibrationUI.style.display = 'block';
    this.calibrationUI.style.pointerEvents = 'auto';
    this.calibrationUI.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-family: Arial, sans-serif;
        font-size: 24px;
        text-align: center;
        margin-bottom: 200px;
      ">
        <h2>Mock Eye Tracking Calibration</h2>
        <p>Click on each point (using mouse simulation)</p>
        <p>Point ${this.currentCalibrationPoint + 1} of ${this.calibrationPoints.length}</p>
      </div>
    `;
    
    this.showNextCalibrationPoint();
  }

  showNextCalibrationPoint() {
    if (this.currentCalibrationPoint >= this.calibrationPoints.length) {
      this.completeCalibration();
      return;
    }

    const point = this.calibrationPoints[this.currentCalibrationPoint];
    
    const existingPoint = document.getElementById('calibration-point');
    if (existingPoint) {
      existingPoint.remove();
    }

    const pointElement = document.createElement('div');
    pointElement.id = 'calibration-point';
    pointElement.style.cssText = `
      position: absolute;
      left: ${point.x}px;
      top: ${point.y}px;
      width: 30px;
      height: 30px;
      background: #ff0000;
      border: 3px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      cursor: pointer;
      animation: pulse 1s infinite;
      z-index: 10001;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    pointElement.onclick = this.handleCalibrationClick;
    this.calibrationUI.appendChild(pointElement);
  }

  handleCalibrationClick() {
    console.log(`Mock calibration point ${this.currentCalibrationPoint + 1} clicked`);
    
    this.currentCalibrationPoint++;
    
    const pointElement = document.getElementById('calibration-point');
    if (pointElement) {
      pointElement.style.background = '#00ff00';
      pointElement.style.animation = 'none';
      setTimeout(() => {
        this.showNextCalibrationPoint();
      }, 500);
    }
  }

  completeCalibration() {
    this.isCalibrating = false;
    this.calibrationUI.style.display = 'none';
    this.calibrationUI.style.pointerEvents = 'none';
    
    const pointElement = document.getElementById('calibration-point');
    if (pointElement) {
      pointElement.remove();
    }
    
    console.log('Mock calibration completed');
    this.emit('calibrationComplete');
  }

  updateCrosshair(x, y) {
    if (!this.crosshair || !this.showCrosshair) return;
    
    this.crosshair.style.left = x + 'px';
    this.crosshair.style.top = y + 'px';
  }

  updateConfidenceIndicator(confidence) {
    if (!this.confidenceIndicator || !this.showConfidence) return;
    
    let color;
    if (confidence > 0.7) {
      color = '#00ff00';
    } else if (confidence > 0.4) {
      color = '#ffff00';
    } else {
      color = '#ff0000';
    }
    
    this.confidenceIndicator.style.background = color;
    this.confidenceIndicator.style.opacity = confidence;
  }

  getGazePosition() {
    return {
      x: this.gazeData.x,
      y: this.gazeData.y,
      confidence: this.gazeData.confidence
    };
  }

  isReadyForTracking() {
    return this.isInitialized && this.isTracking && !this.isCalibrating;
  }

  getUpdateRate() {
    return this.updateRate;
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners[event]) return;
    
    const index = this.eventListeners[event].indexOf(callback);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners[event]) return;
    
    this.eventListeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  async dispose() {
    if (this.isTracking) {
      await this.stop();
    }
    
    if (this.gazeUpdateInterval) {
      clearInterval(this.gazeUpdateInterval);
    }
    
    document.removeEventListener('mousemove', this.handleMouseMove);
    
    if (this.crosshair) {
      this.crosshair.remove();
    }
    if (this.confidenceIndicator) {
      this.confidenceIndicator.remove();
    }
    if (this.calibrationUI) {
      this.calibrationUI.remove();
    }
    
    this.eventListeners = {};
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    
    console.log('MockEyeTracker disposed');
    this.emit('disposed');
  }
}

export default MockEyeTracker;