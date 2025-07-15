class MockFaceTracker {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    this.attentionData = { x: 0, y: 0, radius: 200, confidence: 0.8 };
    this.eventListeners = {};
    this.calibrationPoints = [];
    this.currentCalibrationPoint = 0;
    this.showAttentionZone = true;
    this.showConfidence = true;
    this.trackingMode = 'comfortable';
    
    // DOM elements
    this.attentionZone = null;
    this.confidenceIndicator = null;
    this.calibrationUI = null;
    this.videoElement = null;
    
    // Mock tracking
    this.mouseX = 0;
    this.mouseY = 0;
    this.updateRate = 60;
    
    // Bind methods
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleCalibrationClick = this.handleCalibrationClick.bind(this);
    this.updateAttentionData = this.updateAttentionData.bind(this);
  }

  async init(options = {}) {
    if (this.isInitialized) {
      console.warn('MockFaceTracker already initialized');
      return;
    }

    this.showAttentionZone = options.showAttentionZone !== false;
    this.showConfidence = options.showConfidence !== false;
    this.trackingMode = options.trackingMode || 'comfortable';

    try {
      console.log('MockFaceTracker: Simulating camera access...');
      
      // Simulate camera access delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.isInitialized = true;
      this.createUI();
      
      // Set up mouse tracking as a mock for face tracking
      document.addEventListener('mousemove', this.handleMouseMove);
      
      console.log('MockFaceTracker initialized successfully (using mouse simulation)');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize MockFaceTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('MockFaceTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      console.warn('MockFaceTracker already tracking');
      return;
    }

    try {
      this.isTracking = true;
      this.showUI();
      
      // Start mock attention updates
      this.attentionUpdateInterval = setInterval(this.updateAttentionData, 1000 / 60); // 60 FPS
      
      console.log('MockFaceTracker started (mouse simulation)');
      this.emit('started');
    } catch (error) {
      console.error('Failed to start MockFaceTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isTracking) {
      console.warn('MockFaceTracker not currently tracking');
      return;
    }

    try {
      this.isTracking = false;
      this.hideUI();
      
      if (this.attentionUpdateInterval) {
        clearInterval(this.attentionUpdateInterval);
        this.attentionUpdateInterval = null;
      }
      
      console.log('MockFaceTracker stopped');
      this.emit('stopped');
    } catch (error) {
      console.error('Failed to stop MockFaceTracker:', error);
      this.emit('error', error);
    }
  }

  handleMouseMove(event) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  updateAttentionData() {
    if (!this.isTracking) return;

    // Add some randomness to simulate face tracking inaccuracy
    const jitter = 30;
    const x = this.mouseX + (Math.random() - 0.5) * jitter;
    const y = this.mouseY + (Math.random() - 0.5) * jitter;
    
    // Set radius based on tracking mode
    let radius;
    switch (this.trackingMode) {
      case 'precise':
        radius = 150;
        break;
      case 'comfortable':
        radius = 200;
        break;
      case 'relaxed':
        radius = 250;
        break;
      default:
        radius = 200;
    }
    
    // Simulate varying confidence (face visibility)
    const confidence = 0.7 + Math.random() * 0.3;
    
    this.attentionData = {
      x: x,
      y: y,
      radius: radius,
      confidence: confidence,
      timestamp: Date.now()
    };

    // Update UI
    this.updateAttentionZone(x, y, radius);
    this.updateConfidenceIndicator(confidence);
    
    // Emit event
    this.emit('attentionUpdate', this.attentionData);
  }

  setTrackingMode(mode) {
    const validModes = ['precise', 'comfortable', 'relaxed'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid tracking mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }
    
    this.trackingMode = mode;
    console.log(`Mock tracking mode set to: ${mode}`);
    this.emit('trackingModeChanged', mode);
  }

  async startCalibration() {
    if (!this.isInitialized) {
      throw new Error('MockFaceTracker not initialized');
    }

    if (this.isCalibrating) {
      console.warn('Calibration already in progress');
      return;
    }

    this.isCalibrating = true;
    this.currentCalibrationPoint = 0;
    this.setupCalibrationPoints();
    this.showCalibrationUI();
    
    console.log('Mock face tracking calibration started');
    this.emit('calibrationStarted');
  }

  setupCalibrationPoints() {
    const padding = 0.1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 5-point calibration: corners + center
    this.calibrationPoints = [
      { x: width * padding, y: height * padding },           // Top-left
      { x: width * (1 - padding), y: height * padding },     // Top-right
      { x: width * 0.5, y: height * 0.5 },                  // Center
      { x: width * padding, y: height * (1 - padding) },     // Bottom-left
      { x: width * (1 - padding), y: height * (1 - padding) } // Bottom-right
    ];
  }

  createUI() {
    // Create attention zone
    this.attentionZone = document.createElement('div');
    this.attentionZone.id = 'face-tracker-attention-zone';
    this.attentionZone.style.cssText = `
      position: fixed;
      border: 3px solid rgba(0, 255, 0, 0.6);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      display: none;
      transform: translate(-50%, -50%);
      transition: all 0.2s ease;
      background: rgba(0, 255, 0, 0.1);
    `;
    document.body.appendChild(this.attentionZone);

    // Create confidence indicator
    this.confidenceIndicator = document.createElement('div');
    this.confidenceIndicator.id = 'face-tracker-confidence';
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
    this.calibrationUI.id = 'face-tracker-calibration';
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

    // Create mock video element
    this.videoElement = document.createElement('div');
    this.videoElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      width: 200px;
      height: 150px;
      border: 2px solid #333;
      border-radius: 8px;
      z-index: 9998;
      display: none;
      background: #222;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 12px;
      padding: 10px;
      box-sizing: border-box;
    `;
    this.videoElement.innerHTML = `
      <div style="text-align: center; margin-top: 40px;">
        <div>📹 Mock Camera</div>
        <div style="margin-top: 10px; font-size: 10px;">
          Face tracking simulation<br/>
          using mouse movement
        </div>
      </div>
    `;
    document.body.appendChild(this.videoElement);
  }

  showUI() {
    if (this.showAttentionZone && this.attentionZone) {
      this.attentionZone.style.display = 'block';
    }
    if (this.showConfidence && this.confidenceIndicator) {
      this.confidenceIndicator.style.display = 'block';
    }
    if (this.videoElement) {
      this.videoElement.style.display = 'block';
    }
  }

  hideUI() {
    if (this.attentionZone) {
      this.attentionZone.style.display = 'none';
    }
    if (this.confidenceIndicator) {
      this.confidenceIndicator.style.display = 'none';
    }
    if (this.videoElement) {
      this.videoElement.style.display = 'none';
    }
  }

  updateAttentionZone(x, y, radius) {
    if (!this.attentionZone || !this.showAttentionZone) return;
    
    this.attentionZone.style.left = x + 'px';
    this.attentionZone.style.top = y + 'px';
    this.attentionZone.style.width = (radius * 2) + 'px';
    this.attentionZone.style.height = (radius * 2) + 'px';
  }

  updateConfidenceIndicator(confidence) {
    if (!this.confidenceIndicator || !this.showConfidence) return;
    
    // Color based on confidence (face visibility percentage)
    let color;
    if (confidence > 0.8) {
      color = '#00ff00'; // Green - high confidence
    } else if (confidence > 0.5) {
      color = '#ffff00'; // Yellow - medium confidence
    } else {
      color = '#ff0000'; // Red - low confidence
    }
    
    this.confidenceIndicator.style.background = color;
    this.confidenceIndicator.style.opacity = confidence;
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
        <h2>Mock Face Tracking Calibration</h2>
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
    
    console.log('Mock face tracking calibration completed');
    this.emit('calibrationComplete');
  }

  getAttentionZone() {
    return {
      x: this.attentionData.x,
      y: this.attentionData.y,
      radius: this.attentionData.radius,
      confidence: this.attentionData.confidence
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
    
    if (this.attentionUpdateInterval) {
      clearInterval(this.attentionUpdateInterval);
    }
    
    document.removeEventListener('mousemove', this.handleMouseMove);
    
    if (this.attentionZone) {
      this.attentionZone.remove();
    }
    if (this.confidenceIndicator) {
      this.confidenceIndicator.remove();
    }
    if (this.calibrationUI) {
      this.calibrationUI.remove();
    }
    if (this.videoElement) {
      this.videoElement.remove();
    }
    
    this.eventListeners = {};
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    
    console.log('MockFaceTracker disposed');
    this.emit('disposed');
  }
}

export default MockFaceTracker;