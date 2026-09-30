import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset', // Adds Mac OS style native title bar appearance
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

ipcMain.on('print-landscape', (event, colorMode) => {
  console.log('IPC print-landscape received, color:', colorMode);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.webContents.print({ 
      silent: false,
      printBackground: true,
      landscape: true, 
      color: colorMode === 'color' 
    }, (success, failureReason) => {
      console.log('Print callback:', success, failureReason);
    });
  }
});

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
