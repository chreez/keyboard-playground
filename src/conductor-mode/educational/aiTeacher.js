export class AITeacher {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.pendingRequests = new Map();
    this.requestCounter = 0;
    this.updateInterval = 5000; // 5 seconds between analyses
    this.lastAnalysisTime = 0;
    
    // Current context
    this.musicContext = {
      currentNotes: [],
      recentHistory: [],
      discoveries: [],
      skillLevel: 'beginner'
    };
    
    // Event handlers
    this.onSuggestion = null;
    this.onCelebration = null;
    this.onError = null;
    
    // Teaching moment queue
    this.teachingMoments = [];
    this.maxTeachingMoments = 5;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize Web Worker
      this.worker = new Worker(
        new URL('../workers/ai-analysis-worker.js', import.meta.url),
        { type: 'module' }
      );
      
      // Set up worker message handler
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      this.isInitialized = true;
      console.log('AI Teacher initialized');
      
    } catch (error) {
      console.error('Failed to initialize AI Teacher:', error);
      throw error;
    }
  }

  handleWorkerMessage(event) {
    const { type, data, requestId, error } = event.data;
    
    switch (type) {
      case 'analysis-complete':
        this.handleAnalysisComplete(data, requestId);
        break;
      case 'error':
        this.handleAnalysisError(error, requestId);
        break;
      case 'cache-cleared':
        console.log('AI cache cleared');
        break;
      case 'stats':
        console.log('AI cache stats:', data);
        break;
    }
  }

  handleWorkerError(error) {
    console.error('AI Worker error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  handleAnalysisComplete(data, requestId) {
    const { context, response } = data;
    
    // Remove from pending requests
    this.pendingRequests.delete(requestId);
    
    // Add to teaching moments
    this.addTeachingMoment(response);
    
    // Trigger callback
    if (this.onSuggestion) {
      this.onSuggestion(response);
    }
    
    console.log('AI analysis complete:', response);
  }

  handleAnalysisError(error, requestId) {
    console.error('AI analysis error:', error);
    
    // Remove from pending requests
    this.pendingRequests.delete(requestId);
    
    // Trigger error callback
    if (this.onError) {
      this.onError(error);
    }
  }

  // Update musical context
  updateContext(context) {
    this.musicContext = {
      ...this.musicContext,
      ...context,
      timestamp: Date.now()
    };
  }

  // Analyze current musical moment
  analyzeMusicalMoment() {
    if (!this.isInitialized) return;
    
    const now = Date.now();
    
    // Check if enough time has passed since last analysis
    if (now - this.lastAnalysisTime < this.updateInterval) {
      return;
    }
    
    // Check if we have enough context to analyze
    if (this.musicContext.currentNotes.length === 0 && 
        this.musicContext.recentHistory.length === 0) {
      return;
    }
    
    // Prepare context for analysis
    const analysisContext = this.prepareAnalysisContext();
    
    // Send to worker
    this.requestAnalysis(analysisContext);
    
    this.lastAnalysisTime = now;
  }

  prepareAnalysisContext() {
    const { currentNotes, recentHistory, discoveries, skillLevel } = this.musicContext;
    
    // Simplify context for AI analysis
    const context = {
      currentNotes: currentNotes.slice(-5), // Last 5 notes
      recentHistory: recentHistory.slice(-10), // Last 10 entries
      discoveries: discoveries.slice(-3), // Last 3 discoveries
      skillLevel,
      timestamp: Date.now()
    };
    
    // Add chord/interval/scale information if available
    if (currentNotes.length >= 2) {
      context.hasChord = currentNotes.length >= 3;
      context.hasInterval = true;
    }
    
    return context;
  }

  requestAnalysis(context) {
    if (!this.worker) return;
    
    const requestId = ++this.requestCounter;
    
    // Store pending request
    this.pendingRequests.set(requestId, {
      context,
      timestamp: Date.now()
    });
    
    // Send to worker
    this.worker.postMessage({
      type: 'analyze',
      data: context,
      requestId
    });
  }

  // Add teaching moment to queue
  addTeachingMoment(moment) {
    this.teachingMoments.push({
      ...moment,
      timestamp: Date.now()
    });
    
    // Keep only recent teaching moments
    if (this.teachingMoments.length > this.maxTeachingMoments) {
      this.teachingMoments.shift();
    }
  }

  // Handle discovery events
  handleDiscovery(discovery) {
    // Add to discoveries in context
    this.musicContext.discoveries.push(discovery);
    
    // Trigger immediate celebration
    if (this.onCelebration) {
      this.onCelebration(discovery);
    }
    
    // Request analysis for discovery
    const context = {
      ...this.prepareAnalysisContext(),
      discoveryType: discovery.type,
      discoverySubtype: discovery.subtype,
      isNewDiscovery: true
    };
    
    this.requestAnalysis(context);
  }

  // Handle note changes
  handleNoteChange(notes) {
    this.musicContext.currentNotes = notes;
    
    // Add to recent history
    this.musicContext.recentHistory.push({
      notes: [...notes],
      timestamp: Date.now()
    });
    
    // Keep history manageable
    if (this.musicContext.recentHistory.length > 50) {
      this.musicContext.recentHistory.shift();
    }
  }

  // Handle chord detection
  handleChordDetection(chord) {
    this.musicContext.currentChord = chord;
    
    // Request analysis for chord
    const context = {
      ...this.prepareAnalysisContext(),
      chordType: chord.type,
      chordRoot: chord.root
    };
    
    this.requestAnalysis(context);
  }

  // Handle interval detection
  handleIntervalDetection(interval) {
    this.musicContext.currentInterval = interval;
    
    // Request analysis for interval
    const context = {
      ...this.prepareAnalysisContext(),
      intervalType: interval.shortName,
      intervalName: interval.name
    };
    
    this.requestAnalysis(context);
  }

  // Get recent teaching moments
  getRecentTeachingMoments(count = 3) {
    return this.teachingMoments.slice(-count);
  }

  // Update skill level based on discoveries
  updateSkillLevel() {
    const discoveries = this.musicContext.discoveries;
    const totalDiscoveries = discoveries.length;
    
    if (totalDiscoveries > 20) {
      this.musicContext.skillLevel = 'advanced';
    } else if (totalDiscoveries > 10) {
      this.musicContext.skillLevel = 'intermediate';
    } else {
      this.musicContext.skillLevel = 'beginner';
    }
  }

  // Set event handlers
  onSuggestionReceived(callback) {
    this.onSuggestion = callback;
  }

  onCelebrationTriggered(callback) {
    this.onCelebration = callback;
  }

  onErrorOccurred(callback) {
    this.onError = callback;
  }

  // Force immediate analysis
  forceAnalysis() {
    this.lastAnalysisTime = 0;
    this.analyzeMusicalMoment();
  }

  // Clear teaching moments
  clearTeachingMoments() {
    this.teachingMoments = [];
  }

  // Get AI cache stats
  async getCacheStats() {
    if (!this.worker) return null;
    
    return new Promise((resolve) => {
      const requestId = ++this.requestCounter;
      
      const handler = (event) => {
        if (event.data.requestId === requestId && event.data.type === 'stats') {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.data);
        }
      };
      
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'get-stats',
        requestId
      });
    });
  }

  // Clear AI cache
  clearCache() {
    if (!this.worker) return;
    
    this.worker.postMessage({
      type: 'clear-cache',
      requestId: ++this.requestCounter
    });
  }

  // Cleanup
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.pendingRequests.clear();
    this.teachingMoments = [];
    this.isInitialized = false;
  }
}