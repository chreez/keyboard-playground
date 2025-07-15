# Animation Types Specification v1.0

## Overview
This specification defines the enhanced animation system for emoji spawning in the Keyboard Playground. Each emoji can have distinct movement patterns that match their personality and create delightful, varied visual experiences.

## Core Values & Intent
- **Personality Expression**: Each emoji moves in a way that matches its character
- **Visual Surprise**: Varied animations prevent monotony and increase delight
- **Natural Physics**: Animations feel believable and satisfying
- **Performance First**: All animations maintain 60fps with 20+ concurrent emojis

## Animation Types

### 1. **Float (Default)**
- **Behavior**: Gentle upward movement with slight physics
- **Physics**: Basic gravity, rotation, fade-out
- **Use Cases**: General fallback, neutral symbols
- **Parameters**: `{gravity: 200, rotationSpeed: 0-4, lifetime: 6000}`

### 2. **Bounce**
- **Behavior**: Realistic bouncing physics with energy loss
- **Physics**: Collision detection, decreasing bounce height
- **Use Cases**: Balls, playful animals, toys
- **Parameters**: `{bounceDecay: 0.8, minBounceHeight: 20, maxBounces: 5}`
- **Examples**: ⚽, 🏀, 🎾, 🐰 (rabbit), 🦘 (kangaroo)

### 3. **Spiral**
- **Behavior**: Circular or spiral movement paths
- **Physics**: Parametric spiral equations, controllable radius
- **Use Cases**: Magical, mystical, rotating objects
- **Parameters**: `{spiralRadius: 30-80, spiralSpeed: 2-6, direction: 'clockwise'|'counter'}`
- **Examples**: ✨, 🌟, ⭐, 🦄, 🌀, 🔮

### 4. **Pulse**
- **Behavior**: Rhythmic scaling while moving
- **Physics**: Sine wave scaling, maintains movement
- **Use Cases**: Hearts, alerts, emphasis symbols
- **Parameters**: `{pulseFrequency: 2-4, pulseAmplitude: 0.2-0.5, baseScale: 1.0}`
- **Examples**: 💖, 💕, ❤️, ❗, ⚠️, 💥

### 5. **Wiggle**
- **Behavior**: Side-to-side wobble while moving upward
- **Physics**: Sine wave horizontal displacement
- **Use Cases**: Living creatures, flexible objects
- **Parameters**: `{wiggleAmplitude: 15-40, wiggleFrequency: 3-8, damping: 0.98}`
- **Examples**: 🐛, 🐍, 🌊, 〰️, 🐟, 🦎

### 6. **Burst**
- **Behavior**: Dramatic scale-up on spawn, then normal movement
- **Physics**: Quick scale animation, brief pause, then physics
- **Use Cases**: Explosive, dramatic, attention-grabbing
- **Parameters**: `{burstScale: 1.8, burstDuration: 300, pauseDuration: 200}`
- **Examples**: 💥, ⚡, 🔥, 🎉, 🎊, 🚀

### 7. **Drift**
- **Behavior**: Slow, dreamy upward movement, gravity-defying
- **Physics**: Minimal gravity, gentle random drift
- **Use Cases**: Light objects, ethereal symbols
- **Parameters**: `{driftSpeed: 30, gravity: 50, randomDrift: 10}`
- **Examples**: 💨, 🌌, 👻, ☁️, 🎈, 🪶

### 8. **Swing**
- **Behavior**: Pendulum-like swinging motion
- **Physics**: Sine wave with decreasing amplitude
- **Use Cases**: Hanging objects, chains, pendulums
- **Parameters**: `{swingAngle: 45, swingSpeed: 3, damping: 0.995}`
- **Examples**: 🔗, ⚖️, 🎪, 🎭, 🔔, 🗝️

### 9. **Typewriter**
- **Behavior**: Brief pause on spawn (like typing), then movement
- **Physics**: Stationary pause, then normal physics
- **Use Cases**: Text-related symbols, communication
- **Parameters**: `{typePause: 400, typeEffect: 'blink'|'scale'|'none'}`
- **Examples**: 📝, 💬, 💭, 📖, 🗣️, 📧

### 10. **Hop**
- **Behavior**: Series of small hops with arcing motion
- **Physics**: Multiple small parabolic arcs
- **Use Cases**: Small creatures, hopping animals
- **Parameters**: `{hopHeight: 40, hopDistance: 30, hopsPerSecond: 3}`
- **Examples**: 🐜, 🦗, 🐸, 🐇, 🦘, 🎾

