import { MUSICAL_CONSTANTS } from '../core/musicalConstants.js';

export const OBJECT_STATES = {
  IDLE: 'idle',
  APPROACHING: 'approaching',
  TOUCHED: 'touched',
  PLAYING: 'playing',
  FADING: 'fading'
};

export class InteractiveObject {
  constructor(options = {}) {
    // Basic properties
    this.id = options.id || Math.random().toString(36).substr(2, 9);
    this.type = options.type || 'note';
    this.position = options.position || { x: 0, y: 0, z: 0 };
    this.size = options.size || 50;
    this.collisionRadius = options.collisionRadius || this.size * 0.8;
    
    // Visual properties
    this.color = options.color || '#667eea';
    this.glowColor = options.glowColor || '#ffffff';
    this.opacity = options.opacity || 1.0;
    this.rotation = options.rotation || 0;
    this.scale = options.scale || 1.0;
    
    // State management
    this.state = OBJECT_STATES.IDLE;
    this.lastStateChange = Date.now();
    this.stateDuration = 0;
    
    // Musical properties
    this.midiNote = options.midiNote || 60; // Middle C
    this.noteName = options.noteName || this.midiToNoteName(this.midiNote);
    this.octave = options.octave || Math.floor(this.midiNote / 12) - 1;
    this.velocity = options.velocity || 80;
    
    // Physics properties
    this.velocity3D = options.velocity3D || { x: 0, y: 0, z: 0 };
    this.acceleration = options.acceleration || { x: 0, y: 0, z: 0 };
    this.floatSpeed = options.floatSpeed || 0.5;
    this.floatAmplitude = options.floatAmplitude || 10;
    this.floatOffset = options.floatOffset || Math.random() * Math.PI * 2;
    
    // Interaction properties
    this.isInteractable = options.isInteractable !== false;
    this.isActive = options.isActive !== false;
    this.lastInteraction = 0;
    this.interactionCooldown = options.interactionCooldown || 100;
    
    // Visual feedback
    this.glowIntensity = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.particles = [];
    this.showConnectionLines = options.showConnectionLines !== false;
    
    // Animation properties
    this.animationProgress = 0;
    this.animationDuration = 1000;
    this.basePosition = { ...this.position };
    
    // Event callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onInteraction = options.onInteraction || (() => {});
    this.onSoundTrigger = options.onSoundTrigger || (() => {});
  }
  
