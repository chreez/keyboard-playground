import * as Tone from 'tone';

class AudioSystem {
  constructor() {
    this.isInitialized = false;
    this.synthPools = new Map();
    this.poolSize = 4; // Multiple instances per synth type for polyphony
    this.sustainedNotes = new Map(); // Track held keys for sustained notes
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
    
    // Theme 1: Always use first sound (deterministic)
    const sound = sounds[0];
    
    try {
      sound.play();
    } catch (error) {
      console.error(`Failed to play sound for key ${key}:`, error);
    }
  }

  startSustainedNote(key) {
    if (!this.isInitialized) {
      this.initialize();
      return;
    }

    // Don't start if already sustained
    if (this.sustainedNotes.has(key)) {
      return;
    }

    const sounds = this.getThemeSounds(key);
    if (sounds.length === 0) {
      console.warn(`No sounds found for key: ${key}`);
      return;
    }
    
    const sound = sounds[0];
    
    try {
      const sustainedNote = sound.startSustained();
      if (sustainedNote) {
        this.sustainedNotes.set(key, sustainedNote);
      }
    } catch (error) {
      console.error(`Failed to start sustained sound for key ${key}:`, error);
    }
  }

  stopSustainedNote(key) {
    const sustainedNote = this.sustainedNotes.get(key);
    if (sustainedNote) {
      try {
        sustainedNote.stop();
        this.sustainedNotes.delete(key);
      } catch (error) {
        console.error(`Failed to stop sustained sound for key ${key}:`, error);
      }
    }
  }

  stopAllSustainedNotes() {
    for (const [key, sustainedNote] of this.sustainedNotes) {
      try {
        sustainedNote.stop();
      } catch (error) {
        console.error(`Failed to stop sustained sound for key ${key}:`, error);
      }
    }
    this.sustainedNotes.clear();
  }