## Character-to-Animation Mapping

### Letters (A-Z)
```javascript
const letterAnimations = {
  'A': ['hop', 'float'],      // Ant hops, Apple floats
  'B': ['bounce', 'float'],   // Ball bounces, Bear floats
  'C': ['wiggle', 'float'],   // Cat wiggle, Car floats
  'D': ['wiggle', 'bounce'],  // Dog wiggle, Ball bounces
  'E': ['float', 'burst'],    // Elephant float, Energy burst
  'F': ['wiggle', 'burst'],   // Fish wiggle, Fire burst
  'G': ['hop', 'float'],      // Goat hop, Grapes float
  'H': ['float', 'pulse'],    // Horse float, Heart pulse
  'I': ['wiggle', 'drift'],   // Insect wiggle, Ice drift
  'J': ['bounce', 'float'],   // Jaguar bounce, Jeans float
  'K': ['drift', 'swing'],    // Koala drift, Key swing
  'L': ['float', 'pulse'],    // Lion float, Leaf pulse
  'M': ['hop', 'drift'],      // Mouse hop, Moon drift
  'N': ['wiggle', 'typewriter'], // Newt wiggle, Note typewriter
  'O': ['float', 'float'],    // Owl float, Orange float
  'P': ['float', 'float'],    // Pig float, Pizza float
  'Q': ['drift', 'float'],    // Quail drift, Question float
  'R': ['hop', 'drift'],      // Rabbit hop, Rain drift
  'S': ['wiggle', 'spiral'],  // Snake wiggle, Star spiral
  'T': ['float', 'float'],    // Tiger float, Tree float
  'U': ['spiral', 'drift'],   // Unicorn spiral, Umbrella drift
  'V': ['float', 'float'],    // Vulture float, Violin float
  'W': ['float', 'wiggle'],   // Wolf float, Wave wiggle
  'X': ['wiggle', 'burst'],   // Xenops wiggle, X-mark burst
  'Y': ['hop', 'float'],      // Yak hop, Yarn float
  'Z': ['float', 'wiggle']    // Zebra float, Zigzag wiggle
};
```

### Numbers (0-9)
```javascript
const numberAnimations = {
  '0': ['drift', 'spiral'],   // Circle drift, Crystal spiral
  '1': ['float', 'float'],    // First float, Finger float
  '2': ['float', 'float'],    // Peace float, People float
  '3': ['float', 'float'],    // Medal float, OK float
  '4': ['drift', 'float'],    // Clover drift, Puzzle float
  '5': ['float', 'spiral'],   // Hand float, Star spiral
  '6': ['bounce', 'float'],   // Dice bounce, House float
  '7': ['spiral', 'drift'],   // Lucky spiral, Rainbow drift
  '8': ['bounce', 'spiral'],  // Ball bounce, Infinity spiral
  '9': ['drift', 'drift']     // Lives drift, Cloud drift
};
```

