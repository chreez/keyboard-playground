---
id: conductor-game
title: Musical Conductor Educational Edition
version: 2.1.0
description: Interactive object-based music learning game where players touch floating objects to create sounds and learn theory
entry_points:
  - src/conductor-mode/index.html
  - src/conductor-mode/main.js
status: active
---

# Musical Conductor: Educational Edition Specification v2.0

## Game Overview
**Musical Conductor: Educational Edition** is a delightfully silly piano learning game that uses hand tracking and AI guidance to teach music theory through play. Players control notes with their hands while an AI music teacher provides real-time, contextual learning moments wrapped in joyful, emoji-filled chaos.

## Core Educational Philosophy
- **Learn by doing, not studying**
- **Celebrate mistakes as discoveries**
- **Every sound teaches something**
- **Silly is memorable**

## Core Game Concept

### The Learning Loop
Players use both hands to interact with musical objects floating in 3D space. Each object represents a different note or sound, and touching them with hand gestures triggers the corresponding audio. Visual feedback shows musical relationships in real-time while an AI teacher celebrates discoveries and suggests what to try next.

### Interactive Sound Objects
Instead of a traditional piano keyboard, the game space is populated with various interactive objects that produce sounds when "touched" by the player's hands. Objects are positioned in 3D space to encourage exploration and discovery of musical relationships.

### Educational Goals
1. **Note recognition** - See notes, hear notes, feel notes
2. **Intervals** - Understand musical distances
3. **Chords** - Build triads naturally
4. **Scales** - Discover patterns through play
5. **Rhythm** - Feel the beat organically

## Technical Architecture

### Proven Patterns from POCs
- **60fps Canvas 2D rendering** (from keyboard playground)
- **Object pooling for emojis** (prevents GC hitches)
- **Event-driven architecture** (clean separation)
- **MediaPipe hand tracking** (21-point landmarks)
- **Web Worker for heavy computation** (non-blocking)
- **Graceful degradation** (works without camera)

### Core Systems

```javascript
class MusicalEducatorEngine {
  constructor() {
    this.systems = {
      hands: new DualHandTracker(),      // Both hands tracked
      objects: new InteractiveObjectSystem(), // Musical objects in 3D space
      collision: new CollisionDetector(),     // Hand-object interaction
      theory: new MusicTheoryEngine(),   // Understands relationships
      ai: new AITeacherSystem(),         // LLM integration
      visuals: new EducationalRenderer(), // Shows theory visually
      audio: new PianoAudioSystem(),     // Beautiful piano samples
      progress: new LearningTracker()    // Tracks discoveries
    };
  }
}
```

## Hand Control System

### Hand-Object Interaction
```javascript
const HAND_INTERACTION = {
  detection: {
    method: 'collision',      // Detect when hand touches object
    radius: 50,              // Collision radius in pixels
    depth: true,             // Use Z-axis for 3D interaction
    gestures: ['point', 'pinch', 'palm'] // Valid interaction gestures
  },
  feedback: {
    visual: 'glow',          // Objects glow when touched
    haptic: 'vibration',     // Future: controller feedback
    audio: 'immediate',      // Sound plays on contact
    particle: 'burst'        // Particle effects on interaction
  }
};
```

### Interactive Object System
```javascript
const OBJECT_TYPES = {
  // Basic note objects
  note: {
    shape: 'sphere',         // 3D sphere for single notes
    size: { min: 40, max: 80 }, // Size indicates pitch
    color: 'noteToColor',    // Color-coded by note
    glow: 'onTouch',        // Glows when touched
    physics: 'float'         // Gentle floating motion
  },
  
  // Chord objects
  chord: {
    shape: 'crystal',        // Multi-faceted crystal
    size: 100,              // Larger than single notes
    color: 'chordType',     // Major=warm, Minor=cool
    particles: 'shimmer',   // Shimmering particle effect
    rotation: 'slow'        // Slowly rotating
  },
  
  // Special objects
  scale: {
    shape: 'pathway',       // Series of connected objects
    arrangement: 'spiral',  // Arranged in patterns
    color: 'rainbow',       // Gradient colors
    animation: 'pulse'      // Pulsing invitation
  }
};
```

