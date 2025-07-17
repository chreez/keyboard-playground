# Hand-Keyboard Conductor Integration Specification v1.1

## Implementation Architecture

### Standalone Application
This conductor mode will be implemented as a **fourth independent application** to preserve the integrity of existing apps:

1. **Keyboard Playground** (`npm run dev`) - Remains untouched
2. **Eye Tracking POC** (`npm run dev:eyetracking`) - Remains untouched  
3. **Eye-Integrated Experience** (`npm run dev:integrated`) - Remains untouched
4. **Conductor Mode** (`npm run dev:conductor`) - NEW standalone app

### File Structure (Future Implementation)
```
src/
├── renderer/           # DO NOT TOUCH - Original keyboard playground
├── eye-tracking/       # DO NOT TOUCH - Eye tracking POC
├── integrated/         # DO NOT TOUCH - Eye-keyboard integration
├── conductor/          # NEW - Hand-keyboard conductor mode
│   ├── index.js       # Entry point
│   ├── conductor.js   # Main conductor logic
│   └── gestures.js    # Gesture recognition
├── shared/            # Shared modules (read-only)
│   ├── audio/         # Reused via imports
│   ├── animation/     # Reused via imports
│   └── tracking/      # Reused via imports
```

### Development Command (Future)
```bash
npm run dev:conductor    # Port 3003 - Debug mode with overlays
npm run conductor        # Port 3003 - Production mode (clean UI)
```

### Shared Code Strategy
- Import shared modules (audio, animation) as read-only
- Create new instances, don't modify shared state
- Copy and adapt code if modifications needed
- Never import from other app directories

## Overview
Defines the integration between hand tracking and keyboard playground to create a unified "Conductor Mode" where users control emoji spawning and audio through hand gestures and movements.

## Core Values & Intent
- **Polished Experience**: Clean, minimal UI for end users
- **Gestural Music**: Transform hand movements into musical expression
- **Spatial Control**: Hand position determines where emojis spawn
- **Natural Mapping**: Gestures feel intuitive and musical
- **Zero Learning Curve**: Users discover naturally through play

## UI/UX Design

### Production Mode (Default)
- **Clean Interface**: No technical overlays or debug information
- **Minimal HUD**: Only essential information displayed
- **Simple Instructions**: Brief, friendly gesture hints
- **Polished Visuals**: Beautiful trail effects and smooth animations
- **Hidden Complexity**: All technical details abstracted away

### Debug Mode (npm run dev)
- **Full Telemetry**: FPS counter, CPU usage, latency metrics
- **Hand Skeleton**: 21-point landmark overlay
- **Gesture Labels**: Recognition confidence percentages
- **Console Logging**: Detailed tracking information
- **Performance Graphs**: Real-time performance monitoring

### Initial User Experience
```
Welcome Screen (3 seconds):
┌─────────────────────────────────────┐
│                                     │
│        🎵 Conductor Mode 🎵         │
│                                     │
│    Use your hands to make music!    │
│                                     │
│  👋 Wave to begin  •  ESC to exit   │
│                                     │
└─────────────────────────────────────┘

Then fades to main experience with subtle hints
```

### In-Experience UI Elements
- **Gesture Hints** (bottom center, semi-transparent):
  - "✋ Open hand for sustained notes"
  - "👉 Point to play melodies"
  - "✊ Make a fist for drums"
- **Active Gesture Indicator** (top center):
  - Shows recognized gesture with friendly icon
  - Fades after 1 second
- **Theme Indicator** (top left):
  - Current instrument (🎹 Piano / 🎸 Guitar)
- **Exit Button** (top right):
  - Minimal ✕ matching keyboard playground style

## Conductor Mode Definition

### Single Unified Mode
- **No mode switching**: Hand tracking is always active when available
- **Graceful Degradation**: Falls back to keyboard-only if tracking fails
- **Combined Input**: Keyboard and gestures work simultaneously
- **Performance First**: Maintains 60fps with all systems active

### Hand Roles
- **Left Hand**: Parameter control (octave, theme, effects)
  - Height = Octave mapping (bottom = C2, top = C5)
  - Tilt = Effect intensity (reverb/delay)
  - Distance = Volume control
  
