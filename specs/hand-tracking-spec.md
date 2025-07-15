# Hand Tracking Module Specification v1.0

## Overview
A real-time hand tracking and gesture recognition module using MediaPipe Hand Landmarker, designed to provide natural hand-based interactions for web applications.

## Core Values & Intent
- **Natural Interaction**: Intuitive hand gestures that feel responsive and accurate
- **Performance First**: Lightweight processing that doesn't impact application performance
- **Accessibility**: Works with standard webcams, no special hardware required
- **Privacy Focused**: All processing happens locally in the browser

## Functional Requirements

### Hand Detection & Tracking
- **Multi-hand Support**: Track up to 2 hands simultaneously
- **Hand Landmarks**: 21 key points per hand for detailed tracking
- **Handedness Detection**: Identify left/right hand with confidence scores
- **Real-time Updates**: 30+ FPS tracking with smooth motion
- **Occlusion Handling**: Graceful degradation when hands overlap or partially exit frame
- **Auto-start Tracking**: Automatically begins tracking after camera initialization
  - No manual activation required
  - Seamless user experience from startup
  - ESC key toggles tracking on/off after auto-start
- **Screen Resize Support**: Automatic readjustment when window/screen size changes
  - Canvas dimensions update immediately on resize
  - Landmark coordinates recalculate for new screen dimensions
  - No interruption to hand tracking during resize events

### Gesture Recognition
- **Core Gestures**:
  - **Pointing**: Index finger extended, others folded
  - **Pinching**: Thumb and index finger touching
  - **Waving**: Open palm with lateral movement
  - **Peace Sign**: Index and middle fingers extended
  - **Thumbs Up**: Thumb extended upward, fingers folded
  - **Open Palm**: All fingers extended
  - **Closed Fist**: All fingers folded
- **Gesture Confidence**: 0-1 confidence score for each detected gesture
- **Gesture Events**: Trigger events on gesture start, hold, and end
- **Gesture Modes**:
  - **Basic**: Core gestures only (pointing, pinching, thumbs up, peace sign, open palm, closed fist)
  - **Advanced**: Additional complex gestures and multi-finger combinations
    - Number gestures (1-5 fingers)
    - Specific finger combinations (index+middle, ring+pinky, etc.)
    - Enhanced sensitivity for subtle gestures
    - Multi-hand gesture combinations
- **Custom Gestures**: Extensible system for adding new gesture patterns

### Visual Feedback
- **Landmark Visualization**: Optional overlay showing hand skeleton
- **Gesture Indicators**: Visual confirmation of recognized gestures
- **Tracking Confidence**: Color-coded feedback for tracking quality
- **Debug Mode**: Detailed visualization for development and testing

## Visual Effects

