import { INTERVALS, CHORD_TYPES, SCALES } from '../core/musicalConstants.js';

export class ProgressTracker {
  constructor() {
    this.discoveries = new Set();
    this.achievements = new Set();
    this.sessionStats = {
      startTime: Date.now(),
      notesPlayed: 0,
      chordsDiscovered: 0,
      intervalsDiscovered: 0,
      scalesDiscovered: 0,
      totalPlayTime: 0
    };
    
    this.skillLevel = 'beginner';
    this.skillThresholds = {
      beginner: 0,
      intermediate: 10,
      advanced: 25
    };
    
    // Achievement definitions
    this.achievementDefinitions = this.initializeAchievements();
    
    // Load saved progress
    this.loadProgress();
  }

  // Initialize achievement definitions
  initializeAchievements() {
    return {
      // Interval achievements
      'first_interval': {
        name: 'First Interval',
        description: 'Discover your first musical interval',
        emoji: '🎵',
        unlocked: false
      },
      'interval_explorer': {
        name: 'Interval Explorer',
        description: 'Discover 5 different intervals',
        emoji: '🎶',
        unlocked: false,
        target: 5
      },
      'interval_master': {
        name: 'Interval Master',
        description: 'Discover all 12 intervals',
        emoji: '🎼',
        unlocked: false,
        target: 12
      },
      
      // Chord achievements
      'first_chord': {
        name: 'First Chord',
        description: 'Play your first chord',
        emoji: '🎹',
        unlocked: false
      },
      'chord_builder': {
        name: 'Chord Builder',
        description: 'Discover all basic chord types',
        emoji: '🏗️',
        unlocked: false,
        target: 4
      },
      'harmony_hero': {
        name: 'Harmony Hero',
        description: 'Master major and minor chords',
        emoji: '🦸',
        unlocked: false
      },
      
      // Scale achievements
      'scale_starter': {
        name: 'Scale Starter',
        description: 'Play your first scale',
        emoji: '🎵',
        unlocked: false
      },
      'scale_explorer': {
        name: 'Scale Explorer',
        description: 'Discover 3 different scales',
        emoji: '🧭',
        unlocked: false,
        target: 3
      },
      
      // Special achievements
      'perfect_fifth_finder': {
        name: 'Perfect Fifth Finder',
        description: 'Discover the perfect fifth interval',
        emoji: '⭐',
        unlocked: false
      },
      'major_chord_master': {
        name: 'Major Chord Master',
        description: 'Play 5 different major chords',
        emoji: '😊',
        unlocked: false,
        target: 5
      },
      'session_veteran': {
        name: 'Session Veteran',
        description: 'Play for 10 minutes straight',
        emoji: '⏰',
        unlocked: false
      },
      'note_ninja': {
        name: 'Note Ninja',
        description: 'Play 100 notes in a session',
        emoji: '🥷',
        unlocked: false,
        target: 100
      }
    };
  }

  // Track a discovery
  trackDiscovery(discovery) {
    const { type, subtype } = discovery;
    const discoveryKey = `${type}_${subtype}`;
    
    // Check if this is a new discovery
    const isNewDiscovery = !this.discoveries.has(discoveryKey);
    
    if (isNewDiscovery) {
      this.discoveries.add(discoveryKey);
      this.updateSessionStats(type);
      this.checkAchievements();
      this.updateSkillLevel();
      this.saveProgress();
    }
    
    return isNewDiscovery;
  }

  // Update session statistics
  updateSessionStats(type) {
    this.sessionStats.totalPlayTime = Date.now() - this.sessionStats.startTime;
    
    switch (type) {
      case 'chord':
        this.sessionStats.chordsDiscovered++;
        break;
      case 'interval':
        this.sessionStats.intervalsDiscovered++;
        break;
      case 'scale':
        this.sessionStats.scalesDiscovered++;
        break;
    }
  }

  // Track note played
  trackNotePlayed() {
    this.sessionStats.notesPlayed++;
    this.checkAchievements();
  }

