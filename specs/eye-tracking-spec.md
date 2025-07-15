# Eye Tracking Module Specification v2.0

## Overview
A standalone module that provides real-time attention tracking using standard webcam input and face detection, designed to integrate with interactive applications.

## Core Values & Intent
- **Accessibility**: Works with any standard webcam
- **Transparency**: Clear feedback about tracking status and accuracy
- **Graceful Degradation**: Functions reasonably in suboptimal conditions
- **User Comfort**: Minimal calibration, no eye strain

## Functional Requirements

### Calibration System
- **Method**: 5-point calibration grid (corners + center)
- **Focus Detection**: System detects user focus through facial landmark stability analysis
  - No clicking required - users simply look at calibration points
  - Stability threshold: Landmarks remain stable for ~1.5 seconds
  - Movement tolerance: < 2 pixels deviation in key landmarks
- **Visual Progress Indicator**:
  - Calibration dots display expanding progress ring
  - Ring fills up as focus time accumulates
  - Visual confirmation when point is captured
  - Smooth animation provides clear feedback
- **Auto-advancement**: Automatically proceeds to next calibration point after capture
- **Duration**: < 20 seconds for full calibration
- **Persistence**: 
  - Calibration data saved to localStorage
  - Profile survives browser sessions
  - Option to export/import calibration profiles
- **Console Logging**:
  - Detailed calibration data output for debugging
  - Formatted for easy extraction as default values
  - Includes landmark positions, confidence scores, and timestamps
- **Recalibration**: Accessible hotkey (Spacebar)

### Tracking Display
- **Fullscreen Camera Background**: Live video feed fills entire screen as background
  - Video element must be visible (not hidden behind solid backgrounds)
  - Mirrored display for natural interaction
  - Proper z-index layering (video at back, UI elements on top)
- **Attention Zone**: Circular area showing user's gaze focus point
  - Follows eye gaze when available, falls back to head orientation
  - Semi-transparent overlay for visibility
- **Confidence Indicator**: Visual feedback for tracking quality
  - Green: High confidence (face clearly visible, >80% landmarks)
  - Yellow: Medium confidence (face partially visible, 50-80% landmarks)
  - Red: Low confidence (face barely visible, <50% landmarks)
- **Smoothing**: Kalman filter or moving average to reduce jitter

### Error Handling
- **No Camera**: Clear message with troubleshooting steps
- **Poor Lighting**: Suggestions for improvement
- **Face Not Found**: Pause tracking, show indicator
- **Multiple Faces**: Track closest/largest face
- **Head Out of Frame**: Graceful degradation with last known position

## Technical Requirements

### Core Library
- **Engine**: MediaPipe Face Landmarker
- **Fallback**: Manual mouse mode if tracking fails
- **Prediction**: Head pose estimation from facial landmarks
- **Update Rate**: 30+ Hz tracking frequency

### Performance Constraints
- **CPU Usage**: < 30% on modern hardware
- **Accuracy Target**: 200px attention zone captures user focus 90% of time
- **Initialization**: < 5 seconds to start tracking
- **Latency**: < 100ms from head movement to zone update

## API Interface

```javascript
// Initialize face tracking
FaceTracker.init(options: {
  showAttentionZone: boolean,
  showConfidence: boolean,
  smoothingLevel: number // 0-1
})

// Start tracking
FaceTracker.start(): Promise<void>

// Get current attention zone
FaceTracker.getAttentionZone(): {
  x: number,        // center x
  y: number,        // center y
  radius: number,   // zone radius
  confidence: number // face visibility percentage
}

// Set tracking precision mode
FaceTracker.setTrackingMode(mode: 'precise' | 'comfortable' | 'relaxed')

// Events
FaceTracker.on('calibrationComplete', callback)
FaceTracker.on('trackingLost', callback)
FaceTracker.on('attentionUpdate', callback)
FaceTracker.on('quickMovement', callback) // { velocity, position, randomKey }
```

## Success Criteria

### Accuracy Tests
- [ ] 90% of attention zones capture user focus
- [ ] Stable tracking for 5+ minute sessions
- [ ] Works in typical indoor lighting
- [ ] Handles glasses without major degradation

### User Experience Tests
- [ ] Calibration feels quick and easy
- [ ] Attention zone movement feels natural
- [ ] Clear when tracking is lost
- [ ] No eye fatigue after 30 minutes

## Edge Cases
- User wears glasses (anti-glare coating issues)
- Variable lighting conditions
- User moves head significantly
- Multiple monitors setup
- Different face shapes/angles
- Partial face occlusion

## Privacy & Security
- All processing happens locally
- No video data stored or transmitted
- Clear camera usage indicator
- User can disable at any time

## Implementation Notes

### Technology Pivot Rationale
- **WebGazer.js Issues**: Proved unreliable in testing (reference eye-tracking-tech.md)
  - Inconsistent pupil detection across users
  - Poor performance with glasses/variable lighting
  - Complex calibration requirements
