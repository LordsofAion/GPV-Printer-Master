const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

const isDev = !app.isPackaged;
let backendProcess = null;

function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.db');
  return dbPath;
}

function setupDatabase() {
  const dbPath = getDatabasePath();

  // Create userData dir if not exists
  if (!fs.existsSync(app.getPath('userData'))) {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
  }

  // If DB doesn't exist in userData, copy from resources
  if (!fs.existsSync(dbPath)) {
    console.log('Database not found in userData, copying from resources...');
    // In prod: resources/prisma/dev.db
    // In dev: prisma/dev.db
    let sourcePath;
    if (isDev) {
      sourcePath = path.join(__dirname, '../prisma/dev.db');
    } else {
      sourcePath = path.join(process.resourcesPath, 'prisma', 'dev.db');
    }

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, dbPath);
      console.log('Database copied successfully.');
    } else {
      console.error('Initial database file not found at:', sourcePath);
    }
  }

  // Set Env Var for Prisma
  // Windows: file:C:/Path/To/Db
  // Unix: file:/Path/To/Db
  process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, '/')}`;
  console.log('DATABASE_URL set to:', process.env.DATABASE_URL);
}

function startBackend() {
  if (isDev) {
    console.log('In Dev mode, assuming backend is running via npm script.');
    return;
  }

  const backendPath = path.join(process.resourcesPath, 'backend', 'server.js');
  console.log('Starting backend from:', backendPath);

  if (fs.existsSync(backendPath)) {
    backendProcess = fork(backendPath, [], {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'pipe' // Capture output if needed
    });

    backendProcess.on('message', (msg) => {
      console.log('Backend message:', msg);
    });

    backendProcess.stdout.on('data', (data) => console.log(`Backend Out: ${data}`));
    backendProcess.stderr.on('data', (data) => console.error(`Backend Err: ${data}`));

    console.log('Backend process spawned with PID:', backendProcess.pid);
  } else {
    console.error('Backend server file not found at:', backendPath);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "GPV Print Manager - Produção Inteligente",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.removeMenu();
}

app.whenReady().then(() => {
  setupDatabase();
  startBackend();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Killing backend process...');
    backendProcess.kill();
  }
});
