export class CollisionDetector {
  constructor(options = {}) {
    this.confidenceThreshold = options.confidenceThreshold || 0.8;
    this.proximityRadius = options.proximityRadius || 80; // Distance for "approaching" state
    this.handBoundaryChecker = options.handBoundaryChecker || null;
    
    // Collision history for debouncing
    this.collisionHistory = new Map(); // objectId -> { lastCollision, cooldown }
    this.defaultCooldown = options.defaultCooldown || 100;
    
    // Performance optimization
    this.spatialGrid = new Map();
    this.gridSize = options.gridSize || 100;
    
    // Debug options
    this.debug = options.debug || false;
    this.debugData = {
      totalChecks: 0,
      collisions: 0,
      proximityDetections: 0
    };
  }
  
  // Main collision detection method
  detectCollisions(hands, objects) {
    if (!hands || hands.length === 0 || !objects || objects.length === 0) {
      return {
        collisions: [],
        proximityDetections: [],
        handStates: []
      };
    }
    
    // Update spatial grid for performance
    this.updateSpatialGrid(objects);
    
    const results = {
      collisions: [],
      proximityDetections: [],
      handStates: []
    };
    
    hands.forEach((hand, handIndex) => {
      const handState = this.processHandCollisions(hand, handIndex, objects);
      results.handStates.push(handState);
      
      // Merge results
      results.collisions.push(...handState.collisions);
      results.proximityDetections.push(...handState.proximityDetections);
    });
    
    // Update debug stats
    if (this.debug) {
      this.debugData.totalChecks += hands.length * objects.length;
      this.debugData.collisions += results.collisions.length;
      this.debugData.proximityDetections += results.proximityDetections.length;
    }
    
    return results;
  }
  
  // Process collisions for a single hand
  processHandCollisions(hand, handIndex, objects) {
    const handState = {
      handIndex: handIndex,
      handedness: hand.handedness,
      inBounds: false,
      confidence: 0,
      landmarks: hand.landmarks,
      collisions: [],
      proximityDetections: [],
      interactionPoints: []
    };
    
    // Check if hand is in bounds first
    if (this.handBoundaryChecker) {
      handState.inBounds = this.handBoundaryChecker.isHandInBounds(hand);
      handState.confidence = this.handBoundaryChecker.getHandConfidence(hand);
    } else {
      // Fallback boundary check
      handState.inBounds = this.checkHandInBounds(hand);
      handState.confidence = this.getHandConfidence(hand);
    }
    
    // Skip collision detection if hand is out of bounds or low confidence
    if (!handState.inBounds || handState.confidence < this.confidenceThreshold) {
      return handState;
    }
    
    // Get interaction points from hand landmarks
    const interactionPoints = this.getHandInteractionPoints(hand);
    handState.interactionPoints = interactionPoints;
    
    // Check collisions with objects
    objects.forEach(object => {
      if (!object.isActive || !object.isInteractable) return;
      
      const collisionResult = this.checkHandObjectCollision(
        interactionPoints,
        object,
        hand,
        handIndex
      );
      
      if (collisionResult.collision) {
        handState.collisions.push(collisionResult);
      } else if (collisionResult.proximity) {
        handState.proximityDetections.push(collisionResult);
      }
    });
    
    return handState;
  }
  
  // Get key interaction points from hand landmarks
  getHandInteractionPoints(hand) {
    if (!hand.landmarks || hand.landmarks.length < 21) {
      return [];
    }
    
    const landmarks = hand.landmarks;
    
    // Key interaction points based on MediaPipe hand landmarks
    const interactionPoints = [
      {
        name: 'wrist',
        position: landmarks[0],
        priority: 0.5,
        radius: 30
      },
      {
        name: 'thumb_tip',
        position: landmarks[4],
        priority: 1.0,
        radius: 25
      },
      {
        name: 'index_finger_tip',
        position: landmarks[8],
        priority: 1.0,
        radius: 25
      },
      {
        name: 'middle_finger_tip',
        position: landmarks[12],
        priority: 0.9,
        radius: 25
      },
      {
        name: 'ring_finger_tip',
        position: landmarks[16],
        priority: 0.8,
        radius: 25
      },
      {
        name: 'pinky_tip',
        position: landmarks[20],
        priority: 0.7,
        radius: 25
      },
      {
        name: 'palm_center',
        position: this.calculatePalmCenter(landmarks),
        priority: 0.6,
        radius: 40
      }
    ];
    
    return interactionPoints.filter(point => 
      point.position && 
      typeof point.position.x === 'number' && 
      typeof point.position.y === 'number'
    );
  }
  
  // Calculate palm center from landmarks
  calculatePalmCenter(landmarks) {
    // Use landmarks 0, 5, 9, 13, 17 (base of each finger + wrist)
    const basePoints = [0, 5, 9, 13, 17];
    let x = 0, y = 0, z = 0;
    
    basePoints.forEach(index => {
      if (landmarks[index]) {
        x += landmarks[index].x;
        y += landmarks[index].y;
        z += (landmarks[index].z || 0);
      }
    });
    
    return {
      x: x / basePoints.length,
      y: y / basePoints.length,
      z: z / basePoints.length,
      visibility: 1.0
    };
  }
  
