import { MUSICAL_CONSTANTS } from './musicalConstants.js';

export class HandNoteMapper {
  constructor() {
    this.leftHandRange = MUSICAL_CONSTANTS.HAND_RANGES.left;
    this.rightHandRange = MUSICAL_CONSTANTS.HAND_RANGES.right;
    this.smoothingFactor = 0.8; // For smooth note transitions
    this.velocityRange = { min: 0.1, max: 1.0 };
    
    // Store previous values for smoothing
    this.previousMappings = {
      left: { midi: null, velocity: 0 },
      right: { midi: null, velocity: 0 }
    };
  }

  // Map hand position to MIDI note
  mapHandToNote(handLandmarks, handedness, frameWidth, frameHeight) {
    if (!handLandmarks || handLandmarks.length === 0) {
      return null;
    }

    // Get key landmarks
    const indexTip = handLandmarks[8]; // Index finger tip
    const palmCenter = this.calculatePalmCenter(handLandmarks);
    const handTop = this.findHandTop(handLandmarks);
    const handBottom = this.findHandBottom(handLandmarks);

    // Normalize coordinates (0-1 range)
    const x = indexTip.x;
    const y = indexTip.y;
    const z = indexTip.z || 0; // Z coordinate for velocity/volume

    // Calculate hand height for octave selection
    const handHeight = Math.abs(handTop.y - handBottom.y);
    const relativeY = (y - handTop.y) / handHeight;

    // Get hand range based on handedness
    const range = handedness === 'Left' ? this.leftHandRange : this.rightHandRange;
    
    // Map X coordinate to note within octave (0-11 semitones)
    const noteInOctave = Math.floor(x * 12);
    
    // Map Y coordinate to octave within range
    const octaveOffset = Math.floor(relativeY * range.octaves);
    
    // Calculate final MIDI note
    const midiNote = range.startMidi + (octaveOffset * 12) + noteInOctave;
    
    // Clamp to valid range
    const clampedMidi = Math.max(range.startMidi, Math.min(range.endMidi, midiNote));
    
    // Calculate velocity based on Z coordinate and hand confidence
    const velocity = this.calculateVelocity(z, handLandmarks);
    
    // Apply smoothing
    const smoothedMapping = this.applySmoothing(clampedMidi, velocity, handedness);
    
    return {
      midi: smoothedMapping.midi,
      velocity: smoothedMapping.velocity,
      note: this.midiToNoteName(smoothedMapping.midi),
      octave: Math.floor(smoothedMapping.midi / 12) - 1,
      handedness,
      position: { x, y, z },
      palmCenter,
      confidence: this.calculateHandConfidence(handLandmarks)
    };
  }

  // Calculate palm center from landmarks
  calculatePalmCenter(landmarks) {
    // Use key palm landmarks (0, 5, 9, 13, 17)
    const palmLandmarks = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
    
    let x = 0, y = 0, z = 0;
    palmLandmarks.forEach(landmark => {
      x += landmark.x;
      y += landmark.y;
      z += landmark.z || 0;
    });
    
    return {
      x: x / palmLandmarks.length,
      y: y / palmLandmarks.length,
      z: z / palmLandmarks.length
    };
  }

  // Find the topmost point of the hand
  findHandTop(landmarks) {
    return landmarks.reduce((top, landmark) => 
      landmark.y < top.y ? landmark : top
    );
  }

  // Find the bottommost point of the hand
  findHandBottom(landmarks) {
    return landmarks.reduce((bottom, landmark) => 
      landmark.y > bottom.y ? landmark : bottom
    );
  }

  // Calculate velocity based on Z coordinate and hand activity
  calculateVelocity(z, landmarks) {
    // Base velocity from Z coordinate (closer = louder)
    const baseVelocity = Math.max(0.1, Math.min(1.0, 1.0 - Math.abs(z)));
    
    // Add hand activity factor (more movement = more velocity)
    const activity = this.calculateHandActivity(landmarks);
    const activityBoost = activity * 0.3; // Up to 30% boost
    
    return Math.max(this.velocityRange.min, 
           Math.min(this.velocityRange.max, baseVelocity + activityBoost));
  }