  // Convert MIDI note to note name
  midiToNoteName(midiNote) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNames[midiNote % 12];
  }
  
  // Update object state and animations
  update(deltaTime) {
    const now = Date.now();
    this.stateDuration = now - this.lastStateChange;
    
    // Update floating animation
    this.updateFloatingAnimation(deltaTime);
    
    // Update glow effects
    this.updateGlowEffects(deltaTime);
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update state-specific logic
    this.updateStateLogic(deltaTime);
    
    // Update physics
    this.updatePhysics(deltaTime);
    
    // Update pulse animation
    this.pulsePhase += deltaTime * 0.003;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase -= Math.PI * 2;
    }
  }
  
  updateFloatingAnimation(deltaTime) {
    // Create gentle floating motion
    const time = Date.now() * 0.001;
    const floatOffset = Math.sin(time * this.floatSpeed + this.floatOffset) * this.floatAmplitude;
    
    this.position.y = this.basePosition.y + floatOffset;
    
    // Add slight circular motion
    const circularRadius = 5;
    this.position.x = this.basePosition.x + Math.cos(time * this.floatSpeed * 0.7) * circularRadius;
    this.position.z = this.basePosition.z + Math.sin(time * this.floatSpeed * 0.7) * circularRadius;
  }
  
  updateGlowEffects(deltaTime) {
    switch (this.state) {
      case OBJECT_STATES.IDLE:
        this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * 0.002);
        break;
      case OBJECT_STATES.APPROACHING:
        this.glowIntensity = Math.min(0.5, this.glowIntensity + deltaTime * 0.003);
        break;
      case OBJECT_STATES.TOUCHED:
        this.glowIntensity = Math.min(1.0, this.glowIntensity + deltaTime * 0.005);
        break;
      case OBJECT_STATES.PLAYING:
        this.glowIntensity = 1.0;
        break;
      case OBJECT_STATES.FADING:
        this.glowIntensity = Math.max(0, this.glowIntensity - deltaTime * 0.004);
        break;
    }
  }
  
  updateParticles(deltaTime) {
    // Update existing particles
    this.particles = this.particles.filter(particle => {
      particle.life -= deltaTime;
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      particle.velocity.y += particle.gravity * deltaTime;
      particle.opacity = Math.max(0, particle.life / particle.maxLife);
      return particle.life > 0;
    });
  }
  
  updateStateLogic(deltaTime) {
    switch (this.state) {
      case OBJECT_STATES.PLAYING:
        // Auto-fade after playing
        if (this.stateDuration > 500) {
          this.setState(OBJECT_STATES.FADING);
        }
        break;
      case OBJECT_STATES.FADING:
        // Return to idle after fading
        if (this.stateDuration > 1000) {
          this.setState(OBJECT_STATES.IDLE);
        }
        break;
    }
  }
  
  updatePhysics(deltaTime) {
    // Apply acceleration to velocity
    this.velocity3D.x += this.acceleration.x * deltaTime;
    this.velocity3D.y += this.acceleration.y * deltaTime;
    this.velocity3D.z += this.acceleration.z * deltaTime;
    
    // Apply velocity to position (only if not in floating animation)
    if (this.state !== OBJECT_STATES.IDLE) {
      this.position.x += this.velocity3D.x * deltaTime;
      this.position.y += this.velocity3D.y * deltaTime;
      this.position.z += this.velocity3D.z * deltaTime;
    }
    
    // Apply damping
    const damping = 0.98;
    this.velocity3D.x *= damping;
    this.velocity3D.y *= damping;
    this.velocity3D.z *= damping;
  }
  
  // Check if a point is within collision radius
  isCollidingWith(point) {
    if (!this.isInteractable || !this.isActive) return false;
    
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const dz = (point.z || 0) - this.position.z;
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance <= this.collisionRadius;
  }
  
  // Get distance to a point
  getDistanceTo(point) {
    const dx = point.x - this.position.x;
    const dy = point.y - this.position.y;
    const dz = (point.z || 0) - this.position.z;
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  // Handle interaction with hand
  onHandInteraction(handData) {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.lastInteraction < this.interactionCooldown) {
      return false;
    }
    
    this.lastInteraction = now;
    
    // Change state to touched
    this.setState(OBJECT_STATES.TOUCHED);
    
    // Create particle burst
    this.createParticleBurst();
    
    // Trigger sound
    this.triggerSound(handData);
    
    // Call callback
    this.onInteraction(this, handData);
    
    return true;
  }
  
  // Handle hand approaching
  onHandApproaching(handData) {
    if (this.state === OBJECT_STATES.IDLE) {
      this.setState(OBJECT_STATES.APPROACHING);
    }
  }
  
  // Handle hand leaving
  onHandLeaving(handData) {
    if (this.state === OBJECT_STATES.APPROACHING) {
      this.setState(OBJECT_STATES.IDLE);
    }
  }
  
  // Set object state
  setState(newState) {
    if (this.state === newState) return;
    
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    this.stateDuration = 0;
    
    // State-specific logic
    switch (newState) {
      case OBJECT_STATES.TOUCHED:
        this.scale = 1.2;
        break;
      case OBJECT_STATES.PLAYING:
        this.scale = 1.3;
        break;
      case OBJECT_STATES.FADING:
        this.scale = 1.0;
        break;
      case OBJECT_STATES.IDLE:
        this.scale = 1.0;
        break;
    }
    
    // Call callback
    this.onStateChange(this, oldState, newState);
  }
  
  // Create particle burst effect
  createParticleBurst() {
    const particleCount = 8;
    const burstForce = 0.3;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
      
      const particle = {
        position: { ...this.position },
        velocity: {
          x: Math.cos(angle) * Math.cos(elevation) * burstForce,
          y: Math.sin(elevation) * burstForce,
          z: Math.sin(angle) * Math.cos(elevation) * burstForce
        },
        gravity: -0.0005,
        life: 1000 + Math.random() * 1000,
        maxLife: 1000 + Math.random() * 1000,
        opacity: 1.0,
        size: 3 + Math.random() * 4,
        color: this.color,
        type: 'burst'
      };
      
      this.particles.push(particle);
    }
  }
  
  // Trigger sound for this object
  triggerSound(handData) {
    this.setState(OBJECT_STATES.PLAYING);
    
    const soundData = {
      midiNote: this.midiNote,
      noteName: this.noteName,
      octave: this.octave,
      velocity: this.velocity,
      handData: handData,
      object: this
    };
    
    this.onSoundTrigger(soundData);
  }
  
  // Get current visual properties for rendering
  getVisualProperties() {
    return {
      position: this.position,
      size: this.size * this.scale,
      color: this.color,
      glowColor: this.glowColor,
      glowIntensity: this.glowIntensity,
      opacity: this.opacity,
      rotation: this.rotation,
      state: this.state,
      particles: this.particles,
      pulsePhase: this.pulsePhase
    };
  }
  
  // Get musical properties
  getMusicalProperties() {
    return {
      midiNote: this.midiNote,
      noteName: this.noteName,
      octave: this.octave,
      velocity: this.velocity,
      frequency: this.midiToFrequency(this.midiNote)
    };
  }
  
  // Convert MIDI to frequency
  midiToFrequency(midiNote) {
    return MUSICAL_CONSTANTS.A4_FREQUENCY * Math.pow(2, (midiNote - MUSICAL_CONSTANTS.A4_MIDI) / 12);
  }
  
  // Check if object is currently interactable
  canInteract() {
    return this.isInteractable && this.isActive && 
           Date.now() - this.lastInteraction >= this.interactionCooldown;
  }
  
  // Reset object to initial state
  reset() {
    this.setState(OBJECT_STATES.IDLE);
    this.position = { ...this.basePosition };
    this.velocity3D = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.glowIntensity = 0;
    this.scale = 1.0;
    this.particles = [];
    this.lastInteraction = 0;
  }
  
  // Activate object
  activate() {
    this.isActive = true;
    this.setState(OBJECT_STATES.IDLE);
  }
  
  // Deactivate object
  deactivate() {
    this.isActive = false;
    this.particles = [];
    this.glowIntensity = 0;
  }
  
  // Serialize object data
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      size: this.size,
      color: this.color,
      midiNote: this.midiNote,
      noteName: this.noteName,
      octave: this.octave,
      isActive: this.isActive,
      isInteractable: this.isInteractable
    };
  }
  
  // Deserialize object data
  static deserialize(data) {
    return new InteractiveObject({
      id: data.id,
      type: data.type,
      position: data.position,
      size: data.size,
      color: data.color,
      midiNote: data.midiNote,
      noteName: data.noteName,
      octave: data.octave,
      isActive: data.isActive,
      isInteractable: data.isInteractable
    });
  }
}