  // Check collision between hand interaction points and object
  checkHandObjectCollision(interactionPoints, object, hand, handIndex) {
    const now = Date.now();
    const objectHistory = this.collisionHistory.get(object.id);
    
    // Check cooldown
    if (objectHistory && now - objectHistory.lastCollision < objectHistory.cooldown) {
      return { collision: false, proximity: false };
    }
    
    let closestDistance = Infinity;
    let closestPoint = null;
    let collisionDetected = false;
    let proximityDetected = false;
    
    // Check each interaction point
    interactionPoints.forEach(point => {
      const distance = this.calculateDistance3D(
        this.normalizePosition(point.position),
        object.position
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
      }
      
      // Check for collision
      if (distance <= (object.collisionRadius + point.radius)) {
        collisionDetected = true;
      }
      
      // Check for proximity
      if (distance <= this.proximityRadius) {
        proximityDetected = true;
      }
    });
    
    const result = {
      object: object,
      hand: hand,
      handIndex: handIndex,
      closestPoint: closestPoint,
      closestDistance: closestDistance,
      collision: collisionDetected,
      proximity: proximityDetected && !collisionDetected,
      timestamp: now
    };
    
    // Update collision history
    if (collisionDetected) {
      this.collisionHistory.set(object.id, {
        lastCollision: now,
        cooldown: object.interactionCooldown || this.defaultCooldown
      });
    }
    
    return result;
  }
  
  // Normalize position from MediaPipe coordinates to world coordinates
  normalizePosition(mpPosition) {
    // MediaPipe coordinates are normalized (0-1)
    // Convert to screen/world coordinates
    const canvasWidth = window.innerWidth || 1920;
    const canvasHeight = window.innerHeight || 1080;
    
    return {
      x: (1 - mpPosition.x) * canvasWidth, // Mirror X axis
      y: mpPosition.y * canvasHeight,
      z: (mpPosition.z || 0) * 100 // Convert to reasonable Z scale
    };
  }
  
  // Calculate 3D distance between two points
  calculateDistance3D(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = (point2.z || 0) - (point1.z || 0);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  // Fallback hand boundary check
  checkHandInBounds(hand) {
    if (!hand.landmarks || hand.landmarks.length === 0) {
      return false;
    }
    
    const boundaries = {
      left: 0.05,
      right: 0.95,
      top: 0.05,
      bottom: 0.95
    };
    
    // Check if all landmarks are within boundaries
    return hand.landmarks.every(landmark => 
      landmark.x >= boundaries.left &&
      landmark.x <= boundaries.right &&
      landmark.y >= boundaries.top &&
      landmark.y <= boundaries.bottom
    );
  }
  
  // Get hand confidence (fallback)
  getHandConfidence(hand) {
    if (!hand.landmarks || hand.landmarks.length === 0) {
      return 0;
    }
    
    // Average visibility of key landmarks
    const keyLandmarks = [0, 4, 8, 12, 16, 20]; // Wrist + fingertips
    let totalVisibility = 0;
    let validLandmarks = 0;
    
    keyLandmarks.forEach(index => {
      if (hand.landmarks[index] && typeof hand.landmarks[index].visibility === 'number') {
        totalVisibility += hand.landmarks[index].visibility;
        validLandmarks++;
      }
    });
    
    return validLandmarks > 0 ? totalVisibility / validLandmarks : 0;
  }
  
  // Update spatial grid for performance optimization
  updateSpatialGrid(objects) {
    this.spatialGrid.clear();
    
    objects.forEach(object => {
      const gridX = Math.floor(object.position.x / this.gridSize);
      const gridY = Math.floor(object.position.y / this.gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      if (!this.spatialGrid.has(gridKey)) {
        this.spatialGrid.set(gridKey, []);
      }
      
      this.spatialGrid.get(gridKey).push(object);
    });
  }
  
  // Get objects in spatial grid cell (for optimization)
  getObjectsInGridCell(position) {
    const gridX = Math.floor(position.x / this.gridSize);
    const gridY = Math.floor(position.y / this.gridSize);
    
    const objects = [];
    
    // Check current cell and adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const gridKey = `${gridX + dx},${gridY + dy}`;
        const cellObjects = this.spatialGrid.get(gridKey) || [];
        objects.push(...cellObjects);
      }
    }
    
    return objects;
  }
  
  // Clear collision history
  clearCollisionHistory() {
    this.collisionHistory.clear();
  }
  
  // Get debug information
  getDebugInfo() {
    return {
      ...this.debugData,
      activeCollisions: this.collisionHistory.size,
      spatialGridCells: this.spatialGrid.size
    };
  }
  
  // Reset debug counters
  resetDebugCounters() {
    this.debugData = {
      totalChecks: 0,
      collisions: 0,
      proximityDetections: 0
    };
  }
  
  // Set hand boundary checker
  setHandBoundaryChecker(boundaryChecker) {
    this.handBoundaryChecker = boundaryChecker;
  }
  
  // Update configuration
  updateConfig(newConfig) {
    this.confidenceThreshold = newConfig.confidenceThreshold ?? this.confidenceThreshold;
    this.proximityRadius = newConfig.proximityRadius ?? this.proximityRadius;
    this.defaultCooldown = newConfig.defaultCooldown ?? this.defaultCooldown;
    this.gridSize = newConfig.gridSize ?? this.gridSize;
    this.debug = newConfig.debug ?? this.debug;
  }
}