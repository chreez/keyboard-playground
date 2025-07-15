# Eye-Keyboard Integration Rules Specification v1.0

## Overview
Defines how the Eye Tracking Module and Keyboard Playground combine to create a unified gaze-controlled audio-visual experience.

## Integration Principles
- **Additive Enhancement**: Eye tracking enhances but never breaks keyboard functionality
- **Graceful Fallback**: Full keyboard experience remains if eye tracking fails
- **Clear Modal States**: User always knows which mode is active
- **Performance First**: Combined features maintain 60fps target

## Mode Definitions

### Mode 1: Keyboard Only (Default/Fallback)
- **Behavior**: Original keyboard playground spec
- **Emoji Spawn**: Bottom of screen, float upward
- **Active When**: Eye tracking disabled/unavailable
- **Indicator**: No crosshair visible

### Mode 2: Eye-Controlled Spawn
- **Behavior**: Emojis spawn at gaze location
- **Animation**: Radiate outward from spawn point
- **Physics**: Gentle drift + gravity away from center
- **Active When**: Eye tracking confidence > 50%
- **Indicator**: Crosshair visible and green/yellow

### Mode 3: Attention Zones (Future)
- **Screen divided into regions that modify sound/emoji behavior**
- **Not implemented in v1.0**

## Transition Rules

### Startup Sequence
1. Launch keyboard playground immediately (Mode 1)
2. Initialize eye tracking in background
3. Show calibration prompt (dismissible)
4. If calibrated successfully → Mode 2
5. If dismissed/failed → remain Mode 1

### Runtime Transitions
- **Tracking Lost**: Smooth transition to Mode 1
  - Crosshair fades out over 500ms
  - Next keypress uses bottom spawn
- **Tracking Restored**: Gradual transition to Mode 2
  - Crosshair fades in over 500ms
  - Requires 2 seconds of stable tracking
- **Manual Toggle**: ESC key switches modes

## Spawn Behavior Details

### Gaze-Based Spawning (Mode 2)
```javascript
spawnLocation = {
  x: gazePosition.x + random(-30, 30), // Small random offset
  y: gazePosition.y + random(-30, 30)
}

velocity = {
  x: random(-50, 50),    // Pixels per second
  y: random(-100, -150)  // Slight upward bias
}
```

### Visual Feedback
- **Spawn Effect**: Small pulse/ripple at gaze point
- **Trail Effect**: Optional particle trail following gaze
- **Prediction Line**: Subtle line showing where next emoji will spawn

## Performance Optimization

### Resource Management
- Eye tracking runs on separate thread
- Canvas rendering remains primary thread
- Shared state via atomic operations only
- Maximum 30Hz gaze updates (sufficient for spawning)

### Degradation Strategy
Priority order when performance drops:
1. Reduce eye tracking frequency
2. Disable particle effects
3. Simplify emoji physics
4. Reduce concurrent emoji limit
5. Disable eye tracking entirely

## Hotkeys

| Key | Function |
|-----|----------|
| ESC | Toggle eye tracking on/off |
| SPACE | Recalibrate eye tracking |
| TAB | Show/hide crosshair |
| F1 | Show eye tracking status |

## Success Criteria

### Integration Tests
- [ ] Seamless transition between modes
- [ ] No audio glitches during transitions
- [ ] Maintains 60fps with both systems active
- [ ] Fallback works instantly if tracking fails

### User Experience Tests
- [ ] Mode switches feel intentional, not jarring
- [ ] Clear which mode is active at all times
- [ ] Enhanced experience in Mode 2, not just different
- [ ] New users discover eye tracking naturally

## Configuration Schema

```json
{
  "integration": {
    "enableEyeTracking": true,
    "autoCalibrate": false,
    "fallbackMode": "keyboard",
    "transitionDuration": 500,
    "gazeSpawnOffset": 30,
    "confidenceThreshold": 0.5
  }
}
```

## Future Enhancements
- Gaze duration triggers special effects
- Eye movement patterns unlock easter eggs
- Multiplayer gaze interaction
- Emotion-based spawn behaviors

## Implementation Status (v1.1)

### Current Implementation
- ✅ **Separate Applications**: Three independent apps prevent regressions
- ✅ **Mode System**: Mode 1 (keyboard) and Mode 2 (eye-controlled) implemented
- ✅ **Startup Sequence**: Background initialization working
- ✅ **Transition Rules**: Smooth 500ms crosshair fade implemented
- ✅ **Spawn Behavior**: Gaze-based spawning with ±30px offset
- ✅ **Hotkey Controls**: All specified hotkeys functional
- ✅ **Visual Feedback**: Mode indicators and confidence display
- ✅ **Performance**: 60fps maintained with both systems active

### Mock Implementation
- **Eye Tracking**: Uses mouse simulation for development/testing
- **Confidence Simulation**: Random values 0.7-1.0 with jitter
- **API Compatibility**: Full WebGazer.js API emulation
- **Integration Ready**: Can be replaced with real eye tracking

### Technical Achievements
- **Graceful Degradation**: Seamless fallback to keyboard mode
- **Resource Management**: Minimal performance impact
- **Error Handling**: Robust error recovery and user feedback
- **Event System**: Complete event-driven architecture

## Version History
- v1.0 - Initial integration rules specification
- v1.1 - Implementation complete with mock eye tracking