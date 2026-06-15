const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');

function createWindow() {
  // Set up the webRequest interceptor on the default session to bypass Unsplash 401 bot block.
  // Unsplash blocks standard browser User-Agents (containing Mozilla/5.0...) with a 401.
  // We override the User-Agent to 'Electron' for all Unsplash requests to bypass this check.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://unsplash.com/*', 'https://*.unsplash.com/*'] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = 'Electron';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Fácil Diapos",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: false
    },
    icon: path.join(__dirname, '../public/logo.png'),
  });

  // Hide the default standard menu bar for a clean native app feel
  Menu.setApplicationMenu(null);

  // If the app is packaged, load from local built files.
  // Otherwise, load from the local dev server.
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    // Open devtools in development mode
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
