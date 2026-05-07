import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { DataGenerator, GenerationConfig } from './dataGenerator.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// IPC Handlers for database operations
let dataGenerator: DataGenerator | null = null

ipcMain.handle('db:test-connection', async (_event, dbConfig) => {
  try {
    const generator = new DataGenerator(dbConfig)
    const result = await generator.testConnection()
    await generator.close()
    return { success: result, message: result ? 'Connection successful' : 'Connection failed' }
  } catch (error) {
    return { success: false, message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
})

ipcMain.handle('db:generate-data', async (_event, config: GenerationConfig) => {
  try {
    dataGenerator = new DataGenerator(config.dbConfig)
    const result = await dataGenerator.generateData(config)
    await dataGenerator.close()
    dataGenerator = null
    return result
  } catch (error) {
    if (dataGenerator) {
      await dataGenerator.close()
      dataGenerator = null
    }
    return {
      success: false,
      message: `Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      eventsCreated: 0
    }
  }
})