### Visual Feedback System
```
Screen Layout:
┌─────────────────────────────────────────┐
│  🎼 Current Chord: C Major! 🎉          │  ← Real-time theory
├─────────────────────────────────────────┤
│                                         │
│         🎵  🎶  🎵                      │  ← Musical objects
│      ○    ◈    ○                       │     floating in 3D
│   🎵    🎼    🎵   🎶                  │     space
│     ○    ◆    ○    ○                   │
│                                         │
│    👋 Left Hand    Right Hand 👋        │  ← Hand positions
│         ↓              ↓                │     with trails
│  ╰═══════╤═══════╯                     │  ← Shows interval
│      Major Third!                       │
│                                         │
├─────────────────────────────────────────┤
│  Recent: C·E·G → C Major Chord! 🎹     │  ← Touch history
├─────────────────────────────────────────┤
│  💬 "Try touching the blue crystal!"    │  ← AI suggestions
└─────────────────────────────────────────┘
```

### Object Placement System
```javascript
class ObjectPlacementEngine {
  constructor() {
    this.layout = {
      // Objects arranged in musical patterns
      notes: this.arrangeByScale(),
      chords: this.arrangeByCircleOfFifths(),
      special: this.arrangeByDifficulty()
    };
    
    // Adaptive placement based on player reach
    this.adaptToPlayerReach = true;
    this.comfortZone = { radius: 300, depth: 200 };
  }
  
  arrangeByScale() {
    // C major scale objects in ascending spiral
    return notes.map((note, i) => ({
      position: {
        x: Math.cos(i * 0.5) * 200,
        y: 100 + i * 30,
        z: Math.sin(i * 0.5) * 100
      },
      note: note,
      size: 40 + (i * 5) // Higher notes are larger
    }));
  }
}
```

## AI Teacher Integration

### Non-Blocking Architecture
```javascript
class AITeacherSystem {
  constructor() {
    this.analysisWorker = new Worker('ai-analysis-worker.js');
    this.suggestionQueue = new CircularBuffer(10);
    this.contextWindow = new MusicContext();
    this.updateInterval = 5000; // 5 seconds
  }
  
  async analyzeMusicalMoment() {
    const context = {
      currentNotes: this.getCurrentNotes(),
      recentHistory: this.contextWindow.getLast30Seconds(),
      discoveries: this.progress.getRecentDiscoveries(),
      skillLevel: this.progress.estimateLevel()
    };
    
    // Non-blocking request
    this.analysisWorker.postMessage({
      type: 'analyze',
      context: this.simplifyContext(context),
      prompt: this.generateEducationalPrompt()
    });
  }
  
  generateEducationalPrompt() {
    return `Given these musical actions:
    - Notes played: ${this.contextWindow.notes}
    - Patterns detected: ${this.contextWindow.patterns}
    - Student level: ${this.progress.level}
    
    Provide ONE silly, encouraging teaching moment.
    Example: "Ooh! You found a perfect fifth! 
    That's the same interval as the Star Wars theme! 🌟"`;
  }
}
```

### Educational Interventions

1. **Discovery Celebrations**
   ```javascript
   // When player discovers a major chord
   {
     visual: "🎉 MAJOR CHORD UNLOCKED! 🎉",
     audio: playFanfare(),
     emoji: spawnCelebrationEmojis(['🎵', '🎶', '✨']),
     learning: "Major = Happy! You made Root + 4 + 3 semitones!"
   }
   ```

2. **Gentle Corrections**
   ```javascript
   // When playing dissonant intervals repeatedly
   {
     visual: "😅 Spicy interval! That's a tritone!",
     suggestion: "Try moving one hand by just one key",
     emoji: spawnWobbyEmoji('🌶️'),
     learning: "Tritones sound tense - great for suspense!"
   }
   ```

3. **Progressive Challenges**
   ```javascript
   // Based on skill progression
   if (player.canPlayMajorChords) {
     aiTeacher.suggest({
       challenge: "Can you make this chord minor?",
       hint: "Lower your middle note by one key! 👇",
       reward: "Minor Maestro Badge 🎭"
     });
   }
   ```

## Single Game Mode: "Piano Discovery Garden"

### Core Gameplay
1. **Free Exploration** (Always Available)
   - Both hands create notes
   - Visual feedback shows relationships
   - AI comments on discoveries
   - No pressure, just play

2. **Guided Moments** (Every 30-60 seconds)
   - AI suggests something to try
   - Visual hints appear
   - Success triggers celebration
   - Failure triggers encouragement

3. **Discovery Collection**
   - Find all 12 major chords
   - Discover 5 types of intervals  
   - Play 3 different scales
   - Create a melody the AI can sing back

### Progression System
```javascript
const DISCOVERIES = {
  intervals: {
    unison: { learned: false, emoji: '👯' },
    second: { learned: false, emoji: '👟' },
    third: { learned: false, emoji: '🔺' },
    fourth: { learned: false, emoji: '🏠' },
    fifth: { learned: false, emoji: '⭐' },
    sixth: { learned: false, emoji: '🌸' },
    seventh: { learned: false, emoji: '🌶️' },
    octave: { learned: false, emoji: '🎯' }
  },
  chords: {
    major: { learned: false, emoji: '😊' },
    minor: { learned: false, emoji: '😢' },
    diminished: { learned: false, emoji: '😰' },
    augmented: { learned: false, emoji: '😲' }
  },
  scales: {
    major: { learned: false, emoji: '🌈' },
    minor: { learned: false, emoji: '🌙' },
    pentatonic: { learned: false, emoji: '⭐' },
    blues: { learned: false, emoji: '😎' }
  }
};
```

## Visual Learning System

### Real-Time Theory Visualization
```javascript
class TheoryVisualizer {
  renderInterval(note1, note2) {
    const semitones = this.calculateSemitones(note1, note2);
    const intervalName = this.getIntervalName(semitones);
    
    // Draw connection between hands
    this.drawArc(hand1Position, hand2Position, {
      color: this.getIntervalColor(intervalName),
      label: intervalName,
      emoji: INTERVAL_EMOJIS[intervalName]
    });
    
    // Spawn teaching emoji
    if (this.isNewDiscovery(intervalName)) {
      this.spawnDiscoveryAnimation(intervalName);
    }
  }
  
