# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an experimental Electron application that creates joyful audio-visual feedback through keyboard interaction. The project consists of three main components defined by specification documents:

1. **Keyboard Playground** - Core Electron app with React UI and audio-visual feedback
2. **Eye Tracking Module** - Standalone webcam-based gaze tracking using WebGazer.js  
3. **Integration System** - Rules for combining keyboard and eye tracking modes

## Architecture

### Tech Stack
- **Platform**: Electron (frameless fullscreen window)
- **Frontend**: React for UI state management
- **Animation**: HTML5 Canvas for emoji animations (60+ FPS target)
- **Audio**: Tone.js for real-time sound synthesis (<50ms latency)
- **Eye Tracking**: WebGazer.js with ridge regression/neural network models

### Core Systems
- **Key Mapping**: Comprehensive character support (A-Z, 0-9, symbols) with themed emoji/sound sets
  - Letters: Animal themes (A=Ant, B=Bear, etc.)
  - Numbers: Numeric themes (0=Zero/Circle, 1=One/First, etc.)  
  - Symbols: Functional themes (!=Exclamation, @=Email, etc.)
- **Animation Engine**: Physics-based emoji spawning with concurrent support for 20+ emojis
- **Targeting System**: 10% screen padding with 70% center-bias distribution
- **Audio System**: Theme-based deterministic sounds with synth pooling for rapid keypresses
- **Dual Mode Operation**: 
  - Mode 1: Traditional targeting system (current)
  - Mode 2: Gaze-controlled spawn points with eye tracking (future)
- **Graceful Degradation**: Full keyboard functionality maintained if eye tracking fails

## Performance Requirements

- 60 FPS minimum animation framerate
- <50ms audio latency from keypress to sound
- <200MB RAM usage
- <30% CPU usage for eye tracking
- 30+ Hz eye tracking update rate
- 100px accuracy target for 80% of gaze fixations

## Key Application Controls

| Key | Function |
|-----|----------|
| A-Z | Trigger themed emoji/sound combinations |
| ESC | Toggle eye tracking on/off |
| SPACE | Recalibrate eye tracking |
| TAB | Show/hide gaze crosshair |
| F1 | Show eye tracking status |
| ✕ (top-right) | Exit application |

## Development Patterns

### Mode Transitions
- Startup: Launch keyboard mode immediately, initialize eye tracking in background
- Tracking lost: Smooth 500ms transition to keyboard mode with crosshair fadeout
- Tracking restored: Requires 2 seconds stable tracking before enabling gaze mode

### Eye Tracking Integration
- All processing local (no video data transmitted)
- 9-point calibration system (<30 seconds)
- Confidence indicators: Green (<50px), Yellow (50-100px), Red (>100px)
- Kalman filter smoothing for jitter reduction

### Performance Optimization Priority
1. Reduce eye tracking frequency
2. Disable particle effects  
3. Simplify emoji physics
4. Reduce concurrent emoji limit
5. Disable eye tracking entirely

## Success Criteria

The application should produce immediate delight - users should smile within the first 10 keypresses with zero learning curve required. All characters must produce unique themed output with smooth performance during rapid keypresses and multi-minute sessions.

## Development Commands

### Application Suite
The project consists of three separate applications:

#### 1. Keyboard Playground (Original)
```bash
# Development mode (recommended)
npm run dev          # Port 3000

# Production build and run
npm start
npm run build        # Build only
```

#### 2. Eye Tracking Test (Standalone)
```bash
# Development mode
npm run dev:eyetracking    # Port 3001

# Production build and run
npm run start:eyetracking
npm run build:eyetracking  # Build only
```

#### 3. Integrated Experience
```bash
# Development mode
npm run dev:integrated     # Port 3002

# Production build and run
npm run start:integrated
npm run build:integrated   # Build only
```

### Development Workflow
```bash
# Choose your target application:
npm run dev                # Original playground
npm run dev:eyetracking    # Eye tracking test
npm run dev:integrated     # Combined experience

# Each opens in fullscreen Electron window
# Changes auto-reload via Parcel + Electron restart
```

## Development Workflow

### Design Decision Process
When making significant changes to the codebase, follow this workflow:

1. **Identify the Change**: Clearly define what needs to be modified
2. **Update Specification**: Document the change in the relevant spec file first
3. **Implement Changes**: Make the code changes with proper structure for future flexibility
4. **Commit with Context**: Use descriptive commit messages explaining both the change and reasoning
5. **Update Documentation**: Ensure CLAUDE.md reflects any workflow or architectural changes

### Commit Best Practices
- **Atomic Commits**: Each commit should represent one logical change
- **Descriptive Messages**: Include both what changed and why
- **Spec Updates**: Always update specs when making design decisions
- **Future-Proofing**: Structure code to allow for future variations (e.g., array structure for themes)
- **Size Limits**: Keep commits focused and manageable
  - Maximum 500 lines changed per commit (excluding generated files)
  - If a feature requires more, break into logical sub-commits
  - Each commit should compile and pass basic functionality tests
  - Large refactors should be staged across multiple commits

### Design Patterns Used
- **Theme System**: Audio uses array structure with single-item arrays for Theme 1 (deterministic)
- **Targeting System**: Emoji spawn system designed as integration point for future enhancements
- **Graceful Degradation**: All systems work independently and fail gracefully

### Implementation Guidelines

#### Theme System Evolution
- **Current State**: Theme 1 implements single deterministic sounds per character
- **Future Flexibility**: Array structure maintained to support multiple sound variations
- **Selection Logic**: Theme-specific selection methods (e.g., `sounds[0]` for Theme 1)
- **Consistency**: All characters should follow same array structure pattern

#### Code Structure Principles
- **Extensibility**: Design systems as integration points for future features
- **Maintainability**: Keep related functionality grouped in logical modules
- **Performance**: Optimize for smooth 60fps animation and <50ms audio latency
- **Modularity**: Each system (audio, animation, targeting) should be independently testable

#### Testing and Validation
- **User Experience**: Test with actual typing to ensure smooth rapid keypresses
- **Performance**: Monitor for audio timing conflicts and animation frame drops
- **Compatibility**: Verify works with different keyboard layouts (Dvorak, QWERTZ)
- **Edge Cases**: Test sustained typing sessions and system resource usage