import { MusicalEducatorEngine } from './musicalEducatorEngine.js';

const engine = new MusicalEducatorEngine({
  canvas: { width: window.innerWidth, height: window.innerHeight },
  debug: false
});

engine.init().then(() => engine.start());

window.engine = engine;
