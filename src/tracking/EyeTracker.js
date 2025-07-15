// Import WebGazer with dynamic import to avoid build issues
let webgazer;

async function loadWebGazer() {
  if (!webgazer) {
    const module = await import('webgazer');
    webgazer = module.default;
  }
  return webgazer;
}

class EyeTracker {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    this.gazeData = { x: 0, y: 0, confidence: 0 };
    this.eventListeners = {};
    this.calibrationPoints = [];
    this.currentCalibrationPoint = 0;
    this.smoothingBuffer = [];
    this.smoothingLevel = 0.7;
    this.showCrosshair = true;
    this.showConfidence = true;
    
    // DOM elements
    this.crosshair = null;
    this.confidenceIndicator = null;
    this.calibrationUI = null;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateRate = 0;
    
    // Bind methods
    this.handleGazeUpdate = this.handleGazeUpdate.bind(this);
    this.handleCalibrationClick = this.handleCalibrationClick.bind(this);
  }

  async init(options = {}) {
    if (this.isInitialized) {
      console.warn('EyeTracker already initialized');
      return;
    }

    // Set options
    this.showCrosshair = options.showCrosshair !== false;
    this.showConfidence = options.showConfidence !== false;
    this.smoothingLevel = options.smoothingLevel || 0.7;

    try {
      // Load WebGazer dynamically
      webgazer = await loadWebGazer();
      
      // Check for camera availability
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser');
      }

      // Test camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Camera access granted');
      } catch (cameraError) {
        console.error('Camera access denied:', cameraError);
        this.handleCameraError(cameraError);
        throw new Error('Camera access required for eye tracking');
      }

      // Initialize WebGazer with ridge regression (non-threaded version)
      await webgazer.setGazeListener(this.handleGazeUpdate)
        .setRegression('ridge')
        .begin();

      // Turn off video preview
      webgazer.showVideoPreview(false);
      webgazer.showPredictionPoints(false);

      this.isInitialized = true;
      this.createUI();
      
      console.log('EyeTracker initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize EyeTracker:', error);
      this.showErrorMessage(error.message);
      this.emit('error', error);
      throw error;
    }
  }

  handleCameraError(error) {
    let message = 'Camera access required for eye tracking';
    let troubleshootingTips = [];

    switch (error.name) {
      case 'NotAllowedError':
        message = 'Camera access denied by user';
        troubleshootingTips = [
          'Click the camera icon in the browser address bar',
          'Select "Allow" for camera access',
          'Refresh the page and try again'
        ];
        break;
      case 'NotFoundError':
        message = 'No camera found';
        troubleshootingTips = [
          'Check if your camera is connected',
          'Try using a different camera',
          'Restart your browser'
        ];
        break;
      case 'NotReadableError':
        message = 'Camera is being used by another application';
        troubleshootingTips = [
          'Close other applications that might be using the camera',
          'Restart your browser',
          'Restart your computer if the issue persists'
        ];
        break;
      default:
        troubleshootingTips = [
          'Check camera permissions in browser settings',
          'Try refreshing the page',
          'Try using a different browser'
        ];
    }

    console.error(message, troubleshootingTips);
    this.emit('cameraError', { message, troubleshootingTips });
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('EyeTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      console.warn('EyeTracker already tracking');
      return;
    }

    try {
      await webgazer.resume();
      this.isTracking = true;
      this.showUI();
      
      console.log('EyeTracker started');
      this.emit('started');
    } catch (error) {
      console.error('Failed to start EyeTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isTracking) {
      console.warn('EyeTracker not currently tracking');
      return;
    }

    try {
      await webgazer.pause();
      this.isTracking = false;
      this.hideUI();
      
      console.log('EyeTracker stopped');
      this.emit('stopped');
    } catch (error) {
      console.error('Failed to stop EyeTracker:', error);
      this.emit('error', error);
    }
  }

  async startCalibration() {
    if (!this.isInitialized) {
      throw new Error('EyeTracker not initialized');
    }

    if (this.isCalibrating) {
      console.warn('Calibration already in progress');
      return;
    }

    this.isCalibrating = true;
    this.currentCalibrationPoint = 0;
    this.setupCalibrationPoints();
    this.showCalibrationUI();
    
    console.log('Calibration started');
    this.emit('calibrationStarted');
  }

  setupCalibrationPoints() {
    const padding = 0.1; // 10% padding from edges
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 9-point calibration grid
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
        <h2>Eye Tracking Calibration</h2>
        <p>Look at each point and click when ready</p>
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
    
    // Remove previous point
    const existingPoint = document.getElementById('calibration-point');
    if (existingPoint) {
      existingPoint.remove();
    }

    // Create new calibration point
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
    
    // Add pulse animation
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
    const point = this.calibrationPoints[this.currentCalibrationPoint];
    
    // Store calibration data point
    webgazer.recordScreenPosition(point.x, point.y);
    
    this.currentCalibrationPoint++;
    
    // Show visual feedback
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
    
    // Clean up
    const pointElement = document.getElementById('calibration-point');
    if (pointElement) {
      pointElement.remove();
    }
    
    console.log('Calibration completed');
    this.emit('calibrationComplete');
  }

  handleGazeUpdate(data, timestamp) {
    if (!data || !this.isTracking) return;

    // Validate data
    if (!data.x || !data.y || isNaN(data.x) || isNaN(data.y)) {
      console.warn('Invalid gaze data received:', data);
      return;
    }

    // Check if face is detected
    if (!webgazer.getTracker().predictionReady) {
      if (this.gazeData.confidence > 0) {
        console.log('Face tracking lost');
        this.emit('trackingLost');
        this.gazeData.confidence = 0;
        this.updateConfidenceIndicator(0);
      }
      return;
    }

    // Calculate update rate
    const now = performance.now();
    if (this.lastUpdateTime > 0) {
      const deltaTime = now - this.lastUpdateTime;
      this.updateRate = 1000 / deltaTime;
    }
    this.lastUpdateTime = now;

    // Apply smoothing
    const smoothedData = this.applySmoothig(data);
    
    // Calculate confidence based on prediction stability
    const confidence = this.calculateConfidence(smoothedData);
    
    this.gazeData = {
      x: smoothedData.x,
      y: smoothedData.y,
      confidence: confidence,
      timestamp: timestamp
    };

    // Update UI
    this.updateCrosshair(smoothedData.x, smoothedData.y);
    this.updateConfidenceIndicator(confidence);
    
    // Emit event
    this.emit('gazeUpdate', this.gazeData);
  }

  applySmoothig(data) {
    // Add to smoothing buffer
    this.smoothingBuffer.push(data);
    
    // Keep buffer size reasonable
    if (this.smoothingBuffer.length > 10) {
      this.smoothingBuffer.shift();
    }

    // Apply weighted average
    let totalWeight = 0;
    let smoothedX = 0;
    let smoothedY = 0;
    
    for (let i = 0; i < this.smoothingBuffer.length; i++) {
      const weight = Math.pow(this.smoothingLevel, this.smoothingBuffer.length - 1 - i);
      smoothedX += this.smoothingBuffer[i].x * weight;
      smoothedY += this.smoothingBuffer[i].y * weight;
      totalWeight += weight;
    }
    
    return {
      x: smoothedX / totalWeight,
      y: smoothedY / totalWeight
    };
  }

  calculateConfidence(data) {
    if (this.smoothingBuffer.length < 3) return 0;
    
    // Calculate variance in recent predictions
    const recentPoints = this.smoothingBuffer.slice(-5);
    const avgX = recentPoints.reduce((sum, p) => sum + p.x, 0) / recentPoints.length;
    const avgY = recentPoints.reduce((sum, p) => sum + p.y, 0) / recentPoints.length;
    
    const variance = recentPoints.reduce((sum, p) => {
      const dx = p.x - avgX;
      const dy = p.y - avgY;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0) / recentPoints.length;
    
    // Convert variance to confidence (lower variance = higher confidence)
    const confidence = Math.max(0, Math.min(1, 1 - variance / 100));
    return confidence;
  }

  updateCrosshair(x, y) {
    if (!this.crosshair || !this.showCrosshair) return;
    
    this.crosshair.style.left = x + 'px';
    this.crosshair.style.top = y + 'px';
  }

  updateConfidenceIndicator(confidence) {
    if (!this.confidenceIndicator || !this.showConfidence) return;
    
    // Color based on confidence
    let color;
    if (confidence > 0.7) {
      color = '#00ff00'; // Green - high confidence
    } else if (confidence > 0.4) {
      color = '#ffff00'; // Yellow - medium confidence
    } else {
      color = '#ff0000'; // Red - low confidence
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

  showErrorMessage(message) {
    // Create error message UI
    const errorDiv = document.createElement('div');
    errorDiv.id = 'eye-tracker-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      text-align: center;
      z-index: 10002;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    
    errorDiv.innerHTML = `
      <h3>Eye Tracking Error</h3>
      <p>${message}</p>
      <button onclick="this.parentElement.remove()" style="
        background: white;
        color: red;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">OK</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
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
    
    if (this.isInitialized) {
      await webgazer.end();
    }
    
    // Clean up UI
    if (this.crosshair) {
      this.crosshair.remove();
    }
    if (this.confidenceIndicator) {
      this.confidenceIndicator.remove();
    }
    if (this.calibrationUI) {
      this.calibrationUI.remove();
    }
    
    // Clear event listeners
    this.eventListeners = {};
    
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    
    console.log('EyeTracker disposed');
    this.emit('disposed');
  }
}

export default EyeTracker;