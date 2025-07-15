class MoodDetector {
  constructor() {
    this.currentMood = 'neutral';
    this.moodHistory = [];
    this.maxHistory = 10;
    this.moodStability = 0.7; // How much to weight previous mood vs new analysis
    this.transitionThreshold = 0.3; // Minimum change needed to switch moods
  }

  analyzeMood(beatAnalysis, trendAnalysis = null) {
    if (!beatAnalysis) return this.currentMood;

    // Calculate mood scores for each category
    const scores = {
      calm: this.calculateCalmScore(beatAnalysis, trendAnalysis),
      energetic: this.calculateEnergeticScore(beatAnalysis, trendAnalysis),
      playful: this.calculatePlayfulScore(beatAnalysis, trendAnalysis),
      intense: this.calculateIntenseScore(beatAnalysis, trendAnalysis),
      frantic: this.calculateFranticScore(beatAnalysis, trendAnalysis)
    };

    // Add musical mood analysis for Theme 2
    if (beatAnalysis.theme === 2 && beatAnalysis.musical) {
      const musicalScores = this.analyzeMusicalMood(beatAnalysis.musical);
      Object.assign(scores, musicalScores);
    }

    // Add guitar mood analysis for Theme 3
    if (beatAnalysis.theme === 3) {
      const guitarScores = this.analyzeGuitarMood(beatAnalysis, trendAnalysis);
      Object.assign(scores, guitarScores);
    }

    // Find the mood with the highest score
    const newMood = this.selectDominantMood(scores);
    
    // Apply stability filtering to prevent rapid mood changes
    const finalMood = this.applyMoodStability(newMood, scores);
    
    // Update mood history
    this.updateMoodHistory(finalMood, scores);
    
    this.currentMood = finalMood;
    return finalMood;
  }

  calculateCalmScore(analysis, trend) {
    let score = 0;
    
    // Low tempo suggests calm
    if (analysis.tempo < 60) score += 0.4;
    else if (analysis.tempo < 90) score += 0.2;
    
    // Low intensity suggests calm
    if (analysis.intensity < 2) score += 0.3;
    else if (analysis.intensity < 4) score += 0.1;
    
    // Low variance suggests steady, calm typing
    if (analysis.rhythmVariance < 0.3) score += 0.3;
    
    // Few burst patterns suggest calm
    if (analysis.burstPatterns.length === 0) score += 0.2;
    
    // Octave-based mood modifiers
    if (analysis.currentOctave) {
      // Lower octaves (2-3) suggest calm, deeper tones
      if (analysis.currentOctave <= 3) score += 0.2;
      // Very high octaves (5-6) can be jarring, not calm
      if (analysis.currentOctave >= 5) score -= 0.1;
    }
    
    // Trend analysis
    if (trend && trend.trend === 'decreasing') score += 0.1;
    if (trend && trend.stability > 0.7) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  calculateEnergeticScore(analysis, trend) {
    let score = 0;
    
    // Medium-high tempo suggests energy
    if (analysis.tempo > 90 && analysis.tempo < 150) score += 0.4;
    else if (analysis.tempo > 150) score += 0.2; // Too fast becomes frantic
    
    // Medium-high intensity
    if (analysis.intensity > 4 && analysis.intensity < 7) score += 0.3;
    
    // Some rhythm variance suggests liveliness
    if (analysis.rhythmVariance > 0.2 && analysis.rhythmVariance < 0.6) score += 0.2;
    
    // Moderate burst patterns
    if (analysis.burstPatterns.length > 0 && analysis.burstPatterns.length < 3) score += 0.2;
    
    // Octave-based mood modifiers
    if (analysis.currentOctave) {
      // Mid-range octaves (3-4) suggest balanced energy
      if (analysis.currentOctave >= 3 && analysis.currentOctave <= 4) score += 0.15;
      // High octaves (5) can add brightness/energy
      if (analysis.currentOctave === 5) score += 0.1;
    }
    
    // Trend analysis
    if (trend && trend.trend === 'increasing') score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  calculatePlayfulScore(analysis, trend) {
    let score = 0;
    
    // Variable tempo suggests playfulness
    if (analysis.tempo > 60 && analysis.tempo < 120) score += 0.2;
    
    // Medium intensity with good variance
    if (analysis.intensity > 2 && analysis.intensity < 6) score += 0.2;
    
    // High rhythm variance suggests experimentation
    if (analysis.rhythmVariance > 0.4 && analysis.rhythmVariance < 0.8) score += 0.3;
    
    // Multiple short bursts suggest playful exploration
    const shortBursts = analysis.burstPatterns.filter(b => b.duration < 500);
    if (shortBursts.length > 1) score += 0.3;
    
    // Varied key usage (if available)
    if (analysis.keyCount > 5) score += 0.1;
    
    // Octave-based mood modifiers
    if (analysis.currentOctave) {
      // Higher octaves (4-5) suggest playful, bright tones
      if (analysis.currentOctave >= 4 && analysis.currentOctave <= 5) score += 0.15;
      // Very high octaves (6) can sound playful/whimsical
      if (analysis.currentOctave === 6) score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  calculateIntenseScore(analysis, trend) {
    let score = 0;
    
    // High tempo suggests intensity
    if (analysis.tempo > 120) score += 0.3;
    
    // High intensity
    if (analysis.intensity > 6) score += 0.4;
    
    // Multiple bursts suggest intense typing
    if (analysis.burstPatterns.length > 2) score += 0.3;
    
    // Many keys in short time
    if (analysis.keyCount > 15) score += 0.2;
    
    // Trend analysis
    if (trend && trend.intensity > 5) score += 0.1;
    
    return Math.min(1, score);
  }

  calculateFranticScore(analysis, trend) {
    let score = 0;
    
    // Very high tempo
    if (analysis.tempo > 180) score += 0.4;
    
    // Very high intensity
    if (analysis.intensity > 8) score += 0.3;
    
    // High variance suggests erratic typing
    if (analysis.rhythmVariance > 0.7) score += 0.3;
    
    // Many overlapping bursts
    if (analysis.burstPatterns.length > 3) score += 0.2;
    
    // Extreme key count
    if (analysis.keyCount > 25) score += 0.1;
    
    return Math.min(1, score);
  }

  analyzeMusicalMood(musicalAnalysis) {
    const scores = {
      bright: 0,
      melancholic: 0,
      excited: 0,
      serene: 0
    };
    
    // Pitch-based mood analysis
    if (musicalAnalysis.averagePitch > 72) { // High pitch (above C5)
      scores.bright += 0.3;
      scores.excited += 0.2;
    } else if (musicalAnalysis.averagePitch < 48) { // Low pitch (below C3)
      scores.melancholic += 0.3;
      scores.serene += 0.2;
    }
    
    // Harmony type analysis
    if (musicalAnalysis.harmonyType === 'major') {
      scores.bright += 0.4;
      scores.excited += 0.2;
    } else if (musicalAnalysis.harmonyType === 'minor') {
      scores.melancholic += 0.4;
      scores.serene += 0.2;
    }
    
    // Pitch direction analysis
    if (musicalAnalysis.pitchDirection === 'rising') {
      scores.excited += 0.3;
      scores.bright += 0.2;
    } else if (musicalAnalysis.pitchDirection === 'falling') {
      scores.melancholic += 0.2;
      scores.serene += 0.3;
    }
    
    // Pitch range analysis
    if (musicalAnalysis.pitchRange > 24) { // Wide range
      scores.excited += 0.2;
    } else if (musicalAnalysis.pitchRange < 12) { // Narrow range
      scores.serene += 0.2;
    }
    
    return scores;
  }

  analyzeGuitarMood(analysis, trend) {
    const scores = {
      'guitar-clean': 0,
      'guitar-warm': 0,
      'guitar-driven': 0,
      'guitar-heavy': 0
    };
    
    // Tempo-based guitar mood analysis
    if (analysis.tempo < 60) {
      scores['guitar-clean'] += 0.4;
      scores['guitar-warm'] += 0.2;
    } else if (analysis.tempo < 100) {
      scores['guitar-warm'] += 0.4;
      scores['guitar-clean'] += 0.2;
    } else if (analysis.tempo < 160) {
      scores['guitar-driven'] += 0.4;
      scores['guitar-warm'] += 0.1;
    } else {
      scores['guitar-heavy'] += 0.4;
      scores['guitar-driven'] += 0.2;
    }
    
    // Intensity-based analysis
    if (analysis.intensity < 3) {
      scores['guitar-clean'] += 0.3;
    } else if (analysis.intensity < 6) {
      scores['guitar-warm'] += 0.3;
    } else if (analysis.intensity < 8) {
      scores['guitar-driven'] += 0.3;
    } else {
      scores['guitar-heavy'] += 0.3;
    }
    
    // Octave-based analysis for guitar tones
    if (analysis.currentOctave) {
      if (analysis.currentOctave <= 2) {
        // Low octaves = heavier, driven sound
        scores['guitar-heavy'] += 0.2;
        scores['guitar-driven'] += 0.1;
      } else if (analysis.currentOctave <= 3) {
        // Mid-low octaves = warm, driven
        scores['guitar-warm'] += 0.2;
        scores['guitar-driven'] += 0.1;
      } else if (analysis.currentOctave <= 4) {
        // Mid octaves = balanced
        scores['guitar-warm'] += 0.1;
        scores['guitar-driven'] += 0.1;
      } else {
        // High octaves = clean, bright
        scores['guitar-clean'] += 0.2;
        scores['guitar-warm'] += 0.1;
      }
    }
    
    // Burst pattern analysis
    if (analysis.burstPatterns.length > 3) {
      scores['guitar-heavy'] += 0.2;
    } else if (analysis.burstPatterns.length > 1) {
      scores['guitar-driven'] += 0.2;
    } else if (analysis.burstPatterns.length === 1) {
      scores['guitar-warm'] += 0.1;
    } else {
      scores['guitar-clean'] += 0.1;
    }
    
    // Variance analysis for guitar expressiveness
    if (analysis.rhythmVariance > 0.6) {
      scores['guitar-heavy'] += 0.15;
    } else if (analysis.rhythmVariance > 0.3) {
      scores['guitar-driven'] += 0.15;
    } else {
      scores['guitar-clean'] += 0.1;
      scores['guitar-warm'] += 0.1;
    }
    
    return scores;
  }

  selectDominantMood(scores) {
    let maxScore = 0;
    let dominantMood = 'neutral';
    
    for (const [mood, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        dominantMood = mood;
      }
    }
    
    // Require minimum score threshold to avoid neutral
    if (maxScore < 0.3) {
      dominantMood = 'neutral';
    }
    
    return dominantMood;
  }

  applyMoodStability(newMood, scores) {
    if (this.moodHistory.length === 0) return newMood;
    
    const currentScore = scores[newMood] || 0;
    const previousScore = this.getPreviousMoodScore(this.currentMood);
    
    // Only change mood if the new score is significantly higher
    const scoreThreshold = previousScore + this.transitionThreshold;
    
    if (currentScore > scoreThreshold) {
      return newMood;
    }
    
    // Apply stability weighting
    const stabilityWeight = this.moodStability;
    const changeWeight = 1 - stabilityWeight;
    
    // If the weighted score favors change, switch moods
    if (currentScore * changeWeight > previousScore * stabilityWeight) {
      return newMood;
    }
    
    return this.currentMood;
  }

  getPreviousMoodScore(mood) {
    if (this.moodHistory.length === 0) return 0;
    
    const lastEntry = this.moodHistory[this.moodHistory.length - 1];
    return lastEntry.scores[mood] || 0;
  }

  updateMoodHistory(mood, scores) {
    const entry = {
      timestamp: Date.now(),
      mood,
      scores: { ...scores }
    };
    
    this.moodHistory.push(entry);
    
    if (this.moodHistory.length > this.maxHistory) {
      this.moodHistory.shift();
    }
  }

  getCurrentMood() {
    return this.currentMood;
  }

  getMoodHistory() {
    return [...this.moodHistory];
  }

  getMoodTrend() {
    if (this.moodHistory.length < 3) return 'stable';
    
    const recent = this.moodHistory.slice(-3);
    const moods = recent.map(entry => entry.mood);
    
    // Check for consistent trend
    const isIncreasingEnergy = this.isMoodProgression(moods, ['calm', 'playful', 'energetic']);
    const isDecreasingEnergy = this.isMoodProgression(moods, ['energetic', 'playful', 'calm']);
    const isEscalating = this.isMoodProgression(moods, ['energetic', 'intense', 'frantic']);
    
    if (isIncreasingEnergy) return 'building';
    if (isDecreasingEnergy) return 'calming';
    if (isEscalating) return 'escalating';
    
    return 'stable';
  }

  isMoodProgression(moods, progression) {
    const progressionMap = progression.reduce((map, mood, index) => {
      map[mood] = index;
      return map;
    }, {});
    
    let lastIndex = -1;
    for (const mood of moods) {
      const currentIndex = progressionMap[mood];
      if (currentIndex !== undefined) {
        if (currentIndex <= lastIndex) return false;
        lastIndex = currentIndex;
      }
    }
    
    return lastIndex > 0; // At least some progression occurred
  }

  getDetailedMoodAnalysis() {
    const current = this.getCurrentMood();
    const trend = this.getMoodTrend();
    const history = this.getMoodHistory();
    
    return {
      current,
      trend,
      stability: this.calculateMoodStability(),
      recentHistory: history.slice(-5),
      dominantMoods: this.getDominantMoods(),
      confidence: this.calculateConfidence()
    };
  }

  calculateMoodStability() {
    if (this.moodHistory.length < 3) return 1;
    
    const recent = this.moodHistory.slice(-5);
    const moods = recent.map(entry => entry.mood);
    const uniqueMoods = new Set(moods);
    
    // Fewer unique moods = more stable
    return Math.max(0, 1 - (uniqueMoods.size - 1) / 4);
  }

  getDominantMoods() {
    if (this.moodHistory.length === 0) return [];
    
    const moodCounts = {};
    this.moodHistory.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    return Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mood, count]) => ({ mood, count, percentage: count / this.moodHistory.length }));
  }

  calculateConfidence() {
    if (this.moodHistory.length === 0) return 0;
    
    const lastEntry = this.moodHistory[this.moodHistory.length - 1];
    const currentScore = lastEntry.scores[this.currentMood] || 0;
    
    // Confidence based on score strength and stability
    const stability = this.calculateMoodStability();
    return Math.min(1, currentScore * 0.7 + stability * 0.3);
  }

  reset() {
    this.currentMood = 'neutral';
    this.moodHistory = [];
  }
}

export default MoodDetector;