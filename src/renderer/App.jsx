import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import AudioSystem from '../audio/AudioSystem.js';
import EmojiAnimator from '../animation/EmojiAnimator.js';
import BeatAnalyzer from '../analysis/BeatAnalyzer.js';
import MoodDetector from '../analysis/MoodDetector.js';
import BackgroundVisualizer from '../visualization/BackgroundVisualizer.js';

const App = () => {
  const canvasRef = useRef(null);
  const backgroundCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const audioSystemRef = useRef(null);
  const animatorRef = useRef(null);
  const beatAnalyzerRef = useRef(null);
  const moodDetectorRef = useRef(null);
  const backgroundVisualizerRef = useRef(null);
  const heldKeysRef = useRef(new Set()); // Track held keys for sustained notes

  useEffect(() => {
    const canvas = canvasRef.current;
    const backgroundCanvas = backgroundCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !backgroundCanvas || !container) return;

    // Setup canvas sizes
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;

    // Initialize audio system
    if (!audioSystemRef.current) {
      audioSystemRef.current = new AudioSystem();
      audioSystemRef.current.initialize();
    }

    // Initialize emoji animator
    if (!animatorRef.current) {
      animatorRef.current = new EmojiAnimator(canvas);
      animatorRef.current.start();
    }

    // Initialize beat analyzer
    if (!beatAnalyzerRef.current) {
      beatAnalyzerRef.current = new BeatAnalyzer();
      beatAnalyzerRef.current.setTheme(1); // Default to Theme 1
    }

    // Initialize mood detector
    if (!moodDetectorRef.current) {
      moodDetectorRef.current = new MoodDetector();
    }

    // Initialize background visualizer
    if (!backgroundVisualizerRef.current) {
      backgroundVisualizerRef.current = new BackgroundVisualizer(backgroundCanvas, container);
      backgroundVisualizerRef.current.start();
    }

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      backgroundCanvas.width = window.innerWidth;
      backgroundCanvas.height = window.innerHeight;
    };

    const handleKeyDown = (event) => {
      const key = event.key;
      
      // Handle all printable characters (letters, numbers, symbols) but filter out modifiers
      const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'Tab', 'Escape', 'Enter', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key);
      
      if (!isModifier && key.length === 1) {
        const mappedKey = key.toUpperCase();
        
        // Prevent key repeat for sustained notes
        if (heldKeysRef.current.has(mappedKey)) {
          return;
        }
        
        heldKeysRef.current.add(mappedKey);
        
        // Start sustained note for musical characters or play normal sound
        if (audioSystemRef.current) {
          // For musical characters (letters and numbers), use sustained notes
          if (/[A-Z0-9]/.test(mappedKey)) {
            audioSystemRef.current.startSustainedNote(mappedKey);
          } else {
            // For symbols, use normal one-shot sounds
            audioSystemRef.current.playThemeSound(mappedKey);
          }
        }
        
        // Spawn emoji animation
        if (animatorRef.current) {
          animatorRef.current.spawnEmoji(mappedKey);
        }
        
        // Record keypress for beat analysis
        if (beatAnalyzerRef.current) {
          // For Theme 2 (musical), we could extract the note from the audio system
          // For now, just record the keypress
          beatAnalyzerRef.current.recordKeyPress(mappedKey);
        }
        
        // Update mood based on beat analysis
        if (beatAnalyzerRef.current && moodDetectorRef.current && backgroundVisualizerRef.current) {
          const beatAnalysis = beatAnalyzerRef.current.getCurrentAnalysis();
          const trendAnalysis = beatAnalyzerRef.current.getTrendAnalysis();
          const mood = moodDetectorRef.current.analyzeMood(beatAnalysis, trendAnalysis);
          backgroundVisualizerRef.current.updateMood(mood, beatAnalysis);
        }
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key;
      
      // Handle all printable characters (letters, numbers, symbols) but filter out modifiers
      const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'Tab', 'Escape', 'Enter', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key);
      
      if (!isModifier && key.length === 1) {
        const mappedKey = key.toUpperCase();
        
        heldKeysRef.current.delete(mappedKey);
        
        // Stop sustained note if it's a musical character
        if (audioSystemRef.current && /[A-Z0-9]/.test(mappedKey)) {
          audioSystemRef.current.stopSustainedNote(mappedKey);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Cleanup audio system
      if (audioSystemRef.current) {
        audioSystemRef.current.dispose();
      }
      
      // Cleanup animator
      if (animatorRef.current) {
        animatorRef.current.dispose();
      }
      
      // Cleanup background visualizer
      if (backgroundVisualizerRef.current) {
        backgroundVisualizerRef.current.dispose();
      }
      
      // Cleanup analysis systems
      if (beatAnalyzerRef.current) {
        beatAnalyzerRef.current.reset();
      }
      
      if (moodDetectorRef.current) {
        moodDetectorRef.current.reset();
      }
    };
  }, []);

  const handleClose = () => {
    window.close();
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: '#000000',
        position: 'relative'
      }}
    >
      {/* Background canvas for mood visualization */}
      <canvas
        ref={backgroundCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Canvas for emoji animations */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        ✕
      </button>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);