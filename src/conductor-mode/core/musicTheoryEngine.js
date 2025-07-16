import { MUSICAL_CONSTANTS, INTERVALS, CHORD_TYPES, SCALES, TEACHING_MOMENTS } from './musicalConstants.js';

export class MusicTheoryEngine {
  constructor() {
    this.activeNotes = new Map(); // Map of note -> timestamp
    this.recentHistory = []; // Array of {notes, timestamp, analysis}
    this.discoveries = new Set(); // Track what player has discovered
    this.currentAnalysis = null;
    this.analysisCache = new Map(); // Cache for performance
  }

  // Convert MIDI note number to note name and octave
  midiToNote(midiNumber) {
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    const noteName = MUSICAL_CONSTANTS.NOTE_NAMES[noteIndex];
    return { name: noteName, octave, midi: midiNumber };
  }

  // Convert note name and octave to MIDI number
  noteToMidi(noteName, octave) {
    const noteIndex = MUSICAL_CONSTANTS.NOTE_NAMES.indexOf(noteName);
    if (noteIndex === -1) throw new Error(`Invalid note name: ${noteName}`);
    return (octave + 1) * 12 + noteIndex;
  }

  // Calculate frequency from MIDI note number
  midiToFrequency(midiNumber) {
    return MUSICAL_CONSTANTS.A4_FREQUENCY * Math.pow(2, (midiNumber - MUSICAL_CONSTANTS.A4_MIDI) / 12);
  }

  // Calculate interval in semitones between two MIDI notes
  calculateInterval(midi1, midi2) {
    return Math.abs(midi2 - midi1) % 12;
  }

  // Get interval information
  getIntervalInfo(midi1, midi2) {
    const semitones = this.calculateInterval(midi1, midi2);
    return INTERVALS[semitones];
  }

  // Analyze a set of notes for chords
  analyzeChord(midiNotes) {
    if (midiNotes.length < 3) return null;

    // Sort notes and reduce to unique pitch classes
    const sortedNotes = [...midiNotes].sort((a, b) => a - b);
    const pitchClasses = [...new Set(sortedNotes.map(midi => midi % 12))].sort((a, b) => a - b);
    
    if (pitchClasses.length < 3) return null;

    // Calculate intervals from root
    const root = pitchClasses[0];
    const intervals = pitchClasses.map(pc => (pc - root + 12) % 12);

    // Check against known chord types
    for (const [type, chordData] of Object.entries(CHORD_TYPES)) {
      if (this.intervalsMatch(intervals, chordData.intervals)) {
        const rootNote = this.midiToNote(root + 60); // Add octave for display
        return {
          type,
          root: rootNote.name,
          ...chordData,
          notes: pitchClasses.map(pc => this.midiToNote(pc + 60).name)
        };
      }
    }

    return null; // No chord match found
  }

  // Helper to check if intervals match a chord pattern
  intervalsMatch(intervals1, intervals2) {
    if (intervals1.length !== intervals2.length) return false;
    return intervals1.every((interval, i) => interval === intervals2[i]);
  }

  // Analyze a sequence of notes for scale patterns
  analyzeScale(midiNotes) {
    if (midiNotes.length < 5) return null;

    // Get unique pitch classes in order
    const pitchClasses = [...new Set(midiNotes.map(midi => midi % 12))];
    if (pitchClasses.length < 5) return null;

    // Sort by pitch class
    pitchClasses.sort((a, b) => a - b);
    
    // Calculate intervals from first note
    const root = pitchClasses[0];
    const intervals = pitchClasses.map(pc => (pc - root + 12) % 12);

    // Check against known scales
    for (const [type, scaleData] of Object.entries(SCALES)) {
      if (this.scaleMatches(intervals, scaleData.intervals)) {
        const rootNote = this.midiToNote(root + 60);
        return {
          type,
          root: rootNote.name,
          ...scaleData,
          notes: pitchClasses.map(pc => this.midiToNote(pc + 60).name)
        };
      }
    }

    return null;
  }

  // Helper to check if a sequence matches a scale pattern
  scaleMatches(intervals, scaleIntervals) {
    // Check if intervals are a subset of scale intervals
    return intervals.every(interval => scaleIntervals.includes(interval));
  }