  // Check and unlock achievements
  checkAchievements() {
    const newAchievements = [];
    
    // Check each achievement
    Object.entries(this.achievementDefinitions).forEach(([key, achievement]) => {
      if (achievement.unlocked) return;
      
      let shouldUnlock = false;
      
      switch (key) {
        case 'first_interval':
          shouldUnlock = this.getDiscoveredIntervals().length >= 1;
          break;
        case 'interval_explorer':
          shouldUnlock = this.getDiscoveredIntervals().length >= achievement.target;
          break;
        case 'interval_master':
          shouldUnlock = this.getDiscoveredIntervals().length >= achievement.target;
          break;
        case 'first_chord':
          shouldUnlock = this.getDiscoveredChords().length >= 1;
          break;
        case 'chord_builder':
          shouldUnlock = this.getDiscoveredChords().length >= achievement.target;
          break;
        case 'harmony_hero':
          shouldUnlock = this.hasDiscoveredChords(['major', 'minor']);
          break;
        case 'scale_starter':
          shouldUnlock = this.getDiscoveredScales().length >= 1;
          break;
        case 'scale_explorer':
          shouldUnlock = this.getDiscoveredScales().length >= achievement.target;
          break;
        case 'perfect_fifth_finder':
          shouldUnlock = this.hasDiscoveredInterval('P5');
          break;
        case 'major_chord_master':
          shouldUnlock = this.getMajorChordCount() >= achievement.target;
          break;
        case 'session_veteran':
          shouldUnlock = this.sessionStats.totalPlayTime >= 10 * 60 * 1000; // 10 minutes
          break;
        case 'note_ninja':
          shouldUnlock = this.sessionStats.notesPlayed >= achievement.target;
          break;
      }
      
      if (shouldUnlock) {
        achievement.unlocked = true;
        this.achievements.add(key);
        newAchievements.push({ key, ...achievement });
      }
    });
    
    return newAchievements;
  }

  // Get discovered intervals
  getDiscoveredIntervals() {
    return Array.from(this.discoveries)
      .filter(d => d.startsWith('interval_'))
      .map(d => d.replace('interval_', ''));
  }

  // Get discovered chords
  getDiscoveredChords() {
    return Array.from(this.discoveries)
      .filter(d => d.startsWith('chord_'))
      .map(d => d.replace('chord_', ''));
  }

  // Get discovered scales
  getDiscoveredScales() {
    return Array.from(this.discoveries)
      .filter(d => d.startsWith('scale_'))
      .map(d => d.replace('scale_', ''));
  }

  // Check if specific chords have been discovered
  hasDiscoveredChords(chordTypes) {
    const discovered = this.getDiscoveredChords();
    return chordTypes.every(type => discovered.includes(type));
  }

  // Check if specific interval has been discovered
  hasDiscoveredInterval(intervalType) {
    return this.discoveries.has(`interval_${intervalType}`);
  }

  // Count major chords discovered (different roots)
  getMajorChordCount() {
    // This is a simplified count - in a full implementation,
    // you'd track different root notes
    return this.hasDiscoveredChords(['major']) ? 5 : 0;
  }

  // Update skill level based on total discoveries
  updateSkillLevel() {
    const totalDiscoveries = this.discoveries.size;
    
    if (totalDiscoveries >= this.skillThresholds.advanced) {
      this.skillLevel = 'advanced';
    } else if (totalDiscoveries >= this.skillThresholds.intermediate) {
      this.skillLevel = 'intermediate';
    } else {
      this.skillLevel = 'beginner';
    }
  }