### Hand Trail Effect
- **Purpose**: Create a visually appealing trail that follows hand movement
- **Behavior**: Stores last 15-20 hand positions and renders them with decreasing opacity
- **Trail Characteristics**:
  - Particle type: Small circles or emoji particles
  - Color: Matches current app theme (#A7FF83 for default green)
  - Fade duration: 500-800ms
  - Maximum trail length: 15 positions
  - Update frequency: Every frame (30+ Hz)
- **Performance**: Trail rendering should add <5% CPU overhead
- **Configuration Options**:
  - Trail enabled/disabled
  - Trail length (5-20 positions)
  - Trail style (circles, emojis, sparkles)
  - Trail color/theme
- **Gesture Integration**: 
  - Fast movements create longer, more visible trails
  - Slow movements create subtle, shorter trails
  - Pinch gesture could spawn particle burst

## Technical Requirements

### Core Technology
- **Engine**: MediaPipe Hand Landmarker
- **Model**: Full hand landmark model (21 points)
- **Runtime**: WebGL acceleration when available
- **Fallback**: CPU processing with reduced performance

### Performance Constraints
- **CPU Usage**: < 30% on modern hardware (matching face tracking)
- **Memory Usage**: < 200MB including model loading
- **Latency**: < 50ms from hand movement to detection
- **Initialization**: < 3 seconds to load and start tracking
- **Resize Performance**: < 16ms (1 frame) to recalculate coordinates on window resize

### Screen Adaptation
- **Window Resize Events**: Automatic detection and handling of window size changes
- **Canvas Scaling**: Overlay canvas resizes to match new window dimensions
- **Coordinate Remapping**: Hand landmarks adjust to new screen coordinate system
- **Smooth Transitions**: No visual glitches or tracking interruptions during resize
- **Responsive Design**: Works across different screen sizes and aspect ratios

### Hand Landmark Model
```
0: WRIST
1-4: THUMB (CMC, MCP, IP, TIP)
5-8: INDEX_FINGER (MCP, PIP, DIP, TIP)
9-12: MIDDLE_FINGER (MCP, PIP, DIP, TIP)
13-16: RING_FINGER (MCP, PIP, DIP, TIP)
17-20: PINKY (MCP, PIP, DIP, TIP)
```

## API Interface

```javascript
// Initialize hand tracking
HandTracker.init(options: {
  maxHands: number,          // 1 or 2
  minDetectionConfidence: number, // 0-1
  minTrackingConfidence: number,  // 0-1
  showLandmarks: boolean,
  gestureMode: 'basic' | 'advanced'
})

// Start/stop tracking
HandTracker.start(): Promise<void>
HandTracker.stop(): Promise<void>

// Get current hand data
HandTracker.getHands(): Array<{
  landmarks: Array<{x, y, z}>,
  handedness: 'left' | 'right',
  confidence: number
}>

// Gesture recognition
HandTracker.getCurrentGestures(): Array<{
  type: string,
  confidence: number,
  hand: 'left' | 'right',
  position: {x, y}
}>

// Events
HandTracker.on('handsDetected', (hands) => {})
HandTracker.on('handsLost', () => {})
HandTracker.on('gestureStart', (gesture) => {})
HandTracker.on('gestureEnd', (gesture) => {})
HandTracker.on('gestureHold', (gesture) => {})

// Utility methods
HandTracker.isPointing(): { pointing: boolean, direction: {x, y} }
HandTracker.getPinchStrength(): number // 0-1
HandTracker.getHandCenter(hand): {x, y}
HandTracker.getFingerPositions(hand): Array<{x, y}>

// Screen adaptation methods
HandTracker.handleResize(): void // Called automatically on window resize
HandTracker.updateCanvasSize(): void // Updates overlay canvas dimensions
HandTracker.getScreenDimensions(): {width, height} // Current screen size

// Trail effect methods
HandTracker.toggleTrail(): void // Toggle trail effect on/off
HandTracker.setTrailConfig(config): void // Configure trail settings
HandTracker.getTrailConfig(): object // Get current trail configuration
HandTracker.clearTrail(): void // Clear current trail history
```

## Integration Points

### Emoji Playground Integration
- **Gesture-based Emoji Spawning**:
  - Pointing gesture to place emojis at specific locations
  - Pinch gesture to grab and move emojis
  - Wave gesture to clear screen
  - Peace sign to trigger special effects
- **Hand Position Mapping**: Convert hand coordinates to screen space
- **Gesture Combinations**: Support for two-handed interactions

### Combined Tracking Modes
- **Eye + Hand**: Gaze for targeting, hand gestures for actions
- **Face + Hand**: Emotion detection with gesture confirmation
- **Multi-modal Events**: Coordinate between different tracking systems

## Privacy & Security
- **Local Processing**: All hand tracking happens in-browser
- **No Data Storage**: No hand images or tracking data is stored
- **Camera Permissions**: Clear permission requests with purpose explanation
- **Opt-in Tracking**: Users must explicitly enable hand tracking

## Error Handling
- **No Camera**: Graceful fallback with clear messaging
- **Poor Lighting**: Suggestions for optimal hand visibility
- **No Hands Detected**: Idle state with periodic retry
- **Performance Issues**: Automatic quality reduction

## Future Enhancements
- **3D Hand Pose**: Full 3D rotation and position tracking
- **Gesture Recording**: Record and replay custom gestures
- **Hand Shape Recognition**: Detect specific hand shapes (numbers, letters)
- **Multi-person Support**: Track hands from multiple users
- **Gesture Sequences**: Recognize complex multi-step gestures
- **Hand Props**: Detect objects held in hands
- **Skeleton Rigging**: Advanced hand model for realistic visualization

## Success Criteria
- [ ] Reliable detection in normal lighting conditions
- [ ] All core gestures recognized with >90% accuracy
- [ ] Smooth 30+ FPS tracking without frame drops
- [ ] CPU usage stays under 30% threshold
- [ ] Gesture events fire within 100ms of gesture start
- [ ] Works across major browsers (Chrome, Firefox, Safari, Edge)
- [ ] Clear visual feedback for all tracking states
- [ ] Seamless window resize handling without tracking interruption
- [ ] Canvas and coordinates update correctly on screen size changes
- [ ] No visual glitches during resize operations
- [ ] Hand trail effect adds <5% CPU overhead
- [ ] Trail particles fade smoothly over 500-800ms
- [ ] Trail responds to hand movement velocity
- [ ] Trail effects are visually appealing and not distracting

## Development Considerations
- **Browser Compatibility**: Test across all major browsers
- **Mobile Support**: Consider reduced model for mobile devices
- **Accessibility**: Provide alternative input methods
- **Internationalization**: Consider cultural differences in gestures
- **Testing**: Comprehensive gesture test suite