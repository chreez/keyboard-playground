// Import MediaPipe Hand Landmarker with dynamic import to avoid build issues
let HandLandmarker;
let FilesetResolver;

async function loadMediaPipeHands() {
  if (!HandLandmarker) {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      HandLandmarker = vision.HandLandmarker;
      FilesetResolver = vision.FilesetResolver;
      console.log('MediaPipe Hand Landmarker loaded successfully');
    } catch (error) {
      console.error('Failed to load MediaPipe Hand Landmarker:', error);
      throw new Error('MediaPipe library not available. Please check your internet connection.');
    }
  }
  return { HandLandmarker, FilesetResolver };
}

class HandTracker {
  constructor() {
    this.isInitialized = false;
    this.isTracking = false;
    this.eventListeners = {};
    this.currentHands = [];
    this.currentGestures = [];
    this.smoothingBuffer = [];
    this.smoothingLevel = 0.7;
    this.showLandmarks = false; // Debug feature - off by default
    this.gestureMode = 'basic'; // 'basic', 'advanced'
    
    // MediaPipe components
    this.handLandmarker = null;
    this.vision = null;
    this.videoElement = null;
    
    // DOM elements
    this.handOverlay = null;
    this.gestureIndicator = null;
    
    // Performance tracking
    this.lastUpdateTime = 0;
    this.updateRate = 0;
    this.lastVideoTime = -1;
    this.lastDetectionTime = 0;
    
    // Gesture recognition
    this.gestureHistory = [];
    this.gestureThreshold = 0.7;
    this.gestureStabilityFrames = 5;
    
    // Configuration
    this.config = {
      maxHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    };

    // Trail effect configuration
    this.trailEnabled = true; // On by default for better visual feedback
    this.trailConfig = {
      maxLength: 15,
      fadeDuration: 600, // ms
      particleSize: 8,
      color: '#A7FF83',
      style: 'circles', // 'circles', 'emojis', 'sparkles'
      velocityMultiplier: 1.5
    };
    
    // Trail state
    this.trailHistory = new Map(); // Map of hand ID to trail positions
    this.lastTrailUpdate = 0;
    
    // Hand landmark indices
    this.LANDMARKS = {
      WRIST: 0,
      THUMB_CMC: 1,
      THUMB_MCP: 2,
      THUMB_IP: 3,
      THUMB_TIP: 4,
      INDEX_MCP: 5,
      INDEX_PIP: 6,
      INDEX_DIP: 7,
      INDEX_TIP: 8,
      MIDDLE_MCP: 9,
      MIDDLE_PIP: 10,
      MIDDLE_DIP: 11,
      MIDDLE_TIP: 12,
      RING_MCP: 13,
      RING_PIP: 14,
      RING_DIP: 15,
      RING_TIP: 16,
      PINKY_MCP: 17,
      PINKY_PIP: 18,
      PINKY_DIP: 19,
      PINKY_TIP: 20
    };
    
    // Bind methods
    this.handleHandUpdate = this.handleHandUpdate.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  async init(options = {}) {
    if (this.isInitialized) {
      console.warn('HandTracker already initialized');
      return;
    }

    // Set options
    this.showLandmarks = options.showLandmarks !== false;
    this.gestureMode = options.gestureMode || 'basic';
    this.config.maxHands = options.maxHands || 2;
    this.config.minDetectionConfidence = options.minDetectionConfidence || 0.5;
    this.config.minTrackingConfidence = options.minTrackingConfidence || 0.5;

    try {
      // Load MediaPipe Hand Landmarker
      console.log('Loading MediaPipe Hand Landmarker...');
      const { HandLandmarker: HL, FilesetResolver: FR } = await loadMediaPipeHands();
      
      // Initialize MediaPipe vision with proper WASM path
      console.log('Initializing MediaPipe vision...');
      this.vision = await FR.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      console.log('MediaPipe vision initialized');
      
      // Create hand landmarker
      console.log('Creating hand landmarker...');
      this.handLandmarker = await HL.createFromOptions(this.vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: this.config.maxHands,
        minHandDetectionConfidence: this.config.minDetectionConfidence,
        minHandPresenceConfidence: this.config.minTrackingConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence
      });
      console.log('Hand landmarker created successfully');

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
          z-index: 0;
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
        throw new Error(`Camera access required for hand tracking: ${cameraError.message}`);
      }

      this.isInitialized = true;
      this.createUI();
      
      // Add resize event listener
      window.addEventListener('resize', this.handleResize);
      
      console.log('HandTracker initialized successfully');
      this.emit('initialized');
      
      // Auto-start tracking after initialization
      await this.start();
      console.log('HandTracker auto-started tracking');
    } catch (error) {
      console.error('Failed to initialize HandTracker:', error);
      
      // Check if it's a MediaPipe-specific error
      if (error.message.includes('MediaPipe') || error.message.includes('WASM') || error.message.includes('tasks-vision')) {
        const fallbackError = new Error('MediaPipe Hand Landmarker failed to initialize. This might be due to:\n' +
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
    let message = 'Camera access required for hand tracking';
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
      throw new Error('HandTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      console.warn('HandTracker already tracking');
      return;
    }

    try {
      this.isTracking = true;
      this.showUI();
      
      // Ensure video is ready before starting render loop
      if (this.videoElement && this.videoElement.readyState >= 2) {
        this.renderLoop();
        console.log('HandTracker started');
        this.emit('started');
      } else {
        // Wait for video to be ready
        const waitForVideo = () => {
          if (this.videoElement && this.videoElement.readyState >= 2) {
            this.renderLoop();
            console.log('HandTracker started');
            this.emit('started');
          } else if (this.isTracking) {
            setTimeout(waitForVideo, 100);
          }
        };
        waitForVideo();
      }
    } catch (error) {
      console.error('Failed to start HandTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isTracking) {
      console.warn('HandTracker not currently tracking');
      return;
    }

    try {
      this.isTracking = false;
      this.hideUI();
      
      // Clear current data
      this.currentHands = [];
      this.currentGestures = [];
      this.gestureHistory = [];
      
      console.log('HandTracker stopped');
      this.emit('stopped');
    } catch (error) {
      console.error('Failed to stop HandTracker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  renderLoop() {
    if (!this.isTracking || !this.videoElement) {
      return;
    }

    const video = this.videoElement;
    const now = performance.now();

    // Skip if video hasn't updated or too soon since last detection
    if (video.currentTime === this.lastVideoTime || now - this.lastDetectionTime < 33) {
      requestAnimationFrame(this.renderLoop);
      return;
    }

    try {
      // Ensure video is playing and has valid dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const results = this.handLandmarker.detectForVideo(video, now);
        this.handleHandUpdate(results);
        this.lastVideoTime = video.currentTime;
        this.lastDetectionTime = now;
      }
    } catch (error) {
      console.error('Hand detection error:', error);
      // Reduce error spam by slowing down on errors
      setTimeout(() => {
        if (this.isTracking) {
          requestAnimationFrame(this.renderLoop);
        }
      }, 100);
      return;
    }

    if (this.isTracking) {
      requestAnimationFrame(this.renderLoop);
    }
  }

  handleHandUpdate(results) {
    if (!results || !this.isTracking) return;

    const now = performance.now();
    if (this.lastUpdateTime > 0) {
      const deltaTime = now - this.lastUpdateTime;
      this.updateRate = 1000 / deltaTime;
    }
    this.lastUpdateTime = now;

    // Process hand landmarks
    this.currentHands = [];
    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const handedness = results.handednesses[i];
        
        const hand = {
          landmarks: landmarks,
          handedness: handedness[0].categoryName.toLowerCase(), // 'left' or 'right'
          confidence: handedness[0].score,
          gestures: this.recognizeGestures(landmarks, handedness[0].categoryName.toLowerCase())
        };
        
        this.currentHands.push(hand);
      }
      
      // Update gesture recognition
      this.updateGestureRecognition();
      
      // Update trail effect
      if (this.trailEnabled) {
        this.updateTrailHistory();
      }
      
      // Update UI
      this.updateUI();
      
      // Emit events
      this.emit('handsDetected', this.currentHands);
      this.emit('gesturesDetected', this.currentGestures);
    } else {
      // No hands detected
      if (this.currentHands.length > 0) {
        this.currentHands = [];
        this.currentGestures = [];
        this.emit('handsLost');
      }
      
      // Still need to update trail effects even when no hands detected (for fading)
      if (this.trailEnabled && this.trailHistory.size > 0) {
        this.updateTrailHistory(); // Clean up old trail points
        this.updateUI(); // Redraw with fading trails
      }
    }
  }

  recognizeGestures(landmarks, handedness) {
    const gestures = [];
    
    // Basic gestures (always active)
    const basicGestures = [
      { detect: this.detectPointing, type: 'pointing', props: ['direction'] },
      { detect: this.detectPinching, type: 'pinching', props: ['strength'] },
      { detect: this.detectThumbsUp, type: 'thumbsUp', props: [] },
      { detect: this.detectPeaceSign, type: 'peaceSign', props: [] },
      { detect: this.detectOpenPalm, type: 'openPalm', props: [] },
      { detect: this.detectClosedFist, type: 'closedFist', props: [] }
    ];
    
    // Process basic gestures
    for (const gesture of basicGestures) {
      const result = gesture.detect.call(this, landmarks);
      if (result.confidence > this.gestureThreshold) {
        const gestureData = {
          type: gesture.type,
          confidence: result.confidence,
          hand: handedness
        };
        
        // Add additional properties if they exist
        for (const prop of gesture.props) {
          if (result[prop] !== undefined) {
            gestureData[prop] = result[prop];
          }
        }
        
        gestures.push(gestureData);
      }
    }
    
    // Advanced gestures (only in advanced mode)
    if (this.gestureMode === 'advanced') {
      // Number gestures
      const numberGesture = this.detectNumberGesture(landmarks);
      if (numberGesture.confidence > this.gestureThreshold) {
        gestures.push({
          type: 'number',
          confidence: numberGesture.confidence,
          hand: handedness,
          number: numberGesture.number
        });
      }
      
      // Index + Middle combination
      const indexMiddleGesture = this.detectIndexMiddleCombination(landmarks);
      if (indexMiddleGesture.confidence > this.gestureThreshold) {
        gestures.push({
          type: 'indexMiddle',
          confidence: indexMiddleGesture.confidence,
          hand: handedness
        });
      }
    }
    
    return gestures;
  }

  detectPointing(landmarks) {
    // Index finger extended, others folded
    const indexExtended = this.isFingerExtended(landmarks, 'index');
    const middleFolded = !this.isFingerExtended(landmarks, 'middle');
    const ringFolded = !this.isFingerExtended(landmarks, 'ring');
    const pinkyFolded = !this.isFingerExtended(landmarks, 'pinky');
    
    const confidence = indexExtended && middleFolded && ringFolded && pinkyFolded ? 0.9 : 0.0;
    
    // Calculate pointing direction (mirror x-axis for display)
    const direction = {
      x: -(landmarks[this.LANDMARKS.INDEX_TIP].x - landmarks[this.LANDMARKS.INDEX_MCP].x), // Mirror x direction
      y: landmarks[this.LANDMARKS.INDEX_TIP].y - landmarks[this.LANDMARKS.INDEX_MCP].y
    };
    
    return { confidence, direction };
  }

  detectPinching(landmarks) {
    // Distance between thumb tip and index tip
    const thumbTip = landmarks[this.LANDMARKS.THUMB_TIP];
    const indexTip = landmarks[this.LANDMARKS.INDEX_TIP];
    
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + 
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    
    // Pinching threshold (normalized coordinates)
    const pinchThreshold = 0.05;
    const confidence = distance < pinchThreshold ? 1.0 - (distance / pinchThreshold) : 0.0;
    const strength = Math.max(0, 1.0 - (distance / pinchThreshold));
    
    return { confidence, strength };
  }

  detectThumbsUp(landmarks) {
    // Thumb extended upward, other fingers folded
    const thumbExtended = this.isFingerExtended(landmarks, 'thumb');
    const indexFolded = !this.isFingerExtended(landmarks, 'index');
    const middleFolded = !this.isFingerExtended(landmarks, 'middle');
    const ringFolded = !this.isFingerExtended(landmarks, 'ring');
    const pinkyFolded = !this.isFingerExtended(landmarks, 'pinky');
    
    // Check if thumb is pointing upward
    const thumbUp = landmarks[this.LANDMARKS.THUMB_TIP].y < landmarks[this.LANDMARKS.THUMB_MCP].y;
    
    const confidence = thumbExtended && indexFolded && middleFolded && ringFolded && pinkyFolded && thumbUp ? 0.9 : 0.0;
    
    return { confidence };
  }

  detectPeaceSign(landmarks) {
    // Index and middle fingers extended, others folded
    const indexExtended = this.isFingerExtended(landmarks, 'index');
    const middleExtended = this.isFingerExtended(landmarks, 'middle');
    const ringFolded = !this.isFingerExtended(landmarks, 'ring');
    const pinkyFolded = !this.isFingerExtended(landmarks, 'pinky');
    
    const confidence = indexExtended && middleExtended && ringFolded && pinkyFolded ? 0.9 : 0.0;
    
    return { confidence };
  }

  detectOpenPalm(landmarks) {
    // All fingers extended
    const thumbExtended = this.isFingerExtended(landmarks, 'thumb');
    const indexExtended = this.isFingerExtended(landmarks, 'index');
    const middleExtended = this.isFingerExtended(landmarks, 'middle');
    const ringExtended = this.isFingerExtended(landmarks, 'ring');
    const pinkyExtended = this.isFingerExtended(landmarks, 'pinky');
    
    const confidence = thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended ? 0.9 : 0.0;
    
    return { confidence };
  }

  detectClosedFist(landmarks) {
    // All fingers folded
    const thumbFolded = !this.isFingerExtended(landmarks, 'thumb');
    const indexFolded = !this.isFingerExtended(landmarks, 'index');
    const middleFolded = !this.isFingerExtended(landmarks, 'middle');
    const ringFolded = !this.isFingerExtended(landmarks, 'ring');
    const pinkyFolded = !this.isFingerExtended(landmarks, 'pinky');
    
    const confidence = thumbFolded && indexFolded && middleFolded && ringFolded && pinkyFolded ? 0.9 : 0.0;
    
    return { confidence };
  }

  // Advanced gesture detection methods
  detectNumberGesture(landmarks) {
    // Count extended fingers
    const fingers = [
      this.isFingerExtended(landmarks, 'thumb'),
      this.isFingerExtended(landmarks, 'index'),
      this.isFingerExtended(landmarks, 'middle'),
      this.isFingerExtended(landmarks, 'ring'),
      this.isFingerExtended(landmarks, 'pinky')
    ];
    
    const extendedCount = fingers.filter(f => f).length;
    
    // Only recognize numbers 1-5
    if (extendedCount >= 1 && extendedCount <= 5) {
      // Higher confidence for clear number patterns
      let confidence = 0.7;
      
      // Special cases for higher confidence
      if (extendedCount === 1 && fingers[1]) { // Index finger only
        confidence = 0.9;
      } else if (extendedCount === 2 && fingers[1] && fingers[2]) { // Index and middle
        confidence = 0.9;
      } else if (extendedCount === 5) { // All fingers
        confidence = 0.9;
      }
      
      return { confidence, number: extendedCount };
    }
    
    return { confidence: 0.0, number: 0 };
  }

  detectIndexMiddleCombination(landmarks) {
    // Index and middle fingers extended, others folded
    const indexExtended = this.isFingerExtended(landmarks, 'index');
    const middleExtended = this.isFingerExtended(landmarks, 'middle');
    const thumbFolded = !this.isFingerExtended(landmarks, 'thumb');
    const ringFolded = !this.isFingerExtended(landmarks, 'ring');
    const pinkyFolded = !this.isFingerExtended(landmarks, 'pinky');
    
    const confidence = indexExtended && middleExtended && thumbFolded && ringFolded && pinkyFolded ? 0.8 : 0.0;
    
    return { confidence };
  }

  isFingerExtended(landmarks, finger) {
    let tipIndex, pipIndex, mcpIndex;
    
    switch (finger) {
      case 'thumb':
        tipIndex = this.LANDMARKS.THUMB_TIP;
        pipIndex = this.LANDMARKS.THUMB_IP;
        mcpIndex = this.LANDMARKS.THUMB_MCP;
        break;
      case 'index':
        tipIndex = this.LANDMARKS.INDEX_TIP;
        pipIndex = this.LANDMARKS.INDEX_PIP;
        mcpIndex = this.LANDMARKS.INDEX_MCP;
        break;
      case 'middle':
        tipIndex = this.LANDMARKS.MIDDLE_TIP;
        pipIndex = this.LANDMARKS.MIDDLE_PIP;
        mcpIndex = this.LANDMARKS.MIDDLE_MCP;
        break;
      case 'ring':
        tipIndex = this.LANDMARKS.RING_TIP;
        pipIndex = this.LANDMARKS.RING_PIP;
        mcpIndex = this.LANDMARKS.RING_MCP;
        break;
      case 'pinky':
        tipIndex = this.LANDMARKS.PINKY_TIP;
        pipIndex = this.LANDMARKS.PINKY_PIP;
        mcpIndex = this.LANDMARKS.PINKY_MCP;
        break;
      default:
        return false;
    }
    
    const tip = landmarks[tipIndex];
    const pip = landmarks[pipIndex];
    const mcp = landmarks[mcpIndex];
    
    // For thumb, check if tip is farther from wrist than MCP
    if (finger === 'thumb') {
      const wrist = landmarks[this.LANDMARKS.WRIST];
      const tipDistance = Math.sqrt(Math.pow(tip.x - wrist.x, 2) + Math.pow(tip.y - wrist.y, 2));
      const mcpDistance = Math.sqrt(Math.pow(mcp.x - wrist.x, 2) + Math.pow(mcp.y - wrist.y, 2));
      return tipDistance > mcpDistance;
    }
    
    // For other fingers, check if tip is above PIP and PIP is above MCP
    return tip.y < pip.y && pip.y < mcp.y;
  }

  updateGestureRecognition() {
    // Collect all gestures from all hands
    const allGestures = [];
    for (const hand of this.currentHands) {
      for (const gesture of hand.gestures) {
        allGestures.push({
          ...gesture,
          position: this.getHandCenter(hand.landmarks)
        });
      }
    }
    
    // Add to gesture history for stability
    this.gestureHistory.push(allGestures);
    if (this.gestureHistory.length > this.gestureStabilityFrames) {
      this.gestureHistory.shift();
    }
    
    // Determine stable gestures
    this.currentGestures = this.getStableGestures();
  }

  getStableGestures() {
    if (this.gestureHistory.length < this.gestureStabilityFrames) {
      return [];
    }
    
    const stableGestures = [];
    const gestureTypes = ['pointing', 'pinching', 'thumbsUp', 'peaceSign', 'openPalm', 'closedFist'];
    
    for (const gestureType of gestureTypes) {
      let consistentCount = 0;
      let totalConfidence = 0;
      let lastGesture = null;
      
      for (const frameGestures of this.gestureHistory) {
        const gesture = frameGestures.find(g => g.type === gestureType);
        if (gesture && gesture.confidence > this.gestureThreshold) {
          consistentCount++;
          totalConfidence += gesture.confidence;
          lastGesture = gesture;
        }
      }
      
      if (consistentCount >= this.gestureStabilityFrames * 0.8 && lastGesture) {
        stableGestures.push({
          ...lastGesture,
          confidence: totalConfidence / consistentCount
        });
      }
    }
    
    return stableGestures;
  }

  getHandCenter(landmarks) {
    const wrist = landmarks[this.LANDMARKS.WRIST];
    const middleMcp = landmarks[this.LANDMARKS.MIDDLE_MCP];
    
    return {
      x: (1 - (wrist.x + middleMcp.x) / 2) * window.innerWidth, // Mirror x-coordinate
      y: (wrist.y + middleMcp.y) / 2 * window.innerHeight
    };
  }

  // API methods
  getHands() {
    return this.currentHands;
  }

  getCurrentGestures() {
    return this.currentGestures;
  }

  isPointing() {
    const pointingGesture = this.currentGestures.find(g => g.type === 'pointing');
    return {
      pointing: !!pointingGesture,
      direction: pointingGesture ? pointingGesture.direction : { x: 0, y: 0 }
    };
  }

  getPinchStrength() {
    const pinchGesture = this.currentGestures.find(g => g.type === 'pinching');
    return pinchGesture ? pinchGesture.strength : 0;
  }

  getFingerPositions(hand) {
    if (!hand || !hand.landmarks) return [];
    
    return [
      { x: (1 - hand.landmarks[this.LANDMARKS.THUMB_TIP].x) * window.innerWidth, y: hand.landmarks[this.LANDMARKS.THUMB_TIP].y * window.innerHeight },
      { x: (1 - hand.landmarks[this.LANDMARKS.INDEX_TIP].x) * window.innerWidth, y: hand.landmarks[this.LANDMARKS.INDEX_TIP].y * window.innerHeight },
      { x: (1 - hand.landmarks[this.LANDMARKS.MIDDLE_TIP].x) * window.innerWidth, y: hand.landmarks[this.LANDMARKS.MIDDLE_TIP].y * window.innerHeight },
      { x: (1 - hand.landmarks[this.LANDMARKS.RING_TIP].x) * window.innerWidth, y: hand.landmarks[this.LANDMARKS.RING_TIP].y * window.innerHeight },
      { x: (1 - hand.landmarks[this.LANDMARKS.PINKY_TIP].x) * window.innerWidth, y: hand.landmarks[this.LANDMARKS.PINKY_TIP].y * window.innerHeight }
    ];
  }

  createUI() {
    // Create hand overlay for landmarks
    this.handOverlay = document.createElement('canvas');
    this.handOverlay.id = 'hand-tracker-overlay';
    this.handOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 100;
      display: none;
    `;
    this.handOverlay.width = window.innerWidth;
    this.handOverlay.height = window.innerHeight;
    document.body.appendChild(this.handOverlay);

    // Create gesture indicator
    this.gestureIndicator = document.createElement('div');
    this.gestureIndicator.id = 'hand-tracker-gesture-indicator';
    this.gestureIndicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 1000;
      display: none;
    `;
    document.body.appendChild(this.gestureIndicator);
  }

  showUI() {
    if (this.handOverlay) {
      this.handOverlay.style.display = this.showLandmarks ? 'block' : 'none';
    }
    if (this.gestureIndicator) {
      this.gestureIndicator.style.display = 'block';
    }
  }

  hideUI() {
    if (this.handOverlay) {
      this.handOverlay.style.display = 'none';
    }
    if (this.gestureIndicator) {
      this.gestureIndicator.style.display = 'none';
    }
  }

  toggleLandmarks() {
    this.showLandmarks = !this.showLandmarks;
    if (this.handOverlay) {
      this.handOverlay.style.display = this.showLandmarks ? 'block' : 'none';
    }
  }

  toggleGestureMode() {
    this.gestureMode = this.gestureMode === 'basic' ? 'advanced' : 'basic';
    console.log('Gesture mode changed to:', this.gestureMode);
    this.emit('gestureModeChanged', this.gestureMode);
  }

  toggleTrail() {
    this.trailEnabled = !this.trailEnabled;
    if (!this.trailEnabled) {
      this.clearTrail();
    }
    console.log('Trail effect toggled:', this.trailEnabled);
    this.emit('trailToggled', this.trailEnabled);
  }

  setTrailConfig(config) {
    this.trailConfig = { ...this.trailConfig, ...config };
    console.log('Trail config updated:', this.trailConfig);
  }

  getTrailConfig() {
    return { ...this.trailConfig };
  }

  clearTrail() {
    this.trailHistory.clear();
    console.log('Trail history cleared');
  }

  updateUI() {
    this.drawOverlay();
    this.updateGestureIndicator();
  }

  updateTrailHistory() {
    const now = performance.now();
    
    // Update trail for each currently detected hand
    for (const hand of this.currentHands) {
      const handId = hand.handedness; // Use handedness as ID
      const handCenter = this.getHandCenter(hand.landmarks);
      
      // Calculate velocity for trail effects
      let velocity = 0;
      if (this.trailHistory.has(handId)) {
        const history = this.trailHistory.get(handId);
        if (history.length > 0) {
          const lastPos = history[history.length - 1];
          const deltaTime = now - lastPos.timestamp;
          const deltaX = handCenter.x - lastPos.x;
          const deltaY = handCenter.y - lastPos.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          velocity = deltaTime > 0 ? distance / deltaTime : 0;
        }
      }
      
      // Add current position to trail
      const trailPoint = {
        x: handCenter.x,
        y: handCenter.y,
        timestamp: now,
        velocity: velocity
      };
      
      if (!this.trailHistory.has(handId)) {
        this.trailHistory.set(handId, []);
      }
      
      const trail = this.trailHistory.get(handId);
      trail.push(trailPoint);
      
      // Remove old trail points beyond max length
      if (trail.length > this.trailConfig.maxLength) {
        trail.shift();
      }
      
      // Remove trail points older than fade duration
      const maxAge = this.trailConfig.fadeDuration;
      while (trail.length > 0 && (now - trail[0].timestamp) > maxAge) {
        trail.shift();
      }
    }
    
    // Remove trails for hands that are no longer detected
    const activeHandIds = new Set(this.currentHands.map(h => h.handedness));
    for (const handId of this.trailHistory.keys()) {
      if (!activeHandIds.has(handId)) {
        // Keep fading trail for a short time even after hand disappears
        const trail = this.trailHistory.get(handId);
        if (trail.length === 0) {
          // If trail is empty, remove it immediately
          this.trailHistory.delete(handId);
        } else {
          const oldestTimestamp = trail[0].timestamp;
          if (now - oldestTimestamp > this.trailConfig.fadeDuration) {
            this.trailHistory.delete(handId);
          }
        }
      }
    }
  }

  drawOverlay() {
    if (!this.handOverlay) return;

    const canvas = this.handOverlay;
    const ctx = canvas.getContext('2d');
    
    // Always clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw trail effects first (behind landmarks) - independent of landmark visibility
    if (this.trailEnabled) {
      console.log('Drawing trail effects, trail history size:', this.trailHistory.size);
      this.drawTrailEffects(ctx);
    }
    
    // Draw landmarks only if enabled
    if (this.showLandmarks) {
      this.drawHandLandmarks(ctx);
    }
  }

  drawHandLandmarks(ctx) {
    // Draw each hand
    for (const hand of this.currentHands) {
      this.drawHand(ctx, hand);
    }
  }

  drawTrailEffects(ctx) {
    const now = performance.now();
    
    // Draw trail for each hand
    for (const [handId, trail] of this.trailHistory) {
      if (trail.length < 2) continue; // Need at least 2 points for trail
      
      console.log(`Drawing trail for ${handId} hand with ${trail.length} points`);
      
      const handColor = handId === 'left' ? '#ff6b6b' : '#4ecdc4';
      const trailColor = this.trailConfig.color;
      
      // Draw trail particles
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const age = now - point.timestamp;
        const maxAge = this.trailConfig.fadeDuration;
        
        // Calculate opacity based on age (newer = more opaque)
        const opacity = Math.max(0, 1 - (age / maxAge));
        if (opacity <= 0) continue;
        
        // Calculate size based on velocity and age
        const velocityMultiplier = 1 + (point.velocity * this.trailConfig.velocityMultiplier * 0.001);
        const baseSize = this.trailConfig.particleSize;
        const size = baseSize * velocityMultiplier * opacity;
        
        // Draw particle based on style
        ctx.globalAlpha = opacity;
        
        switch (this.trailConfig.style) {
          case 'circles':
            this.drawCircleParticle(ctx, point.x, point.y, size, trailColor);
            break;
          case 'emojis':
            this.drawEmojiParticle(ctx, point.x, point.y, size, handId);
            break;
          case 'sparkles':
            this.drawSparkleParticle(ctx, point.x, point.y, size, trailColor);
            break;
          default:
            this.drawCircleParticle(ctx, point.x, point.y, size, trailColor);
        }
      }
      
      // Reset global alpha
      ctx.globalAlpha = 1.0;
    }
  }

  drawCircleParticle(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add subtle glow effect
    ctx.shadowBlur = size;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawEmojiParticle(ctx, x, y, size, handId) {
    const emoji = handId === 'left' ? '✨' : '🌟';
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
  }

  drawSparkleParticle(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size / 4;
    ctx.lineCap = 'round';
    
    // Draw sparkle as crossing lines
    const half = size / 2;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - half, y);
    ctx.lineTo(x + half, y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - half);
    ctx.lineTo(x, y + half);
    ctx.stroke();
    
    // Diagonal lines
    const diag = half * 0.7;
    ctx.beginPath();
    ctx.moveTo(x - diag, y - diag);
    ctx.lineTo(x + diag, y + diag);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - diag, y + diag);
    ctx.lineTo(x + diag, y - diag);
    ctx.stroke();
  }

