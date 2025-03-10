import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from "fs" ; 
import { fileURLToPath } from 'url';
import { FILE_OPERATION_CONSTANT, FILE_OPERATION_READ_FAILED } from '../renderer/src/constant/constant';
import { FILE_OPERATION_FAILED } from '../renderer/src/constant/constant';

// Define __dirname 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, 
      webSecurity: false, 
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// JSON File Path
const settingJsonFilePath = path.join(app.getPath("userData"), "setting.json") ; 
const tokenJsonFilePath = path.join(app.getPath("userData"), "token.json") ; 

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle save request from renderer process

// # 1 ==== Save dicom setting related information 
ipcMain.on("save-dicom-setting", async (event, data) => {
  try {
    fs.writeFileSync(settingJsonFilePath, JSON.stringify(data, null, 2), "utf-8") ; 
    event.reply("save-sucess", FILE_OPERATION_CONSTANT.DICOM_SETTING_FILE_SAVED) ; 
  } catch (error) {
    event.reply("save-error", FILE_OPERATION_FAILED)
  }
})

// # 2 ==== Save login token related information 
ipcMain.on("save-token-info", async (event, data) => {
  try {
    fs.writeFileSync(tokenJsonFilePath, JSON.stringify(data, null, 2), "utf-8") ; 
    event.reply("save-sucess", FILE_OPERATION_CONSTANT.TOKEN_FILE_SAVED) ; 
  } catch (error) {
    event.reply("save-error", FILE_OPERATION_FAILED)
  }
})

// # 3 ==== Read login token related information 
ipcMain.handle("read-token-info", async (event) => {
  try {
    const data = fs.readFileSync(tokenJsonFilePath, "utf-8") ; 
    return data ;
  } catch (error) {
    event.reply("save-error", FILE_OPERATION_READ_FAILED)
  }
})