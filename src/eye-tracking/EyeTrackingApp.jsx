import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FaceTracker from '../tracking/FaceTracker.js';

const EyeTrackingApp = () => {
  const faceTrackerRef = useRef(null);
  const [status, setStatus] = useState({
    initialized: false,
    tracking: false,
    calibrating: false,
    error: null
  });
  const [attentionData, setAttentionData] = useState({ x: 0, y: 0, radius: 200, confidence: 0, gazeConfidence: 0 });
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const initFaceTracker = async () => {
      if (!faceTrackerRef.current) {
        faceTrackerRef.current = new FaceTracker();
        
        // Set up event listeners
        faceTrackerRef.current.on('initialized', () => {
          setStatus(prev => ({ ...prev, initialized: true, error: null }));
        });
        
        faceTrackerRef.current.on('started', () => {
          setStatus(prev => ({ ...prev, tracking: true }));
        });
        
        faceTrackerRef.current.on('stopped', () => {
          setStatus(prev => ({ ...prev, tracking: false }));
        });
        
        faceTrackerRef.current.on('calibrationStarted', () => {
          setStatus(prev => ({ ...prev, calibrating: true }));
        });
        
        faceTrackerRef.current.on('calibrationComplete', () => {
          setStatus(prev => ({ ...prev, calibrating: false }));
        });
        
        faceTrackerRef.current.on('attentionUpdate', (data) => {
          setAttentionData(data);
        });
        
        faceTrackerRef.current.on('error', (error) => {
          setStatus(prev => ({ ...prev, error: error.message }));
        });
        
        faceTrackerRef.current.on('cameraError', ({ message, troubleshootingTips }) => {
          const fullMessage = `${message}\n\nTroubleshooting:\n${troubleshootingTips.join('\n')}`;
          setStatus(prev => ({ ...prev, error: fullMessage }));
          console.error('Camera Error:', message, troubleshootingTips);
        });
        
        try {
          await faceTrackerRef.current.init({
            showAttentionZone: true,
            showConfidence: true,
            smoothingLevel: 0.7,
            trackingMode: 'comfortable'
          });
          console.log('FaceTracker initialized successfully');
        } catch (error) {
          console.error('FaceTracker initialization failed:', error);
          setStatus(prev => ({ ...prev, error: error.message }));
        }
      }
    };
    
    initFaceTracker();

    const handleKeyPress = async (event) => {
      const key = event.key;
      
      // Handle face tracking hotkeys
      if (key === 'Escape') {
        if (faceTrackerRef.current && faceTrackerRef.current.isInitialized) {
          if (faceTrackerRef.current.isTracking) {
            await faceTrackerRef.current.stop();
            console.log('Face tracking stopped');
          } else {
            await faceTrackerRef.current.start();
            console.log('Face tracking started');
          }
        }
        return;
      }
      
      if (key === ' ') {
        if (faceTrackerRef.current && faceTrackerRef.current.isInitialized) {
          await faceTrackerRef.current.startCalibration();
          console.log('Calibration started');
        }
        return;
      }
      
      if (key === 'Tab') {
        event.preventDefault();
        if (faceTrackerRef.current) {
          faceTrackerRef.current.showAttentionZone = !faceTrackerRef.current.showAttentionZone;
          if (faceTrackerRef.current.attentionZone) {
            faceTrackerRef.current.attentionZone.style.display = 
              faceTrackerRef.current.showAttentionZone ? 'block' : 'none';
          }
          console.log('Attention zone toggled:', faceTrackerRef.current.showAttentionZone);
        }
        return;
      }
      
      if (key === 'F1') {
        if (faceTrackerRef.current) {
          const statusData = {
            initialized: faceTrackerRef.current.isInitialized,
            tracking: faceTrackerRef.current.isTracking,
            calibrating: faceTrackerRef.current.isCalibrating,
            updateRate: faceTrackerRef.current.getUpdateRate(),
            attentionZone: faceTrackerRef.current.getAttentionZone(),
            trackingMode: faceTrackerRef.current.trackingMode
          };
          console.log('Face tracking status:', statusData);
        }
        return;
      }
      
      if (key === 'h' || key === 'H') {
        setShowInstructions(!showInstructions);
        return;
      }
      
      if (key === 'c' || key === 'C') {
        if (faceTrackerRef.current) {
          faceTrackerRef.current.clearCalibrationData();
          console.log('Calibration data cleared');
        }
        return;
      }
      
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      
      // Cleanup face tracker
      if (faceTrackerRef.current) {
        faceTrackerRef.current.dispose();
      }
    };
  }, []);

  const handleClose = () => {
    window.close();
  };

  const handleStartTracking = async () => {
    if (faceTrackerRef.current && faceTrackerRef.current.isInitialized) {
      await faceTrackerRef.current.start();
    }
  };

  const handleStopTracking = async () => {
    if (faceTrackerRef.current) {
      await faceTrackerRef.current.stop();
    }
  };

  const handleCalibrate = async () => {
    if (faceTrackerRef.current && faceTrackerRef.current.isInitialized) {
      await faceTrackerRef.current.startCalibration();
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return '#00ff00'; // Green
    if (confidence > 0.5) return '#ffff00'; // Yellow
    return '#ff0000'; // Red
  };

  const getConfidenceText = (confidence) => {
    if (confidence > 0.8) return 'High';
    if (confidence > 0.5) return 'Medium';
    return 'Low';
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
          <h3 style={{ margin: '0 0 15px 0', color: '#4CAF50' }}>Face Tracking Test</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
            <p><strong>Controls:</strong></p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li><kbd>ESC</kbd> - Toggle tracking</li>
              <li><kbd>SPACE</kbd> - Start calibration</li>
              <li><kbd>TAB</kbd> - Toggle attention zone</li>
              <li><kbd>F1</kbd> - Show status</li>
              <li><kbd>H</kbd> - Toggle help</li>
              <li><kbd>C</kbd> - Clear calibration data</li>
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
            <span style={{ color: status.calibrating ? '#ff9800' : '#666' }}>
              ● Calibrating: {status.calibrating ? 'Yes' : 'No'}
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

      {/* Attention Data Panel */}
      {status.tracking && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '10px',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Attention Data</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div>X: {Math.round(attentionData.x)}px</div>
            <div>Y: {Math.round(attentionData.y)}px</div>
            <div>Radius: {Math.round(attentionData.radius)}px</div>
            <div>
              Face Visibility: 
              <span style={{ color: getConfidenceColor(attentionData.confidence), marginLeft: '5px' }}>
                {getConfidenceText(attentionData.confidence)} ({Math.round(attentionData.confidence * 100)}%)
              </span>
            </div>
            <div>
              Tracking Mode: 
              <span style={{ 
                color: attentionData.gazeConfidence > 0.7 ? '#00ff00' : '#ffff00', 
                marginLeft: '5px' 
              }}>
                {attentionData.gazeConfidence > 0.7 ? 'Eye Gaze' : 'Head Pose'} 
                ({Math.round(attentionData.gazeConfidence * 100)}% confidence)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
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
          onClick={handleCalibrate}
          disabled={!status.initialized}
          style={{
            padding: '10px 20px',
            backgroundColor: status.initialized ? '#ff9800' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: status.initialized ? 'pointer' : 'not-allowed'
          }}
        >
          Calibrate
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
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#4CAF50' }}>Face Tracking Test</h1>
        {!status.initialized && (
          <p>Initializing face tracking...</p>
        )}
        {status.initialized && !status.tracking && (
          <p>Press ESC or click "Start Tracking" to begin</p>
        )}
        {status.tracking && !status.calibrating && (
          <p>Look around to test face tracking<br/>Press SPACE to calibrate</p>
        )}
        {status.calibrating && (
          <p>Look at each calibration point and click</p>
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<EyeTrackingApp />);