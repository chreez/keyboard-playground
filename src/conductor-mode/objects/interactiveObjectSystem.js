import { ObjectFactory, OBJECT_TYPES } from './objectTypes.js';
import { ObjectPlacementEngine } from './objectPlacementEngine.js';
import { CollisionDetector } from '../interaction/collisionDetector.js';
import { HandBoundaryChecker } from '../interaction/handBoundaryChecker.js';

export class InteractiveObjectSystem {
  constructor(options = {}) {
    this.canvas = options.canvas || { width: 1920, height: 1080 };
    this.isInitialized = false;
    this.isActive = false;
    
    // Core systems
    this.placementEngine = new ObjectPlacementEngine({
      canvas: this.canvas,
      comfortZone: options.comfortZone || { radius: 300, depth: 200 }
    });
    
    this.handBoundaryChecker = new HandBoundaryChecker({
      boundaries: options.boundaries || { left: 0.1, right: 0.9, top: 0.1, bottom: 0.9 },
      minConfidence: options.minConfidence || 0.8
    });
    
    this.collisionDetector = new CollisionDetector({
      confidenceThreshold: options.confidenceThreshold || 0.8,
      proximityRadius: options.proximityRadius || 80,
      handBoundaryChecker: this.handBoundaryChecker
    });
    
    // Object management
    this.activeObjects = new Map();
    this.objectGroups = new Map(); // Group objects by type/layout
    this.lastObjectId = 0;
    
    // Interaction state
    this.handsInBounds = new Map();
    this.activeCollisions = new Map();
    this.proximityStates = new Map();
    
    // Configuration
    this.config = {
      maxObjects: options.maxObjects || 50,
      defaultLayout: options.defaultLayout || 'scale',
      autoCleanup: options.autoCleanup !== false,
      enableAdaptivePlacement: options.enableAdaptivePlacement !== false,
      enableCollisionFeedback: options.enableCollisionFeedback !== false,
      soundEnabled: options.soundEnabled !== false
    };
    
    // Performance tracking
    this.performance = {
      lastUpdateTime: 0,
      updateCount: 0,
      averageFrameTime: 0,
      objectsRendered: 0,
      collisionsDetected: 0
    };
    
    // Event system
    this.eventListeners = {
      objectCreated: [],
      objectDestroyed: [],
      objectInteraction: [],
      handEnterBounds: [],
      handLeaveBounds: [],
      collisionDetected: [],
      proximityDetected: [],
      soundTrigger: []
    };
    
    this.setupEventHandlers();
  }
  
  // Initialize the system
  async init() {
    if (this.isInitialized) {
      console.warn('InteractiveObjectSystem already initialized');
      return;
    }
    
    try {
      console.log('Initializing Interactive Object System...');
      
      // Create default object layout
      await this.createDefaultLayout();
      
      this.isInitialized = true;
      console.log('Interactive Object System initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Interactive Object System:', error);
      throw error;
    }
  }
  
  // Create default object layout
  async createDefaultLayout() {
    const centerPosition = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      z: 0
    };
    
    // Create C major scale layout
    const scaleObjects = this.placementEngine.placeObjects(
      'scale',
      OBJECT_TYPES.NOTE,
      centerPosition,
      { scaleType: 'major', startNote: 60 }
    );
    
    // Add objects to system
    scaleObjects.forEach(obj => {
      this.addObject(obj, 'default_scale');
    });
    
    // Create some chord objects
    const chordCenter = {
      x: centerPosition.x,
      y: centerPosition.y - 150,
      z: 0
    };
    
    const chordObjects = this.placementEngine.placeObjects(
      'functional',
      OBJECT_TYPES.CHORD,
      chordCenter
    );
    
    chordObjects.forEach(obj => {
      this.addObject(obj, 'default_chords');
    });
    
