import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  console.log("Run this function");
  
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld("electronAPI", {
      saveDicomSetting: (data) => ipcRenderer.send("save-dicom-setting", data),
      saveTokenInfo: (data) => ipcRenderer.send("save-token-info", data) , 
      readTokenInfo: () => ipcRenderer.invoke("read-token-info") , 
      readSettingInfo: () => ipcRenderer.invoke("read-setting-info"), 
      saveSuccess: (callBack) => ipcRenderer.on("save-sucess", callBack) , 
      saveFailed: (callBack) => ipcRenderer.on("save-error", callBack), 
      moveOrthancFolder: () => ipcRenderer.send("orthanc-server-handle"), 
      moveOrthanceResponse: (callBack) => ipcRenderer.on("orthanc-server-reply", callBack), 
      orthanceExeHandler: () => ipcRenderer.send("orthanc-exe-configure"), 
      orthanceExeReply: (callBack) => ipcRenderer.on("orthanc-exe-reply", callBack), 
      backUpFolderHandler: (data) => ipcRenderer.send("study-backup-folder-handler",data), 
      SeriesBackUpFolderHandler: (data) => ipcRenderer.send("study-series-backup-handler",data), 
      backupFolderReply: (callback) => ipcRenderer.on("study-backup-folder-reply", callback), 
      SeriesBackupFolderReply: (callback) => ipcRenderer.on("study-series-backup-reply", callback), 
      studyBackupSuccess: (callBack) => ipcRenderer.on('study-backup-folder-reply-success', callBack) ,
      applicationReload: () => ipcRenderer.send("application-reload")

    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
