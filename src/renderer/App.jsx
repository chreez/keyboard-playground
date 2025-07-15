import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import AudioSystem from '../audio/AudioSystem.js';
import EmojiAnimator from '../animation/EmojiAnimator.js';

const App = () => {
  const canvasRef = useRef(null);
  const audioSystemRef = useRef(null);
  const animatorRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleKeyPress = (event) => {
      const key = event.key.toUpperCase();
      if (key >= 'A' && key <= 'Z') {
        console.log(`Key pressed: ${key}`);
        
        // Play themed sound
        if (audioSystemRef.current) {
          audioSystemRef.current.playThemeSound(key);
        }
        
        // Spawn emoji animation
        if (animatorRef.current) {
          animatorRef.current.spawnEmoji(key);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
      
      // Cleanup audio system
      if (audioSystemRef.current) {
        audioSystemRef.current.dispose();
      }
      
      // Cleanup animator
      if (animatorRef.current) {
        animatorRef.current.dispose();
      }
    };
  }, []);

  const handleClose = () => {
    window.close();
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000000',
      position: 'relative'
    }}>
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

      {/* Canvas for animations */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);