- **Face Tracking Benefits**: More stable and user-friendly
  - Robust across different lighting conditions
  - Works well with glasses and movement
  - Trade precision for reliability and user comfort
  - Natural head orientation matches attention patterns

### Attention Cone Concept
- **Head Pose Estimation**: Uses facial landmarks to determine head orientation
- **Attention Zone**: 200px radius area where user is likely focusing
- **Confidence Metric**: Face visibility percentage (0-100%)
- **Tracking Modes**:
  - **Precise**: Smaller zones, higher CPU usage
  - **Comfortable**: Balanced performance and accuracy
  - **Relaxed**: Larger zones, lower CPU usage

### Eye/Gaze Tracking Implementation
- **Eye Landmark Detection**: MediaPipe provides specific eye landmarks:
  - Left eye: landmarks 33, 133, 157, 158, 159, 160, 161, 163, 173, 246
  - Right eye: landmarks 362, 398, 384, 385, 386, 387, 388, 390, 466, 263
  - Iris centers: landmarks 468-477 (left and right iris)
- **Gaze Direction Calculation**:
  - Extract eye corner positions for eye shape
  - Use iris center positions relative to eye boundaries
  - Calculate normalized gaze vector from iris displacement
  - Project gaze vector onto screen plane
- **Screen Mapping**:
  - Map normalized gaze coordinates to screen dimensions
  - Apply calibration offsets for accuracy
  - Smooth gaze position with exponential moving average
- **Fallback to Head Tracking**: When eye landmarks are not reliable, fall back to head orientation

### Focus-Based Calibration Details
- **Landmark Stability Detection**:
  - Monitor key facial landmarks for stability over time
  - Focus on eye center, nose tip, and mouth corners for reliability
  - Calculate standard deviation of positions over sliding window
  - Trigger focus detection when deviation < 2 pixels for 1.5 seconds
- **Progress Visualization**:
  - SVG-based progress ring around calibration points
  - Smooth CSS transitions for filling animation
  - Color progression: gray → blue → green on completion
  - Pulse animation on successful capture
- **Calibration Data Structure**:
  ```javascript
  {
    pointId: number,
    screenPosition: { x, y },
    faceLandmarks: { /* normalized landmark positions */ },
    gazeVector: { x, y },
    confidence: number,
    timestamp: Date.now()
  }
  ```
- **localStorage Schema**:
  - Key: `eyeTracking.calibration.v2`
  - Data: JSON array of calibration points
  - Automatic migration from older formats
- **Console Output Format**:
  ```javascript
  console.log('Calibration Complete:', JSON.stringify(calibrationData, null, 2));
  // Formatted for easy copy-paste as default values
  ```

### Head Movement Integration
- **Velocity Threshold**: 150 pixels/second triggers random keypress events
- **Movement Cooldown**: 1 second between movement events to prevent spam
- **Random Character Generation**: Letters, numbers, and limited symbols
- **Emoji Spawning**: Animations appear at tracked attention zone position
- **Audio Feedback**: Themed sounds play for generated characters
- **Event Data**: Includes velocity, position, and randomly selected character

### Implementation Status (v2.0)

### Current Implementation
- ✅ **Standalone Application**: Independent face tracking test app (`npm run dev:eyetracking`)
- ✅ **Real MediaPipe Integration**: 468-point facial landmark detection
- ✅ **5-Point Calibration**: Simplified calibration system with persistence
- ✅ **Fullscreen Camera Background**: Live video feed as backdrop
- ✅ **Default Calibration**: Pre-configured values for development mode
- ✅ **Visual Feedback**: Attention zone and confidence indicators
- ✅ **Hotkey Controls**: All specified controls functional
- ✅ **Event System**: Complete event-driven architecture
- ✅ **Error Handling**: Comprehensive error recovery
- ✅ **Performance**: 30fps face detection with GPU acceleration
- ✅ **Head Movement Detection**: Velocity-based quick movement detection (integrated app only)
- ✅ **Emoji Integration**: Random keypress generation on quick head movements (integrated app only)

### Technical Achievements
- **Real-time Processing**: 30fps face detection with GPU acceleration
- **Smooth Transitions**: 500ms fade animations
- **Resource Efficient**: <30% CPU usage
- **User Experience**: Intuitive controls and feedback
- **Fullscreen Camera**: Live video background for immersive experience

### Limitations
- **Camera Required**: Real implementation needs webcam access
- **Lighting Dependent**: Performance varies with lighting conditions
- **Accuracy Trade-off**: Less precise than eye tracking but more reliable

## Version History
- v1.0 - Initial standalone eye tracking specification
- v1.1 - Mock implementation complete, ready for real eye tracking
- v2.0 - Pivot to face tracking with MediaPipe, zone-based attention model