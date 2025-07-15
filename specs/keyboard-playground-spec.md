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
Each printable character is assigned themed audio-visual feedback:

**Letters (A-Z)**: Animal + related items themes
- **Example**: D = Dog Theme
  - Emojis: [🐶, 🦴, 🎾]
  - Sounds: Low "woof", high "yip", squeaky toy

**Numbers (0-9)**: Numeric and symbolic themes  
- **Example**: 3 = Three Theme
  - Emojis: [🥉, 👌, 🕒] 
  - Sounds: Three-note sequence

**Symbols**: Functional and expressive themes
- **Example**: ! = Exclamation Theme
  - Emojis: [❗, ⚠️, 💥]
  - Sounds: Sharp accent + percussion

### Animation Behavior
- **Spawn**: Emojis appear at randomized locations with targeting system
- **Motion**: Float upward with slight physics (wobble, rotation)
- **Lifetime**: Fade out after reaching top or after 5 seconds
- **Concurrency**: Support 20+ simultaneous emojis without performance loss

### Targeting System (Integration Point)
- **Spawn Patterns**: Randomized locations across screen with padding constraints
- **Padding**: 10% margin from screen edges to keep content centered
- **Distribution**: Weighted center bias for more natural visual clustering
- **Modes**: Support for different spawn patterns (random, center-bias, future: gaze-targeted)
- **API**: `spawnEmoji(key, targetX?, targetY?)` with optional position override

### Audio System
- **Engine**: Tone.js for synthesis
- **Latency**: < 50ms from keypress to sound
- **Polyphony**: Multiple simultaneous sounds supported
- **Sound Selection**: Theme-based deterministic system
- **Theme 1**: Single deterministic sound per character (current implementation)
- **Future Themes**: Array structure allows for variations while maintaining deterministic behavior

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
- [ ] All printable characters (A-Z, 0-9, symbols) produce unique themed output
- [ ] Random selection works across emoji/sound sets
- [ ] Multiple rapid keypresses handled smoothly (including same-key repeats)
- [ ] Dvorak and alternative keyboard layouts work correctly
- [ ] Exit button closes application cleanly

### Experience Tests
- [ ] First-time users understand immediately
- [ ] Users report feeling "delighted" or "amused"
- [ ] Natural to try all keys without prompting
- [ ] No performance degradation over 5 minutes

## Character Mapping Reference

### Letters (A-Z)
| Key | Theme | Emojis | Sound Types |
|-----|-------|---------|-------------|
| A | Ant/Apple | [🐜, 🍎, 🍏] | Tiny steps, crunch |
| B | Bear/Ball | [🐻, ⚽, 🏀] | Growl, bounce |
| C | Cat/Car | [🐱, 🚗, 🏎️] | Meow, vroom |
| D | Dog/Toys | [🐶, 🦴, 🎾] | Woof, squeak |
| ... | ... | ... | ... |
| Z | Zebra/Zigzag | [🦓, ⚡, 〰️] | Whinny, zap |

### Numbers (0-9)
| Key | Theme | Emojis | Sound Types |
|-----|-------|---------|-------------|
| 0 | Zero/Circle | [🥯, ⭕, 🔮] | Drone, empty thump |
| 1 | One/First | [🥇, 👆, 🕐] | Single ping, tone |
| 2 | Two/Pair | [✌️, 👥, 🕑] | Double ping |
| 3 | Three/Trio | [🥉, 👌, 🕒] | Triple ping sequence |
| ... | ... | ... | ... |
| 9 | Nine/Lives | [🐱, ☁️, 🕘] | Nine harmony |

### Common Symbols
| Key | Theme | Emojis | Sound Types |
|-----|-------|---------|-------------|
| ! | Exclamation | [❗, ⚠️, 💥] | Sharp accent |
| ? | Question | [❓, 🤔, 🔍] | Rising tone |
| @ | At/Email | [📧, 🌐, 📍] | Digital chime |
| # | Hash/Tag | [🏷️, 🎵, #️⃣] | Sharp percussion |
| ... | ... | ... | ... |

## Future Considerations
- Volume control slider
- Theme switching (silly → musical → nature)
- Record/playback sessions
- Multi-key combos for special effects

## Implementation Notes (v1.1)

### Security Requirements
- **Content Security Policy**: Must include CSP meta tag to eliminate Electron security warnings
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; script-src-elem 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; worker-src blob:; connect-src blob: 'self';">
  ```
- **CSP Worker Constraints**: Tone.js requires blob workers for audio processing - must allow `worker-src blob:`, `connect-src blob:`, and `script-src-elem blob:`
- **Audio Worker Compatibility**: Modern Tone.js versions create blob workers that will fail without proper CSP permissions

### Audio System Constraints
- **Reliable Synths**: Use stable Tone.js synthesizers (synth, pluck, membrane, metal) 
- **Avoid Problematic Types**: Oscillator and NoiseSynth cause timing errors with rapid keypresses
- **Rapid Keypress Timing**: CRITICAL - Tone.js throws "Start time must be strictly greater than previous start time" on rapid keypresses
- **Timing Solution**: Implement synth instance pooling (4 instances per type) with forced release for busy synths
- **Random Timing Offset**: Add 0-5ms random delay to prevent exact timing collisions
- **Same-Key Rapid Presses**: Force release existing notes when all synths are busy to prevent audio dropouts
- **Error Handling**: Wrap all audio playback in try-catch blocks with graceful fallbacks
- **Polyphony Safety**: Implement proper triggerAttackRelease vs triggerAttack/triggerRelease patterns
- **Audio Context Management**: Use Tone.now() scheduling with reduced buffer times for faster reuse

### Input Filtering
- **Character Support**: Process all printable characters (A-Z, 0-9, symbols) using `key.length === 1` check
- **Modifier Filtering**: Exclude META, CTRL, ALT, SHIFT, arrow keys, function keys, and other non-printable keys
- **Layout Compatibility**: Map by actual character produced, not key position (supports Dvorak, QWERTZ, etc.)
- **Case Handling**: Convert letters to uppercase for consistent theme mapping

### Performance Optimizations  
- **Emoji Limits**: Hard cap at 20 concurrent emojis with oldest-first removal
- **Animation Cleanup**: Automatic removal when emojis exceed lifetime or go off-screen
- **Memory Management**: Proper disposal of audio and animation systems on unmount

### Development Workflow
- **Build Tools**: Use Parcel with concurrently for parallel renderer/electron development
- **Hot Reloading**: Separate dev scripts for renderer (port 3000) and electron processes
- **Package Structure**: Remove conflicting "main" field to avoid Parcel library target errors

## Version History
- v1.0 - Initial MVP specification (26 letter keys only)
- v1.1 - Implementation requirements and constraints based on development experience
- v1.2 - Expanded character support (A-Z, 0-9, symbols), Dvorak compatibility, rapid keypress fixes