  renderChord(notes) {
    const chordType = this.detectChordType(notes);
    if (chordType) {
      this.showChordShape(notes, chordType);
      this.pulseColor(CHORD_COLORS[chordType]);
      this.displayChordDiagram(chordType);
    }
  }
}
```

### Collision Detection System
```javascript
class CollisionDetector {
  constructor() {
    this.handBounds = {
      inFrame: false,
      confidence: 0,
      boundaries: { left: 0.1, right: 0.9, top: 0.1, bottom: 0.9 }
    };
  }
  
  checkHandInBounds(handLandmarks) {
    // All landmarks must be within frame boundaries
    const allInBounds = handLandmarks.every(point => 
      point.x > this.boundaries.left &&
      point.x < this.boundaries.right &&
      point.y > this.boundaries.top &&
      point.y < this.boundaries.bottom
    );
    
    // High confidence required for sound
    const highConfidence = handLandmarks[0].visibility > 0.8;
    
    return allInBounds && highConfidence;
  }
  
  detectCollision(handPos, object) {
    // 3D distance calculation
    const distance = Math.sqrt(
      Math.pow(handPos.x - object.x, 2) +
      Math.pow(handPos.y - object.y, 2) +
      Math.pow(handPos.z - object.z, 2)
    );
    
    return distance < object.collisionRadius;
  }
}
```

### Silly Educational Moments

1. **Emoji Rain for Scales**
   - Touch objects in ascending order
   - Rainbow emojis fall in order 🌈
   - Each note gets progressively happier emoji

2. **Chord Creatures**
   - Touch 3 objects simultaneously
   - Major chords spawn happy creatures 😊🐸
   - Minor chords spawn sad creatures 😢🐧
   - Diminished chords spawn nervous creatures 😰🦎

3. **Object Connections**
   - Visual lines connect touched objects
   - Perfect fifth = strong golden connection
   - Tritone = wobbly red connection
   - Octave = rainbow connection

## Performance Optimizations

### LLM Integration (Non-Blocking)
```javascript
class AIResponseCache {
  constructor() {
    this.cache = new Map();
    this.precomputed = this.loadPrecomputedResponses();
    this.pendingRequests = new Set();
  }
  
  async getResponse(context) {
    const key = this.contextToKey(context);
    
    // Instant cache hit
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Precomputed fallback
    const similar = this.findSimilarContext(context);
    if (similar) {
      return this.precomputed[similar];
    }
    
    // Async LLM request (non-blocking)
    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.add(key);
      this.requestFromLLM(context).then(response => {
        this.cache.set(key, response);
        this.pendingRequests.delete(key);
      });
    }
    
