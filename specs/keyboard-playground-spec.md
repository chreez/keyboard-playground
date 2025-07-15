# Keyboard Playground Specification v1.7

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
- **Background**: Pure black (#000000) with dynamic mood-based gradients
- **Exit**: Custom minimal close button (✕) in top-right corner
- **Theme Controls**: Piano/Guitar theme switching buttons in top-left corner
- **Music Control**: Background music toggle button (🎵 Music) in top-left corner

### Key Mapping System
Each printable character is assigned themed audio-visual feedback based on current theme:

**Current Implementation**: QWERTY keyboard position-based musical mapping
- **Left side keys** (A, S, Z, Q) = **Low octaves** (2-3)
- **Right side keys** (L, P, M, 0) = **High octaves** (4-5)
- **Numbers row** = **Highest octave** (5)
- **Consistent chromatic scale** progression across keyboard layout

**Theme-Specific Mapping**:
- **Theme 2 (Piano)**: Realistic piano sounds with AMSynth and proper attack/decay
- **Theme 3 (Guitar)**: Electric guitar simulation with distortion, chorus, delay, reverb
- **Sustained Notes**: Hold any letter/number for sustained tones
- **Symbols**: One-shot percussive sounds for punctuation feel

### Animation Behavior
- **Spawn**: Emojis appear at randomized locations with targeting system
- **Motion**: Character-specific animation types (bounce, spiral, pulse, wiggle, burst, drift, swing, typewriter, hop, float)
- **Complex Animations**: Multi-emoji compositions (e.g., car with smoke trail)
- **Lifetime**: Fade out after reaching top or after 6 seconds
- **Concurrency**: Support 20+ simultaneous emojis without performance loss
- **Performance Scaling**: Automatic quality degradation under load
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
- **Polyphony**: Multiple simultaneous sounds supported with synth pooling
- **Sound Selection**: Theme-based deterministic system with extensible architecture
- **Background Music**: Ambient theme music with volume controls and theme synchronization
- **Sustained Notes**: Support for holding keys with proper note release
- **Effects Processing**: Theme-specific effects chains for realistic instrument simulation

#### Theme System Architecture
- **Theme 2 (Piano)**: Realistic piano simulation with keyboard position mapping
  - **QWERTY Position Mapping**: Keys mapped by physical position on keyboard
    - **Z Row (octave 2)**: Z=C2, X=C#2, C=D2, V=D#2, B=E2, N=F2, M=F#2
    - **A Row (octave 3)**: A=C3, S=C#3, D=D3, F=D#3, G=E3, H=F3, J=F#3, K=G3, L=G#3
    - **Q Row (octave 4)**: Q=C4, W=C#4, E=D4, R=D#4, T=E4, Y=F4, U=F#4, I=G4, O=G#4, P=A4
    - **Numbers (octave 5)**: 1=C5, 2=C#5, 3=D5, 4=D#5, 5=E5, 6=F5, 7=F#5, 8=G5, 9=G#5, 0=A5
  - **Synth Type**: AMSynth with realistic piano attack/decay characteristics
  - **Effects Chain**: Reverb (2.0s decay) + Volume control (-4dB)
  - **Musical Characteristics**: Authentic piano feel with proper sustain behavior
  - **Sustained Notes**: Full support for holding keys with natural release
- **Theme 3 (Guitar Synth)**: Electric guitar simulation with comprehensive effects processing
  - **Letters (A-Z)**: Lead guitar tones optimized for solos and melodic lines
    - MonoSynth with sawtooth oscillator, quick attack (0.02s), long release (1.5s)
    - Filter envelope for expressive tonal shaping
  - **Numbers (0-9)**: Rhythm guitar sounds with chunky midrange emphasis
    - Shorter sustain (0.6), faster decay (0.2s) for percussive rhythm feel
    - Lower filter frequency (1500Hz) for fuller sound
  - **Symbols**: Percussive guitar effects for accents and punctuation
    - Square wave oscillator, very quick attack (0.005s), short release (0.5s)
    - High filter frequency (3000Hz) for cutting accent sounds
  - **Effects Chain**: Distortion (0.4 drive) → Chorus (4Hz rate) → Delay (0.25s) → Reverb (2.0s) → Volume (-3dB)
  - **Synth Type**: MonoSynth with sawtooth waves for electric guitar authenticity
  - **Musical Characteristics**: Full range from clean jazz to heavy rock distortion
  - **Sustained Notes**: Authentic guitar sustain with natural feedback characteristics
- **Future Themes**: Array structure designed for variations
  - Multi-item arrays enable sound variations within same character theme
  - Maintains deterministic behavior through theme-specific selection logic
  - Supports progressive complexity (Theme 3: random from set, Theme 4: context-aware, etc.)
- **Implementation**: Function-based theme definitions return sound descriptor arrays
  - Format: `{ synth: 'type', note: 'pitch', duration: 'length' }`
  - Synth types: 'pluck', 'membrane', 'metal', 'synth'
  - Supports complex themes with multiple layered sounds per keypress

#### Background Music System
- **Purpose**: Ambient music loops that enhance the typing experience without interfering
- **Theme Integration**: Background music changes to match current theme (piano/guitar)
- **Volume Control**: Independent volume control for background music vs keyboard sounds
- **Mood Responsiveness**: Music adapts to detected mood (calm, energetic, etc.)
- **Loop System**: Seamless looping ambient tracks with smooth transitions

**Theme-Specific Background Music**:
- **Theme 2 (Piano)**: Classical ambient piano loops with gentle harmonies
  - Calm mood: Soft, meditative piano arpeggios
  - Energetic mood: More dynamic classical piano patterns
  - Playful mood: Light, bouncy piano melodies
- **Theme 3 (Guitar)**: Ambient guitar soundscapes with atmospheric effects
  - Clean mood: Gentle fingerpicked acoustic guitar
  - Warm mood: Mellow electric guitar with chorus
  - Driven mood: Mid-tempo rock rhythm guitar
  - Heavy mood: Atmospheric distorted guitar drones

**Technical Implementation**:
- **Transport**: Tone.js Transport for synchronized playback at 80 BPM
- **Scheduling**: Pattern-based sequencing with seamless looping
- **Effects**: Separate effects chain (Chorus → Delay → Reverb → Volume)
- **Mixing**: Background music at -12dB to avoid masking keyboard sounds
- **Performance**: Lightweight patterns that don't impact typing latency
- **Crossfading**: 2-second smooth transitions between mood changes
- **Pattern Management**: Automatic pattern switching based on mood detection

#### Mood Detection & Background Integration
- **Real-time Analysis**: Analyzes typing patterns for tempo, intensity, rhythm variance
- **Mood Categories**: 
  - **General**: calm, energetic, playful, intense, frantic
  - **Guitar-specific**: guitar-clean, guitar-warm, guitar-driven, guitar-heavy
- **Octave Integration**: Lower octaves trigger warmer colors, higher octaves trigger cooler colors
- **Speed Sensitivity**: Faster typing increases background intensity
- **Visual Feedback**: Background gradients and particle effects respond to mood
- **Audio Feedback**: Background music patterns adapt to detected mood

## Technical Architecture

### Stack
- **Framework**: React (UI state management)
- **Rendering**: HTML5 Canvas (emoji animations)
- **Audio**: Tone.js (sound synthesis)
- **Platform**: Electron (frameless window)

### Performance Requirements
- **Animation**: 60 FPS minimum with automatic quality scaling
- **Audio**: < 50ms latency from keypress to sound
- **Memory**: < 200MB RAM usage for all systems
- **Concurrency**: Smooth with 20+ active emojis
- **Background Music**: No impact on keyboard sound latency
- **Mood Detection**: Real-time analysis without performance degradation
- **Theme Switching**: Instantaneous with proper cleanup

## User Experience & Controls

### Application Controls
| Key/Action | Function |
|------------|----------|
| **A-Z, 0-9** | Trigger themed emoji animations and sounds |
| **Hold A-Z, 0-9** | Sustained notes (piano/guitar themes) |
| **Symbols** | One-shot percussive sounds and animations |
| **Piano Button** | Switch to Theme 2 (realistic piano) |
| **Guitar Button** | Switch to Theme 3 (electric guitar) |
| **🎵 Music Button** | Toggle background music on/off |
| **✕ Button** | Exit application |

### Theme Characteristics
- **Piano Theme**: Realistic piano with proper attack/decay, reverb, octave-based layout
- **Guitar Theme**: Electric guitar with distortion, chorus, delay, mood-responsive effects
- **Background Music**: Ambient loops that adapt to typing mood and theme
- **Visual Feedback**: Background colors and particles respond to octave and mood
- **Sustained Notes**: Natural instrument behavior when holding keys

## Success Criteria

### Functional Tests
- [ ] All printable characters (A-Z, 0-9, symbols) produce unique themed output
- [ ] Theme switching works instantly without audio artifacts
- [ ] Sustained notes respond properly to key press/release
- [ ] Background music adapts to mood changes smoothly
- [ ] Multiple rapid keypresses handled smoothly (including same-key repeats)
- [ ] Dvorak and alternative keyboard layouts work correctly
- [ ] All UI controls (theme switching, music toggle, exit) function properly

### Experience Tests
- [ ] First-time users understand immediately
- [ ] Users report feeling "delighted" or "amused"
- [ ] Natural to try all keys without prompting
- [ ] Theme switching feels intuitive and responsive
- [ ] Background music enhances rather than distracts from typing
- [ ] No performance degradation over 5 minutes

## Character Mapping Reference

### Current Implementation: QWERTY Position-Based Musical Mapping

### Keyboard Layout (Theme 2 - Piano)
| Row | Keys | Notes | Octave |
|-----|------|-------|--------|
| **Numbers** | 1-0 | C5-A5 | 5 (highest) |
| **Q Row** | Q-P | C4-A4 | 4 (high) |
| **A Row** | A-L | C3-G#3 | 3 (medium) |
| **Z Row** | Z-M | C2-F#2 | 2 (low) |

### Theme-Specific Sound Characteristics

#### Theme 2 (Piano)
- **Synth**: AMSynth with piano-like attack/decay
- **Attack**: 0.005s (sharp piano hammer strike)
- **Decay**: 0.3s (natural note decay)
- **Sustain**: 0.2 (realistic piano sustain)
- **Release**: 2.5s (natural tail-off)
- **Effects**: Reverb (2.0s decay) + Volume (-4dB)

#### Theme 3 (Guitar)
- **Letters**: Lead guitar (sawtooth, attack 0.02s, release 1.5s)
- **Numbers**: Rhythm guitar (faster decay 0.2s, sustain 0.6)
- **Symbols**: Effects guitar (square wave, attack 0.005s, release 0.5s)
- **Effects**: Distortion → Chorus → Delay → Reverb → Volume (-3dB)

### Animation Mappings
All characters use the comprehensive animation system with 10 unique types:
- **Bounce**: Balls, playful animals (⚽, 🏀, 🐰)
- **Spiral**: Magical elements (✨, 🌟, 🦄)
- **Pulse**: Hearts, alerts (💖, ❗, ⚠️)
- **Wiggle**: Living creatures (🐛, 🐍, 🐟)
- **Burst**: Explosive elements (💥, 🚀, 🎉)
- **Drift**: Light objects (💨, ☁️, 🎈)
- **Swing**: Hanging objects (🔔, ⚖️, 🗝️)
- **Typewriter**: Communication (📝, 💬, 📧)
- **Hop**: Small creatures (🐜, 🦗, 🐸)
- **Float**: Default animation for neutral objects

## Future Considerations
- **Volume Control**: Individual sliders for keyboard sounds vs background music
- **Additional Themes**: 
  - Theme 4: Orchestral instruments (strings, brass, woodwinds)
  - Theme 5: Electronic/synthetic sounds
  - Theme 6: Natural sounds (rain, wind, birds)
- **Theme Persistence**: Remember user's theme and music preferences across sessions
- **Recording System**: Record and playback typing sessions with full audio-visual reproduction
- **Multi-key Combos**: Special effects for chord-like key combinations
- **MIDI Export**: Export typed melodies as MIDI files
- **Customization**: User-defined key mappings and sound assignments
- **Performance Analytics**: Typing speed, rhythm, and musical analysis

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
- **v1.0** - Initial MVP specification (26 letter keys only)
- **v1.1** - Implementation requirements and constraints based on development experience
- **v1.2** - Expanded character support (A-Z, 0-9, symbols), Dvorak compatibility, rapid keypress fixes
- **v1.3** - Theme system architecture with deterministic Theme 1 implementation
- **v1.4** - Multi-application architecture with eye tracking integration
- **v1.5** - Added Theme 2 (Xylophone/Piano) specification with musical scale mapping
- **v1.6** - Enhanced animation system with 10 unique animation types and character-specific mapping
- **v1.7** - **CURRENT VERSION** - Comprehensive theme system with realistic instruments and background music
  - **Theme 2 (Piano)**: Realistic piano simulation with AMSynth and keyboard position mapping
  - **Theme 3 (Guitar)**: Electric guitar with comprehensive effects chain and authentic sound
  - **Background Music System**: Mood-responsive ambient loops with theme integration
  - **Sustained Notes**: Full support for holding keys with proper instrument behavior
  - **Mood Detection**: Real-time analysis of typing patterns with visual/audio feedback
  - **UI Controls**: Theme switching buttons and background music toggle
  - **Performance Optimization**: Automatic quality scaling and efficient resource management