- **Right Hand**: Trigger control (gestures to sounds/emojis)
  - Position = Spawn location for emojis
  - Gesture = Which character to trigger
  - Velocity = Animation energy and note velocity

### Gesture Mapping
| Gesture | Triggers | Sound Type | Visual | Detection |
|---------|----------|------------|--------|-----------|
| Index Point | Numbers (1-5) based on height | Lead notes | Focused emoji | Extended index finger |
| Open Palm | Vowels (A,E,I,O,U) | Sustained chords | Floating emojis | All fingers extended |
| Fist | Percussion (!,*,#,$,&) | Drums/hits | Burst animations | All fingers closed |
| Peace Sign | Happy letters (H,J,L,Y) | Major chords | Bouncing emojis | Index + middle extended |
| Thumb Up | Celebration (P,W,Z) | Fanfare | Spiral animations | Thumb extended up |
| Pinch | Special burst | Arpeggio | Multi-emoji cascade | Thumb + index touching |

### Spawn Behavior
- **Hand-Triggered**: Emojis spawn at hand position with gesture-specific animation
- **Keyboard-Triggered**: Emojis spawn at bottom with standard animations
- **Overlap Allowed**: Both systems can trigger simultaneously for chaos
- **Visual Polish**: Smooth particle effects at spawn points

### Visual Feedback (Production)
- **Trail Effect**: Beautiful particle trail (gradient colors matching theme)
- **Gesture Recognition**: Subtle glow effect when gesture detected
- **Spawn Effects**: Elegant particle burst at emoji spawn
- **Camera Background**: Softly blurred for privacy and aesthetics
- **No Technical Overlays**: Clean, distraction-free experience

### Visual Feedback (Debug)
- **Hand Skeleton**: Full 21-point overlay with connections
- **Confidence Meters**: Percentage bars for each gesture
- **Trail Debug**: Shows trail history points and decay
- **Performance Overlay**: FPS, CPU, memory usage
- **Console Output**: Detailed gesture recognition logs

## Technical Requirements

### Performance Targets
- 60 FPS maintained with dual input systems
- <100ms gesture recognition latency
- 30+ Hz hand tracking update rate
- Support for 20+ concurrent emojis
- <30% CPU usage for hand tracking
- <200MB total RAM usage

### Gesture Recognition Pipeline
1. Hand landmark detection (MediaPipe 21 points)
2. Gesture classification (< 50ms)
3. Confidence threshold (> 80% for trigger)
4. Cooldown period (200ms between same gesture)
5. Smoothing filter for position stability

### Audio Mapping
- Left hand height: Linear octave mapping (Y position 0-1 → C2-C5)
- Right hand velocity: Note velocity (0-127 MIDI equivalent)
- Distance from camera: Volume scaling (near = loud, far = quiet)
- Gesture hold duration: Note sustain length
- Theme consistency: Gestures respect current theme (piano/guitar)

### Error Handling
- **No Camera**: Friendly message with keyboard-only fallback
- **No Hands Detected**: Subtle hint to raise hands into view
- **Low Confidence**: Silently require higher threshold
- **Multiple Hands**: Track closest/most confident pair
- **Poor Lighting**: Gentle suggestion to improve lighting

## Integration Points

### Event Flow
1. Hand tracking detects gesture + position + parameters
2. Gesture mapper converts to character event
3. Character triggers emoji spawn at hand position
4. Audio system plays sound with hand-derived parameters
5. Animation system uses gesture-specific animation type
6. Trail system updates with new hand position

### Shared State
- Current theme (affects both keyboard and gestures)
- Active emoji list (managed by both systems)
- Audio context (shared between inputs)
- Performance metrics (combined monitoring)
- Trail history (unified rendering)

### Module Dependencies
```javascript
// Shared modules (imported, not modified)
import { AudioSystem } from '../shared/audio/AudioSystem';
import { EmojiAnimator } from '../shared/animation/EmojiAnimator';
import { HandTracker } from '../shared/tracking/HandTracker';

// New conductor-specific modules
import { GestureRecognizer } from './gestures';
import { ConductorController } from './conductor';
import { UIController } from './ui'; // Handles prod vs debug UI
```

## Success Criteria

### Functional Tests
- [ ] All gestures recognized with >90% accuracy
- [ ] Hand position accurately controls spawn location
- [ ] Left hand parameters affect audio correctly
- [ ] Keyboard input continues working simultaneously
- [ ] Smooth transitions when hands enter/leave frame
- [ ] Trail effect renders without performance impact

### Experience Tests
- [ ] First-time users understand within 30 seconds
- [ ] No technical jargon visible in production mode
- [ ] Gesture hints helpful but not intrusive
- [ ] Debug mode provides all needed developer info
- [ ] Maintains joyful, polished feeling throughout

## Configuration Schema
```json
{
  "conductorMode": {
    "debugMode": false,  // Set via NODE_ENV or dev script
    "handTracking": {
      "enabled": true,
      "confidence": 0.8,
      "smoothing": 0.3
    },
    "gestures": {
      "cooldown": 200,
      "confidenceThreshold": 0.8,
      "velocityThreshold": 150
    },
    "parameters": {
      "leftHandOctaveRange": [2, 5],
      "volumeDistanceRange": [0.3, 2.0],
      "effectIntensityRange": [0, 1]
    },
    "visuals": {
      "trailEffect": true,
      "trailLength": 15,
      "trailStyle": "gradient", // gradient, particles, glow
      "cameraBlur": 5,  // Gaussian blur radius
      "spawnEffects": true,
      "gestureGlow": true
    },
    "ui": {
      "showWelcome": true,
      "welcomeDuration": 3000,
      "gestureHints": true,
      "hintsFadeDelay": 5000,
      "minimalMode": true  // Even less UI
    },
    "debug": {
      "showSkeleton": true,
      "showConfidence": true,
      "showPerformance": true,
      "consoleLogging": true,
      "showTelemetry": true
    },
    "logging": {
      "enabled": true,
      "level": "debug",  // error, warn, info, debug, trace
      "systems": {
        "initialization": true,
        "handTracking": true,
        "audioSystem": true,
        "gestureRecognition": true,
        "interactiveObjects": true,
        "musicTheory": true,
        "visualEffects": true,
        "performance": true,
        "errors": true
      },
      "format": {
        "timestamps": true,
        "systemIcons": true,  // Use emoji prefixes for each system
        "verbose": true,      // Include full object details
        "stackTraces": true   // For errors
      },
      "realtime": {
        "enabled": true,
        "maxMessages": 1000,  // Console buffer size
        "debounceMs": 50      // Avoid log spam
      }
    }
  }
}
```

## Hotkeys

### Production Mode
| Key | Function |
|-----|----------|
| ESC | Exit to menu / close application |
| H | Toggle gesture hints |
| M | Toggle minimal mode (hide all UI) |

### Debug Mode Additional Keys
| Key | Function |
|-----|----------|
| D | Toggle debug overlay |
| S | Toggle skeleton overlay |
| T | Toggle trail debug |
| G | Toggle gesture confidence |
| F | Toggle FPS counter |
| L | Toggle console logging |
| SPACE | Recalibrate hand tracking |

## User Help System

### Gesture Learning Flow
1. **Discovery Phase**: Let users explore naturally
2. **Hint Phase**: Show subtle hints after 10 seconds of no gestures
3. **Success Feedback**: Celebrate when user triggers each gesture type
4. **Mastery Mode**: Hints fade away after consistent success

### Help Overlay (Press H)
```
┌─────────────────────────────────┐
│         Gesture Guide           │
│                                 │
│  ✋ Open Palm → Sustained Notes │
│  👉 Point → Melody Notes        │
│  ✊ Fist → Drum Beats          │
│  ✌️ Peace → Happy Sounds        │
│  👍 Thumbs Up → Celebration     │
│  🤏 Pinch → Special Effect      │
│                                 │
│  Left hand height = Pitch       │
│  Move hands for effects!        │
│                                 │
│      Press H to close           │
└─────────────────────────────────┘
```

## Future Enhancements
- Tutorial mode with guided gesture practice
- Gesture customization interface
- Performance recording and sharing
- Accessibility modes (one-handed, seated)
- Party mode (multiple users)
- VR/AR support
- Export performances as video

## Privacy & Security
- Camera blur protects privacy in production
- All processing happens locally
- No video data stored or transmitted
- Camera permission clearly requested
- Visual indicator when camera active

## Version History
- v1.0 - Initial conductor mode specification
- v1.1 - Added production/debug separation and polished UX