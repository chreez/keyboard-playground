import * as Tone from 'tone';

class AudioSystem {
  constructor() {
    this.isInitialized = false;
    this.synths = new Map();
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
    // Create different synth types for variety
    this.synths.set('oscillator', new Tone.Oscillator().toDestination());
    this.synths.set('pluck', new Tone.PluckSynth().toDestination());
    this.synths.set('membrane', new Tone.MembraneSynth().toDestination());
    this.synths.set('metal', new Tone.MetalSynth().toDestination());
    this.synths.set('noise', new Tone.NoiseSynth().toDestination());
  }

  playThemeSound(key) {
    if (!this.isInitialized) {
      this.initialize();
      return;
    }

    const sounds = this.getThemeSounds(key);
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    
    try {
      randomSound.play();
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  getThemeSounds(key) {
    const themes = {
      'A': () => [
        { synth: 'pluck', note: 'C4', duration: '8n' }, // Ant steps
        { synth: 'oscillator', note: 'G4', duration: '4n' } // Apple crunch
      ],
      'B': () => [
        { synth: 'membrane', note: 'C2', duration: '4n' }, // Bear growl
        { synth: 'pluck', note: 'C5', duration: '16n' } // Ball bounce
      ],
      'C': () => [
        { synth: 'oscillator', note: 'E5', duration: '8n' }, // Cat meow
        { synth: 'noise', note: 'C3', duration: '4n' } // Car vroom
      ],
      'D': () => [
        { synth: 'membrane', note: 'G2', duration: '8n' }, // Dog woof
        { synth: 'pluck', note: 'A5', duration: '16n' } // Toy squeak
      ],
      'E': () => [
        { synth: 'oscillator', note: 'A4', duration: '2n' }, // Elephant trumpet
        { synth: 'pluck', note: 'F4', duration: '8n' } // Egg crack
      ],
      'F': () => [
        { synth: 'pluck', note: 'D5', duration: '8n' }, // Fish bubble
        { synth: 'noise', note: 'B3', duration: '4n' } // Fire crackle
      ],
      'G': () => [
        { synth: 'membrane', note: 'D3', duration: '4n' }, // Goat bleat
        { synth: 'pluck', note: 'G5', duration: '16n' } // Guitar strum
      ],
      'H': () => [
        { synth: 'oscillator', note: 'B4', duration: '4n' }, // Horse neigh
        { synth: 'pluck', note: 'C4', duration: '8n' } // Harp pluck
      ],
      'I': () => [
        { synth: 'pluck', note: 'E4', duration: '8n' }, // Insect buzz
        { synth: 'oscillator', note: 'F5', duration: '16n' } // Ice clink
      ],
      'J': () => [
        { synth: 'membrane', note: 'A2', duration: '4n' }, // Jaguar roar
        { synth: 'pluck', note: 'D5', duration: '8n' } // Jump sound
      ],
      'K': () => [
        { synth: 'oscillator', note: 'G4', duration: '8n' }, // Koala call
        { synth: 'pluck', note: 'C5', duration: '16n' } // Key jingle
      ],
      'L': () => [
        { synth: 'membrane', note: 'E2', duration: '2n' }, // Lion roar
        { synth: 'pluck', note: 'A4', duration: '8n' } // Leaf rustle
      ],
      'M': () => [
        { synth: 'oscillator', note: 'A3', duration: '4n' }, // Mouse squeak
        { synth: 'membrane', note: 'C3', duration: '8n' } // Music note
      ],
      'N': () => [
        { synth: 'pluck', note: 'F4', duration: '8n' }, // Newt chirp
        { synth: 'oscillator', note: 'B4', duration: '16n' } // Note chime
      ],
      'O': () => [
        { synth: 'oscillator', note: 'D4', duration: '4n' }, // Owl hoot
        { synth: 'pluck', note: 'G4', duration: '8n' } // Orange squeeze
      ],
      'P': () => [
        { synth: 'membrane', note: 'F2', duration: '8n' }, // Pig oink
        { synth: 'pluck', note: 'E5', duration: '16n' } // Pop sound
      ],
      'Q': () => [
        { synth: 'oscillator', note: 'C5', duration: '4n' }, // Quail call
        { synth: 'pluck', note: 'F4', duration: '8n' } // Question ping
      ],
      'R': () => [
        { synth: 'membrane', note: 'B2', duration: '4n' }, // Rabbit thump
        { synth: 'noise', note: 'A3', duration: '8n' } // Rain patter
      ],
      'S': () => [
        { synth: 'noise', note: 'D4', duration: '8n' }, // Snake hiss
        { synth: 'oscillator', note: 'A5', duration: '16n' } // Star twinkle
      ],
      'T': () => [
        { synth: 'membrane', note: 'G2', duration: '4n' }, // Tiger growl
        { synth: 'pluck', note: 'C4', duration: '8n' } // Tree creak
      ],
      'U': () => [
        { synth: 'oscillator', note: 'E4', duration: '4n' }, // Unicorn magic
        { synth: 'pluck', note: 'D5', duration: '16n' } // Up sound
      ],
      'V': () => [
        { synth: 'membrane', note: 'A2', duration: '8n' }, // Vulture screech
        { synth: 'pluck', note: 'F5', duration: '16n' } // Violin string
      ],
      'W': () => [
        { synth: 'oscillator', note: 'C4', duration: '2n' }, // Wolf howl
        { synth: 'noise', note: 'B3', duration: '8n' } // Wind whoosh
      ],
      'X': () => [
        { synth: 'pluck', note: 'G4', duration: '8n' }, // Xenops chirp
        { synth: 'oscillator', note: 'E5', duration: '16n' } // X-ray beep
      ],
      'Y': () => [
        { synth: 'membrane', note: 'D2', duration: '4n' }, // Yak grunt
        { synth: 'pluck', note: 'A4', duration: '8n' } // Yoyo spin
      ],
      'Z': () => [
        { synth: 'oscillator', note: 'F4', duration: '4n' }, // Zebra whinny
        { synth: 'noise', note: 'C4', duration: '16n' } // Zap sound
      ]
    };

    const themeFunc = themes[key];
    if (!themeFunc) return [];

    const soundDefs = themeFunc();
    return soundDefs.map(def => ({
      play: () => {
        const synth = this.synths.get(def.synth);
        if (synth && synth.triggerAttackRelease) {
          synth.triggerAttackRelease(def.note, def.duration);
        } else if (synth && synth.triggerAttack) {
          synth.triggerAttack(def.note);
          setTimeout(() => synth.triggerRelease(), Tone.Time(def.duration).toMilliseconds());
        }
      }
    }));
  }

  dispose() {
    this.synths.forEach(synth => synth.dispose());
    this.synths.clear();
    this.isInitialized = false;
  }
}

export default AudioSystem;