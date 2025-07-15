// Gesture Recognition for Conductor Mode
// Handles detection and classification of hand gestures

export class GestureRecognizer {
  constructor(config = {}) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold || 0.8,
      cooldownPeriod: config.cooldownPeriod || 200,
      smoothingFactor: config.smoothingFactor || 0.3,
      velocityThreshold: config.velocityThreshold || 150,
      ...config
    };
    
    // Gesture history for smoothing
    this.gestureHistory = [];
    this.maxHistoryLength = 5;
    
    // Last detection times for cooldown
    this.lastDetectionTimes = {};
    
    // Hand landmark indices (MediaPipe format)
    this.LANDMARKS = {
      WRIST: 0,
      THUMB_TIP: 4,
      INDEX_TIP: 8,
      MIDDLE_TIP: 12,
      RING_TIP: 16,
      PINKY_TIP: 20,
      INDEX_MCP: 5,
      MIDDLE_MCP: 9,
      RING_MCP: 13,
      PINKY_MCP: 17
    };
  }

  recognizeGesture(handData) {
    if (!handData || !handData.landmarks) {
      return null;
    }
    
    const landmarks = handData.landmarks;
    const now = performance.now();
    
    // Detect all possible gestures
    const detectedGestures = [
      this.detectPointing(landmarks),
      this.detectOpenPalm(landmarks),
      this.detectClosedFist(landmarks),
      this.detectPeaceSign(landmarks),
      this.detectThumbsUp(landmarks),
      this.detectPinch(landmarks)
    ].filter(gesture => gesture !== null);
    
    // Find the gesture with highest confidence
    const bestGesture = detectedGestures.reduce((best, current) => {
      return (!best || current.confidence > best.confidence) ? current : best;
    }, null);
    
    if (!bestGesture || bestGesture.confidence < this.config.confidenceThreshold) {
      return null;
    }
    
    // Check cooldown
    const gestureKey = `${bestGesture.type}_${handData.handedness}`;
    if (this.lastDetectionTimes[gestureKey] && 
        now - this.lastDetectionTimes[gestureKey] < this.config.cooldownPeriod) {
      return null;
    }
    
    // Apply smoothing
    const smoothedGesture = this.applySmoothing(bestGesture);
    
    if (smoothedGesture.confidence >= this.config.confidenceThreshold) {
      this.lastDetectionTimes[gestureKey] = now;
      return smoothedGesture;
    }
    
    return null;
  }

  detectPointing(landmarks) {
    // Pointing: Index finger extended, others curled
    try {
      const indexTip = landmarks[this.LANDMARKS.INDEX_TIP];
      const indexMcp = landmarks[this.LANDMARKS.INDEX_MCP];
      const middleTip = landmarks[this.LANDMARKS.MIDDLE_TIP];
      const middleMcp = landmarks[this.LANDMARKS.MIDDLE_MCP];
      const ringTip = landmarks[this.LANDMARKS.RING_TIP];
      const ringMcp = landmarks[this.LANDMARKS.RING_MCP];
      const pinkyTip = landmarks[this.LANDMARKS.PINKY_TIP];
      const pinkyMcp = landmarks[this.LANDMARKS.PINKY_MCP];
      
      // Check if index finger is extended
      const indexExtended = indexTip.y < indexMcp.y;
      
      // Check if other fingers are curled
      const middleCurled = middleTip.y > middleMcp.y;
      const ringCurled = ringTip.y > ringMcp.y;
      const pinkyCurled = pinkyTip.y > pinkyMcp.y;
      
      if (indexExtended && middleCurled && ringCurled && pinkyCurled) {
        const confidence = this.calculatePointingConfidence(landmarks);
        return {
          type: 'point',
          confidence: confidence,
          direction: this.getPointingDirection(landmarks)
        };
      }
    } catch (error) {
      console.error('Error detecting pointing gesture:', error);
    }
    
    return null;
  }

  detectOpenPalm(landmarks) {
    // Open Palm: All fingers extended
    try {
      const fingerTips = [
        landmarks[this.LANDMARKS.THUMB_TIP],
        landmarks[this.LANDMARKS.INDEX_TIP],
        landmarks[this.LANDMARKS.MIDDLE_TIP],
        landmarks[this.LANDMARKS.RING_TIP],
        landmarks[this.LANDMARKS.PINKY_TIP]
      ];
      
      const fingerMcps = [
        landmarks[this.LANDMARKS.INDEX_MCP],
        landmarks[this.LANDMARKS.MIDDLE_MCP],
        landmarks[this.LANDMARKS.RING_MCP],
        landmarks[this.LANDMARKS.PINKY_MCP]
      ];
      
      // Check if all fingers are extended (tips above MCPs)
      let extendedCount = 0;
      for (let i = 1; i < fingerTips.length; i++) {
        if (fingerTips[i].y < fingerMcps[i - 1].y) {
          extendedCount++;
        }
      }
      
      if (extendedCount >= 3) { // Allow some tolerance
        const confidence = extendedCount / 4; // Normalize to 0-1
        return {
          type: 'palm',
          confidence: confidence,
          openness: extendedCount / 4
        };
      }
    } catch (error) {
      console.error('Error detecting open palm gesture:', error);
    }
    
    return null;
  }

  detectClosedFist(landmarks) {
    // Closed Fist: All fingers curled
    try {
      const fingerTips = [
        landmarks[this.LANDMARKS.INDEX_TIP],
        landmarks[this.LANDMARKS.MIDDLE_TIP],
        landmarks[this.LANDMARKS.RING_TIP],
        landmarks[this.LANDMARKS.PINKY_TIP]
      ];
      
      const fingerMcps = [
        landmarks[this.LANDMARKS.INDEX_MCP],
        landmarks[this.LANDMARKS.MIDDLE_MCP],
        landmarks[this.LANDMARKS.RING_MCP],
        landmarks[this.LANDMARKS.PINKY_MCP]
      ];
      
      // Check if all fingers are curled (tips below MCPs)
      let curledCount = 0;
      for (let i = 0; i < fingerTips.length; i++) {
        if (fingerTips[i].y > fingerMcps[i].y) {
          curledCount++;
        }
      }
      
      if (curledCount >= 3) { // Allow some tolerance
        const confidence = curledCount / 4; // Normalize to 0-1
        return {
          type: 'fist',
          confidence: confidence,
          tightness: curledCount / 4
        };
      }
    } catch (error) {
      console.error('Error detecting closed fist gesture:', error);
    }
    
    return null;
  }

  detectPeaceSign(landmarks) {
    // Peace Sign: Index and middle fingers extended, others curled
    try {
      const indexTip = landmarks[this.LANDMARKS.INDEX_TIP];
      const indexMcp = landmarks[this.LANDMARKS.INDEX_MCP];
      const middleTip = landmarks[this.LANDMARKS.MIDDLE_TIP];
      const middleMcp = landmarks[this.LANDMARKS.MIDDLE_MCP];
      const ringTip = landmarks[this.LANDMARKS.RING_TIP];
      const ringMcp = landmarks[this.LANDMARKS.RING_MCP];
      const pinkyTip = landmarks[this.LANDMARKS.PINKY_TIP];
      const pinkyMcp = landmarks[this.LANDMARKS.PINKY_MCP];
      
      // Check if index and middle fingers are extended
      const indexExtended = indexTip.y < indexMcp.y;
      const middleExtended = middleTip.y < middleMcp.y;
      
      // Check if ring and pinky are curled
      const ringCurled = ringTip.y > ringMcp.y;
      const pinkyCurled = pinkyTip.y > pinkyMcp.y;
      
      if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
        const confidence = this.calculatePeaceSignConfidence(landmarks);
        return {
          type: 'peace',
          confidence: confidence,
          spread: this.calculateFingerSpread(indexTip, middleTip)
        };
      }
    } catch (error) {
      console.error('Error detecting peace sign gesture:', error);
    }
    
    return null;
  }

  detectThumbsUp(landmarks) {
    // Thumbs Up: Thumb extended upward, other fingers curled
    try {
      const thumbTip = landmarks[this.LANDMARKS.THUMB_TIP];
      const wrist = landmarks[this.LANDMARKS.WRIST];
      const indexTip = landmarks[this.LANDMARKS.INDEX_TIP];
      const indexMcp = landmarks[this.LANDMARKS.INDEX_MCP];
      const middleTip = landmarks[this.LANDMARKS.MIDDLE_TIP];
      const middleMcp = landmarks[this.LANDMARKS.MIDDLE_MCP];
      
      // Check if thumb is extended upward
      const thumbExtended = thumbTip.y < wrist.y;
      
      // Check if other fingers are curled
      const indexCurled = indexTip.y > indexMcp.y;
      const middleCurled = middleTip.y > middleMcp.y;
      
      if (thumbExtended && indexCurled && middleCurled) {
        const confidence = this.calculateThumbsUpConfidence(landmarks);
        return {
          type: 'thumbsUp',
          confidence: confidence,
          angle: this.calculateThumbAngle(landmarks)
        };
      }
    } catch (error) {
      console.error('Error detecting thumbs up gesture:', error);
    }
    
    return null;
  }

  detectPinch(landmarks) {
    // Pinch: Thumb and index finger close together
    try {
      const thumbTip = landmarks[this.LANDMARKS.THUMB_TIP];
      const indexTip = landmarks[this.LANDMARKS.INDEX_TIP];
      
      // Calculate distance between thumb and index finger tips
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2)
      );
      
      // Pinch threshold (adjust based on testing)
      const pinchThreshold = 0.05; // Normalized distance
      
      if (distance < pinchThreshold) {
        const confidence = 1 - (distance / pinchThreshold);
        return {
          type: 'pinch',
          confidence: confidence,
          strength: 1 - (distance / pinchThreshold)
        };
      }
    } catch (error) {
      console.error('Error detecting pinch gesture:', error);
    }
    
    return null;
  }

  // Helper methods for confidence calculations
  calculatePointingConfidence(landmarks) {
    // Calculate confidence based on finger positions and angles
    // This is a simplified implementation
    return 0.9; // Mock high confidence
  }

  calculatePeaceSignConfidence(landmarks) {
    // Calculate confidence based on finger spread and positioning
    return 0.85; // Mock confidence
  }

  calculateThumbsUpConfidence(landmarks) {
    // Calculate confidence based on thumb angle and other finger positions
    return 0.8; // Mock confidence
  }

  getPointingDirection(landmarks) {
    // Calculate pointing direction vector
    const indexTip = landmarks[this.LANDMARKS.INDEX_TIP];
    const indexMcp = landmarks[this.LANDMARKS.INDEX_MCP];
    
    return {
      x: indexTip.x - indexMcp.x,
      y: indexTip.y - indexMcp.y
    };
  }

  calculateFingerSpread(finger1, finger2) {
    // Calculate spread between two fingers
    return Math.sqrt(
      Math.pow(finger1.x - finger2.x, 2) +
      Math.pow(finger1.y - finger2.y, 2)
    );
  }

  calculateThumbAngle(landmarks) {
    // Calculate thumb angle relative to hand
    // This is a simplified implementation
    return 0; // Mock angle
  }

  applySmoothing(gesture) {
    // Add gesture to history
    this.gestureHistory.push(gesture);
    
    // Maintain history length
    if (this.gestureHistory.length > this.maxHistoryLength) {
      this.gestureHistory.shift();
    }
    
    // Calculate smoothed confidence
    const recentGestures = this.gestureHistory.filter(g => g.type === gesture.type);
    if (recentGestures.length === 0) {
      return gesture;
    }
    
    const smoothedConfidence = recentGestures.reduce((sum, g) => sum + g.confidence, 0) / recentGestures.length;
    
    return {
      ...gesture,
      confidence: smoothedConfidence
    };
  }

  // Utility methods
  normalizeCoordinate(coord, screenDimension) {
    // Normalize coordinate to 0-1 range
    return Math.max(0, Math.min(1, coord / screenDimension));
  }

  calculateVelocity(currentPos, previousPos, deltaTime) {
    // Calculate velocity between two positions
    if (!previousPos || deltaTime === 0) {
      return 0;
    }
    
    const distance = Math.sqrt(
      Math.pow(currentPos.x - previousPos.x, 2) +
      Math.pow(currentPos.y - previousPos.y, 2)
    );
    
    return distance / deltaTime;
  }

  reset() {
    // Reset gesture history and detection times
    this.gestureHistory = [];
    this.lastDetectionTimes = {};
  }
}