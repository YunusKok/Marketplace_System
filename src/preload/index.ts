import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Database API for renderer
const dbAPI = {
  // Cari işlemleri
  getCariler: () => ipcRenderer.invoke('db:getCariler'),
  getCari: (id: string) => ipcRenderer.invoke('db:getCari', id),
  addCari: (cari: {
    kod: string
    unvan: string
    yetkili?: string
    telefon?: string
    adres?: string
    vergiDairesi?: string
    vergiNo?: string
  }) => ipcRenderer.invoke('db:addCari', cari),
  updateCari: (id: string, cari: Partial<{
    kod: string
    unvan: string
    yetkili?: string
    telefon?: string
    adres?: string
    vergiDairesi?: string
    vergiNo?: string
    bakiye: number
    bakiyeTuru: string
  }>) => ipcRenderer.invoke('db:updateCari', id, cari),
  deleteCari: (id: string) => ipcRenderer.invoke('db:deleteCari', id),
  
  // Hareket işlemleri
  getHareketler: (cariId?: string) => ipcRenderer.invoke('db:getHareketler', cariId),
  addHareket: (hareket: {
    cariId: string
    tarih: string
    aciklama: string
    borc: number
    alacak: number
    islemTipi: string
  }) => ipcRenderer.invoke('db:addHareket', hareket),
  
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('db:getDashboardStats'),
  
  // Excel export
  exportToExcel: (tableName: string, fileName?: string) => 
    ipcRenderer.invoke('db:exportToExcel', tableName, fileName),
  exportCariEkstre: (cariId: string) => 
    ipcRenderer.invoke('db:exportCariEkstre', cariId),
  
  // Fatura işlemleri
  getFaturalar: () => ipcRenderer.invoke('db:getFaturalar'),
  addFatura: (fatura: {
    cariId: string
    tarih: string
    faturaNo: string
    tutar: number
    kdv: number
    genelToplam: number
    faturaTipi: 'ALIS' | 'SATIS'
    aciklama?: string
  }) => ipcRenderer.invoke('db:addFatura', fatura),
  deleteFatura: (id: string) => ipcRenderer.invoke('db:deleteFatura', id),
  
  // Auth
  login: (username: string, password: string) => 
    ipcRenderer.invoke('db:login', username, password)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('db', dbAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.db = dbAPI
}
