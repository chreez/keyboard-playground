import { ObjectFactory, OBJECT_TYPES } from './objectTypes.js';
import { MUSICAL_CONSTANTS } from '../core/musicalConstants.js';

export class ObjectPlacementEngine {
  constructor(options = {}) {
    this.canvas = options.canvas || { width: 1920, height: 1080 };
    this.camera = options.camera || { x: 0, y: 0, z: 0 };
    this.comfortZone = options.comfortZone || { radius: 300, depth: 200 };
    this.adaptToPlayerReach = options.adaptToPlayerReach !== false;
    this.minObjectDistance = options.minObjectDistance || 80;
    this.maxObjectDistance = options.maxObjectDistance || 400;
    
    // Layout configurations
    this.layouts = {
      notes: this.createNoteLayouts(),
      chords: this.createChordLayouts(),
      scales: this.createScaleLayouts()
    };
    
    // Current active objects
    this.activeObjects = new Map();
    this.objectGrid = new Map(); // Spatial grid for collision avoidance
    this.gridSize = 100;
    
    // Player adaptation
    this.playerReachHistory = [];
    this.maxReachHistorySize = 20;
    this.adaptationRate = 0.1;
  }
  
  // Create different note arrangement patterns
  createNoteLayouts() {
    return {
      chromatic: this.createChromaticLayout.bind(this),
      scale: this.createScaleLayout.bind(this),
      circle: this.createCircularLayout.bind(this),
      keyboard: this.createKeyboardLayout.bind(this),
      random: this.createRandomLayout.bind(this)
    };
  }
  
  // Create chord arrangement patterns
  createChordLayouts() {
    return {
      circleOfFifths: this.createCircleOfFifthsLayout.bind(this),
      functional: this.createFunctionalHarmonyLayout.bind(this),
      family: this.createChordFamilyLayout.bind(this),
      cluster: this.createChordClusterLayout.bind(this)
    };
  }
  
  // Create scale arrangement patterns
  createScaleLayouts() {
    return {
      linear: this.createLinearScaleLayout.bind(this),
      spiral: this.createSpiralScaleLayout.bind(this),
      modal: this.createModalLayout.bind(this),
      pentatonic: this.createPentatonicLayout.bind(this)
    };
  }
  
