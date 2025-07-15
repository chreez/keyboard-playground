import * as Tone from 'tone';

class AudioSystem {
  constructor() {
    this.isInitialized = false;
    this.synthPools = new Map();
    this.poolSize = 4; // Multiple instances per synth type for polyphony
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      this.setupSynths();
      this.isInitialized = true;
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  setupSynths() {
    // Create pools of synth instances for polyphony without timing conflicts
    const synthTypes = ['pluck', 'membrane', 'metal', 'synth'];
    
    synthTypes.forEach(type => {
      const pool = [];
      for (let i = 0; i < this.poolSize; i++) {
        let synth;
        switch(type) {
          case 'pluck':
            synth = new Tone.PluckSynth().toDestination();
            break;
          case 'membrane':
            synth = new Tone.MembraneSynth().toDestination();
            break;
          case 'metal':
            synth = new Tone.MetalSynth().toDestination();
            break;
          case 'synth':
          default:
            synth = new Tone.Synth().toDestination();
            break;
        }
        pool.push({ synth, inUse: false });
      }
      this.synthPools.set(type, pool);
    });
  }

  playThemeSound(key) {
    if (!this.isInitialized) {
      this.initialize();
      return;
    }

    const sounds = this.getThemeSounds(key);
    if (sounds.length === 0) {
      console.warn(`No sounds found for key: ${key}`);
      return;
    }
    
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    
    try {
      randomSound.play();
    } catch (error) {
      console.error(`Failed to play sound for key ${key}:`, error);
    }
  }

  getThemeSounds(key) {
    const themes = {
      'A': () => [
        { synth: 'pluck', note: 'C4', duration: '8n' }, // Ant steps
        { synth: 'synth', note: 'G4', duration: '4n' } // Apple crunch
      ],
      'B': () => [
        { synth: 'membrane', note: 'C2', duration: '4n' }, // Bear growl
        { synth: 'pluck', note: 'C5', duration: '16n' } // Ball bounce
      ],
      'C': () => [
        { synth: 'synth', note: 'E5', duration: '8n' }, // Cat meow
        { synth: 'synth', note: 'C3', duration: '4n' } // Car vroom
      ],
      'D': () => [
        { synth: 'membrane', note: 'G2', duration: '8n' }, // Dog woof
        { synth: 'pluck', note: 'A5', duration: '16n' } // Toy squeak
      ],
      'E': () => [
        { synth: 'synth', note: 'A4', duration: '2n' }, // Elephant trumpet
        { synth: 'pluck', note: 'F4', duration: '8n' } // Egg crack
      ],
      'F': () => [
        { synth: 'pluck', note: 'D5', duration: '8n' }, // Fish bubble
        { synth: 'synth', note: 'B3', duration: '4n' } // Fire crackle
      ],
      'G': () => [
        { synth: 'membrane', note: 'D3', duration: '4n' }, // Goat bleat
        { synth: 'pluck', note: 'G5', duration: '16n' } // Guitar strum
      ],
      'H': () => [
        { synth: 'synth', note: 'B4', duration: '4n' }, // Horse neigh
        { synth: 'pluck', note: 'C4', duration: '8n' } // Harp pluck
      ],
      'I': () => [
        { synth: 'pluck', note: 'E4', duration: '8n' }, // Insect buzz
        { synth: 'synth', note: 'F5', duration: '16n' } // Ice clink
      ],
      'J': () => [
        { synth: 'membrane', note: 'A2', duration: '4n' }, // Jaguar roar
        { synth: 'pluck', note: 'D5', duration: '8n' } // Jump sound
      ],
      'K': () => [
        { synth: 'synth', note: 'G4', duration: '8n' }, // Koala call
        { synth: 'pluck', note: 'C5', duration: '16n' } // Key jingle
      ],
      'L': () => [
        { synth: 'membrane', note: 'E2', duration: '2n' }, // Lion roar
        { synth: 'pluck', note: 'A4', duration: '8n' } // Leaf rustle
      ],
      'M': () => [
        { synth: 'synth', note: 'A3', duration: '4n' }, // Mouse squeak
        { synth: 'membrane', note: 'C3', duration: '8n' } // Music note
      ],
      'N': () => [
        { synth: 'pluck', note: 'F4', duration: '8n' }, // Newt chirp
        { synth: 'synth', note: 'B4', duration: '16n' } // Note chime
      ],
      'O': () => [
        { synth: 'synth', note: 'D4', duration: '4n' }, // Owl hoot
        { synth: 'pluck', note: 'G4', duration: '8n' } // Orange squeeze
      ],
      'P': () => [
        { synth: 'membrane', note: 'F2', duration: '8n' }, // Pig oink
        { synth: 'pluck', note: 'E5', duration: '16n' } // Pop sound
      ],
      'Q': () => [
        { synth: 'synth', note: 'C5', duration: '4n' }, // Quail call
        { synth: 'pluck', note: 'F4', duration: '8n' } // Question ping
      ],
      'R': () => [
        { synth: 'membrane', note: 'B2', duration: '4n' }, // Rabbit thump
        { synth: 'synth', note: 'A3', duration: '8n' } // Rain patter
      ],
      'S': () => [
        { synth: 'synth', note: 'D4', duration: '8n' }, // Snake hiss
        { synth: 'synth', note: 'A5', duration: '16n' } // Star twinkle
      ],
      'T': () => [
        { synth: 'membrane', note: 'G2', duration: '4n' }, // Tiger growl
        { synth: 'pluck', note: 'C4', duration: '8n' } // Tree creak
      ],
      'U': () => [
        { synth: 'synth', note: 'E4', duration: '4n' }, // Unicorn magic
        { synth: 'pluck', note: 'D5', duration: '16n' } // Up sound
      ],
      'V': () => [
        { synth: 'membrane', note: 'A2', duration: '8n' }, // Vulture screech
        { synth: 'pluck', note: 'F5', duration: '16n' } // Violin string
      ],
      'W': () => [
        { synth: 'synth', note: 'C4', duration: '2n' }, // Wolf howl
        { synth: 'synth', note: 'B3', duration: '8n' } // Wind whoosh
      ],
      'X': () => [
        { synth: 'pluck', note: 'G4', duration: '8n' }, // Xenops chirp
        { synth: 'synth', note: 'E5', duration: '16n' } // X-ray beep
      ],
      'Y': () => [
        { synth: 'membrane', note: 'D2', duration: '4n' }, // Yak grunt
        { synth: 'pluck', note: 'A4', duration: '8n' } // Yoyo spin
      ],
      'Z': () => [
        { synth: 'synth', note: 'F4', duration: '4n' }, // Zebra whinny
        { synth: 'synth', note: 'C4', duration: '16n' } // Zap sound
      ],
      // Numbers 0-9
      '0': () => [
        { synth: 'synth', note: 'C3', duration: '2n' }, // Zero drone
        { synth: 'membrane', note: 'A1', duration: '4n' } // Empty thump
      ],
      '1': () => [
        { synth: 'pluck', note: 'C5', duration: '16n' }, // Single ping
        { synth: 'synth', note: 'G4', duration: '8n' } // One tone
      ],
      '2': () => [
        { synth: 'pluck', note: 'C5', duration: '16n' }, // Two pings
        { synth: 'pluck', note: 'E5', duration: '16n' }
      ],
      '3': () => [
        { synth: 'pluck', note: 'C5', duration: '16n' }, // Three pings
        { synth: 'pluck', note: 'E5', duration: '16n' },
        { synth: 'pluck', note: 'G5', duration: '16n' }
      ],
      '4': () => [
        { synth: 'membrane', note: 'F2', duration: '8n' }, // Four beats
        { synth: 'synth', note: 'A4', duration: '16n' }
      ],
      '5': () => [
        { synth: 'synth', note: 'D4', duration: '8n' }, // Five harmony
        { synth: 'pluck', note: 'F#4', duration: '8n' }
      ],
      '6': () => [
        { synth: 'membrane', note: 'G2', duration: '8n' }, // Six rhythm
        { synth: 'synth', note: 'B4', duration: '16n' }
      ],
      '7': () => [
        { synth: 'synth', note: 'C5', duration: '8n' }, // Lucky seven
        { synth: 'pluck', note: 'G5', duration: '16n' }
      ],
      '8': () => [
        { synth: 'membrane', note: 'D2', duration: '8n' }, // Infinity loop
        { synth: 'synth', note: 'F4', duration: '4n' }
      ],
      '9': () => [
        { synth: 'synth', note: 'A4', duration: '8n' }, // Nine lives
        { synth: 'pluck', note: 'C5', duration: '16n' }
      ],
      // Common symbols
      ' ': () => [
        { synth: 'synth', note: 'C2', duration: '16n' } // Space whoosh
      ],
      '.': () => [
        { synth: 'pluck', note: 'C6', duration: '32n' } // Dot click
      ],
      ',': () => [
        { synth: 'pluck', note: 'G5', duration: '32n' } // Comma pause
      ],
      '!': () => [
        { synth: 'synth', note: 'C5', duration: '8n' }, // Exclamation
        { synth: 'membrane', note: 'C3', duration: '16n' }
      ],
      '?': () => [
        { synth: 'synth', note: 'G4', duration: '8n' }, // Question rise
        { synth: 'synth', note: 'C5', duration: '16n' }
      ],
      ';': () => [
        { synth: 'pluck', note: 'F4', duration: '16n' }, // Semicolon
        { synth: 'pluck', note: 'C4', duration: '32n' }
      ],
      ':': () => [
        { synth: 'pluck', note: 'F4', duration: '16n' }, // Colon
        { synth: 'pluck', note: 'F4', duration: '16n' }
      ],
      "'": () => [
        { synth: 'pluck', note: 'A5', duration: '32n' } // Apostrophe tick
      ],
      '"': () => [
        { synth: 'pluck', note: 'A5', duration: '32n' }, // Quote marks
        { synth: 'pluck', note: 'A5', duration: '32n' }
      ],
      '-': () => [
        { synth: 'synth', note: 'F3', duration: '8n' } // Dash/hyphen
      ],
      '=': () => [
        { synth: 'synth', note: 'C4', duration: '16n' }, // Equals
        { synth: 'synth', note: 'C4', duration: '16n' }
      ],
      '+': () => [
        { synth: 'synth', note: 'C4', duration: '16n' }, // Plus/add
        { synth: 'synth', note: 'G4', duration: '16n' }
      ],
      '*': () => [
        { synth: 'pluck', note: 'C5', duration: '16n' }, // Star/multiply
        { synth: 'synth', note: 'G4', duration: '8n' }
      ],
      '/': () => [
        { synth: 'synth', note: 'A4', duration: '16n' } // Slash/divide
      ],
      '\\': () => [
        { synth: 'synth', note: 'F4', duration: '16n' } // Backslash
      ],
      '(': () => [
        { synth: 'synth', note: 'C4', duration: '16n' } // Open paren
      ],
      ')': () => [
        { synth: 'synth', note: 'G4', duration: '16n' } // Close paren
      ],
      '[': () => [
        { synth: 'membrane', note: 'C3', duration: '16n' } // Open bracket
      ],
      ']': () => [
        { synth: 'membrane', note: 'G3', duration: '16n' } // Close bracket
      ],
      '{': () => [
        { synth: 'membrane', note: 'F2', duration: '16n' } // Open brace
      ],
      '}': () => [
        { synth: 'membrane', note: 'C3', duration: '16n' } // Close brace
      ],
      '<': () => [
        { synth: 'synth', note: 'A3', duration: '16n' } // Less than
      ],
      '>': () => [
        { synth: 'synth', note: 'E4', duration: '16n' } // Greater than
      ],
      '@': () => [
        { synth: 'synth', note: 'D4', duration: '4n' }, // At symbol
        { synth: 'pluck', note: 'A4', duration: '8n' }
      ],
      '#': () => [
        { synth: 'membrane', note: 'F2', duration: '8n' }, // Hash/sharp
        { synth: 'synth', note: 'F4', duration: '16n' }
      ],
      '$': () => [
        { synth: 'synth', note: 'G4', duration: '8n' }, // Dollar sign
        { synth: 'pluck', note: 'C5', duration: '16n' }
      ],
      '%': () => [
        { synth: 'synth', note: 'F4', duration: '16n' }, // Percent
        { synth: 'synth', note: 'C5', duration: '16n' }
      ],
      '^': () => [
        { synth: 'synth', note: 'C5', duration: '8n' } // Caret/hat
      ],
      '&': () => [
        { synth: 'membrane', note: 'G2', duration: '8n' }, // Ampersand
        { synth: 'synth', note: 'D4', duration: '16n' }
      ],
      '|': () => [
        { synth: 'synth', note: 'C4', duration: '4n' } // Pipe
      ],
      '~': () => [
        { synth: 'synth', note: 'A4', duration: '2n' } // Tilde wave
      ],
      '`': () => [
        { synth: 'pluck', note: 'F5', duration: '32n' } // Backtick
      ]
    };

    const themeFunc = themes[key];
    if (!themeFunc) return [];

    const soundDefs = themeFunc();
    return soundDefs.map(def => ({
      play: () => {
        const pool = this.synthPools.get(def.synth);
        if (!pool) {
          console.warn(`Synth pool ${def.synth} not found`);
          return;
        }

        // Find an available synth from the pool
        let availableSynth = pool.find(item => !item.inUse);
        if (!availableSynth) {
          // If all synths are busy, find the one that's been in use the longest
          // This prevents blocking on rapid same-key presses
          availableSynth = pool[0];
          // Force release any existing note to make it available immediately
          try {
            if (availableSynth.synth.triggerRelease) {
              availableSynth.synth.triggerRelease();
            }
          } catch (e) {
            // Ignore release errors
          }
        }

        const { synth } = availableSynth;
        availableSynth.inUse = true;

        try {
          // Use scheduled timing to avoid conflicts with small random offset
          const now = Tone.now() + (Math.random() * 0.005); // 0-5ms random delay
          const duration = Tone.Time(def.duration).toSeconds();
          
          synth.triggerAttackRelease(def.note, def.duration, now);
          
          // Mark synth as available after the note duration plus small buffer
          setTimeout(() => {
            availableSynth.inUse = false;
          }, (duration + 0.05) * 1000); // Reduced buffer for faster reuse
          
        } catch (error) {
          console.warn(`Error playing ${def.synth} sound:`, error);
          availableSynth.inUse = false; // Release on error
        }
      }
    }));
  }

  dispose() {
    this.synthPools.forEach(pool => {
      pool.forEach(item => item.synth.dispose());
    });
    this.synthPools.clear();
    this.isInitialized = false;
  }
}

export default AudioSystem;