  getThemeSounds(key) {
    const themes = {
      'A': () => [{ synth: 'pluck', note: 'C4', duration: '8n' }], // Ant steps
      'B': () => [{ synth: 'membrane', note: 'C2', duration: '4n' }], // Bear growl
      'C': () => [{ synth: 'synth', note: 'E5', duration: '8n' }], // Cat meow
      'D': () => [{ synth: 'membrane', note: 'G2', duration: '8n' }], // Dog woof
      'E': () => [{ synth: 'synth', note: 'A4', duration: '2n' }], // Elephant trumpet
      'F': () => [{ synth: 'pluck', note: 'D5', duration: '8n' }], // Fish bubble
      'G': () => [{ synth: 'membrane', note: 'D3', duration: '4n' }], // Goat bleat
      'H': () => [{ synth: 'synth', note: 'B4', duration: '4n' }], // Horse neigh
      'I': () => [{ synth: 'pluck', note: 'E4', duration: '8n' }], // Insect buzz
      'J': () => [{ synth: 'membrane', note: 'A2', duration: '4n' }], // Jaguar roar
      'K': () => [{ synth: 'synth', note: 'G4', duration: '8n' }], // Koala call
      'L': () => [{ synth: 'membrane', note: 'E2', duration: '2n' }], // Lion roar
      'M': () => [{ synth: 'synth', note: 'A3', duration: '4n' }], // Mouse squeak
      'N': () => [{ synth: 'pluck', note: 'F4', duration: '8n' }], // Newt chirp
      'O': () => [{ synth: 'synth', note: 'D4', duration: '4n' }], // Owl hoot
      'P': () => [{ synth: 'membrane', note: 'F2', duration: '8n' }], // Pig oink
      'Q': () => [{ synth: 'synth', note: 'C5', duration: '4n' }], // Quail call
      'R': () => [{ synth: 'membrane', note: 'B2', duration: '4n' }], // Rabbit thump
      'S': () => [{ synth: 'synth', note: 'D4', duration: '8n' }], // Snake hiss
      'T': () => [{ synth: 'membrane', note: 'G2', duration: '4n' }], // Tiger growl
      'U': () => [{ synth: 'synth', note: 'E4', duration: '4n' }], // Unicorn magic
      'V': () => [{ synth: 'membrane', note: 'A2', duration: '8n' }], // Vulture screech
      'W': () => [{ synth: 'synth', note: 'C4', duration: '2n' }], // Wolf howl
      'X': () => [{ synth: 'pluck', note: 'G4', duration: '8n' }], // Xenops chirp
      'Y': () => [{ synth: 'membrane', note: 'D2', duration: '4n' }], // Yak grunt
      'Z': () => [{ synth: 'synth', note: 'F4', duration: '4n' }], // Zebra whinny
      // Numbers 0-9
      '0': () => [{ synth: 'synth', note: 'C3', duration: '2n' }], // Zero drone
      '1': () => [{ synth: 'pluck', note: 'C5', duration: '16n' }], // Single ping
      '2': () => [{ synth: 'pluck', note: 'E5', duration: '16n' }], // Two tone
      '3': () => [{ synth: 'pluck', note: 'G5', duration: '16n' }], // Three tone
      '4': () => [{ synth: 'membrane', note: 'F2', duration: '8n' }], // Four beats
      '5': () => [{ synth: 'synth', note: 'D4', duration: '8n' }], // Five harmony
      '6': () => [{ synth: 'membrane', note: 'G2', duration: '8n' }], // Six rhythm
      '7': () => [{ synth: 'synth', note: 'C5', duration: '8n' }], // Lucky seven
      '8': () => [{ synth: 'membrane', note: 'D2', duration: '8n' }], // Infinity loop
      '9': () => [{ synth: 'synth', note: 'A4', duration: '8n' }], // Nine lives
      // Common symbols
      ' ': () => [{ synth: 'synth', note: 'C2', duration: '16n' }], // Space whoosh
      '.': () => [{ synth: 'pluck', note: 'C6', duration: '32n' }], // Dot click
      ',': () => [{ synth: 'pluck', note: 'G5', duration: '32n' }], // Comma pause
      '!': () => [{ synth: 'synth', note: 'C5', duration: '8n' }], // Exclamation
      '?': () => [{ synth: 'synth', note: 'G4', duration: '8n' }], // Question rise
      ';': () => [{ synth: 'pluck', note: 'F4', duration: '16n' }], // Semicolon
      ':': () => [{ synth: 'pluck', note: 'F4', duration: '16n' }], // Colon
      "'": () => [{ synth: 'pluck', note: 'A5', duration: '32n' }], // Apostrophe tick
      '"': () => [{ synth: 'pluck', note: 'A5', duration: '32n' }], // Quote marks
      '-': () => [{ synth: 'synth', note: 'F3', duration: '8n' }], // Dash/hyphen
      '=': () => [{ synth: 'synth', note: 'C4', duration: '16n' }], // Equals
      '+': () => [{ synth: 'synth', note: 'C4', duration: '16n' }], // Plus/add
      '*': () => [{ synth: 'pluck', note: 'C5', duration: '16n' }], // Star/multiply
      '/': () => [{ synth: 'synth', note: 'A4', duration: '16n' }], // Slash/divide
      '\\': () => [{ synth: 'synth', note: 'F4', duration: '16n' }], // Backslash
      '(': () => [{ synth: 'synth', note: 'C4', duration: '16n' }], // Open paren
      ')': () => [{ synth: 'synth', note: 'G4', duration: '16n' }], // Close paren
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
      '@': () => [{ synth: 'synth', note: 'D4', duration: '4n' }], // At symbol
      '#': () => [{ synth: 'membrane', note: 'F2', duration: '8n' }], // Hash/sharp
      '$': () => [{ synth: 'synth', note: 'G4', duration: '8n' }], // Dollar sign
      '%': () => [{ synth: 'synth', note: 'F4', duration: '16n' }], // Percent
      '^': () => [
        { synth: 'synth', note: 'C5', duration: '8n' } // Caret/hat
      ],
      '&': () => [{ synth: 'membrane', note: 'G2', duration: '8n' }], // Ampersand
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
      },
      startSustained: () => {
        const pool = this.synthPools.get(def.synth);
        if (!pool) {
          console.warn(`Synth pool ${def.synth} not found`);
          return null;
        }

        // Find an available synth from the pool
        let availableSynth = pool.find(item => !item.inUse);
        if (!availableSynth) {
          // If all synths are busy, use the first one
          availableSynth = pool[0];
          // Force release any existing note
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
          // Use scheduled timing to avoid conflicts
          const now = Tone.now() + (Math.random() * 0.005); // 0-5ms random delay
          
          synth.triggerAttack(def.note, now);
          
          // Return an object with a stop method
          return {
            stop: () => {
              try {
                synth.triggerRelease();
                availableSynth.inUse = false;
              } catch (error) {
                console.warn(`Error stopping sustained ${def.synth} sound:`, error);
                availableSynth.inUse = false;
              }
            }
          };
          
        } catch (error) {
          console.warn(`Error starting sustained ${def.synth} sound:`, error);
          availableSynth.inUse = false;
          return null;
        }
      }
    }));
  }

  dispose() {
    this.stopAllSustainedNotes();
    this.synthPools.forEach(pool => {
      pool.forEach(item => item.synth.dispose());
    });
    this.synthPools.clear();
    this.isInitialized = false;
  }
}

export default AudioSystem;