# Keyboard Playground Specification v1.3

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
- **Motion**: Character-specific animation types (bounce, spiral, pulse, wiggle, burst, drift, swing, typewriter, hop, float)
- **Lifetime**: Fade out after reaching top or after 6 seconds
- **Concurrency**: Support 20+ simultaneous emojis without performance loss
- **Animation Types**: See detailed specification in `specs/animation-types-spec.md`

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
- **Sound Selection**: Theme-based deterministic system with extensible architecture

#### Theme System Architecture
- **Theme 1 (Current)**: Single deterministic sound per character
  - Each character maps to single-item array containing one sound definition
  - Provides consistent, predictable audio feedback for muscle memory
  - Uses `playThemeSound()` method with `sounds[0]` selection
- **Theme 2 (Xylophone/Piano)**: Musical scale mapping with pleasant tones
  - Characters arranged in chromatic scale progression for natural musical feel
  - **Letters (A-Z)**: Map to 26 ascending chromatic notes starting from C3
    - A=C3, B=C#3, C=D3, D=D#3, E=E3, F=F3, G=F#3, H=G3, I=G#3, J=A3, K=A#3, L=B3, M=C4, N=C#4, O=D4, P=D#4, Q=E4, R=F4, S=F#4, T=G4, U=G#4, V=A4, W=A#4, X=B4, Y=C5, Z=C#5
  - **Numbers (0-9)**: Map to major pentatonic scale for harmonic consonance
    - 0=C4, 1=D4, 2=E4, 3=G4, 4=A4, 5=C5, 6=D5, 7=E5, 8=G5, 9=A5
  - **Symbols**: Map to percussive and bell-like tones for textural variety
    - Common symbols use higher octave metallic tones (C6-C7 range)
  - **Synth Type**: Bright, crystalline 'pluck' synth with moderate sustain
  - **Musical Characteristics**: Playful yet pleasant, encourages melodic exploration
- **Future Themes**: Array structure designed for variations
  - Multi-item arrays enable sound variations within same character theme
  - Maintains deterministic behavior through theme-specific selection logic
  - Supports progressive complexity (Theme 3: random from set, Theme 4: context-aware, etc.)
- **Implementation**: Function-based theme definitions return sound descriptor arrays
  - Format: `{ synth: 'type', note: 'pitch', duration: 'length' }`
  - Synth types: 'pluck', 'membrane', 'metal', 'synth'
  - Supports complex themes with multiple layered sounds per keypress

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
  - **Theme 2 Implementation**: Xylophone/Piano musical scale theme ready for development
  - **Theme Selection**: UI control to switch between Theme 1 (animal sounds) and Theme 2 (musical)
  - **Theme Persistence**: Remember user's theme preference across sessions
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

## Multi-Application Architecture (v1.4)

### Application Suite
The project now consists of three separate applications to maintain separation of concerns:

#### 1. Keyboard Playground (Original)
- **Command**: `npm run dev` (port 3000)
- **Purpose**: Core keyboard-to-audio-visual experience
- **Status**: Production-ready, no regressions
- **Features**: All original functionality preserved

#### 2. Eye Tracking Test
- **Command**: `npm run dev:eyetracking` (port 3001)
- **Purpose**: Standalone eye tracking development and testing
- **Status**: Mock implementation using mouse simulation
- **Features**: Calibration, crosshair, confidence indicators, all hotkeys

#### 3. Integrated Experience
- **Command**: `npm run dev:integrated` (port 3002)
- **Purpose**: Combined keyboard + eye tracking experience
- **Status**: Fully functional with mock eye tracking
- **Features**: Mode switching, smooth transitions, gaze-controlled spawning

### Integration Architecture
- **Mode 1**: Keyboard-only (default/fallback) - original targeting system
- **Mode 2**: Eye-controlled spawn when tracking confidence > 50%
- **Smooth Transitions**: 500ms crosshair fade, visual mode indicators
- **Graceful Degradation**: Falls back to keyboard mode if tracking fails

## Version History
- v1.0 - Initial MVP specification (26 letter keys only)
- v1.1 - Implementation requirements and constraints based on development experience
- v1.2 - Expanded character support (A-Z, 0-9, symbols), Dvorak compatibility, rapid keypress fixes
- v1.3 - Theme system architecture with deterministic Theme 1 implementation
- v1.4 - Multi-application architecture with eye tracking integration
- v1.5 - Added Theme 2 (Xylophone/Piano) specification with musical scale mapping
- v1.6 - Enhanced animation system with 10 unique animation types and character-specific mapping