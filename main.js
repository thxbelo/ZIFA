import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, 'server/index.ts');
  
  const userDataPath = app.getPath('userData');

  if (isDev) {
    console.log('Starting backend in development mode...');
    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, USER_DATA_PATH: userDataPath }
    });
  } else {
    console.log('Starting backend in production mode...');
    serverProcess = spawn('node', ['--loader', 'ts-node/esm', 'server/index.ts'], {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production', USER_DATA_PATH: userDataPath }
    });
  }

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/vite.svg') // Change to your icon if available
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // startServer(); // The dev script in package.json already starts the server
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
