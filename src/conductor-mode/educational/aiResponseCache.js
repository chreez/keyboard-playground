export class AIResponseCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Set();
    this.maxCacheSize = 100;
    this.maxAge = 5 * 60 * 1000; // 5 minutes
    
    // Precomputed responses for common scenarios
    this.precomputedResponses = this.loadPrecomputedResponses();
    
    // Generic fallback responses
    this.fallbackResponses = this.loadFallbackResponses();
  }

  // Get response from cache, precomputed, or trigger async fetch
  async getResponse(context) {
    const key = this.contextToKey(context);
    
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.maxAge) {
        return cached.response;
      } else {
        this.cache.delete(key); // Remove expired entry
      }
    }
    
    // Check precomputed responses
    const precomputed = this.findPrecomputedResponse(context);
    if (precomputed) {
      return precomputed;
    }
    
    // If not in cache, trigger async LLM request (non-blocking)
    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.add(key);
      this.requestFromLLM(context).then(response => {
        this.cache.set(key, {
          response,
          timestamp: Date.now()
        });
        this.pendingRequests.delete(key);
        this.cleanupCache();
      }).catch(error => {
        console.error('AI response failed:', error);
        this.pendingRequests.delete(key);
      });
    }
    
    // Return immediate fallback
    return this.getFallbackResponse(context);
  }

  // Convert context to cache key
  contextToKey(context) {
    const { 
      chordType, 
      intervalType, 
      scaleType, 
      discoveryType,
      skillLevel = 'beginner'
    } = context;
    
    // Create deterministic key
    const parts = [
      chordType || 'no-chord',
      intervalType || 'no-interval', 
      scaleType || 'no-scale',
      discoveryType || 'no-discovery',
      skillLevel
    ];
    
    return parts.join('|');
  }

  // Find matching precomputed response
  findPrecomputedResponse(context) {
    const { chordType, intervalType, discoveryType } = context;
    
    // Direct matches
    if (chordType && this.precomputedResponses.chords[chordType]) {
      return this.precomputedResponses.chords[chordType];
    }
    
    if (intervalType && this.precomputedResponses.intervals[intervalType]) {
      return this.precomputedResponses.intervals[intervalType];
    }
    
    if (discoveryType && this.precomputedResponses.discoveries[discoveryType]) {
      return this.precomputedResponses.discoveries[discoveryType];
    }
    
    return null;
  }

  // Get fallback response based on context
  getFallbackResponse(context) {
    const { chordType, intervalType, recentNotes } = context;
    
    if (chordType) {
      return this.fallbackResponses.chords[
        Math.floor(Math.random() * this.fallbackResponses.chords.length)
      ];
    }
    
    if (intervalType) {
      return this.fallbackResponses.intervals[
        Math.floor(Math.random() * this.fallbackResponses.intervals.length)
      ];
    }
    
    if (recentNotes && recentNotes.length > 0) {
      return this.fallbackResponses.general[
        Math.floor(Math.random() * this.fallbackResponses.general.length)
      ];
    }
    
    return this.fallbackResponses.encouragement[
      Math.floor(Math.random() * this.fallbackResponses.encouragement.length)
    ];
  }

  // Load precomputed responses for common scenarios
  loadPrecomputedResponses() {
    return {
      chords: {
        major: {
          message: "🎉 Major chord! That's the happy sound! Major chords are built with Root + 4 semitones + 3 semitones. They're everywhere in pop music!",
          celebration: ['🎵', '🎶', '✨', '🌟'],
          suggestion: "Try playing different major chords by moving your left hand!"
        },
        minor: {
          message: "😢 Minor chord! That's the sad, emotional sound. Minor chords use Root + 3 semitones + 4 semitones - just one note different from major!",
          celebration: ['🎵', '🎶', '💙', '🌙'],
          suggestion: "Can you make this major by raising your middle finger slightly?"
        },
        diminished: {
          message: "😰 Diminished chord! That's the tense, unstable sound. It wants to resolve to something more stable. Very dramatic!",
          celebration: ['🎵', '🎶', '🎭', '⚡'],
          suggestion: "Try resolving this tension by moving one finger slightly!"
        }
      },
      intervals: {
        'P5': {
          message: "⭐ Perfect fifth! That's the Star Wars theme interval - it sounds strong and stable. Most powerful interval in music!",
          celebration: ['⭐', '🎬', '🎵'],
          suggestion: "Perfect fifths are the backbone of power chords in rock music!"
        },
        'P8': {
          message: "🎯 Octave! These notes are the same but one is exactly double the frequency. They sound identical but in different registers!",
          celebration: ['🎯', '🔢', '🎵'],
          suggestion: "Try playing the same melody an octave apart with both hands!"
        },
        'TT': {
          message: "🌶️ Tritone! The 'devil's interval' - it creates tension and wants to resolve. Essential for jazz and classical music!",
          celebration: ['🌶️', '😈', '🎵'],
          suggestion: "Try resolving this by moving one note up or down by a semitone!"
        }
      },
      discoveries: {
        first_chord: {
          message: "🎉 Your first chord! Chords are multiple notes played together. They're the foundation of harmony in music!",
          celebration: ['🎉', '✨', '🌟'],
          suggestion: "Try moving your hands to create different chord shapes!"
        },
        first_interval: {
          message: "🎵 Your first interval! Intervals are the distances between notes. They're the building blocks of melody and harmony!",
          celebration: ['🎵', '🎶', '📏'],
          suggestion: "Try creating different intervals by changing the distance between your hands!"
        }
      }
    };
  }

  // Load fallback responses for immediate use
  loadFallbackResponses() {
    return {
      chords: [
        "🎵 Nice chord! You're creating harmony with multiple notes!",
        "🎶 That's a chord! Multiple notes working together create rich sounds!",
        "✨ Beautiful chord! You're building musical structures!"
      ],
      intervals: [
        "🎵 Great interval! You're exploring musical distances!",
        "🎶 Nice interval! That's the space between two notes!",
        "📏 Interesting interval! You're discovering musical relationships!"
      ],
      general: [
        "🎵 Keep exploring! Every sound teaches you something new!",
        "🎶 Musical discovery in progress! Let your hands guide you!",
        "✨ You're making music! Every note is a step in your journey!"
      ],
      encouragement: [
        "🎵 Keep playing! Music is about exploration and joy!",
        "🎶 You're doing great! Let your creativity flow!",
        "✨ Every sound is beautiful! Keep discovering!"
      ]
    };
  }

  // Make LLM request (async, non-blocking)
  async requestFromLLM(context) {
    const prompt = this.generatePrompt(context);
    
    try {
      // Use environment variables for API keys
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('No API key available');
      }
      
      // Use appropriate API based on available key
      if (process.env.ANTHROPIC_API_KEY) {
        return await this.callAnthropicAPI(prompt);
      } else if (process.env.OPENAI_API_KEY) {
        return await this.callOpenAIAPI(prompt);
      }
      
    } catch (error) {
      console.error('LLM request failed:', error);
      throw error;
    }
  }

  // Generate educational prompt
  generatePrompt(context) {
    const { 
      chordType, 
      intervalType, 
      recentNotes, 
      skillLevel = 'beginner',
      discoveries = []
    } = context;
    
    let prompt = `You are a joyful, encouraging music teacher. Give ONE short, enthusiastic response (max 50 words) about this musical moment:\n\n`;
    
    if (chordType) {
      prompt += `- Player just played a ${chordType} chord\n`;
    }
    
    if (intervalType) {
      prompt += `- Player discovered a ${intervalType} interval\n`;
    }
    
    if (recentNotes && recentNotes.length > 0) {
      prompt += `- Recent notes: ${recentNotes.join(', ')}\n`;
    }
    
    if (discoveries.length > 0) {
      prompt += `- Recent discoveries: ${discoveries.join(', ')}\n`;
    }
    
    prompt += `- Skill level: ${skillLevel}\n\n`;
    prompt += `Respond with:\n`;
    prompt += `1. An enthusiastic reaction with emoji\n`;
    prompt += `2. A simple explanation of what they discovered\n`;
    prompt += `3. A gentle suggestion for what to try next\n\n`;
    prompt += `Keep it encouraging, fun, and educational!`;
    
    return prompt;
  }

  // Call Anthropic API
  async callAnthropicAPI(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 150,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    const data = await response.json();
    return {
      message: data.content[0].text,
      celebration: ['🎵', '🎶', '✨'],
      suggestion: "Keep exploring!"
    };
  }

  // Call OpenAI API
  async callOpenAIAPI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 150,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    const data = await response.json();
    return {
      message: data.choices[0].message.content,
      celebration: ['🎵', '🎶', '✨'],
      suggestion: "Keep exploring!"
    };
  }

  // Clean up old cache entries
  cleanupCache() {
    if (this.cache.size <= this.maxCacheSize) return;
    
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      maxCacheSize: this.maxCacheSize,
      precomputedResponses: Object.keys(this.precomputedResponses).length
    };
  }
}