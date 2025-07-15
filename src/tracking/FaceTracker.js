// Import MediaPipe Face Landmarker with dynamic import to avoid build issues
let FaceLandmarker;
let FilesetResolver;

async function loadMediaPipe() {
  if (!FaceLandmarker) {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      FaceLandmarker = vision.FaceLandmarker;
      FilesetResolver = vision.FilesetResolver;
      console.log('MediaPipe tasks-vision loaded successfully');
    } catch (error) {
      console.error('Failed to load MediaPipe tasks-vision:', error);
      throw new Error('MediaPipe library not available. Please check your internet connection.');
    }
  }
  return { FaceLandmarker, FilesetResolver };
}

class FaceTracker {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.isCalibrating = false;
    this.attentionData = { x: 0, y: 0, radius: 200, confidence: 0 };
    this.eventListeners = {};
    this.calibrationPoints = [];
    this.currentCalibrationPoint = 0;
    this.smoothingBuffer = [];
    this.smoothingLevel = 0.7;
    this.showAttentionZone = true;
    this.showConfidence = true;
    this.trackingMode = 'comfortable'; // 'precise', 'comfortable', 'relaxed'
    
    // MediaPipe components
    this.faceLandmarker = null;
    this.vision = null;
    this.camera = null;
    this.videoElement = null;
    
    // DOM elements
    this.attentionZone = null;
    this.confidenceIndicator = null;
    this.calibrationUI = null;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateRate = 0;
    this.lastVideoTime = -1;
    this.lastDetectionTime = 0;
    
    // Calibration data
    this.calibrationMap = new Map();
    this.currentFaceLandmarks = null;
    
    // Head movement tracking
    this.previousPosition = { x: 0, y: 0, timestamp: 0 };
    this.movementVelocityThreshold = 150; // pixels per second
    this.movementCooldown = 1000; // milliseconds between movement events
    this.lastMovementEvent = 0;
    
    // Bind methods
    this.handleFaceUpdate = this.handleFaceUpdate.bind(this);
    this.handleCalibrationClick = this.handleCalibrationClick.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  async init(options = {}) {
    if (this.isInitialized) {
      console.warn('FaceTracker already initialized');
      return;
    }

    // Set options
    this.showAttentionZone = options.showAttentionZone !== false;
    this.showConfidence = options.showConfidence !== false;
    this.smoothingLevel = options.smoothingLevel || 0.7;
    this.trackingMode = options.trackingMode || 'comfortable';

    try {
      // Load MediaPipe Face Landmarker
      console.log('Loading MediaPipe Face Landmarker...');
      const { FaceLandmarker: FL, FilesetResolver: FR } = await loadMediaPipe();
      
      // Initialize MediaPipe vision with proper WASM path
      console.log('Initializing MediaPipe vision...');
      this.vision = await FR.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      console.log('MediaPipe vision initialized');
      
      // Create face landmarker
      console.log('Creating face landmarker...');
      this.faceLandmarker = await FL.createFromOptions(this.vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true
      });
      console.log('Face landmarker created successfully');

      // Check for camera availability
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser');
      }

