const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false, // Remove window frame and system controls for immersive experience
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'Conductor Mode - Hand Gesture Music',
    show: false // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle keyboard shortcuts for fullscreen app
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      // Don't exit fullscreen on ESC - let the app handle it
      // The app uses ESC to exit to menu / close application
      event.preventDefault();
    }
    
    // Cmd+Q (Mac) or Ctrl+Q to quit
    if (input.type === 'keyDown' && input.key === 'q' && (input.meta || input.control)) {
      app.quit();
    }
    
    // Cmd+W (Mac) or Ctrl+W to close window
    if (input.type === 'keyDown' && input.key === 'w' && (input.meta || input.control)) {
      mainWindow.close();
    }
  });

  if (isDev) {
    // Development mode - load from parcel dev server
    mainWindow.loadURL('http://localhost:3004');
    // Don't open DevTools in fullscreen by default for polished experience
    // mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/conductor/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle certificate errors for MediaPipe WASM loading
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.includes('cdn.jsdelivr.net') || url.includes('storage.googleapis.com')) {
    // Ignore certificate errors for MediaPipe resources
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Set up content security policy for MediaPipe and conductor mode
app.on('web-contents-created', (event, contents) => {
  contents.on('dom-ready', () => {
    contents.insertCSS(`
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    `);
  });
});