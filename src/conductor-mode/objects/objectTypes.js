import { InteractiveObject } from './interactiveObject.js';
import { MUSICAL_CONSTANTS } from '../core/musicalConstants.js';

export const OBJECT_TYPES = {
  NOTE: 'note',
  CHORD: 'chord',
  SCALE: 'scale',
  SPECIAL: 'special'
};

export const OBJECT_SHAPES = {
  SPHERE: 'sphere',
  CRYSTAL: 'crystal',
  PATHWAY: 'pathway',
  STAR: 'star',
  CUBE: 'cube'
};

// Base class for note objects (spheres)
export class NoteObject extends InteractiveObject {
  constructor(options = {}) {
    super({
      ...options,
      type: OBJECT_TYPES.NOTE,
      shape: OBJECT_SHAPES.SPHERE,
      size: options.size || NoteObject.getSizeFromPitch(options.midiNote || 60)
    });
    
    this.shape = OBJECT_SHAPES.SPHERE;
    this.color = options.color || this.getNoteColor();
    this.glowColor = options.glowColor || this.color;
    this.floatSpeed = options.floatSpeed || 0.3;
    this.floatAmplitude = options.floatAmplitude || 8;
  }
  
  // Get color based on note
  getNoteColor() {
    const noteColors = {
      'C': '#FF6B6B',   // Red
      'C#': '#FF8E6B',  // Orange-red
      'D': '#FFB56B',   // Orange
      'D#': '#FFDD6B',  // Yellow-orange
      'E': '#F0FF6B',   // Yellow
      'F': '#C8FF6B',   // Yellow-green
      'F#': '#9FFF6B',  // Green
      'G': '#6BFF9F',   // Green-cyan
      'G#': '#6BFFC8',  // Cyan
      'A': '#6BDDFF',   // Blue
      'A#': '#6BB5FF',  // Blue-purple
      'B': '#8E6BFF'    // Purple
    };
    
    return noteColors[this.noteName] || '#667eea';
  }
  
  // Get size based on pitch (higher = larger)
  static getSizeFromPitch(midiNote) {
    const baseSize = 40;
    const sizeMultiplier = (midiNote - 48) / 24; // C3 to C5 range
    return Math.max(30, Math.min(80, baseSize + sizeMultiplier * 20));
  }
  
  // Update with note-specific behavior
  update(deltaTime) {
    super.update(deltaTime);
    
    // Add gentle pulsing based on note frequency
    const frequency = this.midiToFrequency(this.midiNote);
    const pulseFactor = Math.sin(this.pulsePhase * (frequency / 440)) * 0.1 + 1;
    this.scale = this.scale * pulseFactor;
  }
}

// Base class for chord objects (crystals)
export class ChordObject extends InteractiveObject {
  constructor(options = {}) {
    super({
      ...options,
      type: OBJECT_TYPES.CHORD,
      shape: OBJECT_SHAPES.CRYSTAL,
      size: options.size || 80
    });
    
    this.shape = OBJECT_SHAPES.CRYSTAL;
    this.chordType = options.chordType || 'major';
    this.rootNote = options.rootNote || 'C';
    this.chordNotes = options.chordNotes || this.generateChordNotes();
    this.color = options.color || this.getChordColor();
    this.glowColor = options.glowColor || this.color;
    this.rotationSpeed = options.rotationSpeed || 0.5;
    this.facets = options.facets || 8;
    this.floatSpeed = options.floatSpeed || 0.2;
    this.floatAmplitude = options.floatAmplitude || 15;
  }
  
  // Generate chord notes based on type
  generateChordNotes() {
    const chordIntervals = {
      'major': [0, 4, 7],
      'minor': [0, 3, 7],
      'diminished': [0, 3, 6],
      'augmented': [0, 4, 8],
      'major7': [0, 4, 7, 11],
      'minor7': [0, 3, 7, 10],
      'dominant7': [0, 4, 7, 10]
    };
    
    const intervals = chordIntervals[this.chordType] || chordIntervals.major;
    const rootMidi = this.midiNote || 60;
    
    return intervals.map(interval => ({
      midi: rootMidi + interval,
      note: this.midiToNoteName(rootMidi + interval)
    }));
  }
  
  // Get color based on chord type
  getChordColor() {
    const chordColors = {
      'major': '#4ECDC4',     // Warm teal
      'minor': '#45B7D1',     // Cool blue
      'diminished': '#96CEB4', // Pale green
      'augmented': '#FFEAA7',  // Warm yellow
      'major7': '#DDA0DD',     // Plum
      'minor7': '#87CEEB',     // Sky blue
      'dominant7': '#F0A500'   // Orange
    };
    
    return chordColors[this.chordType] || '#4ECDC4';
  }
  