    // Return generic encouragement immediately
    return this.getGenericEncouragement(context);
  }
}
```

## Success Metrics

### Educational Goals
- 80% of players discover a major chord in first session
- 60% understand intervals after 30 minutes
- 40% can intentionally create chords after 1 hour
- 90% report "learning something new"

### Engagement Goals  
- Average session length: 20+ minutes
- Return rate: 70% next day
- Discovery completion: 30% all intervals
- Sharing rate: 50% share a discovery

## Technical Requirements

### Core Performance
- 60 FPS with hand tracking active
- <100ms hand tracking latency
- <50ms audio latency (critical for learning)
- AI responses within 5 seconds (cached/precomputed)

### Accessibility
- Keyboard-only mode (no hands required)
- Visual note indicators for deaf players  
- High contrast mode
- Adjustable emoji size

## Future Expansions

### Instrument Progression
1. Start: Piano only (full implementation)
2. Future: Guitar, Drums, Violin (same learning system)
3. Each instrument teaches different theory aspects

### Social Learning
- Share musical discoveries
- Duet mode with friend
- AI creates exercises based on friend's playing
- Musical conversation mode

## Conclusion

Musical Conductor: Educational Edition transforms music theory from boring drills into delightful discovery. By combining proven technical patterns with AI-assisted teaching moments, players learn fundamental musical concepts while spawning silly emojis and making joyful noise. The key is that every interaction teaches something, but it never feels like a lesson - it feels like play.

## Success Criteria

### Input/Output Behaviors
1. **Hand Tracking Input**
   - Input: MediaPipe hand landmarks (21 points per hand)
   - Output: Musical notes triggered only when hands touch objects
   - Success: <100ms latency from hand-object collision to note trigger
   - **Critical**: NO sound when hands are out of frame or not touching objects

2. **Hand Detection Boundaries**
   - Input: Hand position relative to camera frame
   - Output: Sound enabled only when hands are fully visible
   - Success: Immediate silence when hands leave frame
   - Success: No false triggers from partial hand detection
   - Success: Clear visual indicator when hands are "out of bounds"

3. **Object Interaction**
   - Input: Hand collision with musical objects
   - Output: Precise sound trigger only on contact
   - Success: No accidental triggers from nearby objects
   - Success: Visual feedback (glow) precedes audio by ~50ms
   - Success: Multiple simultaneous touches create proper chords

4. **AI Teacher Responses**
   - Input: Musical context (notes, patterns, discoveries)
   - Output: Educational suggestions and celebrations
   - Success: Response within 5 seconds, contextually relevant

5. **Visual Feedback**
   - Input: Active notes and musical relationships
   - Output: Real-time theory visualization with emoji feedback
   - Success: 60 FPS rendering, clear visual indicators

### Testable Outcomes
- Players can discover and play all 12 major chords
- Interval detection accuracy >95%
- Chord recognition works for triads and inversions
- AI suggestions improve player discovery rate by 50%
- Session length averages 20+ minutes

## Version History
- v2.0 - Educational focus with AI teacher integration
- v1.0 - Original game specification

## Implementation Status

A detailed implementation plan for completing this specification is available in `/CONDUCTOR_IMPLEMENTATION_PLAN.md`. The plan breaks down the work into 4 phases with 10 major tasks, designed for sequential implementation by AI agents.

Current implementation status:
- ✅ Basic hand tracking and gesture recognition
- ✅ Audio system with themes
- ✅ Visual effects foundation
- ❌ Music theory engine (Phase 1)
- ❌ Educational features (Phase 2)
- ❌ Game systems (Phase 3)
- ❌ Polish and integration (Phase 4)

## Changelog

### [2.1.0] - 2025-07-16
- **Major Update**: Transformed piano keyboard into interactive 3D objects
- Added collision detection system for hand-object interaction
- Added object placement engine with musical arrangement patterns
- Enhanced success criteria with "no sound when hands out of frame" requirement
- Added hand boundary detection to prevent false triggers
- Updated visual system to show floating musical objects
- Added object types: notes (spheres), chords (crystals), scales (pathways)
- Improved interaction feedback with glow effects and particle bursts

### [2.0.2] - 2025-07-16
- Added implementation status section
- Added reference to implementation plan document
- No functional changes to specification

### [2.0.1] - 2025-07-16
- Added required frontmatter section for spec validation
- Added success criteria section for testability
- Added formal changelog section
- No functional changes to specification

### [2.0.0] - Previous
- Complete rewrite with educational focus
- Added AI teacher integration
- Introduced discovery-based progression
- Enhanced visual learning system
- Optimized for non-blocking LLM integration

### [1.0.0] - Initial
- Original Musical Conductor game concept
- Basic hand tracking implementation
- Simple note mapping system