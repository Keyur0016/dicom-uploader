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
      saveSuccess: (callBack) => ipcRenderer.on("save-sucess", callBack) , 
      saveFailed: (callBack) => ipcRenderer.on("save-error", callBack)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
