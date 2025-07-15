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
- **Key Mapping**: 26 alphabet keys mapped to themed emoji/sound sets (animals + related items)
- **Animation Engine**: Physics-based emoji spawning with concurrent support for 20+ emojis
- **Dual Mode Operation**: 
  - Mode 1: Traditional bottom-spawn (fallback)
  - Mode 2: Gaze-controlled spawn points with eye tracking
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

The application should produce immediate delight - users should smile within the first 10 keypresses with zero learning curve required. All 26 keys must produce unique themed output with smooth performance during rapid keypresses and multi-minute sessions.