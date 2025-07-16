// Musical constants for theory calculations
export const MUSICAL_CONSTANTS = {
  // Note names in chromatic order
  NOTE_NAMES: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  
  // Frequency of A4 (440 Hz)
  A4_FREQUENCY: 440,
  
  // MIDI note number for A4
  A4_MIDI: 69,
  
  // Semitones in an octave
  SEMITONES_PER_OCTAVE: 12,
  
  // Hand range mappings
  HAND_RANGES: {
    left: {
      startNote: 'C2',
      endNote: 'B3',
      startMidi: 36,
      endMidi: 59,
      octaves: 2
    },
    right: {
      startNote: 'C4',
      endNote: 'B5',
      startMidi: 60,
      endMidi: 83,
      octaves: 2
    }
  }
};

// Interval definitions
export const INTERVALS = {
  0: { name: 'Unison', shortName: 'P1', quality: 'Perfect', emoji: '👯', color: '#FFD700' },
  1: { name: 'Minor Second', shortName: 'm2', quality: 'Minor', emoji: '👟', color: '#FF6B6B' },
  2: { name: 'Major Second', shortName: 'M2', quality: 'Major', emoji: '👠', color: '#4ECDC4' },
  3: { name: 'Minor Third', shortName: 'm3', quality: 'Minor', emoji: '🔺', color: '#45B7D1' },
  4: { name: 'Major Third', shortName: 'M3', quality: 'Major', emoji: '🔴', color: '#96CEB4' },
  5: { name: 'Perfect Fourth', shortName: 'P4', quality: 'Perfect', emoji: '🏠', color: '#FECA57' },
  6: { name: 'Tritone', shortName: 'TT', quality: 'Diminished', emoji: '🌶️', color: '#FF9FF3' },
  7: { name: 'Perfect Fifth', shortName: 'P5', quality: 'Perfect', emoji: '⭐', color: '#54A0FF' },
  8: { name: 'Minor Sixth', shortName: 'm6', quality: 'Minor', emoji: '🌸', color: '#5F27CD' },
  9: { name: 'Major Sixth', shortName: 'M6', quality: 'Major', emoji: '🌺', color: '#00D2D3' },
  10: { name: 'Minor Seventh', shortName: 'm7', quality: 'Minor', emoji: '🌶️', color: '#FF6348' },
  11: { name: 'Major Seventh', shortName: 'M7', quality: 'Major', emoji: '🔥', color: '#FF4757' },
  12: { name: 'Octave', shortName: 'P8', quality: 'Perfect', emoji: '🎯', color: '#3742FA' }
};

// Chord definitions
export const CHORD_TYPES = {
  major: {
    name: 'Major',
    intervals: [0, 4, 7],
    symbol: '',
    emoji: '😊',
    color: '#FFD700',
    description: 'Happy and bright'
  },
  minor: {
    name: 'Minor',
    intervals: [0, 3, 7],
    symbol: 'm',
    emoji: '😢',
    color: '#87CEEB',
    description: 'Sad and melancholic'
  },
  diminished: {
    name: 'Diminished',
    intervals: [0, 3, 6],
    symbol: 'dim',
    emoji: '😰',
    color: '#FF6B6B',
    description: 'Tense and unstable'
  },
  augmented: {
    name: 'Augmented',
    intervals: [0, 4, 8],
    symbol: 'aug',
    emoji: '😲',
    color: '#FF9FF3',
    description: 'Mysterious and dreamy'
  },
  sus2: {
    name: 'Suspended 2nd',
    intervals: [0, 2, 7],
    symbol: 'sus2',
    emoji: '🤔',
    color: '#96CEB4',
    description: 'Floating and unresolved'
  },
  sus4: {
    name: 'Suspended 4th',
    intervals: [0, 5, 7],
    symbol: 'sus4',
    emoji: '🤷',
    color: '#FECA57',
    description: 'Anticipating resolution'
  }
};

// Scale definitions
export const SCALES = {
  major: {
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    emoji: '🌈',
    color: '#FFD700',
    description: 'Happy and bright'
  },
  minor: {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    emoji: '🌙',
    color: '#87CEEB',
    description: 'Sad and contemplative'
  },
  pentatonic: {
    name: 'Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    emoji: '⭐',
    color: '#96CEB4',
    description: 'Universal and melodic'
  },
  blues: {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    emoji: '😎',
    color: '#4ECDC4',
    description: 'Soulful and expressive'
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    emoji: '🎭',
    color: '#45B7D1',
    description: 'Jazzy and sophisticated'
  }
};

// Teaching moments based on discoveries
export const TEACHING_MOMENTS = {
  firstMajorChord: {
    message: "🎉 You found your first major chord! Major chords sound happy because they use the pattern Root + 4 semitones + 3 semitones!",
    celebration: ['🎵', '🎶', '✨', '🌟']
  },
  firstMinorChord: {
    message: "😢 That's a minor chord! Minor chords sound sad because they use Root + 3 semitones + 4 semitones - just one note different from major!",
    celebration: ['🎵', '🎶', '💙', '🌙']
  },
  perfectFifth: {
    message: "⭐ Perfect fifth! That's the same interval as the Star Wars theme - it sounds strong and stable!",
    celebration: ['⭐', '🎬', '🎵']
  },
  octave: {
    message: "🎯 Octave! These notes sound the same but one is exactly twice the frequency of the other - musical math!",
    celebration: ['🎯', '🔢', '🎵']
  },
  tritone: {
    message: "🌶️ Spicy! That's a tritone - it was called 'the devil's interval' in medieval times because it sounds so tense!",
    celebration: ['🌶️', '😈', '🎵']
  }
};