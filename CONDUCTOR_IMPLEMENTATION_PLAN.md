# Musical Conductor Educational Edition - Implementation Plan

## Overview
This document provides a detailed implementation plan for completing the Musical Conductor Educational Edition game as specified in `specs/conductor-game.md`. The plan is designed for Claude Sonnet agents to implement in sequential phases.

## Current State Analysis

### Existing Foundation (✅ Complete)
- Electron application with hand tracking via MediaPipe
- Basic gesture recognition (6 gesture types)
- Audio system with theme switching
- Visual effects and emoji animations
- UI with welcome screen and production/debug modes

### Missing Core Features (❌ To Implement)
- Music theory engine for educational content
- Hand-to-note mapping for piano control
- AI teacher integration
- Visual learning system
- Discovery and progression tracking

## Implementation Phases

### Phase 1: Core Musical Foundation (High Priority)

#### Task 1.1: Music Theory Engine
**Files to create/modify:**
- `src/conductor-mode/musicTheoryEngine.js`
- `src/conductor-mode/musicalConstants.js`

**Implementation details:**
```javascript
// Key features to implement:
- Note frequency calculation and mapping
- Interval detection between any two notes
- Chord recognition (major, minor, diminished, augmented)
- Scale pattern detection
- Real-time analysis of playing patterns
```

**Deliverables:**
- Complete music theory calculation system
- Unit tests for all theory functions
- Integration with hand tracking data

#### Task 1.2: Hand-to-Note Mapping System
**Files to modify:**
- `src/conductor-mode/conductorController.js`
- `src/conductor-mode/handNoteMapper.js` (new)

**Implementation details:**
```javascript
// Mapping requirements:
- Left hand: C2-B3 (2 octaves, bass)
- Right hand: C4-B5 (2 octaves, treble)
- X-axis: note selection within octave
- Y-axis: octave selection
- Z-axis: velocity/volume
- Smooth interpolation between notes
```

**Deliverables:**
- Precise hand position to note mapping
- Visual indicators for current notes
- Smooth transitions between notes

### Phase 2: Educational Systems (High Priority)

#### Task 2.1: Educational Visual System
**Files to create:**
- `src/conductor-mode/educationalRenderer.js`
- `src/conductor-mode/theoryVisualizer.js`

**Features to implement:**
- Interval bridges between hands
- Chord shape visualization
- Scale pattern indicators
- Discovery celebration effects
- Real-time theory display

#### Task 2.2: AI Teacher Integration
**Files to create:**
- `src/conductor-mode/aiTeacher.js`
- `src/conductor-mode/aiResponseCache.js`
- `src/conductor-mode/workers/ai-analysis-worker.js`

**Implementation approach:**
1. Create Web Worker for non-blocking AI calls
2. Implement response caching system
3. Build contextual prompt generation
4. Add precomputed fallback responses
5. Integrate with Anthropic/OpenAI API

**Key features:**
- 5-second response time maximum
- Context-aware suggestions
- Celebration of discoveries
- Progressive difficulty adjustment

### Phase 3: Game Systems (Medium Priority)

#### Task 3.1: Discovery & Progress System
**Files to create:**
- `src/conductor-mode/progressTracker.js`
- `src/conductor-mode/discoverySystem.js`

**Features:**
- Track all musical discoveries
- Unlock system for concepts
- Achievement notifications
- Progress persistence (localStorage)
- Skill level estimation

#### Task 3.2: Piano Audio System
**Files to modify:**
- `src/conductor-mode/audioSystem.js`
- Add piano sample loading
- Implement proper note triggering

**Requirements:**
- 88-key piano sample set
- <50ms audio latency
- Velocity sensitivity
- Sustain pedal simulation

### Phase 4: Polish & Integration (Low Priority)

#### Task 4.1: Piano Discovery Garden Mode
**Implementation:**
- Free exploration always available
- Guided moments every 30-60 seconds
- Collection mechanics for discoveries
- Integrated tutorial flow

#### Task 4.2: Performance Optimization
**Optimizations:**
- Move theory calculations to Web Worker
- Implement object pooling for visuals
- Cache AI responses aggressively
- Ensure consistent 60fps

## Technical Implementation Guidelines

### Code Organization
```
src/conductor-mode/
├── core/
│   ├── musicTheoryEngine.js
│   ├── handNoteMapper.js
│   └── musicalConstants.js
├── educational/
│   ├── aiTeacher.js
│   ├── progressTracker.js
│   └── discoverySystem.js
├── visuals/
│   ├── educationalRenderer.js
│   └── theoryVisualizer.js
├── workers/
│   └── ai-analysis-worker.js
└── modes/
    └── pianoDiscoveryGarden.js
```

### Integration Points
1. **Hand Tracking → Note Mapping**
   - Modify `updateHandGestures()` to include note calculation
   - Add note trigger events to audio system

2. **Theory Engine → Visual System**
   - Real-time analysis feeds visual indicators
   - Discovery events trigger celebrations

3. **AI Teacher → UI**
   - Non-blocking suggestions appear in UI
   - Context updates trigger AI analysis

4. **Progress → Game Mode**
   - Discoveries unlock new challenges
   - Skill level adjusts AI guidance

## Testing Requirements

### Unit Tests
- Music theory calculations
- Hand position mappings
- Discovery detection logic
- AI prompt generation

### Integration Tests
- Hand tracking to audio pipeline
- Theory analysis to visuals
- AI response timing
- Progress persistence

### Performance Tests
- 60fps with all systems active
- <100ms hand tracking latency
- <50ms audio latency
- <5s AI response time

## Success Metrics
- 80% of players discover a major chord in first session
- 60% understand intervals after 30 minutes
- Average session length: 20+ minutes
- All educational features working smoothly

## Implementation Order for Sonnet Agents

1. **Start with Music Theory Engine** - Foundation for everything
2. **Implement Hand-to-Note Mapping** - Core interaction
3. **Build Visual Learning System** - Immediate feedback
4. **Add AI Teacher** - Educational guidance
5. **Create Progress System** - Track learning
6. **Polish with Game Mode** - Tie it all together

Each task should be completed with:
- Working implementation
- Basic tests
- Integration with existing systems
- Documentation of new features

## Notes for Implementers
- Always test with actual hand tracking
- Ensure educational elements are fun, not preachy
- Keep performance as top priority
- Make discoveries feel magical
- Test with music beginners for accessibility