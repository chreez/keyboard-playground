import { ProgressTracker } from './progressTracker.js';
import { TEACHING_MOMENTS } from '../core/musicalConstants.js';

export class DiscoverySystem {
  constructor() {
    this.progressTracker = new ProgressTracker();
    this.discoveryQueue = [];
    this.celebrationQueue = [];
    this.isProcessing = false;
    
    // Discovery notification settings
    this.notificationDuration = 3000; // 3 seconds
    this.celebrationDuration = 2000; // 2 seconds
    
    // Event handlers
    this.onDiscovery = null;
    this.onAchievement = null;
    this.onCelebration = null;
    this.onMilestone = null;
    
    // Recent discoveries cache
    this.recentDiscoveries = [];
    this.maxRecentDiscoveries = 10;
  }

  // Process a potential discovery
  processDiscovery(discovery) {
    const { type, subtype } = discovery;
    
    // Track with progress tracker
    const isNewDiscovery = this.progressTracker.trackDiscovery(discovery);
    
    if (isNewDiscovery) {
      // Create discovery event
      const discoveryEvent = {
        ...discovery,
        timestamp: Date.now(),
        isNew: true,
        teachingMoment: this.getTeachingMoment(type, subtype)
      };
      
      // Add to recent discoveries
      this.addToRecentDiscoveries(discoveryEvent);
      
      // Queue for processing
      this.discoveryQueue.push(discoveryEvent);
      
      // Check for new achievements
      const newAchievements = this.progressTracker.checkAchievements();
      newAchievements.forEach(achievement => {
        this.celebrationQueue.push({
          type: 'achievement',
          achievement,
          timestamp: Date.now()
        });
      });
      
      // Process queue
      this.processQueue();
      
      return discoveryEvent;
    }
    
    return null; // Not a new discovery
  }

  // Add to recent discoveries
  addToRecentDiscoveries(discovery) {
    this.recentDiscoveries.unshift(discovery);
    
    // Keep only recent discoveries
    if (this.recentDiscoveries.length > this.maxRecentDiscoveries) {
      this.recentDiscoveries.pop();
    }
  }

  // Process discovery and celebration queues
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Process discoveries first
      while (this.discoveryQueue.length > 0) {
        const discovery = this.discoveryQueue.shift();
        await this.handleDiscovery(discovery);
      }
      
