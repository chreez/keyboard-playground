const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'Hand Tracking Test'
  });

  if (isDev) {
    // Development mode - load from parcel dev server
    mainWindow.loadURL('http://localhost:3003');
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - load from built files
    mainWindow.loadFile(path.join(__dirname, '../dist/hand-tracking/index.html'));
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

// Set up content security policy for MediaPipe
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