  // Chromatic note layout (all 12 notes in a circle)
  createChromaticLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const radius = options.radius || 180;
    const startNote = options.startNote || 60; // Middle C
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.3, // Flatten vertically
        z: centerPosition.z + Math.sin(angle) * radius * 0.2
      };
      
      const midiNote = startNote + i;
      const noteObject = ObjectFactory.createNote({
        midiNote: midiNote,
        position: position,
        floatOffset: i * 0.3
      });
      
      objects.push(noteObject);
    }
    
    return objects;
  }
  
  // Scale layout (7 notes in ascending order)
  createScaleLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const scaleType = options.scaleType || 'major';
    const startNote = options.startNote || 60;
    const spacing = options.spacing || 80;
    
    const scaleIntervals = {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10]
    };
    
    const intervals = scaleIntervals[scaleType] || scaleIntervals.major;
    
    intervals.forEach((interval, index) => {
      const position = {
        x: centerPosition.x + (index - intervals.length / 2) * spacing,
        y: centerPosition.y + index * 20, // Slight ascending slope
        z: centerPosition.z + Math.sin(index * 0.5) * 30
      };
      
      const midiNote = startNote + interval;
      const noteObject = ObjectFactory.createNote({
        midiNote: midiNote,
        position: position,
        floatOffset: index * 0.4
      });
      
      objects.push(noteObject);
    });
    
    return objects;
  }
  
  // Circular layout for any set of notes
  createCircularLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const notes = options.notes || [60, 62, 64, 65, 67, 69, 71];
    const radius = options.radius || 150;
    
    notes.forEach((midiNote, index) => {
      const angle = (index / notes.length) * Math.PI * 2;
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.4,
        z: centerPosition.z + Math.sin(angle) * radius * 0.3
      };
      
      const noteObject = ObjectFactory.createNote({
        midiNote: midiNote,
        position: position,
        floatOffset: index * 0.5
      });
      
      objects.push(noteObject);
    });
    
    return objects;
  }
  
  // Piano keyboard layout (linear arrangement)
  createKeyboardLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const startNote = options.startNote || 60;
    const octaves = options.octaves || 2;
    const keySpacing = options.keySpacing || 40;
    
    for (let octave = 0; octave < octaves; octave++) {
      for (let note = 0; note < 12; note++) {
        const midiNote = startNote + (octave * 12) + note;
        const keyIndex = (octave * 12) + note;
        
        // Position white keys in front, black keys behind
        const isBlackKey = [1, 3, 6, 8, 10].includes(note);
        const position = {
          x: centerPosition.x + (keyIndex * keySpacing) - (octaves * 6 * keySpacing),
          y: centerPosition.y + (isBlackKey ? -30 : 0),
          z: centerPosition.z + (isBlackKey ? 40 : 0)
        };
        
        const noteObject = ObjectFactory.createNote({
          midiNote: midiNote,
          position: position,
          size: isBlackKey ? 35 : 45,
          floatOffset: keyIndex * 0.2
        });
        
        objects.push(noteObject);
      }
    }
    
    return objects;
  }
  
  // Random layout within comfort zone
  createRandomLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const noteCount = options.noteCount || 12;
    const startNote = options.startNote || 60;
    const radius = options.radius || this.comfortZone.radius;
    
    for (let i = 0; i < noteCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const height = (Math.random() - 0.5) * 200;
      
      const position = {
        x: centerPosition.x + Math.cos(angle) * distance,
        y: centerPosition.y + height,
        z: centerPosition.z + Math.sin(angle) * distance * 0.5
      };
      
      const midiNote = startNote + (i % 12);
      const noteObject = ObjectFactory.createNote({
        midiNote: midiNote,
        position: position,
        floatOffset: i * 0.6
      });
      
      objects.push(noteObject);
    }
    
    return objects;
  }
  
  // Circle of fifths layout for chords
  createCircleOfFifthsLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const radius = options.radius || 250;
    
    // Circle of fifths progression
    const fifthsProgression = [
      { root: 'C', midi: 60, type: 'major' },
      { root: 'G', midi: 67, type: 'major' },
      { root: 'D', midi: 62, type: 'major' },
      { root: 'A', midi: 69, type: 'major' },
      { root: 'E', midi: 64, type: 'major' },
      { root: 'B', midi: 71, type: 'major' },
      { root: 'F#', midi: 66, type: 'major' },
      { root: 'C#', midi: 61, type: 'major' },
      { root: 'G#', midi: 68, type: 'major' },
      { root: 'D#', midi: 63, type: 'major' },
      { root: 'A#', midi: 70, type: 'major' },
      { root: 'F', midi: 65, type: 'major' }
    ];
    
    fifthsProgression.forEach((chord, index) => {
      const angle = (index / fifthsProgression.length) * Math.PI * 2;
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.3,
        z: centerPosition.z + Math.sin(angle) * radius * 0.4
      };
      
      const chordObject = ObjectFactory.createChord({
        midiNote: chord.midi,
        chordType: chord.type,
        rootNote: chord.root,
        position: position,
        floatOffset: index * 0.7
      });
      
      objects.push(chordObject);
    });
    
    return objects;
  }
  
  // Functional harmony layout (I-IV-V-vi progression)
  createFunctionalHarmonyLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const key = options.key || 'C';
    const spacing = options.spacing || 120;
    
    // Common chord progressions in key of C
    const chords = [
      { root: 'C', type: 'major', midi: 60, function: 'I' },
      { root: 'F', type: 'major', midi: 65, function: 'IV' },
      { root: 'G', type: 'major', midi: 67, function: 'V' },
      { root: 'A', type: 'minor', midi: 69, function: 'vi' },
      { root: 'D', type: 'minor', midi: 62, function: 'ii' },
      { root: 'E', type: 'minor', midi: 64, function: 'iii' },
      { root: 'B', type: 'diminished', midi: 71, function: 'vii°' }
    ];
    
    chords.forEach((chord, index) => {
      const angle = (index / chords.length) * Math.PI * 2;
      const radius = index < 4 ? 150 : 200; // Inner circle for primary chords
      
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.2,
        z: centerPosition.z + Math.sin(angle) * radius * 0.3
      };
      
      const chordObject = ObjectFactory.createChord({
        midiNote: chord.midi,
        chordType: chord.type,
        rootNote: chord.root,
        position: position,
        floatOffset: index * 0.8
      });
      
      objects.push(chordObject);
    });
    
    return objects;
  }
  
  // Chord family layout (group by type)
  createChordFamilyLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const families = {
      major: { chords: ['C', 'F', 'G'], color: '#4ECDC4', y: 0 },
      minor: { chords: ['A', 'D', 'E'], color: '#45B7D1', y: -80 },
      diminished: { chords: ['B'], color: '#96CEB4', y: 80 }
    };
    
    Object.entries(families).forEach(([type, family]) => {
      family.chords.forEach((root, index) => {
        const position = {
          x: centerPosition.x + (index - 1) * 100,
          y: centerPosition.y + family.y,
          z: centerPosition.z
        };
        
        const midiNote = this.noteNameToMidi(root, 4);
        const chordObject = ObjectFactory.createChord({
          midiNote: midiNote,
          chordType: type,
          rootNote: root,
          position: position,
          color: family.color,
          floatOffset: index * 0.5
        });
        
        objects.push(chordObject);
      });
    });
    
    return objects;
  }
  
  // Chord cluster layout (related chords grouped together)
  createChordClusterLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const clusters = [
      { center: { x: -150, y: 0, z: 0 }, chords: [
        { root: 'C', type: 'major', midi: 60 },
        { root: 'C', type: 'minor', midi: 60 },
        { root: 'C', type: 'major7', midi: 60 }
      ]},
      { center: { x: 0, y: 0, z: 0 }, chords: [
        { root: 'F', type: 'major', midi: 65 },
        { root: 'F', type: 'minor', midi: 65 },
        { root: 'F', type: 'major7', midi: 65 }
      ]},
      { center: { x: 150, y: 0, z: 0 }, chords: [
        { root: 'G', type: 'major', midi: 67 },
        { root: 'G', type: 'dominant7', midi: 67 },
        { root: 'G', type: 'minor', midi: 67 }
      ]}
    ];
    
    clusters.forEach(cluster => {
      cluster.chords.forEach((chord, index) => {
        const angle = (index / cluster.chords.length) * Math.PI * 2;
        const radius = 50;
        
        const position = {
          x: centerPosition.x + cluster.center.x + Math.cos(angle) * radius,
          y: centerPosition.y + cluster.center.y + Math.sin(angle) * radius * 0.5,
          z: centerPosition.z + cluster.center.z + Math.sin(angle) * radius * 0.3
        };
        
        const chordObject = ObjectFactory.createChord({
          midiNote: chord.midi,
          chordType: chord.type,
          rootNote: chord.root,
          position: position,
          floatOffset: index * 0.3
        });
        
        objects.push(chordObject);
      });
    });
    
    return objects;
  }
  
  // Linear scale layout
  createLinearScaleLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const scaleType = options.scaleType || 'major';
    const spacing = options.spacing || 80;
    
    const scaleObject = ObjectFactory.createScale({
      scaleType: scaleType,
      position: centerPosition,
      pathLength: spacing * 7,
      floatOffset: 0
    });
    
    objects.push(scaleObject);
    
    return objects;
  }
  
  // Spiral scale layout
  createSpiralScaleLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const scales = ['major', 'minor', 'pentatonic', 'blues'];
    const radius = options.radius || 200;
    
    scales.forEach((scaleType, index) => {
      const angle = (index / scales.length) * Math.PI * 2;
      const spiralRadius = radius + (index * 50);
      
      const position = {
        x: centerPosition.x + Math.cos(angle) * spiralRadius,
        y: centerPosition.y + (index * 30),
        z: centerPosition.z + Math.sin(angle) * spiralRadius
      };
      
      const scaleObject = ObjectFactory.createScale({
        scaleType: scaleType,
        position: position,
        floatOffset: index * 1.2
      });
      
      objects.push(scaleObject);
    });
    
    return objects;
  }
  
  // Modal layout (different modes of major scale)
  createModalLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const modes = [
      { name: 'ionian', intervals: [0, 2, 4, 5, 7, 9, 11] },
      { name: 'dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
      { name: 'phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
      { name: 'lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
      { name: 'mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
      { name: 'aeolian', intervals: [0, 2, 3, 5, 7, 8, 10] },
      { name: 'locrian', intervals: [0, 1, 3, 5, 6, 8, 10] }
    ];
    
    modes.forEach((mode, index) => {
      const angle = (index / modes.length) * Math.PI * 2;
      const radius = 250;
      
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.3,
        z: centerPosition.z + Math.sin(angle) * radius * 0.4
      };
      
      const scaleObject = ObjectFactory.createScale({
        scaleType: mode.name,
        position: position,
        floatOffset: index * 0.9
      });
      
      objects.push(scaleObject);
    });
    
    return objects;
  }
  
  // Pentatonic layout
  createPentatonicLayout(centerPosition = { x: 0, y: 0, z: 0 }, options = {}) {
    const objects = [];
    const pentatonicScales = [
      { root: 'C', type: 'major' },
      { root: 'G', type: 'major' },
      { root: 'D', type: 'major' },
      { root: 'A', type: 'minor' },
      { root: 'E', type: 'minor' }
    ];
    
    pentatonicScales.forEach((scale, index) => {
      const angle = (index / pentatonicScales.length) * Math.PI * 2;
      const radius = 180;
      
      const position = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius * 0.4,
        z: centerPosition.z + Math.sin(angle) * radius * 0.2
      };
      
      const scaleObject = ObjectFactory.createScale({
        scaleType: 'pentatonic',
        rootNote: scale.root,
        position: position,
        floatOffset: index * 0.7
      });
      
      objects.push(scaleObject);
    });
    
    return objects;
  }
  
  // Adaptive placement based on player reach
  adaptPlacementToPlayer(handPositions) {
    if (!this.adaptToPlayerReach || !handPositions || handPositions.length === 0) {
      return;
    }
    
    // Track player reach
    handPositions.forEach(hand => {
      if (hand.landmarks && hand.landmarks.length > 0) {
        const wrist = hand.landmarks[0];
        this.playerReachHistory.push({
          x: wrist.x * this.canvas.width,
          y: wrist.y * this.canvas.height,
          z: wrist.z * 100, // Approximate depth
          timestamp: Date.now()
        });
      }
    });
    
    // Limit history size
    if (this.playerReachHistory.length > this.maxReachHistorySize) {
      this.playerReachHistory.shift();
    }
    
    // Calculate comfort zone
    if (this.playerReachHistory.length >= 5) {
      this.updateComfortZone();
    }
  }
  
  // Update comfort zone based on player movement
  updateComfortZone() {
    const recent = this.playerReachHistory.slice(-10);
    
    // Calculate average position
    const avg = recent.reduce((acc, pos) => ({
      x: acc.x + pos.x / recent.length,
      y: acc.y + pos.y / recent.length,
      z: acc.z + pos.z / recent.length
    }), { x: 0, y: 0, z: 0 });
    
    // Calculate max reach
    const maxReach = Math.max(...recent.map(pos => 
      Math.sqrt(
        Math.pow(pos.x - avg.x, 2) + 
        Math.pow(pos.y - avg.y, 2) + 
        Math.pow(pos.z - avg.z, 2)
      )
    ));
    
    // Adapt comfort zone gradually
    this.comfortZone.radius = this.comfortZone.radius * (1 - this.adaptationRate) + 
                              (maxReach * 1.2) * this.adaptationRate;
    
    // Reposition objects if needed
    this.repositionObjectsInComfortZone(avg);
  }
  
  // Reposition objects to stay within comfort zone
  repositionObjectsInComfortZone(centerPosition) {
    this.activeObjects.forEach((object, id) => {
      const distance = Math.sqrt(
        Math.pow(object.position.x - centerPosition.x, 2) + 
        Math.pow(object.position.y - centerPosition.y, 2) + 
        Math.pow(object.position.z - centerPosition.z, 2)
      );
      
      if (distance > this.comfortZone.radius) {
        // Move object closer
        const factor = this.comfortZone.radius / distance;
        object.basePosition.x = centerPosition.x + (object.position.x - centerPosition.x) * factor;
        object.basePosition.y = centerPosition.y + (object.position.y - centerPosition.y) * factor;
        object.basePosition.z = centerPosition.z + (object.position.z - centerPosition.z) * factor;
      }
    });
  }
  
  // Check for object collisions and maintain minimum distances
  avoidObjectCollisions(objects) {
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i];
        const obj2 = objects[j];
        
        const distance = Math.sqrt(
          Math.pow(obj2.position.x - obj1.position.x, 2) + 
          Math.pow(obj2.position.y - obj1.position.y, 2) + 
          Math.pow(obj2.position.z - obj1.position.z, 2)
        );
        
        if (distance < this.minObjectDistance) {
          // Move objects apart
          const midpoint = {
            x: (obj1.position.x + obj2.position.x) / 2,
            y: (obj1.position.y + obj2.position.y) / 2,
            z: (obj1.position.z + obj2.position.z) / 2
          };
          
          const separation = this.minObjectDistance / 2;
          const direction1 = this.normalizeVector({
            x: obj1.position.x - midpoint.x,
            y: obj1.position.y - midpoint.y,
            z: obj1.position.z - midpoint.z
          });
          
          const direction2 = this.normalizeVector({
            x: obj2.position.x - midpoint.x,
            y: obj2.position.y - midpoint.y,
            z: obj2.position.z - midpoint.z
          });
          
          obj1.basePosition.x = midpoint.x + direction1.x * separation;
          obj1.basePosition.y = midpoint.y + direction1.y * separation;
          obj1.basePosition.z = midpoint.z + direction1.z * separation;
          
          obj2.basePosition.x = midpoint.x + direction2.x * separation;
          obj2.basePosition.y = midpoint.y + direction2.y * separation;
          obj2.basePosition.z = midpoint.z + direction2.z * separation;
        }
      }
    }
  }
  
  // Normalize a vector
  normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (length === 0) return { x: 1, y: 0, z: 0 };
    
    return {
      x: vector.x / length,
      y: vector.y / length,
      z: vector.z / length
    };
  }
  
  // Convert note name to MIDI number
  noteNameToMidi(noteName, octave = 4) {
    const noteMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    return (octave + 1) * 12 + noteMap[noteName];
  }
  
  // Place objects using specified layout
  placeObjects(layoutType, objectType, centerPosition, options = {}) {
    const layoutCategory = objectType === OBJECT_TYPES.NOTE ? 'notes' :
                          objectType === OBJECT_TYPES.CHORD ? 'chords' :
                          objectType === OBJECT_TYPES.SCALE ? 'scales' : 'notes';
    
    const layoutFunction = this.layouts[layoutCategory][layoutType];
    if (!layoutFunction) {
      console.warn(`Layout ${layoutType} not found for ${objectType}`);
      return [];
    }
    
    const objects = layoutFunction(centerPosition, options);
    
    // Avoid collisions
    this.avoidObjectCollisions(objects);
    
    // Add to active objects
    objects.forEach(obj => {
      this.activeObjects.set(obj.id, obj);
    });
    
    return objects;
  }
  
  // Remove objects
  removeObjects(objectIds) {
    objectIds.forEach(id => {
      this.activeObjects.delete(id);
    });
  }
  
  // Clear all objects
  clearAllObjects() {
    this.activeObjects.clear();
  }
  
  // Get objects within a region
  getObjectsInRegion(center, radius) {
    const objectsInRegion = [];
    
    this.activeObjects.forEach(obj => {
      const distance = Math.sqrt(
        Math.pow(obj.position.x - center.x, 2) + 
        Math.pow(obj.position.y - center.y, 2) + 
        Math.pow(obj.position.z - center.z, 2)
      );
      
      if (distance <= radius) {
        objectsInRegion.push(obj);
      }
    });
    
    return objectsInRegion;
  }
  
  // Get all active objects
  getAllObjects() {
    return Array.from(this.activeObjects.values());
  }
  
  // Update object positions (call this each frame)
  update(deltaTime, handPositions = []) {
    // Adapt to player
    this.adaptPlacementToPlayer(handPositions);
    
    // Update all objects
    this.activeObjects.forEach(obj => {
      obj.update(deltaTime);
    });
  }
}