      // Test camera access with better error handling
      console.log('Requesting camera access...');
      try {
        // Request camera permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 }
          } 
        });
        
        console.log('Camera access granted, creating video element...');
        
        // Create video element as fullscreen background
        this.videoElement = document.createElement('video');
        this.videoElement.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          transform: scaleX(-1);
          z-index: -1;
          display: block;
        `;
        this.videoElement.srcObject = stream;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true; // Prevent echo
        document.body.appendChild(this.videoElement);
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          this.videoElement.addEventListener('loadedmetadata', resolve);
        });
        
        // Force video to play
        try {
          await this.videoElement.play();
          console.log('Video started playing');
        } catch (playError) {
          console.warn('Video autoplay failed:', playError);
        }
        
        console.log('Camera access granted and video ready');
      } catch (cameraError) {
        console.error('Camera access denied:', cameraError);
        this.handleCameraError(cameraError);
        throw new Error(`Camera access required for face tracking: ${cameraError.message}`);
      }

      this.isInitialized = true;
      this.createUI();
      
      // Load any existing calibration data
      const calibrationLoaded = this.loadCalibrationData();
      
      // Show notification if using default calibration
      if (calibrationLoaded && this.calibrationMap.size > 0) {
        this.showCalibrationInfo();
      }
      
      console.log('FaceTracker initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize FaceTracker:', error);
      
      // Check if it's a MediaPipe-specific error
      if (error.message.includes('MediaPipe') || error.message.includes('WASM') || error.message.includes('tasks-vision')) {
        const fallbackError = new Error('MediaPipe Face Landmarker failed to initialize. This might be due to:\n' +
          '• Internet connection issues\n' +
          '• WASM loading problems\n' +
          '• Browser compatibility\n\n' +
          'Please try refreshing the page or using a different browser.');
        this.showErrorMessage(fallbackError.message);
        this.emit('error', fallbackError);
        throw fallbackError;
      }
      
      this.showErrorMessage(error.message);
      this.emit('error', error);
      throw error;
    }
  }

  handleCameraError(error) {
    let message = 'Camera access required for face tracking';
    let troubleshootingTips = [];

    switch (error.name) {
      case 'NotAllowedError':
        message = 'Camera access denied by user';
        troubleshootingTips = [
          '1. Click the camera icon in the browser address bar',
          '2. Select "Allow" for camera access',
          '3. Refresh the page and try again',
          '4. In macOS: Go to System Preferences → Security & Privacy → Camera',
          '5. Make sure your browser is allowed to use the camera'
        ];
        break;
      case 'NotFoundError':
        message = 'No camera found';
        troubleshootingTips = [
          '1. Check if your camera is connected and working',
          '2. Try using a different camera if available',
          '3. Check if camera drivers are installed',
          '4. Restart your browser and try again'
        ];
        break;
      case 'NotReadableError':
        message = 'Camera is being used by another application';
        troubleshootingTips = [
          '1. Close other applications that might be using the camera',
          '2. Close video calling apps (Zoom, Teams, etc.)',
          '3. Restart your browser',
          '4. Restart your computer if the issue persists'
        ];
        break;
      case 'OverconstrainedError':
        message = 'Camera does not support the requested settings';
        troubleshootingTips = [
          '1. Try using a different camera',
          '2. Check if your camera supports the resolution requirements',
          '3. Restart your browser and try again'
        ];
        break;
      default:
        troubleshootingTips = [
          '1. Check camera permissions in browser settings',
          '2. Try refreshing the page',
          '3. Try using a different browser (Chrome, Firefox, Safari)',
          '4. Make sure your browser is up to date'
        ];
    }

    console.error(message, troubleshootingTips);
    this.emit('cameraError', { message, troubleshootingTips });
  }

  async start() {
    if (!this.isInitialized) {
      throw new Error('FaceTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      console.warn('FaceTracker already tracking');
      return;
    }

    try {
      this.isTracking = true;
      this.showUI();
      
      // Ensure video is ready before starting render loop
      if (this.videoElement && this.videoElement.readyState >= 2) {
        this.renderLoop();
        console.log('FaceTracker started');
        this.emit('started');
      } else {
        // Wait for video to be ready
        const waitForVideo = () => {
          if (this.videoElement && this.videoElement.readyState >= 2) {
            this.renderLoop();
            console.log('FaceTracker started');
            this.emit('started');
          } else if (this.isTracking) {
            setTimeout(waitForVideo, 100);
          }
        };
        waitForVideo();
      }
    } catch (error) {
      console.error('Failed to start FaceTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isTracking) {
      console.warn('FaceTracker not currently tracking');
      return;
    }

    try {
      this.isTracking = false;
      this.hideUI();
      
      console.log('FaceTracker stopped');
      this.emit('stopped');
    } catch (error) {
      console.error('Failed to stop FaceTracker:', error);
      this.emit('error', error);
    }
  }

  renderLoop() {
    if (!this.isTracking || !this.faceLandmarker) return;

    const video = this.videoElement;
    const now = performance.now();
    
    // Throttle detection to ~30fps (33ms minimum interval)
    if (video && video.readyState >= 2 && video.currentTime !== this.lastVideoTime && 
        now - this.lastDetectionTime >= 33) {
      try {
        // Ensure video is playing and has valid dimensions
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const results = this.faceLandmarker.detectForVideo(video, now);
          this.handleFaceUpdate(results);
          this.lastVideoTime = video.currentTime;
          this.lastDetectionTime = now;
        }
      } catch (error) {
        console.error('Face detection error:', error);
        // Reduce error spam by slowing down on errors
        setTimeout(() => {
          if (this.isTracking) {
            requestAnimationFrame(this.renderLoop);
          }
        }, 100);
        return;
      }
    }

    if (this.isTracking) {
      requestAnimationFrame(this.renderLoop);
    }
  }

  handleFaceUpdate(results) {
    if (!results || !this.isTracking) return;

    const now = performance.now();
    if (this.lastUpdateTime > 0) {
      const deltaTime = now - this.lastUpdateTime;
      this.updateRate = 1000 / deltaTime;
    }
    this.lastUpdateTime = now;

    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      const landmarks = results.faceLandmarks[0];
      this.currentFaceLandmarks = landmarks;
      
      const attentionData = this.calculateAttentionZone(landmarks);
      
      // Apply smoothing
      const smoothedData = this.applySmoothing(attentionData);
      
      // Calculate confidence based on face visibility
      const confidence = this.calculateConfidence(landmarks);
      
      this.attentionData = {
        x: smoothedData.x,
        y: smoothedData.y,
        radius: smoothedData.radius,
        confidence: confidence,
        timestamp: now
      };

      // Check for quick head movements
      this.checkHeadMovement(smoothedData.x, smoothedData.y, now);

      // Update UI
      this.updateAttentionZone(smoothedData.x, smoothedData.y, smoothedData.radius);
      this.updateConfidenceIndicator(confidence);
      
      // Emit event
      this.emit('attentionUpdate', this.attentionData);
    } else {
      // No face detected
      this.currentFaceLandmarks = null;
      if (this.attentionData.confidence > 0) {
        console.log('Face tracking lost');
        this.emit('trackingLost');
        this.attentionData.confidence = 0;
        this.updateConfidenceIndicator(0);
      }
    }
  }

  calculateAttentionZone(landmarks) {
    // Get current face pose
    const facePose = this.getCurrentFacePose();
    
    if (!facePose) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 200 };
    }

    // Apply calibration mapping if available
    const calibratedPosition = this.applyCalibratedMapping(facePose);
    
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

    return {
      x: Math.max(radius, Math.min(window.innerWidth - radius, calibratedPosition.x)),
      y: Math.max(radius, Math.min(window.innerHeight - radius, calibratedPosition.y)),
      radius: radius
    };
  }

  checkHeadMovement(x, y, timestamp) {
    // Skip if not enough time has passed since initialization
    if (this.previousPosition.timestamp === 0) {
      this.previousPosition = { x, y, timestamp };
      return;
    }

    // Calculate time delta
    const timeDelta = timestamp - this.previousPosition.timestamp;
    if (timeDelta < 50) return; // Skip if too frequent (< 50ms)

    // Calculate distance moved
    const deltaX = x - this.previousPosition.x;
    const deltaY = y - this.previousPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Calculate velocity (pixels per second)
    const velocity = distance / (timeDelta / 1000);
    
    // Check if movement is fast enough and cooldown has passed
    const now = Date.now();
    if (velocity > this.movementVelocityThreshold && 
        now - this.lastMovementEvent > this.movementCooldown) {
      
      console.log(`Quick head movement detected: ${Math.round(velocity)} px/s`);
      this.lastMovementEvent = now;
      
      // Generate random keypress
      const randomKey = this.generateRandomKey();
      this.emit('quickMovement', {
        velocity: velocity,
        position: { x, y },
        randomKey: randomKey
      });
    }
    
    // Update previous position
    this.previousPosition = { x, y, timestamp };
  }

  generateRandomKey() {
    // Character sets for random selection
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Combine all characters with weighted distribution
    const allChars = letters + numbers + symbols.slice(0, 10); // Limit symbols
    
    // Select random character
    const randomIndex = Math.floor(Math.random() * allChars.length);
    return allChars[randomIndex];
  }

  getCurrentFacePose() {
    if (!this.currentFaceLandmarks) return null;
    
    const landmarks = this.currentFaceLandmarks;
    
    // Key facial landmarks for head pose estimation
    const noseTip = landmarks[1]; // Nose tip
    const leftEye = landmarks[33]; // Left eye outer corner
    const rightEye = landmarks[362]; // Right eye outer corner
    const chinCenter = landmarks[175]; // Chin center
    const foreheadCenter = landmarks[9]; // Forehead center
    const leftMouth = landmarks[61]; // Left mouth corner
    const rightMouth = landmarks[291]; // Right mouth corner

    // Calculate face center
    const faceCenterX = (leftEye.x + rightEye.x) / 2;
    const faceCenterY = (leftEye.y + rightEye.y + chinCenter.y + foreheadCenter.y) / 4;

    // Calculate head pose angles
    const headDirection = this.calculateHeadPose(landmarks);
    
    // Return normalized face pose data
    return {
      faceCenter: { x: faceCenterX, y: faceCenterY },
      noseTip: { x: noseTip.x, y: noseTip.y },
      eyeCenter: { x: faceCenterX, y: (leftEye.y + rightEye.y) / 2 },
      headDirection: headDirection,
      landmarks: {
        leftEye: { x: leftEye.x, y: leftEye.y },
        rightEye: { x: rightEye.x, y: rightEye.y },
        noseTip: { x: noseTip.x, y: noseTip.y },
        chinCenter: { x: chinCenter.x, y: chinCenter.y },
        leftMouth: { x: leftMouth.x, y: leftMouth.y },
        rightMouth: { x: rightMouth.x, y: rightMouth.y }
      }
    };
  }

  applyCalibratedMapping(facePose) {
    // If no calibration data, use basic head pose projection
    if (this.calibrationMap.size < 3) {
      const screenX = facePose.faceCenter.x * window.innerWidth;
      const screenY = facePose.faceCenter.y * window.innerHeight;
      
      // Project attention point based on head pose
      const attentionX = screenX + facePose.headDirection.x * 200;
      const attentionY = screenY + facePose.headDirection.y * 200;
      
      return { x: attentionX, y: attentionY };
    }

    // Use calibration mapping for more accurate positioning
    return this.interpolateFromCalibration(facePose);
  }

  interpolateFromCalibration(facePose) {
    const calibrationPoints = Array.from(this.calibrationMap.values());
    
    if (calibrationPoints.length < 3) {
      // Fallback to basic calculation
      const screenX = facePose.faceCenter.x * window.innerWidth;
      const screenY = facePose.faceCenter.y * window.innerHeight;
      return { x: screenX, y: screenY };
    }

    // Find the closest calibration points for interpolation
    const distances = calibrationPoints.map(cal => {
      const dx = facePose.faceCenter.x - cal.faceData.faceCenter.x;
      const dy = facePose.faceCenter.y - cal.faceData.faceCenter.y;
      const noseDx = facePose.noseTip.x - cal.faceData.noseTip.x;
      const noseDy = facePose.noseTip.y - cal.faceData.noseTip.y;
      
      return Math.sqrt(dx*dx + dy*dy + noseDx*noseDx + noseDy*noseDy);
    });

    // Use inverse distance weighting for interpolation
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    for (let i = 0; i < calibrationPoints.length; i++) {
      const distance = distances[i];
      const weight = distance > 0 ? 1 / (distance + 0.001) : 1000; // Avoid division by zero
      
      weightedX += calibrationPoints[i].screenPoint.x * weight;
      weightedY += calibrationPoints[i].screenPoint.y * weight;
      totalWeight += weight;
    }

    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight
    };
  }

  calculateHeadPose(landmarks) {
    // Simple head pose estimation using key landmarks
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[362];
    const chinCenter = landmarks[175];

    // Calculate face orientation
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    };

    // Head direction relative to face center
    const headDirection = {
      x: noseTip.x - eyeCenter.x,
      y: noseTip.y - eyeCenter.y
    };

    // Normalize and scale
    const magnitude = Math.sqrt(headDirection.x * headDirection.x + headDirection.y * headDirection.y);
    return {
      x: (headDirection.x / magnitude) * 2,
      y: (headDirection.y / magnitude) * 2
    };
  }

  calculateConfidence(landmarks) {
    // Calculate confidence based on face visibility and landmark stability
    const visibilityScore = landmarks.length / 478; // 478 is total landmarks
    
    // Check if key landmarks are visible
    const keyLandmarks = [1, 33, 362, 175, 9]; // nose, eyes, chin, forehead
    const keyVisible = keyLandmarks.filter(idx => landmarks[idx]).length / keyLandmarks.length;
    
    // Combine visibility metrics
    const confidence = Math.min(1, (visibilityScore * 0.7 + keyVisible * 0.3));
    return confidence;
  }

  applySmoothing(data) {
    // Add to smoothing buffer
    this.smoothingBuffer.push(data);
    
    // Keep buffer size reasonable
    if (this.smoothingBuffer.length > 5) {
      this.smoothingBuffer.shift();
    }

    // Apply weighted average
    let totalWeight = 0;
    let smoothedX = 0;
    let smoothedY = 0;
    let smoothedRadius = 0;
    
    for (let i = 0; i < this.smoothingBuffer.length; i++) {
      const weight = Math.pow(this.smoothingLevel, this.smoothingBuffer.length - 1 - i);
      smoothedX += this.smoothingBuffer[i].x * weight;
      smoothedY += this.smoothingBuffer[i].y * weight;
      smoothedRadius += this.smoothingBuffer[i].radius * weight;
      totalWeight += weight;
    }
    
    return {
      x: smoothedX / totalWeight,
      y: smoothedY / totalWeight,
      radius: smoothedRadius / totalWeight
    };
  }

  async startCalibration() {
    if (!this.isInitialized) {
      throw new Error('FaceTracker not initialized');
    }

    if (this.isCalibrating) {
      console.warn('Calibration already in progress');
      return;
    }

    this.isCalibrating = true;
    this.currentCalibrationPoint = 0;
    this.calibrationMap.clear();
    this.setupCalibrationPoints();
    this.showCalibrationUI();
    
    console.log('Face tracking calibration started');
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

  setTrackingMode(mode) {
    const validModes = ['precise', 'comfortable', 'relaxed'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid tracking mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }
    
    this.trackingMode = mode;
    console.log(`Tracking mode set to: ${mode}`);
    this.emit('trackingModeChanged', mode);
  }

  getAttentionZone() {
    return {
      x: this.attentionData.x,
      y: this.attentionData.y,
      radius: this.attentionData.radius,
      confidence: this.attentionData.confidence
    };
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
  }

  showUI() {
    if (this.showAttentionZone && this.attentionZone) {
      this.attentionZone.style.display = 'block';
    }
    if (this.showConfidence && this.confidenceIndicator) {
      this.confidenceIndicator.style.display = 'block';
    }
    // Always show video as background
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
    // Keep video visible as background even when UI is hidden
    // if (this.videoElement) {
    //   this.videoElement.style.display = 'none';
    // }
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
        <h2>Face Tracking Calibration</h2>
        <p><strong>Look directly at the red dot</strong></p>
        <p>Keep your head still and click when focused</p>
        <p style="font-size: 18px; color: #ffff00;">Point ${this.currentCalibrationPoint + 1} of ${this.calibrationPoints.length}</p>
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
    const point = this.calibrationPoints[this.currentCalibrationPoint];
    
    // Get current face pose data for calibration
    const currentFaceData = this.getCurrentFacePose();
    
    if (currentFaceData) {
      // Store calibration data point with face pose
      this.calibrationMap.set(this.currentCalibrationPoint, {
        screenPoint: point,
        faceData: currentFaceData
      });
      
      console.log(`Calibration point ${this.currentCalibrationPoint + 1} stored:`, {
        screen: point,
        faceCenter: currentFaceData.faceCenter,
        noseTip: currentFaceData.noseTip,
        headDirection: currentFaceData.headDirection
      });
    } else {
      console.warn('No face detected during calibration point click');
    }
    
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
    
    console.log('Face tracking calibration completed with', this.calibrationMap.size, 'points');
    console.log('Calibration data:', Array.from(this.calibrationMap.values()));
    
    // Save calibration data to localStorage
    this.saveCalibrationData();
    
    // Show calibration success message
    this.showCalibrationSuccess();
    
    this.emit('calibrationComplete');
  }

  showCalibrationSuccess() {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 255, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      text-align: center;
      z-index: 10002;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    
    successDiv.innerHTML = `
      <h3>Calibration Complete!</h3>
      <p>Face tracking is now calibrated to your position.</p>
      <p>Look around to test the attention zone accuracy.</p>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }

  showCalibrationInfo() {
    const isDevelopmentMode = window.location.port === '3001' || window.location.href.includes('localhost');
    const isDefaultCalibration = isDevelopmentMode && !localStorage.getItem('faceTracker_calibration');
    
    if (isDefaultCalibration) {
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 123, 255, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        text-align: center;
        z-index: 10002;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      
      infoDiv.innerHTML = `
        <strong>Development Mode:</strong> Using default calibration<br>
        <small>Press SPACE to recalibrate for your setup</small>
      `;
      
      document.body.appendChild(infoDiv);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        if (infoDiv.parentNode) {
          infoDiv.remove();
        }
      }, 4000);
    }
  }

  saveCalibrationData() {
    try {
      const calibrationData = {
        timestamp: Date.now(),
        points: Array.from(this.calibrationMap.entries())
      };
      localStorage.setItem('faceTracker_calibration', JSON.stringify(calibrationData));
      console.log('Calibration data saved to localStorage');
    } catch (error) {
      console.error('Failed to save calibration data:', error);
    }
  }

  loadCalibrationData() {
    try {
      const saved = localStorage.getItem('faceTracker_calibration');
      if (saved) {
        const calibrationData = JSON.parse(saved);
        this.calibrationMap = new Map(calibrationData.points);
        console.log('Loaded calibration data from localStorage:', this.calibrationMap.size, 'points');
        return true;
      }
    } catch (error) {
      console.error('Failed to load calibration data:', error);
    }
    
    // Load default calibration for development mode
    return this.loadDefaultCalibration();
  }

  loadDefaultCalibration() {
    // Check if we're in development mode (console window vs fullscreen)
    const isDevelopmentMode = window.location.port === '3001' || window.location.href.includes('localhost');
    
    if (isDevelopmentMode) {
      // Default calibration values for npm run dev:eyetracking workflow
      // These are based on a typical development setup with console window
      const defaultCalibrationPoints = [
        [0, {
          screenPoint: { x: 124.5, y: 112.60000000000001 },
          faceData: {
            faceCenter: { x: 0.5502247214317322, y: 0.4544675722718239 },
            noseTip: { x: 0.5944936275482178, y: 0.47204527258872986 },
            headDirection: { x: 0.9997687166012494, y: 1.7321843185139076 }
          }
        }],
        [1, {
          screenPoint: { x: 1120.5, y: 112.60000000000001 },
          faceData: {
            faceCenter: { x: 0.4988580048084259, y: 0.48162125796079636 },
            noseTip: { x: 0.5061836242675781, y: 0.512454628944397 },
            headDirection: { x: 0.15977421023224472, y: 1.9936078354943991 }
          }
        }],
        [2, {
          screenPoint: { x: 622.5, y: 563 },
          faceData: {
            faceCenter: { x: 0.5345018059015274, y: 0.5277667865157127 },
            noseTip: { x: 0.5685189962387085, y: 0.5801661014556885 },
            headDirection: { x: 0.5398392266425879, y: 1.92576572027283 }
          }
        }],
        [3, {
          screenPoint: { x: 124.5, y: 1013.4 },
          faceData: {
            faceCenter: { x: 0.5757335424423218, y: 0.6005130559206009 },
            noseTip: { x: 0.6277220845222473, y: 0.6659359931945801 },
            headDirection: { x: 0.7353668168014068, y: 1.8599020524606575 }
          }
        }],
        [4, {
          screenPoint: { x: 1120.5, y: 1013.4 },
          faceData: {
            faceCenter: { x: 0.4771008640527725, y: 0.5838421583175659 },
            noseTip: { x: 0.4809936583042145, y: 0.6551327705383301 },
            headDirection: { x: 0.05464630026328456, y: 1.9992533060789306 }
          }
        }]
      ];

      this.calibrationMap = new Map(defaultCalibrationPoints);
      console.log('Loaded default calibration data for development mode:', this.calibrationMap.size, 'points');
      return true;
    }
    
    return false;
  }

  clearCalibrationData() {
    this.calibrationMap.clear();
    localStorage.removeItem('faceTracker_calibration');
    console.log('Calibration data cleared');
  }

  isReadyForTracking() {
    return this.isInitialized && this.isTracking && !this.isCalibrating;
  }

  getUpdateRate() {
    return this.updateRate;
  }

  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'face-tracker-error';
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
      <h3>Face Tracking Error</h3>
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
    
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
    }
    
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.remove();
    }
    
    // Clean up UI
    if (this.attentionZone) {
      this.attentionZone.remove();
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
    
    console.log('FaceTracker disposed');
    this.emit('disposed');
  }
}

export default FaceTracker;