  drawHand(ctx, hand) {
    const landmarks = hand.landmarks;
    const color = hand.handedness === 'left' ? '#ff6b6b' : '#4ecdc4';
    
    // Draw landmarks
    ctx.fillStyle = color;
    for (const landmark of landmarks) {
      const x = (1 - landmark.x) * window.innerWidth; // Mirror x-coordinate
      const y = landmark.y * window.innerHeight;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    this.drawHandConnections(ctx, landmarks);
    
    // Draw gesture indicators
    for (const gesture of hand.gestures) {
      this.drawGestureIndicator(ctx, gesture, hand);
    }
  }

  drawHandConnections(ctx, landmarks) {
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20]
    ];
    
    for (const [start, end] of connections) {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo((1 - startPoint.x) * window.innerWidth, startPoint.y * window.innerHeight);
      ctx.lineTo((1 - endPoint.x) * window.innerWidth, endPoint.y * window.innerHeight);
      ctx.stroke();
    }
  }

  drawGestureIndicator(ctx, gesture, hand) {
    const center = this.getHandCenter(hand.landmarks);
    const radius = 30;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${gesture.confidence * 0.8})`;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw gesture name
    ctx.fillText(gesture.type, center.x, center.y - radius - 10);
    
    // Draw confidence circle
    ctx.strokeStyle = `rgba(255, 255, 255, ${gesture.confidence})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI * gesture.confidence);
    ctx.stroke();
  }

  updateGestureIndicator() {
    if (!this.gestureIndicator) return;
    
    if (this.currentGestures.length > 0) {
      const gestureTexts = this.currentGestures.map(g => 
        `${g.type} (${g.hand}, ${Math.round(g.confidence * 100)}%)`
      );
      this.gestureIndicator.textContent = gestureTexts.join(' | ');
      this.gestureIndicator.style.display = 'block';
    } else {
      this.gestureIndicator.style.display = 'none';
    }
  }

  showErrorMessage(message) {
    console.error('HandTracker Error:', message);
    // Could show UI error message here
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


  getUpdateRate() {
    return this.updateRate;
  }

  handleResize() {
    // Throttle resize events to avoid excessive processing
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      this.updateCanvasSize();
      this.emit('resize', this.getScreenDimensions());
    }, 100);
  }

  updateCanvasSize() {
    if (this.handOverlay) {
      this.handOverlay.width = window.innerWidth;
      this.handOverlay.height = window.innerHeight;
      this.handOverlay.style.width = '100vw';
      this.handOverlay.style.height = '100vh';
    }
  }

  getScreenDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  dispose() {
    this.stop();
    
    // Remove resize event listener
    window.removeEventListener('resize', this.handleResize);
    
    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Clean up DOM elements
    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }
    
    if (this.handOverlay) {
      this.handOverlay.remove();
      this.handOverlay = null;
    }
    
    if (this.gestureIndicator) {
      this.gestureIndicator.remove();
      this.gestureIndicator = null;
    }
    
    // Clean up MediaPipe
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    
    this.isInitialized = false;
    this.eventListeners = {};
  }
}

export default HandTracker;