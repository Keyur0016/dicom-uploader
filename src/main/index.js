import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from "fs" ; 
import fsA from 'fs-extra';
import { fileURLToPath } from 'url';
import { FILE_OPERATION_CONSTANT, FILE_OPERATION_READ_FAILED } from '../renderer/src/constant/constant';
import { FILE_OPERATION_FAILED } from '../renderer/src/constant/constant';
import { ORTHANCE_SOURCE_FOLDER, ORTHANCE_SERVER_DESTINATION_FOLDER, ORTHANCE_JSON_CONFIGURATION_PATH, BACKUP_STUDY_PATH } from '../renderer/src/constant/filepath.constant';
import { spawn } from 'child_process';
import { configureOrthancPeerRequest, deleteParticularStudyRequest, fetchStudyList, ORTHANC_URL } from '../renderer/src/handler/study.handler';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

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



ipcMain.handle("read-setting-info", async (event) => {
  try {
    let data = fs.readFileSync(settingJsonFilePath, "utf-8") ; 
    data = JSON.parse(data) ; 
    return data ; 
  } catch (error) {
    event.reply("save-error", FILE_OPERATION_READ_FAILED)
  }
})

// # 4 ==== Handle orthanc server related folder ====================
ipcMain.on("orthanc-server-handle", async (event) => {
  if (!fs.existsSync(ORTHANCE_SERVER_DESTINATION_FOLDER)){
    try {
      await fsA.copy(ORTHANCE_SOURCE_FOLDER, ORTHANCE_SERVER_DESTINATION_FOLDER) ; 
      event.reply("orthanc-server-reply", FILE_OPERATION_CONSTANT.ORTAHNCE_SERVER_FOLDER_COPY)
    } catch (error) {
      console.log(error);
      
      event.reply("orthanc-server-reply", FILE_OPERATION_CONSTANT.ORATANCE_SERVER_FOLDER_COPY_FAILED)
    }  
  }
})

// # 5 ==== Configure orthanc.exe in background ==========================
ipcMain.on("orthanc-exe-configure", async(event) => {
  try {
    await fetchStudyList() ; 
  } catch (error) {
    const exePath = path.join(ORTHANCE_SERVER_DESTINATION_FOLDER, "Orthanc.exe") ; 
    try {
      const process = spawn(exePath, [ORTHANCE_JSON_CONFIGURATION_PATH], {
        stdio: ["ignore", "pipe", "pipe"], 
        detached: true, 
        windowsHide: true
      }); 
      if (process.pid){
        console.log("Run this function");
        event.reply("orthanc-exe-reply", FILE_OPERATION_CONSTANT.ORTHANCE_EXE_START_SUCCESS)
      } else{
        event.reply("orthanc-exe-reply", FILE_OPERATION_CONSTANT.ORTHANCE_EXE_FAILED)
      }
    } catch (error) {
      console.log(error);
      event.reply("orthanc-exe-reply", FILE_OPERATION_CONSTANT.ORTHANCE_EXE_FAILED)
    }
  }
})

// # ======= 6 Check orthanc backup folder is exists or not ============================
ipcMain.on("study-backup-folder-handler", async(event, data) => {
  try {
    const response = await axios({
      method: "GET", 
      url: `${ORTHANC_URL}/jobs/${data?.backupJobID}/archive`, 
      responseType: "stream"
    });

    // Construct backup path
    let backup_study_folder = path.join(
      BACKUP_STUDY_PATH, 
      data?.particularStudy?.PatientMainDicomTags?.PatientName
    );

    // Ensure that the full folder structure exists
    if (!fs.existsSync(backup_study_folder)){
      fs.mkdirSync(backup_study_folder, { recursive: true });
    }

    let backup_study_path = path.join(backup_study_folder, `${data?.particularStudy?.ID}.zip`);

    // Create write stream
    const writer = fs.createWriteStream(backup_study_path);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        await deleteParticularStudyRequest(data?.particularStudy?.ID) ; 
        event.reply('study-backup-folder-reply-success', FILE_OPERATION_CONSTANT.STUDY_DELETE_SUCCESS);
        resolve({ success: true, backup_study_path });
      });

      writer.on('error', (error) => {
          console.error("File Write Error:", error);
          event.reply('study-backup-folder-reply', FILE_OPERATION_CONSTANT.BACKUP_FOLDER_CREATE_FAILED);
          reject(error);
      });
    });

  } catch (error) {
    console.error("Backup Failed:", error);
    event.reply("study-backup-folder-reply", FILE_OPERATION_CONSTANT.BACKUP_FOLDER_CREATE_FAILED);
  }
});