      // Process celebrations
      while (this.celebrationQueue.length > 0) {
        const celebration = this.celebrationQueue.shift();
        await this.handleCelebration(celebration);
      }
      
    } catch (error) {
      console.error('Error processing discovery queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Handle individual discovery
  async handleDiscovery(discovery) {
    console.log('New discovery:', discovery);
    
    // Trigger discovery callback
    if (this.onDiscovery) {
      this.onDiscovery(discovery);
    }
    
    // Check if this is a milestone discovery
    const milestone = this.checkMilestone(discovery);
    if (milestone) {
      this.celebrationQueue.push({
        type: 'milestone',
        milestone,
        discovery,
        timestamp: Date.now()
      });
    }
    
    // Add a small delay to prevent overwhelming the user
    await this.delay(500);
  }

  // Handle celebrations (achievements, milestones)
  async handleCelebration(celebration) {
    console.log('Celebration:', celebration);
    
    if (celebration.type === 'achievement') {
      if (this.onAchievement) {
        this.onAchievement(celebration.achievement);
      }
    } else if (celebration.type === 'milestone') {
      if (this.onMilestone) {
        this.onMilestone(celebration.milestone);
      }
    }
    
    // Trigger general celebration callback
    if (this.onCelebration) {
      this.onCelebration(celebration);
    }
    
    // Add delay for celebration
    await this.delay(this.celebrationDuration);
  }

  // Check if discovery is a milestone
  checkMilestone(discovery) {
    const stats = this.progressTracker.getProgressStats();
    
    // Check for percentage milestones
    const milestones = [25, 50, 75, 100];
    
    milestones.forEach(percentage => {
      if (stats.intervals.percentage === percentage) {
        return {
          type: 'intervals',
          percentage,
          message: `🎵 ${percentage}% of intervals discovered!`,
          celebration: ['🎵', '🎶', '✨']
        };
      }
      
      if (stats.chords.percentage === percentage) {
        return {
          type: 'chords',
          percentage,
          message: `🎼 ${percentage}% of chords discovered!`,
          celebration: ['🎼', '🎹', '🌟']
        };
      }
      
      if (stats.scales.percentage === percentage) {
        return {
          type: 'scales',
          percentage,
          message: `🎵 ${percentage}% of scales discovered!`,
          celebration: ['🎵', '🎶', '🎼']
        };
      }
    });
    
    return null;
  }

  // Get teaching moment for discovery
  getTeachingMoment(type, subtype) {
    const key = `${type}_${subtype}`;
    
    // Check for specific teaching moments
    if (TEACHING_MOMENTS[key]) {
      return TEACHING_MOMENTS[key];
    }
    
    // Check for type-specific teaching moments
    const typeKey = `first_${type}`;
    if (TEACHING_MOMENTS[typeKey]) {
      return TEACHING_MOMENTS[typeKey];
    }
    
    // Generate generic teaching moment
    return this.generateGenericTeachingMoment(type, subtype);
  }

  // Generate generic teaching moment
  generateGenericTeachingMoment(type, subtype) {
    const moments = {
      chord: {
        message: `🎵 You discovered a ${subtype} chord! Chords are multiple notes played together to create harmony.`,
        celebration: ['🎵', '🎶', '✨'],
        suggestion: "Try moving your hands to create different chord shapes!"
      },
      interval: {
        message: `🎶 You found a ${subtype} interval! Intervals are the musical distances between notes.`,
        celebration: ['🎶', '📏', '🎵'],
        suggestion: "Experiment with different hand positions to explore more intervals!"
      },
      scale: {
        message: `🎼 You played a ${subtype} scale! Scales are sequences of notes that create different moods.`,
        celebration: ['🎼', '🎵', '🌈'],
        suggestion: "Try playing melodies using this scale pattern!"
      }
    };
    
    return moments[type] || {
      message: `🎵 Great discovery! You found something musical!`,
      celebration: ['🎵', '🎶', '✨'],
      suggestion: "Keep exploring to learn more!"
    };
  }

  // Track note played
  trackNotePlayed() {
    this.progressTracker.trackNotePlayed();
  }

  // Get current progress
  getProgress() {
    return this.progressTracker.getProgressStats();
  }

  // Get session statistics
  getSessionStats() {
    return this.progressTracker.getSessionStats();
  }

  // Get recent discoveries
  getRecentDiscoveries(count = 5) {
    return this.recentDiscoveries.slice(0, count);
  }

  // Get unlocked achievements
  getUnlockedAchievements() {
    return this.progressTracker.getUnlockedAchievements();
  }

  // Get next milestone
  getNextMilestone() {
    return this.progressTracker.getNextMilestone();
  }

  // Set event handlers
  onDiscoveryMade(callback) {
    this.onDiscovery = callback;
  }

  onAchievementUnlocked(callback) {
    this.onAchievement = callback;
  }

  onCelebrationTriggered(callback) {
    this.onCelebration = callback;
  }

  onMilestoneReached(callback) {
    this.onMilestone = callback;
  }

  // Get skill level
  getSkillLevel() {
    return this.progressTracker.skillLevel;
  }

  // Check if discovery is significant
  isSignificantDiscovery(discovery) {
    const { type, subtype } = discovery;
    
    // First discoveries are always significant
    if (this.progressTracker.getDiscoveredIntervals().length === 1 && type === 'interval') {
      return true;
    }
    
    if (this.progressTracker.getDiscoveredChords().length === 1 && type === 'chord') {
      return true;
    }
    
    if (this.progressTracker.getDiscoveredScales().length === 1 && type === 'scale') {
      return true;
    }
    
    // Special intervals/chords are significant
    const significantIntervals = ['P5', 'P8', 'TT'];
    const significantChords = ['major', 'minor'];
    
    if (type === 'interval' && significantIntervals.includes(subtype)) {
      return true;
    }
    
    if (type === 'chord' && significantChords.includes(subtype)) {
      return true;
    }
    
    return false;
  }

  // Generate discovery summary
  generateDiscoverySummary() {
    const progress = this.getProgress();
    const achievements = this.getUnlockedAchievements();
    const recent = this.getRecentDiscoveries();
    
    return {
      progress,
      achievements: achievements.length,
      recentDiscoveries: recent.length,
      skillLevel: this.getSkillLevel(),
      nextMilestone: this.getNextMilestone(),
      summary: `Skill Level: ${this.getSkillLevel().toUpperCase()} | ` +
               `Discoveries: ${progress.overall.discovered} | ` +
               `Achievements: ${achievements.length}`
    };
  }

  // Clear all progress
  clearProgress() {
    this.progressTracker.clearProgress();
    this.recentDiscoveries = [];
    this.discoveryQueue = [];
    this.celebrationQueue = [];
  }

  // Export progress
  exportProgress() {
    return {
      ...this.progressTracker.exportProgress(),
      recentDiscoveries: this.recentDiscoveries,
      summary: this.generateDiscoverySummary()
    };
  }

  // Utility: delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}