### Symbols
```javascript
const symbolAnimations = {
  ' ': ['drift', 'drift'],     // Wind drift, Space drift
  '.': ['float', 'float'],     // Dots float
  ',': ['typewriter', 'drift'], // Writing typewriter, Pause drift
  '!': ['burst', 'pulse'],     // Exclamation burst, Warning pulse
  '?': ['float', 'wiggle'],    // Question float, Search wiggle
  ';': ['pulse', 'float'],     // Wink pulse, Eye float
  ':': ['pulse', 'float'],     // Smile pulse, Eyes float
  "'": ['typewriter', 'drift'], // Speech typewriter, Sparkle drift
  '"': ['typewriter', 'float'], // Quote typewriter, Book float
  '-': ['swing', 'float'],     // Minus swing, Cut float
  '=': ['swing', 'float'],     // Balance swing, Equals float
  '+': ['pulse', 'float'],     // Plus pulse, Medical float
  '*': ['spiral', 'burst'],    // Star spiral, Sparkle burst
  '/': ['float', 'burst'],     // Division float, Lightning burst
  '\\': ['float', 'float'],    // Arrow float, Boomerang float
  '(': ['pulse', 'float'],     // Hug pulse, Embrace float
  ')': ['pulse', 'float'],     // Smile pulse, Celebration float
  '[': ['float', 'float'],     // Box float, Books float
  ']': ['burst', 'float'],     // Check burst, Target float
  '{': ['spiral', 'pulse'],    // Flower spiral, Decoration pulse
  '}': ['burst', 'spiral'],    // Celebration burst, Confetti spiral
  '<': ['float', 'float'],     // Left arrows float
  '>': ['float', 'float'],     // Right arrows float
  '@': ['typewriter', 'float'], // Email typewriter, Web float
  '#': ['float', 'spiral'],    // Tag float, Music spiral
  '$': ['float', 'drift'],     // Money float, Cash drift
  '%': ['float', 'pulse'],     // Percent float, Battery pulse
  '^': ['float', 'float'],     // Up arrows float, Mountain float
  '&': ['swing', 'float'],     // Handshake swing, Link float
  '|': ['float', 'float'],     // Ruler float, Pipe float
  '~': ['wiggle', 'wiggle'],   // Wave wiggle, Snake wiggle
  '`': ['typewriter', 'float'] // Backtick typewriter, Pen float
};
```

## Animation Selection Algorithm

### 1. **Probability-Based Selection**
- Each character has 1-3 preferred animation types
- Primary animation: 70% probability
- Secondary animation: 25% probability  
- Fallback (float): 5% probability

### 2. **Context-Aware Selection**
- Mood-based modifiers (from background visualization)
- Recent animation history (avoid repetition)
- Performance-based degradation (simpler animations under load)

### 3. **Selection Logic**
```javascript
function selectAnimationType(character, context = {}) {
  const animations = getAnimationsForCharacter(character);
  const moodModifier = context.mood || 'neutral';
  const performanceMode = context.performance || 'high';
  
  // Apply mood modifiers
  if (moodModifier === 'energetic') {
    // Favor burst, bounce, spiral
    animations.weights = adjustForEnergy(animations.weights);
  } else if (moodModifier === 'calm') {
    // Favor drift, float, gentle movements
    animations.weights = adjustForCalm(animations.weights);
  }
  
  // Apply performance scaling
  if (performanceMode === 'low') {
    // Favor simpler animations
    animations.weights = simplifyAnimations(animations.weights);
  }
  
  return weightedRandomSelection(animations);
}
```

## Performance Considerations

### 1. **Computational Complexity**
- **Float/Drift**: Low complexity (linear movement)
- **Bounce**: Medium complexity (collision detection)
- **Spiral/Pulse**: Medium complexity (trigonometric calculations)
- **Wiggle/Swing**: Medium complexity (sine wave calculations)
- **Burst/Hop**: High complexity (multi-phase animations)

### 2. **Performance Scaling**
- **High Performance**: All animation types available
- **Medium Performance**: Limit complex animations to 30% of spawns
- **Low Performance**: Primarily float/drift with occasional simple effects

### 3. **Memory Management**
- Reuse animation calculation objects
- Pool complex animation states
- Efficient cleanup of expired animations

## Implementation Requirements

### 1. **Core Animation Engine**
- `AnimationType` enum with all animation types
- `AnimationController` class for each emoji
- Physics update system with pluggable animation types
- Performance monitoring and automatic scaling

### 2. **Animation State Management**
- Each emoji has `animationType` and `animationState` properties
- State machines for complex multi-phase animations
- Smooth transitions between animation phases

### 3. **Physics Integration**
- Maintain existing physics for basic movement
- Layer animation-specific behaviors on top
- Collision detection for bouncing animations
- Boundary management for all animation types

## Success Criteria

### 1. **Visual Delight**
- Each character feels unique and personality-driven
- Animations surprise and delight users
- Visual variety prevents monotony
- Smooth, believable physics

### 2. **Performance Standards**
- Maintain 60fps with 20+ concurrent emojis
- Graceful degradation under load
- Memory usage remains under 50MB for animation system
- Startup time impact < 100ms

### 3. **User Experience**
- Animations enhance rather than distract from typing
- Character-animation pairing feels natural
- System remains responsive during complex animations
- No jarring or disruptive movements

## Future Enhancements

### 1. **Advanced Physics**
- Emoji-to-emoji interactions
- Magnetic attraction/repulsion effects
- Fluid dynamics for certain symbols
- Particle trail effects

### 2. **Seasonal Variations**
- Holiday-themed animation variants
- Time-of-day based animation selection
- Weather-responsive animations
- User customization options

### 3. **Audio-Visual Synchronization**
- Animations timed to audio beats
- Visual effects synchronized with sound duration
- Rhythm-based animation selection
- Musical theme integration

## Version History
- v1.0 - Initial animation types specification with character mapping system

---

*This specification provides the foundation for creating delightful, varied emoji animations that enhance the joyful experience of the Keyboard Playground while maintaining optimal performance.*