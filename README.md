# Keyboard Playground

An experimental Electron application that creates joyful audio-visual feedback through keyboard interaction, designed for immediate delight and zero-friction play.

## Features

- **Immediate Joy**: Every keypress creates delightful audio-visual feedback
- **26 Themed Keys**: Each letter (A-Z) triggers unique emoji and sound combinations
- **Real-time Animations**: Physics-based emoji animations with gravity and rotation
- **Synthesized Audio**: Multiple Tone.js synthesizers create themed sounds
- **Performance Optimized**: 60fps animations with <50ms audio latency

## Key Mappings

Each alphabet key triggers themed emoji and sound combinations:

| Key | Theme | Emojis | Sounds |
|-----|-------|--------|---------|
| A | Ant/Apple | 🐜🍎🍏 | Tiny steps, crunch |
| B | Bear/Ball | 🐻⚽🏀 | Growl, bounce |
| C | Cat/Car | 🐱🚗🏎️ | Meow, vroom |
| D | Dog/Toys | 🐶🦴🎾 | Woof, squeak |
| ... | ... | ... | ... |

*And 22 more themed combinations through Z!*

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keyboard-playground
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Development

### Application Suite
The project consists of three separate applications:

#### 1. Keyboard Playground (Original)
```bash
npm run dev          # Development mode (port 3000)
npm start            # Production build and run
```

#### 2. Eye Tracking Test (Standalone)
```bash
npm run dev:eyetracking    # Development mode (port 3001)
npm start:eyetracking      # Production build and run
```

#### 3. Integrated Experience
```bash
npm run dev:integrated     # Development mode (port 3002)
npm start:integrated       # Production build and run
```

### Choose Your Experience
- **Original**: Classic keyboard playground with audio-visual feedback
- **Eye Tracking**: Standalone eye tracking test with mouse simulation
- **Integrated**: Combined keyboard + eye tracking with mode switching

## Usage

1. **Launch the application** - Opens in fullscreen mode with black background
2. **Press any letter key (A-Z)** - Watch emojis float up while hearing themed sounds
3. **Press multiple keys rapidly** - Experience the joy of concurrent animations and polyphonic audio
4. **Click the ✕ button** - Exit the application

## Architecture

- **Electron**: Fullscreen frameless window platform
- **React**: UI state management and component structure  
- **HTML5 Canvas**: High-performance emoji animations (60+ FPS)
- **Tone.js**: Real-time audio synthesis with multiple synth types
- **Performance**: 20+ concurrent emojis, <200MB RAM usage

## Technical Details

### Animation System
- Physics-based movement with gravity and random velocities
- Rotation and scaling effects for visual appeal
- 5-second lifetime with fade-out effects
- Automatic cleanup for performance optimization

### Audio System
- Multiple synthesizer types (oscillator, pluck, membrane, metal, noise)
- Themed sound mappings for each key
- Polyphonic playback supporting rapid keypresses
- <50ms latency from keypress to audio output

## Performance

The application is optimized for:
- 60 FPS minimum animation framerate
- <50ms audio latency
- <200MB RAM usage
- Support for 20+ concurrent emoji animations
- Smooth performance during rapid key sequences

## License

MIT