  // Calculate hand activity level based on finger positions
  calculateHandActivity(landmarks) {
    // Simple activity measure based on finger spread
    const fingers = {
      thumb: [landmarks[1], landmarks[2], landmarks[3], landmarks[4]],
      index: [landmarks[5], landmarks[6], landmarks[7], landmarks[8]],
      middle: [landmarks[9], landmarks[10], landmarks[11], landmarks[12]],
      ring: [landmarks[13], landmarks[14], landmarks[15], landmarks[16]],
      pinky: [landmarks[17], landmarks[18], landmarks[19], landmarks[20]]
    };
    
    let totalActivity = 0;
    let fingerCount = 0;
    
    Object.values(fingers).forEach(finger => {
      const spread = this.calculateFingerSpread(finger);
      totalActivity += spread;
      fingerCount++;
    });
    
    return totalActivity / fingerCount;
  }

  // Calculate finger spread (extension)
  calculateFingerSpread(fingerLandmarks) {
    if (fingerLandmarks.length < 4) return 0;
    
    const base = fingerLandmarks[0];
    const tip = fingerLandmarks[3];
    
    return Math.sqrt(
      Math.pow(tip.x - base.x, 2) + 
      Math.pow(tip.y - base.y, 2)
    );
  }

  // Calculate overall hand confidence
  calculateHandConfidence(landmarks) {
    // Simple confidence based on landmark consistency
    // In a real implementation, you'd use MediaPipe's confidence scores
    return 0.8; // Placeholder
  }

  // Apply smoothing to reduce jittery note changes
  applySmoothing(midi, velocity, handedness) {
    const previous = this.previousMappings[handedness.toLowerCase()];
    
    let smoothedMidi = midi;
    let smoothedVelocity = velocity;
    
    if (previous.midi !== null) {
      // Only smooth if the change is small (within 2 semitones)
      const midiDiff = Math.abs(midi - previous.midi);
      if (midiDiff <= 2) {
        smoothedMidi = Math.round(
          previous.midi * this.smoothingFactor + 
          midi * (1 - this.smoothingFactor)
        );
      }
      
      smoothedVelocity = 
        previous.velocity * this.smoothingFactor + 
        velocity * (1 - this.smoothingFactor);
    }
    
    // Update previous values
    this.previousMappings[handedness.toLowerCase()] = {
      midi: smoothedMidi,
      velocity: smoothedVelocity
    };
    
    return { midi: smoothedMidi, velocity: smoothedVelocity };
  }

  // Convert MIDI number to note name
  midiToNoteName(midiNumber) {
    const noteIndex = midiNumber % 12;
    return MUSICAL_CONSTANTS.NOTE_NAMES[noteIndex];
  }

  // Get visual position for note display
  getVisualPosition(noteMapping, canvasWidth, canvasHeight) {
    if (!noteMapping) return null;
    
    const { handedness, position } = noteMapping;
    const handArea = handedness === 'Left' ? 
      { x: 0, y: 0, width: canvasWidth / 2, height: canvasHeight } :
      { x: canvasWidth / 2, y: 0, width: canvasWidth / 2, height: canvasHeight };
    
    return {
      x: handArea.x + position.x * handArea.width,
      y: handArea.y + position.y * handArea.height,
      area: handArea
    };
  }

  // Check if note should be triggered (based on gesture or position)
  shouldTriggerNote(noteMapping, gestureState) {
    if (!noteMapping) return false;
    
    // Trigger on specific gestures or high confidence
    const triggerGestures = ['point', 'palm', 'peace'];
    const gestureMatch = triggerGestures.includes(gestureState?.type);
    const highConfidence = noteMapping.confidence > 0.7;
    const goodVelocity = noteMapping.velocity > 0.2;
    
    return gestureMatch && highConfidence && goodVelocity;
  }

  // Get note range information for display
  getNoteRangeInfo(handedness) {
    const range = handedness === 'Left' ? this.leftHandRange : this.rightHandRange;
    return {
      startNote: range.startNote,
      endNote: range.endNote,
      startMidi: range.startMidi,
      endMidi: range.endMidi,
      octaves: range.octaves,
      totalNotes: range.endMidi - range.startMidi + 1
    };
  }

  // Reset smoothing state
  reset() {
    this.previousMappings = {
      left: { midi: null, velocity: 0 },
      right: { midi: null, velocity: 0 }
    };
  }
}