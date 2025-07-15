import * as Tone from 'tone';

class BackgroundMusicManager {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentTheme = 2;
    this.currentMood = 'calm';
    this.volume = -12; // Background music should be quieter than keyboard
    this.patterns = new Map();
    this.synths = new Map();
    this.effects = new Map();
    this.activePattern = null;
    this.fadeTime = 2; // 2 seconds for smooth transitions
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Tone.js transport if not already done
      if (Tone.Transport.state === 'stopped') {
        Tone.Transport.bpm.value = 80; // Slow, ambient tempo
      }

      this.setupEffects();
      this.setupSynths();
      this.createPatterns();
      this.isInitialized = true;
      console.log('Background music manager initialized');
    } catch (error) {
      console.error('Failed to initialize background music manager:', error);
    }
  }

  setupEffects() {
    // Create effects chain for background music
    const reverb = new Tone.Reverb({
      decay: 4,
      preDelay: 0.02,
      wet: 0.4
    });

    const chorus = new Tone.Chorus(4, 2.5, 0.3);
    const delay = new Tone.FeedbackDelay(0.375, 0.2);
    const volume = new Tone.Volume(this.volume);

    // Chain effects
    chorus.chain(delay, reverb, volume, Tone.getDestination());

    this.effects.set('main', { chorus, delay, reverb, volume });
  }

  setupSynths() {
    const mainEffects = this.effects.get('main');

    // Piano theme synths
    const pianoSynth = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.5, sustain: 0.4, release: 3 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 2 }
    }).connect(mainEffects.chorus);

    // Guitar theme synths
    const guitarSynth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.1, decay: 0.8, sustain: 0.6, release: 4 },
      filter: { Q: 1.5, type: 'lowpass', frequency: 1200 },
      filterEnvelope: { attack: 0.1, decay: 0.4, sustain: 0.8, release: 2 }
    }).connect(mainEffects.chorus);

    this.synths.set('piano', pianoSynth);
    this.synths.set('guitar', guitarSynth);
  }

  createPatterns() {
    this.createPianoPatterns();
    this.createGuitarPatterns();
  }

  createPianoPatterns() {
    // Piano calm pattern - gentle arpeggios
    const pianoCalmPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('piano');
      synth.triggerAttackRelease(note, '2n', time);
    }, ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C4', 'G3'], 'up');
    pianoCalmPattern.interval = '4n';
    pianoCalmPattern.loop = true;

    // Piano energetic pattern - more dynamic
    const pianoEnergeticPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('piano');
      synth.triggerAttackRelease(note, '8n', time);
    }, ['C3', 'F3', 'A3', 'C4', 'F4', 'A4', 'F4', 'C4', 'A3', 'F3'], 'upDown');
    pianoEnergeticPattern.interval = '8n';
    pianoEnergeticPattern.loop = true;

    // Piano playful pattern - bouncy melody
    const pianoPlayfulPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('piano');
      synth.triggerAttackRelease(note, '4n', time);
    }, ['C4', 'E4', 'G4', 'E4', 'F4', 'A4', 'G4', 'E4'], 'up');
    pianoPlayfulPattern.interval = '4n';
    pianoPlayfulPattern.loop = true;

    this.patterns.set('piano-calm', pianoCalmPattern);
    this.patterns.set('piano-energetic', pianoEnergeticPattern);
    this.patterns.set('piano-playful', pianoPlayfulPattern);
  }

  createGuitarPatterns() {
    // Guitar clean pattern - fingerpicked style
    const guitarCleanPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('guitar');
      synth.triggerAttackRelease(note, '2n', time);
    }, ['E2', 'A2', 'D3', 'G3', 'B3', 'E3', 'B3', 'G3'], 'upDown');
    guitarCleanPattern.interval = '4n';
    guitarCleanPattern.loop = true;

    // Guitar warm pattern - mellow chords
    const guitarWarmPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('guitar');
      synth.triggerAttackRelease(note, '2n', time);
    }, ['A2', 'D3', 'F#3', 'A3', 'D4', 'A3', 'F#3', 'D3'], 'up');
    guitarWarmPattern.interval = '2n';
    guitarWarmPattern.loop = true;

    // Guitar driven pattern - rhythmic
    const guitarDrivenPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('guitar');
      synth.triggerAttackRelease(note, '8n', time);
    }, ['E2', 'E2', 'G2', 'E2', 'A2', 'A2', 'G2', 'E2'], 'up');
    guitarDrivenPattern.interval = '8n';
    guitarDrivenPattern.loop = true;

    // Guitar heavy pattern - atmospheric drones
    const guitarHeavyPattern = new Tone.Pattern((time, note) => {
      const synth = this.synths.get('guitar');
      synth.triggerAttackRelease(note, '1n', time);
    }, ['E1', 'A1', 'D2', 'G2'], 'up');
    guitarHeavyPattern.interval = '1n';
    guitarHeavyPattern.loop = true;

    this.patterns.set('guitar-clean', guitarCleanPattern);
    this.patterns.set('guitar-warm', guitarWarmPattern);
    this.patterns.set('guitar-driven', guitarDrivenPattern);
    this.patterns.set('guitar-heavy', guitarHeavyPattern);
  }

  setTheme(themeNumber) {
    this.currentTheme = themeNumber;
    if (this.isPlaying) {
      this.updateBackgroundMusic();
    }
  }

  setMood(mood) {
    if (mood === this.currentMood) return;
    this.currentMood = mood;
    if (this.isPlaying) {
      this.updateBackgroundMusic();
    }
  }

  updateBackgroundMusic() {
    const patternKey = this.getPatternKey();
    const newPattern = this.patterns.get(patternKey);
    
    if (newPattern && newPattern !== this.activePattern) {
      this.crossfadeToPattern(newPattern);
    }
  }

  getPatternKey() {
    let moodKey = this.currentMood;
    
    // Map guitar-specific moods to pattern names
    if (this.currentTheme === 3) {
      if (this.currentMood.startsWith('guitar-')) {
        moodKey = this.currentMood; // Use guitar mood directly
      } else {
        // Map generic moods to guitar moods
        switch (this.currentMood) {
          case 'calm': moodKey = 'guitar-clean'; break;
          case 'energetic': moodKey = 'guitar-warm'; break;
          case 'playful': moodKey = 'guitar-driven'; break;
          case 'intense': moodKey = 'guitar-driven'; break;
          case 'frantic': moodKey = 'guitar-heavy'; break;
          default: moodKey = 'guitar-clean'; break;
        }
      }
      return moodKey;
    } else {
      // Piano theme
      switch (this.currentMood) {
        case 'calm': return 'piano-calm';
        case 'energetic': return 'piano-energetic';
        case 'playful': return 'piano-playful';
        case 'intense': return 'piano-energetic';
        case 'frantic': return 'piano-energetic';
        default: return 'piano-calm';
      }
    }
  }

  crossfadeToPattern(newPattern) {
    const volume = this.effects.get('main').volume;
    
    // Fade out current pattern
    if (this.activePattern) {
      volume.volume.rampTo(-60, this.fadeTime);
      setTimeout(() => {
        this.activePattern.stop();
        this.activePattern = newPattern;
        this.activePattern.start();
        volume.volume.rampTo(this.volume, this.fadeTime);
      }, this.fadeTime * 1000);
    } else {
      // No current pattern, start new one directly
      this.activePattern = newPattern;
      this.activePattern.start();
      volume.volume.rampTo(this.volume, this.fadeTime);
    }
  }

  start() {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    Tone.Transport.start();
    this.updateBackgroundMusic();
    console.log('Background music started');
  }

  stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.activePattern) {
      this.activePattern.stop();
      this.activePattern = null;
    }
    console.log('Background music stopped');
  }

  setVolume(volumeDb) {
    this.volume = volumeDb;
    const volume = this.effects.get('main')?.volume;
    if (volume) {
      volume.volume.rampTo(volumeDb, 0.1);
    }
  }

  getVolume() {
    return this.volume;
  }

  isBackgroundMusicPlaying() {
    return this.isPlaying;
  }

  dispose() {
    this.stop();
    
    // Dispose patterns
    this.patterns.forEach(pattern => {
      pattern.dispose();
    });
    this.patterns.clear();
    
    // Dispose synths
    this.synths.forEach(synth => {
      synth.dispose();
    });
    this.synths.clear();
    
    // Dispose effects
    this.effects.forEach(chain => {
      Object.values(chain).forEach(effect => {
        if (effect && effect.dispose) {
          effect.dispose();
        }
      });
    });
    this.effects.clear();
    
    this.isInitialized = false;
  }
}

export default BackgroundMusicManager;