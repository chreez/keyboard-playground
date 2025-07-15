# Keyboard Playground Specification v1.0

## Overview
An experimental Electron application that creates joyful audio-visual feedback through keyboard interaction, designed for immediate delight and zero-friction play.

## Core Values & Intent
- **Immediate Joy**: Users should smile within the first 10 keypresses
- **Zero Friction**: No menus, no settings, no instructions needed
- **Sensory Delight**: Every interaction produces satisfying audiovisual feedback
- **Playful Discovery**: Encourage exploration of all keys

## Functional Requirements

### Application Structure
- **Platform**: Electron (latest stable)
- **Window**: Fullscreen, frameless with custom minimal UI
- **Background**: Pure black (#000000)
- **Exit**: Custom minimal close button (✕) in top-right corner

### Key Mapping System
Each alphabet key (A-Z) is assigned:
- **Theme**: Animal + related items
- **Emoji Set**: Minimum 3 related emojis (randomly selected per press)
- **Sound Set**: 2-3 synthesized sounds matching the theme
- **Example**: D = Dog Theme
  - Emojis: [🐶, 🦴, 🎾]
  - Sounds: Low "woof", high "yip", squeaky toy

### Animation Behavior
- **Spawn**: Emojis appear at bottom of screen
- **Motion**: Float upward with slight physics (wobble, rotation)
- **Lifetime**: Fade out after reaching top or after 5 seconds
- **Concurrency**: Support 20+ simultaneous emojis without performance loss

### Audio System
- **Engine**: Tone.js for synthesis
- **Latency**: < 50ms from keypress to sound
- **Polyphony**: Multiple simultaneous sounds supported
- **Variation**: Each theme has 2-3 sound variants

## Technical Architecture

### Stack
- **Framework**: React (UI state management)
- **Rendering**: HTML5 Canvas (emoji animations)
- **Audio**: Tone.js (sound synthesis)
- **Platform**: Electron (frameless window)

### Performance Requirements
- 60 FPS animation minimum
- < 50ms audio latency
- < 200MB RAM usage
- Smooth with 20+ active emojis

## Success Criteria

### Functional Tests
- [ ] All 26 keys produce unique themed output
- [ ] Random selection works across emoji/sound sets
- [ ] Multiple rapid keypresses handled smoothly
- [ ] Exit button closes application cleanly

### Experience Tests
- [ ] First-time users understand immediately
- [ ] Users report feeling "delighted" or "amused"
- [ ] Natural to try all keys without prompting
- [ ] No performance degradation over 5 minutes

## Complete Key Mapping Reference

| Key | Theme | Emojis | Sound Types |
|-----|-------|---------|-------------|
| A | Ant/Apple | [🐜, 🍎, 🍏] | Tiny steps, crunch |
| B | Bear/Ball | [🐻, ⚽, 🏀] | Growl, bounce |
| C | Cat/Car | [🐱, 🚗, 🏎️] | Meow, vroom |
| D | Dog/Toys | [🐶, 🦴, 🎾] | Woof, squeak |
| ... | ... | ... | ... |
| Z | Zebra/Zigzag | [🦓, ⚡, 〰️] | Whinny, zap |

## Future Considerations
- Volume control slider
- Theme switching (silly → musical → nature)
- Record/playback sessions
- Multi-key combos for special effects

## Implementation Notes (v1.1)

### Security Requirements
- **Content Security Policy**: Must include CSP meta tag to eliminate Electron security warnings
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src blob:; connect-src blob: 'self';">
  ```
- **CSP Worker Constraints**: Tone.js requires blob workers for audio processing - must allow `worker-src blob:` and `connect-src blob:`
- **Audio Worker Compatibility**: Modern Tone.js versions create blob workers that will fail without proper CSP permissions

### Audio System Constraints
- **Reliable Synths**: Use stable Tone.js synthesizers (synth, pluck, membrane, metal) 
- **Avoid Problematic Types**: Oscillator and NoiseSynth cause timing errors with rapid keypresses
- **Rapid Keypress Timing**: CRITICAL - Tone.js throws "Start time must be strictly greater than previous start time" on rapid keypresses
- **Timing Solution**: Implement audio context time scheduling or synth instance pooling for concurrent notes
- **Error Handling**: Wrap all audio playback in try-catch blocks with graceful fallbacks
- **Polyphony Safety**: Implement proper triggerAttackRelease vs triggerAttack/triggerRelease patterns
- **Audio Context Management**: Ensure proper Tone.js context timing to prevent scheduling conflicts

### Input Filtering
- **Key Validation**: Only process single-character keys (A-Z) using `key.length === 1` check
- **Modifier Filtering**: Exclude META, CTRL, ALT, SHIFT and other modifier keys
- **Case Handling**: Convert to uppercase for consistent theme mapping

### Performance Optimizations  
- **Emoji Limits**: Hard cap at 20 concurrent emojis with oldest-first removal
- **Animation Cleanup**: Automatic removal when emojis exceed lifetime or go off-screen
- **Memory Management**: Proper disposal of audio and animation systems on unmount

### Development Workflow
- **Build Tools**: Use Parcel with concurrently for parallel renderer/electron development
- **Hot Reloading**: Separate dev scripts for renderer (port 3000) and electron processes
- **Package Structure**: Remove conflicting "main" field to avoid Parcel library target errors

## Version History
- v1.0 - Initial MVP specification
- v1.1 - Implementation requirements and constraints based on development experience