  // Get progress statistics
  getProgressStats() {
    const intervals = this.getDiscoveredIntervals();
    const chords = this.getDiscoveredChords();
    const scales = this.getDiscoveredScales();
    
    return {
      intervals: {
        discovered: intervals.length,
        total: Object.keys(INTERVALS).length,
        percentage: Math.round((intervals.length / Object.keys(INTERVALS).length) * 100)
      },
      chords: {
        discovered: chords.length,
        total: Object.keys(CHORD_TYPES).length,
        percentage: Math.round((chords.length / Object.keys(CHORD_TYPES).length) * 100)
      },
      scales: {
        discovered: scales.length,
        total: Object.keys(SCALES).length,
        percentage: Math.round((scales.length / Object.keys(SCALES).length) * 100)
      },
      overall: {
        discovered: this.discoveries.size,
        total: Object.keys(INTERVALS).length + Object.keys(CHORD_TYPES).length + Object.keys(SCALES).length,
        skillLevel: this.skillLevel,
        achievements: this.achievements.size,
        totalAchievements: Object.keys(this.achievementDefinitions).length
      }
    };
  }

  // Get session statistics
  getSessionStats() {
    return {
      ...this.sessionStats,
      duration: Date.now() - this.sessionStats.startTime,
      averageNotesPerMinute: this.sessionStats.notesPlayed / ((Date.now() - this.sessionStats.startTime) / 60000)
    };
  }

  // Get unlocked achievements
  getUnlockedAchievements() {
    return Object.entries(this.achievementDefinitions)
      .filter(([key, achievement]) => achievement.unlocked)
      .map(([key, achievement]) => ({ key, ...achievement }));
  }

  // Get locked achievements
  getLockedAchievements() {
    return Object.entries(this.achievementDefinitions)
      .filter(([key, achievement]) => !achievement.unlocked)
      .map(([key, achievement]) => ({ key, ...achievement }));
  }

  // Get next milestone
  getNextMilestone() {
    const locked = this.getLockedAchievements();
    if (locked.length === 0) return null;
    
    // Find the closest achievement to unlock
    const intervals = this.getDiscoveredIntervals().length;
    const chords = this.getDiscoveredChords().length;
    const scales = this.getDiscoveredScales().length;
    
    // Simple logic to find next likely achievement
    if (intervals === 0) return locked.find(a => a.key === 'first_interval');
    if (chords === 0) return locked.find(a => a.key === 'first_chord');
    if (scales === 0) return locked.find(a => a.key === 'scale_starter');
    
    return locked[0]; // Return first locked achievement
  }

  // Save progress to localStorage
  saveProgress() {
    const progressData = {
      discoveries: Array.from(this.discoveries),
      achievements: Array.from(this.achievements),
      sessionStats: this.sessionStats,
      skillLevel: this.skillLevel,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('conductor-progress', JSON.stringify(progressData));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // Load progress from localStorage
  loadProgress() {
    try {
      const saved = localStorage.getItem('conductor-progress');
      if (!saved) return;
      
      const progressData = JSON.parse(saved);
      
      // Restore discoveries
      this.discoveries = new Set(progressData.discoveries || []);
      
      // Restore achievements
      this.achievements = new Set(progressData.achievements || []);
      
      // Update achievement definitions
      this.achievements.forEach(key => {
        if (this.achievementDefinitions[key]) {
          this.achievementDefinitions[key].unlocked = true;
        }
      });
      
      // Restore skill level
      this.skillLevel = progressData.skillLevel || 'beginner';
      
      // Don't restore session stats - they're session-specific
      
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }

  // Clear all progress
  clearProgress() {
    this.discoveries.clear();
    this.achievements.clear();
    this.skillLevel = 'beginner';
    this.sessionStats = {
      startTime: Date.now(),
      notesPlayed: 0,
      chordsDiscovered: 0,
      intervalsDiscovered: 0,
      scalesDiscovered: 0,
      totalPlayTime: 0
    };
    
    // Reset achievement definitions
    Object.values(this.achievementDefinitions).forEach(achievement => {
      achievement.unlocked = false;
    });
    
    // Clear localStorage
    localStorage.removeItem('conductor-progress');
  }

  // Export progress data
  exportProgress() {
    return {
      discoveries: Array.from(this.discoveries),
      achievements: this.getUnlockedAchievements(),
      stats: this.getProgressStats(),
      sessionStats: this.getSessionStats(),
      skillLevel: this.skillLevel
    };
  }
}