  // Main analysis function - call this with current active notes
  analyzeCurrentNotes(midiNotes, timestamp = Date.now()) {
    const cacheKey = midiNotes.sort().join(',');
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const analysis = {
      timestamp,
      notes: midiNotes.map(midi => this.midiToNote(midi)),
      intervals: [],
      chord: null,
      scale: null,
      discoveries: []
    };

    // Analyze intervals between all pairs of notes
    for (let i = 0; i < midiNotes.length; i++) {
      for (let j = i + 1; j < midiNotes.length; j++) {
        const intervalInfo = this.getIntervalInfo(midiNotes[i], midiNotes[j]);
        analysis.intervals.push({
          note1: midiNotes[i],
          note2: midiNotes[j],
          ...intervalInfo
        });
      }
    }

    // Analyze chord
    analysis.chord = this.analyzeChord(midiNotes);

    // Analyze scale (use recent history for better context)
    const recentNotes = this.getRecentNotes(5000); // Last 5 seconds
    analysis.scale = this.analyzeScale([...midiNotes, ...recentNotes]);

    // Check for new discoveries
    analysis.discoveries = this.checkForDiscoveries(analysis);

    // Cache the result
    this.analysisCache.set(cacheKey, analysis);

    // Store in history
    this.recentHistory.push(analysis);
    this.currentAnalysis = analysis;

    // Clean up old history (keep last 100 entries)
    if (this.recentHistory.length > 100) {
      this.recentHistory.shift();
    }

    return analysis;
  }

  // Get recent notes from history
  getRecentNotes(timeWindowMs) {
    const cutoff = Date.now() - timeWindowMs;
    return this.recentHistory
      .filter(entry => entry.timestamp > cutoff)
      .flatMap(entry => entry.notes.map(note => note.midi));
  }

  // Check for new discoveries and generate teaching moments
  checkForDiscoveries(analysis) {
    const discoveries = [];

    // Check chord discoveries
    if (analysis.chord) {
      const chordKey = `chord_${analysis.chord.type}`;
      if (!this.discoveries.has(chordKey)) {
        this.discoveries.add(chordKey);
        discoveries.push({
          type: 'chord',
          subtype: analysis.chord.type,
          message: this.getTeachingMoment(analysis.chord.type),
          celebration: true
        });
      }
    }

    // Check interval discoveries
    analysis.intervals.forEach(interval => {
      const intervalKey = `interval_${interval.shortName}`;
      if (!this.discoveries.has(intervalKey)) {
        this.discoveries.add(intervalKey);
        discoveries.push({
          type: 'interval',
          subtype: interval.shortName,
          message: this.getTeachingMoment(interval.shortName),
          celebration: true
        });
      }
    });

    // Check scale discoveries
    if (analysis.scale) {
      const scaleKey = `scale_${analysis.scale.type}`;
      if (!this.discoveries.has(scaleKey)) {
        this.discoveries.add(scaleKey);
        discoveries.push({
          type: 'scale',
          subtype: analysis.scale.type,
          message: this.getTeachingMoment(analysis.scale.type),
          celebration: true
        });
      }
    }

    return discoveries;
  }

  // Generate teaching moments based on discoveries
  getTeachingMoment(discoveryType) {
    const teachingMoments = {
      major: TEACHING_MOMENTS.firstMajorChord,
      minor: TEACHING_MOMENTS.firstMinorChord,
      P5: TEACHING_MOMENTS.perfectFifth,
      P8: TEACHING_MOMENTS.octave,
      TT: TEACHING_MOMENTS.tritone
    };

    return teachingMoments[discoveryType] || {
      message: `🎵 Nice! You discovered ${discoveryType}!`,
      celebration: ['🎵', '🎶', '✨']
    };
  }

  // Get progress statistics
  getProgressStats() {
    const totalIntervals = Object.keys(INTERVALS).length;
    const totalChords = Object.keys(CHORD_TYPES).length;
    const totalScales = Object.keys(SCALES).length;

    const discoveredIntervals = [...this.discoveries].filter(d => d.startsWith('interval_')).length;
    const discoveredChords = [...this.discoveries].filter(d => d.startsWith('chord_')).length;
    const discoveredScales = [...this.discoveries].filter(d => d.startsWith('scale_')).length;

    return {
      intervals: { discovered: discoveredIntervals, total: totalIntervals },
      chords: { discovered: discoveredChords, total: totalChords },
      scales: { discovered: discoveredScales, total: totalScales },
      overall: {
        discovered: this.discoveries.size,
        total: totalIntervals + totalChords + totalScales
      }
    };
  }

  // Clear history and reset (useful for testing)
  reset() {
    this.activeNotes.clear();
    this.recentHistory = [];
    this.discoveries.clear();
    this.currentAnalysis = null;
    this.analysisCache.clear();
  }

  // Get current analysis for display
  getCurrentAnalysis() {
    return this.currentAnalysis;
  }

  // Get all discoveries for display
  getAllDiscoveries() {
    return [...this.discoveries];
  }
}