    console.log(`Created default layout with ${this.activeObjects.size} objects`);
  }
  
  // Setup event handlers
  setupEventHandlers() {
    // Hand boundary events
    this.handBoundaryChecker.on('handEnterBounds', (data) => {
      this.handsInBounds.set(data.handId, true);
      this.emit('handEnterBounds', data);
    });
    
    this.handBoundaryChecker.on('handLeaveBounds', (data) => {
      this.handsInBounds.set(data.handId, false);
      this.emit('handLeaveBounds', data);
      
      // Clear any active collisions for this hand
      this.clearHandCollisions(data.handId);
    });
    
    this.handBoundaryChecker.on('handBoundsWarning', (data) => {
      console.log('Hand boundary warning:', data.violations);
    });
  }
  
  // Main update loop
  update(deltaTime, hands = []) {
    if (!this.isInitialized || !this.isActive) return;
    
    const startTime = performance.now();
    
    // Update placement engine (handles object positioning and player adaptation)
    this.placementEngine.update(deltaTime, hands);
    
    // Update all objects
    this.updateObjects(deltaTime);
    
    // Process hand interactions
    this.processHandInteractions(hands);
    
    // Cleanup if enabled
    if (this.config.autoCleanup) {
      this.performCleanup();
    }
    
    // Update performance metrics
    this.updatePerformanceMetrics(startTime);
  }
  
  // Update all objects
  updateObjects(deltaTime) {
    this.activeObjects.forEach(object => {
      object.update(deltaTime);
    });
  }
  
  // Process hand interactions
  processHandInteractions(hands) {
    if (!hands || hands.length === 0) {
      // Clear all collisions when no hands
      this.activeCollisions.clear();
      this.proximityStates.clear();
      return;
    }
    
    // Get all objects as array
    const objects = Array.from(this.activeObjects.values());
    
    // Detect collisions
    const collisionResults = this.collisionDetector.detectCollisions(hands, objects);
    
    // Process collision results
    this.processCollisionResults(collisionResults);
  }
  
  // Process collision detection results
  processCollisionResults(results) {
    // Clear previous states
    this.activeCollisions.clear();
    this.proximityStates.clear();
    
    // Process hand states
    results.handStates.forEach(handState => {
      const handId = this.getHandId(handState);
      
      // Update hand boundary state
      this.handsInBounds.set(handId, handState.inBounds);
      
      // Only process interactions if hand is in bounds
      if (!handState.inBounds) return;
      
      // Process collisions
      handState.collisions.forEach(collision => {
        this.handleObjectCollision(collision, handState);
      });
      
      // Process proximity detections
      handState.proximityDetections.forEach(proximity => {
        this.handleObjectProximity(proximity, handState);
      });
    });
  }
  
  // Handle object collision
  handleObjectCollision(collision, handState) {
    const object = collision.object;
    const collisionKey = `${object.id}_${this.getHandId(handState)}`;
    
    // Store collision state
    this.activeCollisions.set(collisionKey, collision);
    
    // Trigger object interaction
    const interactionSuccess = object.onHandInteraction(collision.hand);
    
    if (interactionSuccess) {
      // Emit events
      this.emit('objectInteraction', {
        object: object,
        hand: collision.hand,
        collision: collision,
        timestamp: Date.now()
      });
      
      this.emit('collisionDetected', collision);
      
      // Update performance metrics
      this.performance.collisionsDetected++;
    }
  }
  
  // Handle object proximity
  handleObjectProximity(proximity, handState) {
    const object = proximity.object;
    const proximityKey = `${object.id}_${this.getHandId(handState)}`;
    
    // Store proximity state
    this.proximityStates.set(proximityKey, proximity);
    
    // Trigger object proximity response
    object.onHandApproaching(proximity.hand);
    
    // Emit proximity event
    this.emit('proximityDetected', proximity);
  }
  
  // Clear collisions for a specific hand
  clearHandCollisions(handId) {
    // Remove collisions for this hand
    for (const [key, collision] of this.activeCollisions.entries()) {
      if (key.endsWith(`_${handId}`)) {
        // Notify object that hand is leaving
        collision.object.onHandLeaving(collision.hand);
        this.activeCollisions.delete(key);
      }
    }
    
    // Remove proximity states for this hand
    for (const [key, proximity] of this.proximityStates.entries()) {
      if (key.endsWith(`_${handId}`)) {
        proximity.object.onHandLeaving(proximity.hand);
        this.proximityStates.delete(key);
      }
    }
  }
  
  // Get hand ID from hand state
  getHandId(handState) {
    return `${handState.handedness || 'unknown'}_${handState.handIndex || 0}`;
  }
  
  // Add object to system
  addObject(object, groupName = 'default') {
    // Setup object event handlers
    object.onSoundTrigger = (soundData) => {
      this.emit('soundTrigger', soundData);
    };
    
    object.onStateChange = (obj, oldState, newState) => {
      // Handle state changes if needed
    };
    
    object.onInteraction = (obj, handData) => {
      // Handle interaction events if needed
    };
    
    // Add to active objects
    this.activeObjects.set(object.id, object);
    
    // Add to group
    if (!this.objectGroups.has(groupName)) {
      this.objectGroups.set(groupName, new Set());
    }
    this.objectGroups.get(groupName).add(object.id);
    
    // Emit event
    this.emit('objectCreated', { object, groupName });
    
    return object;
  }
  
  // Remove object from system
  removeObject(objectId) {
    const object = this.activeObjects.get(objectId);
    if (!object) return false;
    
    // Remove from active objects
    this.activeObjects.delete(objectId);
    
    // Remove from groups
    this.objectGroups.forEach(group => {
      group.delete(objectId);
    });
    
    // Clear any active interactions
    this.clearObjectInteractions(objectId);
    
    // Emit event
    this.emit('objectDestroyed', { objectId, object });
    
    return true;
  }
  
  // Clear interactions for a specific object
  clearObjectInteractions(objectId) {
    // Remove from collisions
    for (const [key, collision] of this.activeCollisions.entries()) {
      if (key.startsWith(`${objectId}_`)) {
        this.activeCollisions.delete(key);
      }
    }
    
    // Remove from proximity states
    for (const [key, proximity] of this.proximityStates.entries()) {
      if (key.startsWith(`${objectId}_`)) {
        this.proximityStates.delete(key);
      }
    }
  }
  
  // Create objects with specified layout
  createObjectLayout(layoutType, objectType, centerPosition, options = {}) {
    const objects = this.placementEngine.placeObjects(
      layoutType,
      objectType,
      centerPosition,
      options
    );
    
    const groupName = options.groupName || `${layoutType}_${objectType}`;
    
    objects.forEach(obj => {
      this.addObject(obj, groupName);
    });
    
    return objects;
  }
  
  // Remove object group
  removeObjectGroup(groupName) {
    const group = this.objectGroups.get(groupName);
    if (!group) return false;
    
    // Remove all objects in group
    group.forEach(objectId => {
      this.removeObject(objectId);
    });
    
    // Remove group
    this.objectGroups.delete(groupName);
    
    return true;
  }
  
  // Get objects by group
  getObjectsByGroup(groupName) {
    const group = this.objectGroups.get(groupName);
    if (!group) return [];
    
    return Array.from(group).map(id => this.activeObjects.get(id)).filter(Boolean);
  }
  
  // Get all active objects
  getAllObjects() {
    return Array.from(this.activeObjects.values());
  }
  
  // Get objects in region
  getObjectsInRegion(center, radius) {
    return this.placementEngine.getObjectsInRegion(center, radius);
  }
  
  // Start the system
  start() {
    if (!this.isInitialized) {
      throw new Error('System not initialized');
    }
    
    this.isActive = true;
    console.log('Interactive Object System started');
  }
  
  // Stop the system
  stop() {
    this.isActive = false;
    
    // Clear all interactions
    this.activeCollisions.clear();
    this.proximityStates.clear();
    this.handsInBounds.clear();
    
    console.log('Interactive Object System stopped');
  }
  
  // Perform cleanup
  performCleanup() {
    // Clean up old hand states
    this.handBoundaryChecker.cleanupOldStates();
    
    // Clean up collision history
    this.collisionDetector.clearCollisionHistory();
  }
  
  // Update performance metrics
  updatePerformanceMetrics(startTime) {
    const frameTime = performance.now() - startTime;
    
    this.performance.updateCount++;
    this.performance.lastUpdateTime = frameTime;
    this.performance.objectsRendered = this.activeObjects.size;
    
    // Calculate rolling average
    if (this.performance.updateCount === 1) {
      this.performance.averageFrameTime = frameTime;
    } else {
      this.performance.averageFrameTime = 
        (this.performance.averageFrameTime * 0.9) + (frameTime * 0.1);
    }
  }
  
  // Get system status
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      isActive: this.isActive,
      objectCount: this.activeObjects.size,
      groupCount: this.objectGroups.size,
      handsInBounds: this.handsInBounds.size,
      activeCollisions: this.activeCollisions.size,
      proximityDetections: this.proximityStates.size,
      performance: this.performance,
      boundaryStatus: this.handBoundaryChecker.getBoundaryStatus()
    };
  }
  
  // Get debug information
  getDebugInfo() {
    return {
      systemStatus: this.getSystemStatus(),
      placementEngine: this.placementEngine.getAllObjects().length,
      collisionDetector: this.collisionDetector.getDebugInfo(),
      handBoundaryChecker: this.handBoundaryChecker.getDebugInfo(),
      activeObjects: Array.from(this.activeObjects.keys()),
      objectGroups: Object.fromEntries(
        Array.from(this.objectGroups.entries()).map(([name, group]) => 
          [name, Array.from(group)]
        )
      )
    };
  }
  
  // Configure system
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update subsystems
    if (newConfig.confidenceThreshold !== undefined) {
      this.collisionDetector.updateConfig({ 
        confidenceThreshold: newConfig.confidenceThreshold 
      });
    }
    
    if (newConfig.boundaries !== undefined) {
      this.handBoundaryChecker.updateBoundaries(newConfig.boundaries);
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
  
  // Cleanup and destroy
  destroy() {
    this.stop();
    
    // Clear all objects
    this.activeObjects.clear();
    this.objectGroups.clear();
    
    // Clear event listeners
    Object.keys(this.eventListeners).forEach(event => {
      this.eventListeners[event] = [];
    });
    
    this.isInitialized = false;
    console.log('Interactive Object System destroyed');
  }
}