  // Update with chord-specific behavior
  update(deltaTime) {
    super.update(deltaTime);
    
    // Rotate the crystal
    this.rotation += this.rotationSpeed * deltaTime * 0.001;
    if (this.rotation > Math.PI * 2) {
      this.rotation -= Math.PI * 2;
    }
    
    // Shimmer effect
    this.glowIntensity += Math.sin(this.pulsePhase * 2) * 0.1;
  }
  
  // Handle chord interaction
  onHandInteraction(handData) {
    const result = super.onHandInteraction(handData);
    
    if (result) {
      // Play all chord notes
      this.chordNotes.forEach((note, index) => {
        setTimeout(() => {
          this.onSoundTrigger({
            midiNote: note.midi,
            noteName: note.note,
            octave: Math.floor(note.midi / 12) - 1,
            velocity: this.velocity,
            handData: handData,
            object: this,
            isChordNote: true,
            chordIndex: index
          });
        }, index * 50); // Stagger notes slightly
      });
    }
    
    return result;
  }
  
  // Create more intense particle burst for chords
  createParticleBurst() {
    const particleCount = 12;
    const burstForce = 0.4;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.3;
      
      const particle = {
        position: { ...this.position },
        velocity: {
          x: Math.cos(angle) * Math.cos(elevation) * burstForce,
          y: Math.sin(elevation) * burstForce,
          z: Math.sin(angle) * Math.cos(elevation) * burstForce
        },
        gravity: -0.0003,
        life: 1500 + Math.random() * 1000,
        maxLife: 1500 + Math.random() * 1000,
        opacity: 1.0,
        size: 4 + Math.random() * 6,
        color: this.color,
        type: 'shimmer'
      };
      
      this.particles.push(particle);
    }
  }
}

// Base class for scale objects (pathways)
export class ScaleObject extends InteractiveObject {
  constructor(options = {}) {
    super({
      ...options,
      type: OBJECT_TYPES.SCALE,
      shape: OBJECT_SHAPES.PATHWAY,
      size: options.size || 60
    });
    
    this.shape = OBJECT_SHAPES.PATHWAY;
    this.scaleType = options.scaleType || 'major';
    this.rootNote = options.rootNote || 'C';
    this.scaleNotes = options.scaleNotes || this.generateScaleNotes();
    this.color = options.color || this.getScaleColor();
    this.glowColor = options.glowColor || this.color;
    this.pathLength = options.pathLength || 200;
    this.nodeCount = options.nodeCount || this.scaleNotes.length;
    this.floatSpeed = options.floatSpeed || 0.1;
    this.floatAmplitude = options.floatAmplitude || 5;
    this.pulseSpeed = options.pulseSpeed || 1.0;
    this.nodes = this.generatePathNodes();
  }
  
