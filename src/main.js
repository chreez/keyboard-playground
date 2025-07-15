const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the React app
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
    
    // Forward console logs to main process
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[RENDERER ${level}]:`, message);
      if (line) console.log(`  at line ${line} in ${sourceId}`);
    });
  } else {
    win.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }
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