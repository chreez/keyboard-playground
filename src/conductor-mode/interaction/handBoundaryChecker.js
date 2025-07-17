export class HandBoundaryChecker {
  constructor(options = {}) {
    // Boundary configuration
    this.boundaries = options.boundaries || {
      left: 0.1,    // 10% from left edge
      right: 0.9,   // 10% from right edge
      top: 0.1,     // 10% from top edge
      bottom: 0.9   // 10% from bottom edge
    };
    
    // Confidence thresholds
    this.minConfidence = options.minConfidence || 0.8;
    this.landmarkConfidenceThreshold = options.landmarkConfidenceThreshold || 0.7;
    
    // Tracking state
    this.handStates = new Map(); // handId -> state
    this.transitionCooldown = options.transitionCooldown || 200; // ms
    
    // Visual feedback
    this.showBoundaries = options.showBoundaries || false;
    this.boundaryVisualizer = null;
    
    // Hand tracking history for stability
    this.handHistory = new Map(); // handId -> history array
    this.historySize = options.historySize || 5;
    this.stabilityThreshold = options.stabilityThreshold || 0.7;
    
    // Events
    this.eventListeners = {
      handEnterBounds: [],
      handLeaveBounds: [],
      handBoundsWarning: [],
      confidenceChanged: []
    };
  }
  
  // Main method to check if hand is in bounds
  isHandInBounds(hand) {
    if (!hand || !hand.landmarks || hand.landmarks.length === 0) {
      return false;
    }
    
    const handId = this.getHandId(hand);
    const currentState = this.handStates.get(handId) || this.createInitialHandState(handId);
    
    // Check all landmarks are within boundaries
    const allInBounds = this.checkAllLandmarksInBounds(hand.landmarks);
    
    // Check confidence
    const confidence = this.getHandConfidence(hand);
    const highConfidence = confidence >= this.minConfidence;
    
    // Combine checks
    const inBounds = allInBounds && highConfidence;
    
    // Update hand state
    this.updateHandState(handId, hand, inBounds, confidence);
    
    // Use stability check for final result
    return this.getStableHandState(handId);
  }
  
  // Get hand confidence score
  getHandConfidence(hand) {
    if (!hand.landmarks || hand.landmarks.length === 0) {
      return 0;
    }
    
    // Method 1: Use landmark visibility if available
    if (hand.landmarks[0] && typeof hand.landmarks[0].visibility === 'number') {
      return this.calculateVisibilityConfidence(hand.landmarks);
    }
    
    // Method 2: Use hand.score if available (from some hand tracking systems)
    if (typeof hand.score === 'number') {
      return hand.score;
    }
    
    // Method 3: Use hand.confidence if available
    if (typeof hand.confidence === 'number') {
      return hand.confidence;
    }
    
    // Method 4: Calculate based on landmark consistency
    return this.calculateConsistencyConfidence(hand.landmarks);
  }
  
  // Calculate confidence based on landmark visibility
  calculateVisibilityConfidence(landmarks) {
    const keyLandmarks = [0, 4, 8, 12, 16, 20]; // Wrist + fingertips
    let totalVisibility = 0;
    let validLandmarks = 0;
    
    keyLandmarks.forEach(index => {
      if (landmarks[index] && typeof landmarks[index].visibility === 'number') {
        totalVisibility += landmarks[index].visibility;
        validLandmarks++;
      }
    });
    
    return validLandmarks > 0 ? totalVisibility / validLandmarks : 0;
  }
  
  // Calculate confidence based on landmark consistency
  calculateConsistencyConfidence(landmarks) {
    // Check if landmarks form a reasonable hand shape
    if (landmarks.length < 21) return 0;
    
    const wrist = landmarks[0];
    let validConnections = 0;
    let totalConnections = 0;
    
    // Check finger tip distances from wrist (should be reasonable)
    const fingertips = [4, 8, 12, 16, 20];
    fingertips.forEach(tipIndex => {
      if (landmarks[tipIndex]) {
        const distance = this.calculateDistance2D(wrist, landmarks[tipIndex]);
        totalConnections++;
        
        // Reasonable finger length range (normalized coordinates)
        if (distance >= 0.05 && distance <= 0.3) {
          validConnections++;
        }
      }
    });
    
    return totalConnections > 0 ? validConnections / totalConnections : 0;
  }
  
  // Check if all landmarks are within boundaries
  checkAllLandmarksInBounds(landmarks) {
    return landmarks.every(landmark => 
      this.isLandmarkInBounds(landmark)
    );
  }
  
  // Check if a single landmark is within boundaries
  isLandmarkInBounds(landmark) {
    if (!landmark || typeof landmark.x !== 'number' || typeof landmark.y !== 'number') {
      return false;
    }
    
    // Check landmark confidence if available
    if (typeof landmark.visibility === 'number' && 
        landmark.visibility < this.landmarkConfidenceThreshold) {
      return false;
    }
    
    return landmark.x >= this.boundaries.left &&
           landmark.x <= this.boundaries.right &&
           landmark.y >= this.boundaries.top &&
           landmark.y <= this.boundaries.bottom;
  }
  
  // Get landmarks that are out of bounds
  getOutOfBoundsLandmarks(landmarks) {
    return landmarks.filter(landmark => !this.isLandmarkInBounds(landmark));
  }
  
  // Get boundary violation details
  getBoundaryViolations(hand) {
    if (!hand.landmarks) return [];
    
    const violations = [];
    
    hand.landmarks.forEach((landmark, index) => {
      if (!landmark) return;
      
      const landmarkViolations = [];
      
      if (landmark.x < this.boundaries.left) {
        landmarkViolations.push('left');
      }
      if (landmark.x > this.boundaries.right) {
        landmarkViolations.push('right');
      }
      if (landmark.y < this.boundaries.top) {
        landmarkViolations.push('top');
      }
      if (landmark.y > this.boundaries.bottom) {
        landmarkViolations.push('bottom');
      }
      
      if (landmarkViolations.length > 0) {
        violations.push({
          landmarkIndex: index,
          landmark: landmark,
          violations: landmarkViolations
        });
      }
    });
    
    return violations;
  }
  
  // Create initial hand state
  createInitialHandState(handId) {
    return {
      handId: handId,
      inBounds: false,
      confidence: 0,
      lastUpdate: Date.now(),
      lastTransition: Date.now(),
      transitionCount: 0,
      stableState: false,
      violations: []
    };
  }
  
  // Update hand state
  updateHandState(handId, hand, inBounds, confidence) {
    const now = Date.now();
    const currentState = this.handStates.get(handId) || this.createInitialHandState(handId);
    const previousInBounds = currentState.inBounds;
    
    // Update basic state
    currentState.confidence = confidence;
    currentState.lastUpdate = now;
    currentState.violations = this.getBoundaryViolations(hand);
    
    // Handle state transitions with cooldown
    if (inBounds !== previousInBounds) {
      if (now - currentState.lastTransition >= this.transitionCooldown) {
        currentState.inBounds = inBounds;
        currentState.lastTransition = now;
        currentState.transitionCount++;
        
        // Emit events
        if (inBounds) {
          this.emit('handEnterBounds', { handId, hand, state: currentState });
        } else {
          this.emit('handLeaveBounds', { handId, hand, state: currentState });
        }
      }
    } else {
      currentState.inBounds = inBounds;
    }
    
    // Update hand history for stability
    this.updateHandHistory(handId, inBounds);
    
    // Update stable state
    currentState.stableState = this.getStableHandState(handId);
    
    // Store updated state
    this.handStates.set(handId, currentState);
    
    // Emit confidence change event
    this.emit('confidenceChanged', { handId, confidence, state: currentState });
    
    // Check for boundary warnings
    if (!inBounds && currentState.violations.length > 0) {
      this.emit('handBoundsWarning', { 
        handId, 
        hand, 
        violations: currentState.violations,
        state: currentState 
      });
    }
  }
  
  // Update hand history for stability checking
  updateHandHistory(handId, inBounds) {
    if (!this.handHistory.has(handId)) {
      this.handHistory.set(handId, []);
    }
    
    const history = this.handHistory.get(handId);
    history.push(inBounds);
    
    // Limit history size
    if (history.length > this.historySize) {
      history.shift();
    }
  }
  
  // Get stable hand state based on history
  getStableHandState(handId) {
    const history = this.handHistory.get(handId);
    if (!history || history.length < this.historySize) {
      return false; // Not enough history, assume out of bounds
    }
    
    // Calculate percentage of "in bounds" states
    const inBoundsCount = history.filter(state => state).length;
    const stability = inBoundsCount / history.length;
    
    return stability >= this.stabilityThreshold;
  }
  
  // Get hand ID for tracking
  getHandId(hand) {
    // Use handedness + index as ID, or generate one
    if (hand.handedness) {
      return `${hand.handedness}_${hand.index || 0}`;
    }
    
    // Fallback: use landmark signature
    if (hand.landmarks && hand.landmarks.length > 0) {
      const signature = hand.landmarks[0].x.toFixed(3) + hand.landmarks[0].y.toFixed(3);
      return `hand_${signature}`;
    }
    
    return 'unknown_hand';
  }
  
  // Calculate 2D distance between two points
  calculateDistance2D(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Get hand state
  getHandState(handId) {
    return this.handStates.get(handId);
  }
  
  // Get all hand states
  getAllHandStates() {
    return Object.fromEntries(this.handStates);
  }
  
  // Clean up old hand states
  cleanupOldStates(maxAge = 5000) {
    const now = Date.now();
    
    for (const [handId, state] of this.handStates.entries()) {
      if (now - state.lastUpdate > maxAge) {
        this.handStates.delete(handId);
        this.handHistory.delete(handId);
      }
    }
  }
  
  // Update boundaries
  updateBoundaries(newBoundaries) {
    this.boundaries = { ...this.boundaries, ...newBoundaries };
  }
  
  // Set boundary visualizer
  setBoundaryVisualizer(visualizer) {
    this.boundaryVisualizer = visualizer;
    if (this.showBoundaries && visualizer) {
      visualizer.setBoundaries(this.boundaries);
    }
  }
  
  // Toggle boundary visualization
  toggleBoundaryVisualization(show) {
    this.showBoundaries = show;
    if (this.boundaryVisualizer) {
      this.boundaryVisualizer.setVisible(show);
    }
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
  
  // Get boundary status for UI display
  getBoundaryStatus() {
    const handStates = Array.from(this.handStates.values());
    
    return {
      totalHands: handStates.length,
      handsInBounds: handStates.filter(state => state.stableState).length,
      averageConfidence: handStates.length > 0 ? 
        handStates.reduce((sum, state) => sum + state.confidence, 0) / handStates.length : 0,
      boundaries: this.boundaries,
      recentViolations: handStates.flatMap(state => state.violations)
    };
  }
  
  // Reset all tracking data
  reset() {
    this.handStates.clear();
    this.handHistory.clear();
  }
  
  // Get debug information
  getDebugInfo() {
    return {
      boundaries: this.boundaries,
      handStates: Object.fromEntries(this.handStates),
      handHistory: Object.fromEntries(this.handHistory),
      config: {
        minConfidence: this.minConfidence,
        transitionCooldown: this.transitionCooldown,
        historySize: this.historySize,
        stabilityThreshold: this.stabilityThreshold
      }
    };
  }
}