  // Generate scale notes
  generateScaleNotes() {
    const scaleIntervals = {
      'major': [0, 2, 4, 5, 7, 9, 11],
      'minor': [0, 2, 3, 5, 7, 8, 10],
      'pentatonic': [0, 2, 4, 7, 9],
      'blues': [0, 3, 5, 6, 7, 10],
      'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };
    
    const intervals = scaleIntervals[this.scaleType] || scaleIntervals.major;
    const rootMidi = this.midiNote || 60;
    
    return intervals.map(interval => ({
      midi: rootMidi + interval,
      note: this.midiToNoteName(rootMidi + interval)
    }));
  }
  
  // Generate path nodes
  generatePathNodes() {
    const nodes = [];
    const angleStep = (Math.PI * 2) / this.nodeCount;
    
    for (let i = 0; i < this.nodeCount; i++) {
      const angle = i * angleStep;
      const radius = this.pathLength / 2;
      
      nodes.push({
        position: {
          x: this.position.x + Math.cos(angle) * radius,
          y: this.position.y + Math.sin(angle) * radius * 0.5,
          z: this.position.z + Math.sin(angle) * radius * 0.3
        },
        note: this.scaleNotes[i],
        active: false,
        glowIntensity: 0
      });
    }
    
    return nodes;
  }
  
  // Get color based on scale type
  getScaleColor() {
    const scaleColors = {
      'major': '#FFD93D',     // Bright yellow
      'minor': '#6BCF7F',     // Green
      'pentatonic': '#FF6B9D', // Pink
      'blues': '#4D79A4',     // Blue
      'chromatic': '#B4A7D6'   // Purple
    };
    
    return scaleColors[this.scaleType] || '#FFD93D';
  }
  
  // Update with scale-specific behavior
  update(deltaTime) {
    super.update(deltaTime);
    
    // Update nodes
    this.nodes.forEach((node, index) => {
      // Pulse effect that travels along the path
      const pulsePhase = this.pulsePhase + (index * 0.3);
      node.glowIntensity = Math.max(0, Math.sin(pulsePhase) * 0.5 + 0.5);
      
      // Gentle floating motion for nodes
      const time = Date.now() * 0.001;
      node.position.y += Math.sin(time * this.floatSpeed + index) * 0.5;
    });
  }
  
  // Handle scale interaction
  onHandInteraction(handData) {
    const result = super.onHandInteraction(handData);
    
    if (result) {
      // Play scale notes in sequence
      this.scaleNotes.forEach((note, index) => {
        setTimeout(() => {
          this.onSoundTrigger({
            midiNote: note.midi,
            noteName: note.note,
            octave: Math.floor(note.midi / 12) - 1,
            velocity: this.velocity,
            handData: handData,
            object: this,
            isScaleNote: true,
            scaleIndex: index
          });
        }, index * 200); // Stagger notes more for scale
      });
    }
    
    return result;
  }
  
  // Create rainbow particle burst for scales
  createParticleBurst() {
    const particleCount = 16;
    const burstForce = 0.3;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#87CEEB'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.4;
      
      const particle = {
        position: { ...this.position },
        velocity: {
          x: Math.cos(angle) * Math.cos(elevation) * burstForce,
          y: Math.sin(elevation) * burstForce,
          z: Math.sin(angle) * Math.cos(elevation) * burstForce
        },
        gravity: -0.0004,
        life: 2000 + Math.random() * 1000,
        maxLife: 2000 + Math.random() * 1000,
        opacity: 1.0,
        size: 3 + Math.random() * 5,
        color: colors[i % colors.length],
        type: 'rainbow'
      };
      
      this.particles.push(particle);
    }
  }
}

// Factory function to create objects
export class ObjectFactory {
  static createNote(options = {}) {
    return new NoteObject(options);
  }
  
  static createChord(options = {}) {
    return new ChordObject(options);
  }
  
  static createScale(options = {}) {
    return new ScaleObject(options);
  }
  
  static createObject(type, options = {}) {
    switch (type) {
      case OBJECT_TYPES.NOTE:
        return ObjectFactory.createNote(options);
      case OBJECT_TYPES.CHORD:
        return ObjectFactory.createChord(options);
      case OBJECT_TYPES.SCALE:
        return ObjectFactory.createScale(options);
      default:
        return new InteractiveObject(options);
    }
  }
  
  // Create a C major scale setup
  static createCMajorScale(centerPosition = { x: 0, y: 0, z: 0 }) {
    const objects = [];
    const notes = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale
    const radius = 150;
    
    notes.forEach((midi, index) => {
      const angle = (index / notes.length) * Math.PI * 2;
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.3,
        z: centerPosition.z + Math.sin(angle) * radius * 0.2
      };
      
      objects.push(ObjectFactory.createNote({
        midiNote: midi,
        position: position,
        floatOffset: index * 0.5
      }));
    });
    
    return objects;
  }
  
  // Create common chord objects
  static createCommonChords(centerPosition = { x: 0, y: 0, z: 0 }) {
    const objects = [];
    const chords = [
      { root: 'C', type: 'major', midi: 60 },
      { root: 'F', type: 'major', midi: 65 },
      { root: 'G', type: 'major', midi: 67 },
      { root: 'A', type: 'minor', midi: 69 },
      { root: 'D', type: 'minor', midi: 62 },
      { root: 'E', type: 'minor', midi: 64 }
    ];
    
    const radius = 200;
    
    chords.forEach((chord, index) => {
      const angle = (index / chords.length) * Math.PI * 2;
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.4,
        z: centerPosition.z + Math.sin(angle) * radius * 0.3
      };
      
      objects.push(ObjectFactory.createChord({
        midiNote: chord.midi,
        chordType: chord.type,
        rootNote: chord.root,
        position: position,
        floatOffset: index * 0.8
      }));
    });
    
    return objects;
  }
}

// Export all types for external use
export {
  NoteObject,
  ChordObject,
  ScaleObject
};