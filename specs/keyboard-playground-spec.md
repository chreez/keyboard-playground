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

## Version History
- v1.0 - Initial MVP specification