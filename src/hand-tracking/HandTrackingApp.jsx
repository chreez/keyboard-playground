import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import HandTracker from '../tracking/HandTracker.js';

const HandTrackingApp = () => {
  const handTrackerRef = useRef(null);
  const [status, setStatus] = useState({
    initialized: false,
    tracking: false,
    error: null
  });
  const [handData, setHandData] = useState([]);
  const [gestureData, setGestureData] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [gestureMode, setGestureMode] = useState('basic');

  useEffect(() => {
    const initHandTracker = async () => {
      if (!handTrackerRef.current) {
        handTrackerRef.current = new HandTracker();
        
        // Set up event listeners
        handTrackerRef.current.on('initialized', () => {
          setStatus(prev => ({ ...prev, initialized: true, error: null }));
        });
        
        handTrackerRef.current.on('started', () => {
          setStatus(prev => ({ ...prev, tracking: true }));
        });
        
        handTrackerRef.current.on('stopped', () => {
          setStatus(prev => ({ ...prev, tracking: false }));
        });
        
        handTrackerRef.current.on('handsDetected', (hands) => {
          setHandData(hands);
        });
        
        handTrackerRef.current.on('handsLost', () => {
          setHandData([]);
          setGestureData([]);
        });
        
        handTrackerRef.current.on('gesturesDetected', (gestures) => {
          setGestureData(gestures);
        });
        
        handTrackerRef.current.on('error', (error) => {
          setStatus(prev => ({ ...prev, error: error.message }));
        });
        
        handTrackerRef.current.on('cameraError', ({ message, troubleshootingTips }) => {
          const fullMessage = `${message}\n\nTroubleshooting:\n${troubleshootingTips.join('\n')}`;
          setStatus(prev => ({ ...prev, error: fullMessage }));
          console.error('Camera Error:', message, troubleshootingTips);
        });

        handTrackerRef.current.on('resize', (dimensions) => {
          console.log('Screen resized to:', dimensions);
        });
        
        try {
          await handTrackerRef.current.init({
            maxHands: 2,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
            showLandmarks: showLandmarks,
            gestureMode: gestureMode
          });
          console.log('HandTracker initialized successfully');
        } catch (error) {
          console.error('HandTracker initialization failed:', error);
          setStatus(prev => ({ ...prev, error: error.message }));
        }
      }
    };
    
    initHandTracker();

    const handleKeyPress = async (event) => {
      const key = event.key;
      
      // Handle hand tracking hotkeys
      if (key === 'Escape') {
        if (handTrackerRef.current && handTrackerRef.current.isInitialized) {
          if (handTrackerRef.current.isTracking) {
            await handTrackerRef.current.stop();
            console.log('Hand tracking stopped');
          } else {
            await handTrackerRef.current.start();
            console.log('Hand tracking started');
          }
        }
        return;
      }
      
      if (key === 'Tab') {
        event.preventDefault();
        if (handTrackerRef.current) {
          handTrackerRef.current.toggleLandmarks();
          setShowLandmarks(handTrackerRef.current.showLandmarks);
        }
        console.log('Landmarks toggled:', handTrackerRef.current?.showLandmarks);
        return;
      }
      
      if (key === 'F1') {
        if (handTrackerRef.current) {
          const statusData = {
            initialized: handTrackerRef.current.isInitialized,
            tracking: handTrackerRef.current.isTracking,
            updateRate: handTrackerRef.current.getUpdateRate(),
            hands: handTrackerRef.current.getHands(),
            gestures: handTrackerRef.current.getCurrentGestures(),
            gestureMode: handTrackerRef.current.gestureMode
          };
          console.log('Hand tracking status:', statusData);
        }
        return;
      }
      
      if (key === 'h' || key === 'H') {
        setShowInstructions(!showInstructions);
        return;
      }
      
      if (key === 'g' || key === 'G') {
        const newMode = gestureMode === 'basic' ? 'advanced' : 'basic';
        setGestureMode(newMode);
        if (handTrackerRef.current) {
          handTrackerRef.current.gestureMode = newMode;
        }
        console.log('Gesture mode changed to:', newMode);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      
      // Cleanup hand tracker
      if (handTrackerRef.current) {
        handTrackerRef.current.dispose();
      }
    };
  }, [gestureMode]);

  const handleClose = () => {
    window.close();
  };

  const handleStartTracking = async () => {
    if (handTrackerRef.current && handTrackerRef.current.isInitialized) {
      await handTrackerRef.current.start();
    }
  };

  const handleStopTracking = async () => {
    if (handTrackerRef.current) {
      await handTrackerRef.current.stop();
    }
  };

  const handleToggleLandmarks = () => {
    if (handTrackerRef.current) {
      handTrackerRef.current.toggleLandmarks();
      setShowLandmarks(handTrackerRef.current.showLandmarks);
    }
  };

  const handleToggleGestureMode = () => {
    const newMode = gestureMode === 'basic' ? 'advanced' : 'basic';
    setGestureMode(newMode);
    if (handTrackerRef.current) {
      handTrackerRef.current.gestureMode = newMode;
    }
  };

  const getGestureColor = (gesture) => {
    const colors = {
      pointing: '#ff6b6b',
      pinching: '#4ecdc4',
      thumbsUp: '#45b7d1',
      peaceSign: '#96ceb4',
      openPalm: '#ffeaa7',
      closedFist: '#dda0dd'
    };
    return colors[gesture.type] || '#ffffff';
  };

  const getHandednessColor = (handedness) => {
    return handedness === 'left' ? '#ff6b6b' : '#4ecdc4';
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'transparent',
      position: 'relative',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
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

      {/* Instructions Panel */}
      {showInstructions && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>Hand Tracking Test</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            <p><strong>Controls:</strong></p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li><kbd>ESC</kbd> - Toggle tracking</li>
              <li><kbd>TAB</kbd> - Toggle landmarks</li>
              <li><kbd>F1</kbd> - Show status</li>
              <li><kbd>H</kbd> - Toggle help</li>
              <li><kbd>G</kbd> - Toggle gesture mode</li>
            </ul>
            <p><strong>Gestures:</strong></p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>👉 Pointing</li>
              <li>🤏 Pinching</li>
              <li>👍 Thumbs up</li>
              <li>✌️ Peace sign</li>
              <li>🖐️ Open palm</li>
              <li>✊ Closed fist</li>
            </ul>
          </div>
        </div>
      )}

      {/* Status Panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '80px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '10px',
        zIndex: 1000,
        fontSize: '14px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Status</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div>
            <span style={{ color: status.initialized ? '#4CAF50' : '#f44336' }}>
              ● Initialized: {status.initialized ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span style={{ color: status.tracking ? '#4CAF50' : '#f44336' }}>
              ● Tracking: {status.tracking ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span style={{ color: showLandmarks ? '#4CAF50' : '#f44336' }}>
              ● Landmarks: {showLandmarks ? 'On' : 'Off'}
            </span>
          </div>
          <div>
            <span style={{ color: '#4CAF50' }}>
              ● Mode: {gestureMode}
            </span>
          </div>
        </div>
        {status.error && (
          <div style={{ 
            marginTop: '10px', 
            color: '#f44336', 
            fontSize: '12px',
            lineHeight: '1.4',
            whiteSpace: 'pre-line',
            maxWidth: '300px'
          }}>
            <strong>Error:</strong> {status.error}
          </div>
        )}
      </div>

      {/* Hand Data Panel */}
      {status.tracking && handData.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '10px',
          zIndex: 1000,
          fontSize: '14px',
          maxWidth: '400px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Hand Data</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {handData.map((hand, index) => (
              <div key={index} style={{ padding: '5px', border: '1px solid #333', borderRadius: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: getHandednessColor(hand.handedness) }}>
                    {hand.handedness.toUpperCase()} HAND
                  </span>
                  <span style={{ color: '#aaa' }}>
                    ({Math.round(hand.confidence * 100)}% confidence)
                  </span>
                </div>
                {hand.gestures.length > 0 && (
                  <div style={{ marginTop: '5px' }}>
                    <strong>Gestures:</strong>
                    {hand.gestures.map((gesture, gIndex) => (
                      <div key={gIndex} style={{ 
                        color: getGestureColor(gesture),
                        marginLeft: '10px',
                        fontSize: '12px'
                      }}>
                        {gesture.type} ({Math.round(gesture.confidence * 100)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gesture Data Panel */}
      {status.tracking && gestureData.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '10px',
          zIndex: 1000,
          fontSize: '14px',
          maxWidth: '300px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Active Gestures</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {gestureData.map((gesture, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                padding: '5px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '5px'
              }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: getGestureColor(gesture),
                  borderRadius: '50%'
                }}></div>
                <span style={{ color: getGestureColor(gesture) }}>
                  {gesture.type}
                </span>
                <span style={{ color: getHandednessColor(gesture.hand) }}>
                  ({gesture.hand})
                </span>
                <span style={{ color: '#aaa', fontSize: '12px' }}>
                  {Math.round(gesture.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        zIndex: 1000
      }}>
        {!status.tracking ? (
          <button
            onClick={handleStartTracking}
            disabled={!status.initialized}
            style={{
              padding: '10px 20px',
              backgroundColor: status.initialized ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: status.initialized ? 'pointer' : 'not-allowed'
            }}
          >
            Start Tracking
          </button>
        ) : (
          <button
            onClick={handleStopTracking}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Stop Tracking
          </button>
        )}
        
        <button
          onClick={handleToggleLandmarks}
          disabled={!status.initialized}
          style={{
            padding: '10px 20px',
            backgroundColor: status.initialized ? (showLandmarks ? '#ff9800' : '#666') : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: status.initialized ? 'pointer' : 'not-allowed'
          }}
        >
          {showLandmarks ? 'Hide' : 'Show'} Landmarks
        </button>
        
        <button
          onClick={handleToggleGestureMode}
          disabled={!status.initialized}
          style={{
            padding: '10px 20px',
            backgroundColor: status.initialized ? '#9c27b0' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: status.initialized ? 'pointer' : 'not-allowed'
          }}
        >
          Mode: {gestureMode}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        fontSize: '24px',
        color: 'rgba(255, 255, 255, 0.6)',
        zIndex: 0
      }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Hand Tracking Test</h1>
        {!status.initialized && (
          <p>Initializing hand tracking...</p>
        )}
        {status.initialized && !status.tracking && (
          <p>Press ESC or click "Start Tracking" to begin</p>
        )}
        {status.tracking && handData.length === 0 && (
          <p>Show your hands to the camera</p>
        )}
        {status.tracking && handData.length > 0 && (
          <p>Make gestures with your hands</p>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<HandTrackingApp />);