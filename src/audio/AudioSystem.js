import * as Tone from 'tone';

class AudioSystem {
  constructor() {
    this.isInitialized = false;
    this.synthPools = new Map();
    this.poolSize = 4; // Multiple instances per synth type for polyphony
    this.sustainedNotes = new Map(); // Track held keys for sustained notes
    this.currentTheme = 2; // Default to keyboard position theme (was Theme 2, now Theme 2)
    this.effectsChains = new Map(); // Store effects chains for different themes
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

  setTheme(themeNumber) {
    if (themeNumber === this.currentTheme) return;
    
    this.currentTheme = themeNumber;
    
    // Stop all sustained notes when switching themes
    this.stopAllSustainedNotes();
    
    // Reinitialize synths for new theme
    this.setupSynths();
    
    console.log(`Switched to theme ${themeNumber}`);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  setupSynths() {
    // Dispose existing synths and effects chains
    this.disposeSynths();
    
    // Setup synths based on current theme
    switch(this.currentTheme) {
      case 2:
        this.setupTheme2Synths(); // Keyboard position theme
        break;
      case 3:
        this.setupTheme3Synths(); // Guitar synth theme
        break;
      default:
        this.setupTheme2Synths(); // Fallback to keyboard position
        break;
    }
  }

  setupTheme2Synths() {
    // Theme 2: Keyboard position with piano-like synth
    const synthTypes = ['piano', 'membrane', 'metal', 'synth'];
    
    // Create reverb and volume control for more pleasant sound
    const reverb = new Tone.Reverb({
      decay: 2.0,
      preDelay: 0.015,
      wet: 0.25
    });
    
    const volume = new Tone.Volume(-4); // Less volume reduction for piano
    
    reverb.chain(volume, Tone.getDestination());
    this.effectsChains.set('theme2', { reverb, volume });
    
    synthTypes.forEach(type => {
      const pool = [];
      for (let i = 0; i < this.poolSize; i++) {
        let synth;
        switch(type) {
          case 'piano':
            // Create a piano-like sound using AMSynth for realistic piano characteristics
            synth = new Tone.AMSynth({
              harmonicity: 3,
              oscillator: {
                type: 'sine'
              },
              envelope: {
                attack: 0.005,
                decay: 0.3,
                sustain: 0.2,
                release: 2.5
              },
              modulation: {
                type: 'square'
              },
              modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.3,
                release: 1.5
              }
            }).connect(reverb);
            break;
          case 'membrane':
            synth = new Tone.MembraneSynth().connect(reverb);
            break;
          case 'metal':
            synth = new Tone.MetalSynth().connect(reverb);
            break;
          case 'synth':
          default:
            synth = new Tone.Synth().connect(reverb);
            break;
        }
        pool.push({ synth, inUse: false });
      }
      this.synthPools.set(type, pool);
    });
  }

  setupTheme3Synths() {
    // Theme 3: Guitar synth with effects chain
    const synthTypes = ['guitar-lead', 'guitar-rhythm', 'guitar-effects'];
    
    // Create guitar effects chain
    const distortion = new Tone.Distortion(0.4);
    const chorus = new Tone.Chorus(4, 2.5, 0.5);
    const delay = new Tone.FeedbackDelay(0.25, 0.3);
    const reverb = new Tone.Reverb({
      decay: 2.0,
      preDelay: 0.02,
      wet: 0.3
    });
    const volume = new Tone.Volume(-3); // Less volume reduction for guitar
    
    // Chain effects: distortion -> chorus -> delay -> reverb -> volume -> destination
    distortion.chain(chorus, delay, reverb, volume, Tone.getDestination());
    
    this.effectsChains.set('theme3', { distortion, chorus, delay, reverb, volume });
    
    synthTypes.forEach(type => {
      const pool = [];
      for (let i = 0; i < this.poolSize; i++) {
        let synth;
        switch(type) {
          case 'guitar-lead':
            synth = new Tone.MonoSynth({
              oscillator: {
                type: 'sawtooth'
              },
              envelope: {
                attack: 0.02,
                decay: 0.3,
                sustain: 0.4,
                release: 1.5
              },
              filter: {
                Q: 2,
                type: 'lowpass',
                rolloff: -24,
                frequency: 2000
              },
              filterEnvelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.8,
                release: 0.5,
                baseFrequency: 800,
                octaves: 2
              }
            }).connect(distortion);
            break;
          case 'guitar-rhythm':
            synth = new Tone.MonoSynth({
              oscillator: {
                type: 'sawtooth'
              },
              envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.6,
                release: 0.8
              },
              filter: {
                Q: 3,
                type: 'lowpass',
                rolloff: -24,
                frequency: 1500
              },
              filterEnvelope: {
                attack: 0.005,
                decay: 0.08,
                sustain: 0.9,
                release: 0.3,
                baseFrequency: 600,
                octaves: 1.5
              }
            }).connect(distortion);
            break;
          case 'guitar-effects':
            synth = new Tone.MonoSynth({
              oscillator: {
                type: 'square'
              },
              envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.2,
                release: 0.5
              },
              filter: {
                Q: 4,
                type: 'lowpass',
                rolloff: -24,
                frequency: 3000
              },
              filterEnvelope: {
                attack: 0.001,
                decay: 0.05,
                sustain: 0.3,
                release: 0.2,
                baseFrequency: 1000,
                octaves: 3
              }
            }).connect(distortion);
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
    switch(this.currentTheme) {
      case 2:
        return this.getTheme2Sounds(key);
      case 3:
        return this.getTheme3Sounds(key);
      default:
        return this.getTheme2Sounds(key);
    }
  }

  getTheme2Sounds(key) {
    // Theme 2: Keyboard position with piano-like synth
    const noteInfo = this.getKeyboardPositionNote(key);
    
    const soundDefs = [{
      synth: 'piano',
      note: noteInfo.note,
      duration: noteInfo.duration,
      octave: noteInfo.octave // Add octave info for mood system
    }];
    
    return this.mapSoundDefs(soundDefs);
  }

  getTheme3Sounds(key) {
    // Theme 3: Guitar synth with different sounds for different key types
    const noteInfo = this.getKeyboardPositionNote(key);
    let synthType, duration;
    
    if (/[A-Z]/.test(key)) {
      // Letters: Lead guitar tones
      synthType = 'guitar-lead';
      duration = noteInfo.duration;
    } else if (/[0-9]/.test(key)) {
      // Numbers: Rhythm guitar tones
      synthType = 'guitar-rhythm';
      duration = '4n'; // Shorter for rhythm
    } else {
      // Symbols: Effects and percussive sounds
      synthType = 'guitar-effects';
      duration = '8n'; // Short and punchy
    }
    
    const soundDefs = [{
      synth: synthType,
      note: noteInfo.note,
      duration: duration,
      octave: noteInfo.octave
    }];
    
    return this.mapSoundDefs(soundDefs);
  }

  getKeyboardPositionNote(key) {
    // QWERTY keyboard layout mapping - left to right, low to high pitch
    const keyboardLayout = {
      // Numbers row (octave 5 - highest)
      '1': { note: 'C5', octave: 5 }, '2': { note: 'C#5', octave: 5 }, '3': { note: 'D5', octave: 5 }, 
      '4': { note: 'D#5', octave: 5 }, '5': { note: 'E5', octave: 5 }, '6': { note: 'F5', octave: 5 }, 
      '7': { note: 'F#5', octave: 5 }, '8': { note: 'G5', octave: 5 }, '9': { note: 'G#5', octave: 5 }, 
      '0': { note: 'A5', octave: 5 },
      
      // Q row (octave 4 - high)
      'Q': { note: 'C4', octave: 4 }, 'W': { note: 'C#4', octave: 4 }, 'E': { note: 'D4', octave: 4 }, 
      'R': { note: 'D#4', octave: 4 }, 'T': { note: 'E4', octave: 4 }, 'Y': { note: 'F4', octave: 4 }, 
      'U': { note: 'F#4', octave: 4 }, 'I': { note: 'G4', octave: 4 }, 'O': { note: 'G#4', octave: 4 }, 
      'P': { note: 'A4', octave: 4 },
      
      // A row (octave 3 - medium)
      'A': { note: 'C3', octave: 3 }, 'S': { note: 'C#3', octave: 3 }, 'D': { note: 'D3', octave: 3 }, 
      'F': { note: 'D#3', octave: 3 }, 'G': { note: 'E3', octave: 3 }, 'H': { note: 'F3', octave: 3 }, 
      'J': { note: 'F#3', octave: 3 }, 'K': { note: 'G3', octave: 3 }, 'L': { note: 'G#3', octave: 3 },
      
      // Z row (octave 2 - low)
      'Z': { note: 'C2', octave: 2 }, 'X': { note: 'C#2', octave: 2 }, 'C': { note: 'D2', octave: 2 }, 
      'V': { note: 'D#2', octave: 2 }, 'B': { note: 'E2', octave: 2 }, 'N': { note: 'F2', octave: 2 }, 
      'M': { note: 'F#2', octave: 2 }
    };
    
    // Symbol mappings - use octave 6 for high metallic sounds
    const symbolMappings = {
      ' ': { note: 'C2', octave: 2, duration: '16n' },
      '.': { note: 'C6', octave: 6, duration: '32n' },
      ',': { note: 'G5', octave: 5, duration: '32n' },
      '!': { note: 'C6', octave: 6, duration: '8n' },
      '?': { note: 'G5', octave: 5, duration: '8n' },
      ';': { note: 'A4', octave: 4, duration: '16n' },
      ':': { note: 'A4', octave: 4, duration: '16n' },
      "'": { note: 'A6', octave: 6, duration: '32n' },
      '"': { note: 'A6', octave: 6, duration: '32n' },
      '-': { note: 'F3', octave: 3, duration: '8n' },
      '=': { note: 'B4', octave: 4, duration: '16n' },
      '+': { note: 'B4', octave: 4, duration: '16n' },
      '*': { note: 'C6', octave: 6, duration: '16n' },
      '/': { note: 'B4', octave: 4, duration: '16n' },
      '\\': { note: 'F4', octave: 4, duration: '16n' },
      '(': { note: 'C4', octave: 4, duration: '16n' },
      ')': { note: 'G4', octave: 4, duration: '16n' },
      '[': { note: 'C3', octave: 3, duration: '16n' },
      ']': { note: 'G3', octave: 3, duration: '16n' },
      '{': { note: 'F2', octave: 2, duration: '16n' },
      '}': { note: 'C3', octave: 3, duration: '16n' },
      '<': { note: 'A3', octave: 3, duration: '16n' },
      '>': { note: 'E4', octave: 4, duration: '16n' },
      '@': { note: 'D4', octave: 4, duration: '4n' },
      '#': { note: 'F2', octave: 2, duration: '8n' },
      '$': { note: 'G4', octave: 4, duration: '8n' },
      '%': { note: 'F4', octave: 4, duration: '16n' },
      '^': { note: 'C5', octave: 5, duration: '8n' },
      '&': { note: 'G2', octave: 2, duration: '8n' },
      '|': { note: 'C4', octave: 4, duration: '4n' },
      '~': { note: 'A4', octave: 4, duration: '2n' },
      '`': { note: 'F5', octave: 5, duration: '32n' }
    };
    
    // Check for symbol first
    if (symbolMappings[key]) {
      return symbolMappings[key];
    }
    
    // Check for keyboard layout mapping
    if (keyboardLayout[key]) {
      return {
        note: keyboardLayout[key].note,
        octave: keyboardLayout[key].octave,
        duration: '2n' // Longer duration for better sustain
      };
    }
    
    // Fallback for unmapped keys
    return {
      note: 'C4',
      octave: 4,
      duration: '4n'
    };
  }

  // Get octave information for mood system integration
  getKeyOctave(key) {
    return this.getKeyboardPositionNote(key).octave;
  }

  // Legacy method for backwards compatibility - returns updated theme mapping
  getThemes() {
    return this.getKeyboardPositionNote.bind(this);
  }

  // Map theme sound definitions to playable objects
  mapSoundDefs(soundDefs) {
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

  disposeSynths() {
    // Dispose existing synths
    this.synthPools.forEach(pool => {
      pool.forEach(item => item.synth.dispose());
    });
    this.synthPools.clear();
    
    // Dispose effects chains
    this.effectsChains.forEach(chain => {
      Object.values(chain).forEach(effect => {
        if (effect && effect.dispose) {
          effect.dispose();
        }
      });
    });
    this.effectsChains.clear();
  }

  dispose() {
    this.stopAllSustainedNotes();
    this.disposeSynths();
    this.isInitialized = false;
  }
}

export default AudioSystem;