import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AudioSystem from '../audio/AudioSystem.js';
import EmojiAnimator from '../animation/EmojiAnimator.js';
import MockEyeTracker from '../tracking/MockEyeTracker.js';

const IntegratedApp = () => {
  const canvasRef = useRef(null);
  const audioSystemRef = useRef(null);
  const animatorRef = useRef(null);
  const eyeTrackerRef = useRef(null);
  
  // Integration state
  const [mode, setMode] = useState('keyboard'); // 'keyboard' or 'eye-controlled'
  const [eyeTrackingStatus, setEyeTrackingStatus] = useState({
    initialized: false,
    tracking: false,
    calibrating: false,
    confidence: 0
  });
  const [showModeIndicator, setShowModeIndicator] = useState(false);
  const [crosshairOpacity, setCrosshairOpacity] = useState(0);

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

    // Initialize eye tracker in background (following startup sequence)
    const initEyeTracker = async () => {
      if (!eyeTrackerRef.current) {
        eyeTrackerRef.current = new MockEyeTracker();
        
        // Set up event listeners
        eyeTrackerRef.current.on('initialized', () => {
          setEyeTrackingStatus(prev => ({ ...prev, initialized: true }));
          console.log('Eye tracking initialized - ready for Mode 2');
        });
        
        eyeTrackerRef.current.on('started', () => {
          setEyeTrackingStatus(prev => ({ ...prev, tracking: true }));
          transitionToMode('eye-controlled');
        });
        
        eyeTrackerRef.current.on('stopped', () => {
          setEyeTrackingStatus(prev => ({ ...prev, tracking: false }));
          transitionToMode('keyboard');
        });
        
        eyeTrackerRef.current.on('calibrationStarted', () => {
          setEyeTrackingStatus(prev => ({ ...prev, calibrating: true }));
        });
        
        eyeTrackerRef.current.on('calibrationComplete', () => {
          setEyeTrackingStatus(prev => ({ ...prev, calibrating: false }));
        });
        
        eyeTrackerRef.current.on('gazeUpdate', (data) => {
          setEyeTrackingStatus(prev => ({ ...prev, confidence: data.confidence }));
        });
        
        eyeTrackerRef.current.on('error', (error) => {
          console.warn('Eye tracking error:', error);
          transitionToMode('keyboard');
        });
        
        try {
          await eyeTrackerRef.current.init({
            showCrosshair: true,
            showConfidence: true,
            smoothingLevel: 0.7
          });
        } catch (error) {
          console.warn('Eye tracking initialization failed, staying in keyboard mode:', error);
        }
      }
    };
    
    // Initialize eye tracking in background
    initEyeTracker();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleKeyPress = async (event) => {
      const key = event.key;
      
      // Handle eye tracking hotkeys
      if (key === 'Escape') {
        if (eyeTrackerRef.current && eyeTrackerRef.current.isInitialized) {
          if (eyeTrackerRef.current.isTracking) {
            await eyeTrackerRef.current.stop();
            console.log('Eye tracking stopped - switched to Mode 1');
          } else {
            await eyeTrackerRef.current.start();
            console.log('Eye tracking started - switched to Mode 2');
          }
        }
        return;
      }
      
      if (key === ' ') {
        if (eyeTrackerRef.current && eyeTrackerRef.current.isInitialized) {
          await eyeTrackerRef.current.startCalibration();
          console.log('Eye tracking calibration started');
        }
        return;
      }
      
      if (key === 'Tab') {
        event.preventDefault();
        if (eyeTrackerRef.current) {
          eyeTrackerRef.current.showCrosshair = !eyeTrackerRef.current.showCrosshair;
          if (eyeTrackerRef.current.crosshair) {
            eyeTrackerRef.current.crosshair.style.display = 
              eyeTrackerRef.current.showCrosshair ? 'block' : 'none';
          }
          console.log('Crosshair toggled:', eyeTrackerRef.current.showCrosshair);
        }
        return;
      }
      
      if (key === 'F1') {
        if (eyeTrackerRef.current) {
          const status = {
            mode: mode,
            initialized: eyeTrackerRef.current.isInitialized,
            tracking: eyeTrackerRef.current.isTracking,
            calibrating: eyeTrackerRef.current.isCalibrating,
            updateRate: eyeTrackerRef.current.getUpdateRate(),
            gazePosition: eyeTrackerRef.current.getGazePosition(),
            confidence: eyeTrackingStatus.confidence
          };
          console.log('Integration status:', status);
        }
        return;
      }
      
      // Handle all printable characters (letters, numbers, symbols) but filter out modifiers
      const isModifier = ['Control', 'Alt', 'Shift', 'Meta', 'Tab', 'Escape', 'Enter', 'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(key);
      
      if (!isModifier && key.length === 1) {
        const mappedKey = key.toUpperCase();
        
        // Determine spawn position based on mode
        let spawnX, spawnY;
        
        if (mode === 'eye-controlled' && 
            eyeTrackerRef.current && 
            eyeTrackerRef.current.isReadyForTracking() && 
            eyeTrackingStatus.confidence > 0.5) {
          
          // Mode 2: Eye-controlled spawn with random offset
          const gazePos = eyeTrackerRef.current.getGazePosition();
          spawnX = gazePos.x + (Math.random() - 0.5) * 60; // ±30px random offset
          spawnY = gazePos.y + (Math.random() - 0.5) * 60;
          
          console.log(`Mode 2: Spawning ${mappedKey} at gaze position (${Math.round(spawnX)}, ${Math.round(spawnY)})`);
        } else {
          // Mode 1: Keyboard only (original behavior) - spawn at bottom
          spawnX = undefined; // Let animator use default targeting
          spawnY = undefined;
          
          console.log(`Mode 1: Spawning ${mappedKey} with default targeting`);
        }
        
        // Play themed sound
        if (audioSystemRef.current) {
          audioSystemRef.current.playThemeSound(mappedKey);
        }
        
        // Spawn emoji animation
        if (animatorRef.current) {
          animatorRef.current.spawnEmoji(mappedKey, spawnX, spawnY);
        }
        
        // Show mode indicator briefly
        showModeIndicatorBriefly();
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
      
      // Cleanup eye tracker
      if (eyeTrackerRef.current) {
        eyeTrackerRef.current.dispose();
      }
    };
  }, [mode, eyeTrackingStatus.confidence]);

  // Mode transition with smooth crosshair fade
  const transitionToMode = (newMode) => {
    if (newMode === mode) return;
    
    console.log(`Transitioning from Mode ${mode === 'keyboard' ? '1' : '2'} to Mode ${newMode === 'keyboard' ? '1' : '2'}`);
    
    if (newMode === 'eye-controlled') {
      // Fade in crosshair over 500ms
      setCrosshairOpacity(1);
      if (eyeTrackerRef.current && eyeTrackerRef.current.crosshair) {
        eyeTrackerRef.current.crosshair.style.transition = 'opacity 500ms ease';
        eyeTrackerRef.current.crosshair.style.opacity = '1';
      }
    } else {
      // Fade out crosshair over 500ms
      setCrosshairOpacity(0);
      if (eyeTrackerRef.current && eyeTrackerRef.current.crosshair) {
        eyeTrackerRef.current.crosshair.style.transition = 'opacity 500ms ease';
        eyeTrackerRef.current.crosshair.style.opacity = '0';
      }
    }
    
    setMode(newMode);
    showModeIndicatorBriefly();
  };

  const showModeIndicatorBriefly = () => {
    setShowModeIndicator(true);
    setTimeout(() => setShowModeIndicator(false), 2000);
  };

  const handleClose = () => {
    window.close();
  };

  const getModeDescription = () => {
    if (mode === 'eye-controlled') {
      return `Mode 2: Eye-Controlled Spawn (${Math.round(eyeTrackingStatus.confidence * 100)}% confidence)`;
    } else {
      return 'Mode 1: Keyboard Only';
    }
  };

  const getModeColor = () => {
    if (mode === 'eye-controlled') {
      if (eyeTrackingStatus.confidence > 0.7) return '#4CAF50'; // Green
      if (eyeTrackingStatus.confidence > 0.5) return '#FF9800'; // Orange
      return '#f44336'; // Red
    }
    return '#2196F3'; // Blue for keyboard mode
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

      {/* Mode indicator */}
      {showModeIndicator && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: getModeColor(),
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
          zIndex: 1000,
          border: `2px solid ${getModeColor()}`,
          animation: 'fadeInOut 2s ease-in-out'
        }}>
          {getModeDescription()}
        </div>
      )}

      {/* Instructions overlay (shows on startup) */}
      {eyeTrackingStatus.initialized && !eyeTrackingStatus.tracking && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '10px',
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div>🎮 Keyboard Playground + Eye Tracking</div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: '0.7' }}>
            Press ESC to enable eye tracking • SPACE to calibrate • Type any key to play
          </div>
        </div>
      )}

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

      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<IntegratedApp />);