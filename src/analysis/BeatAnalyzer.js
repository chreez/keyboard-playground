class BeatAnalyzer {
  constructor() {
    this.measureDuration = 4000; // 4 seconds per measure
    this.keyPresses = []; // Array of {timestamp, key, note} objects
    this.measures = []; // Array of analyzed measures
    this.maxMeasures = 5; // Keep last 5 measures for trend analysis
    this.lastAnalysis = 0;
    this.analysisInterval = 500; // Analyze every 500ms
    this.currentTheme = 1; // 1 for animal sounds, 2 for musical
  }

  setTheme(theme) {
    this.currentTheme = theme;
  }

  recordKeyPress(key, note = null) {
    const timestamp = Date.now();
    
    // Add to current keypresses
    this.keyPresses.push({
      timestamp,
      key,
      note, // For musical analysis (Theme 2)
      theme: this.currentTheme
    });

    // Clean up old keypresses (older than 2 measures)
    const cleanupTime = timestamp - (this.measureDuration * 2);
    this.keyPresses = this.keyPresses.filter(kp => kp.timestamp > cleanupTime);

    // Trigger analysis if enough time has passed
    if (timestamp - this.lastAnalysis > this.analysisInterval) {
      this.analyzeCurrentPattern();
      this.lastAnalysis = timestamp;
    }
  }

  analyzeCurrentPattern() {
    const now = Date.now();
    const measureStart = now - this.measureDuration;
    
    // Get keypresses from current measure
    const currentMeasureKeys = this.keyPresses.filter(kp => kp.timestamp >= measureStart);
    
    if (currentMeasureKeys.length === 0) {
      return this.createEmptyMeasure();
    }

    // Calculate basic rhythm metrics
    const analysis = {
      timestamp: now,
      duration: this.measureDuration,
      keyCount: currentMeasureKeys.length,
      tempo: this.calculateTempo(currentMeasureKeys),
      intensity: this.calculateIntensity(currentMeasureKeys),
      rhythmVariance: this.calculateRhythmVariance(currentMeasureKeys),
      burstPatterns: this.detectBurstPatterns(currentMeasureKeys),
      theme: this.currentTheme
    };

    // Add musical analysis for Theme 2
    if (this.currentTheme === 2) {
      analysis.musical = this.analyzeMusicalContent(currentMeasureKeys);
    }

    // Add to measures history
    this.measures.push(analysis);
    if (this.measures.length > this.maxMeasures) {
      this.measures.shift();
    }

    return analysis;
  }

  calculateTempo(keys) {
    if (keys.length < 2) return 0;
    
    // Calculate average time between keypresses
    const intervals = [];
    for (let i = 1; i < keys.length; i++) {
      intervals.push(keys[i].timestamp - keys[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Convert to beats per minute (60000ms = 1 minute)
    return avgInterval > 0 ? 60000 / avgInterval : 0;
  }

  calculateIntensity(keys) {
    if (keys.length === 0) return 0;
    
    // Base intensity on key density and clustering
    const keyDensity = keys.length / (this.measureDuration / 1000); // keys per second
    
    // Detect simultaneous keypresses (within 100ms)
    let simultaneousCount = 0;
    for (let i = 1; i < keys.length; i++) {
      if (keys[i].timestamp - keys[i-1].timestamp < 100) {
        simultaneousCount++;
      }
    }
    
    const simultaneousBonus = simultaneousCount * 0.5;
    return Math.min(10, keyDensity + simultaneousBonus); // Scale 0-10
  }

  calculateRhythmVariance(keys) {
    if (keys.length < 3) return 0;
    
    // Calculate variance in timing between keypresses
    const intervals = [];
    for (let i = 1; i < keys.length; i++) {
      intervals.push(keys[i].timestamp - keys[i-1].timestamp);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    
    // Normalize to 0-1 scale (higher = more erratic)
    return Math.min(1, Math.sqrt(variance) / 1000);
  }

  detectBurstPatterns(keys) {
    if (keys.length < 3) return [];
    
    const bursts = [];
    let currentBurst = [];
    
    for (let i = 0; i < keys.length; i++) {
      if (currentBurst.length === 0) {
        currentBurst.push(keys[i]);
      } else {
        const timeDiff = keys[i].timestamp - currentBurst[currentBurst.length - 1].timestamp;
        
        if (timeDiff < 200) { // Within 200ms = part of burst
          currentBurst.push(keys[i]);
        } else {
          // End of burst
          if (currentBurst.length >= 3) {
            bursts.push({
              start: currentBurst[0].timestamp,
              end: currentBurst[currentBurst.length - 1].timestamp,
              keyCount: currentBurst.length,
              duration: currentBurst[currentBurst.length - 1].timestamp - currentBurst[0].timestamp
            });
          }
          currentBurst = [keys[i]];
        }
      }
    }
    
    // Check final burst
    if (currentBurst.length >= 3) {
      bursts.push({
        start: currentBurst[0].timestamp,
        end: currentBurst[currentBurst.length - 1].timestamp,
        keyCount: currentBurst.length,
        duration: currentBurst[currentBurst.length - 1].timestamp - currentBurst[0].timestamp
      });
    }
    
    return bursts;
  }

  analyzeMusicalContent(keys) {
    const musicalKeys = keys.filter(k => k.note);
    if (musicalKeys.length === 0) return null;

    // Extract pitch information
    const pitches = musicalKeys.map(k => this.noteToPitch(k.note));
    const averagePitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const pitchRange = Math.max(...pitches) - Math.min(...pitches);
    
    // Analyze scale patterns
    const scaleAnalysis = this.analyzeScalePattern(pitches);
    
    return {
      averagePitch,
      pitchRange,
      keyCount: musicalKeys.length,
      scalePattern: scaleAnalysis.pattern,
      harmonyType: scaleAnalysis.harmonyType,
      pitchDirection: this.analyzePitchDirection(pitches)
    };
  }

  noteToPitch(note) {
    // Convert note names to MIDI pitch numbers
    const noteMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    const match = note.match(/^([A-G]#?)(\d+)$/);
    if (!match) return 60; // Default to C4
    
    const [, noteName, octave] = match;
    return (parseInt(octave) + 1) * 12 + noteMap[noteName];
  }

  analyzeScalePattern(pitches) {
    if (pitches.length < 3) return { pattern: 'insufficient', harmonyType: 'neutral' };
    
    // Check for major/minor patterns
    const intervals = [];
    for (let i = 1; i < pitches.length; i++) {
      intervals.push(pitches[i] - pitches[i-1]);
    }
    
    // Simple major/minor detection based on interval patterns
    const majorIntervals = [2, 2, 1, 2, 2, 2, 1]; // Major scale pattern
    const minorIntervals = [2, 1, 2, 2, 1, 2, 2]; // Minor scale pattern
    
    // Count ascending vs descending intervals
    const ascending = intervals.filter(i => i > 0).length;
    const descending = intervals.filter(i => i < 0).length;
    
    return {
      pattern: ascending > descending ? 'ascending' : descending > ascending ? 'descending' : 'mixed',
      harmonyType: this.detectHarmonyType(intervals)
    };
  }

  detectHarmonyType(intervals) {
    // Simple heuristic: presence of minor thirds suggests minor harmony
    const minorThirds = intervals.filter(i => Math.abs(i) === 3).length;
    const majorThirds = intervals.filter(i => Math.abs(i) === 4).length;
    
    if (minorThirds > majorThirds) return 'minor';
    if (majorThirds > minorThirds) return 'major';
    return 'neutral';
  }

  analyzePitchDirection(pitches) {
    if (pitches.length < 2) return 'static';
    
    let rising = 0;
    let falling = 0;
    
    for (let i = 1; i < pitches.length; i++) {
      if (pitches[i] > pitches[i-1]) rising++;
      else if (pitches[i] < pitches[i-1]) falling++;
    }
    
    if (rising > falling) return 'rising';
    if (falling > rising) return 'falling';
    return 'mixed';
  }

  createEmptyMeasure() {
    return {
      timestamp: Date.now(),
      duration: this.measureDuration,
      keyCount: 0,
      tempo: 0,
      intensity: 0,
      rhythmVariance: 0,
      burstPatterns: [],
      theme: this.currentTheme,
      musical: null
    };
  }

  getCurrentAnalysis() {
    return this.measures.length > 0 ? this.measures[this.measures.length - 1] : this.createEmptyMeasure();
  }

  getMeasureHistory() {
    return [...this.measures];
  }

  getTrendAnalysis() {
    if (this.measures.length < 2) return null;
    
    const recent = this.measures.slice(-3); // Last 3 measures
    const avgTempo = recent.reduce((a, b) => a + b.tempo, 0) / recent.length;
    const avgIntensity = recent.reduce((a, b) => a + b.intensity, 0) / recent.length;
    const avgVariance = recent.reduce((a, b) => a + b.rhythmVariance, 0) / recent.length;
    
    return {
      tempo: avgTempo,
      intensity: avgIntensity,
      variance: avgVariance,
      stability: 1 - avgVariance, // Inverse of variance
      trend: this.calculateTrend(recent)
    };
  }

  calculateTrend(measures) {
    if (measures.length < 2) return 'stable';
    
    const first = measures[0];
    const last = measures[measures.length - 1];
    
    const tempoChange = last.tempo - first.tempo;
    const intensityChange = last.intensity - first.intensity;
    
    if (tempoChange > 20 || intensityChange > 2) return 'increasing';
    if (tempoChange < -20 || intensityChange < -2) return 'decreasing';
    return 'stable';
  }

  reset() {
    this.keyPresses = [];
    this.measures = [];
    this.lastAnalysis = 0;
  }
}

export default BeatAnalyzer;