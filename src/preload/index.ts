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
  
  // Müstahsil işlemleri
  getMustahsiller: () => ipcRenderer.invoke('db:getMustahsiller'),
  addMustahsil: (mustahsil: any) => ipcRenderer.invoke('db:addMustahsil', mustahsil),
  deleteMustahsil: (id: string) => ipcRenderer.invoke('db:deleteMustahsil', id),
  getMusthasilEkstre: (cariId: string) => ipcRenderer.invoke('db:getMusthasilEkstre', cariId),
  
  // Kasa işlemleri
  getKasaIslemleri: () => ipcRenderer.invoke('db:getKasaIslemleri'),
  getKasaBakiye: () => ipcRenderer.invoke('db:getKasaBakiye'),
  addKasaIslem: (islem: {
    cariId?: string
    tarih: string
    aciklama: string
    tutar: number
    islemTipi: 'TAHSILAT' | 'ODEME'
  }) => ipcRenderer.invoke('db:addKasaIslem', islem),
  deleteKasaIslem: (id: string) => ipcRenderer.invoke('db:deleteKasaIslem', id),
  
  // Çek/Senet işlemleri
  getCekSenetler: () => ipcRenderer.invoke('db:getCekSenetler'),
  getCekSenetOzet: () => ipcRenderer.invoke('db:getCekSenetOzet'),
  addCekSenet: (cekSenet: {
    cariId?: string
    tip: 'CEK' | 'SENET'
    numara?: string
    banka?: string
    vadeTarihi: string
    tutar: number
    durum?: string
    aciklama?: string
  }) => ipcRenderer.invoke('db:addCekSenet', cekSenet),
  updateCekSenet: (id: string, cekSenet: Partial<{
    cariId?: string
    tip: 'CEK' | 'SENET'
    numara?: string
    banka?: string
    vadeTarihi?: string
    tutar?: number
    durum?: string
    aciklama?: string
  }>) => ipcRenderer.invoke('db:updateCekSenet', id, cekSenet),
  deleteCekSenet: (id: string) => ipcRenderer.invoke('db:deleteCekSenet', id),
  
  // Auth
  login: (username: string, password: string) => 
    ipcRenderer.invoke('db:login', username, password),
  
  // Ayarlar işlemleri
  getAyarlar: () => ipcRenderer.invoke('db:getAyarlar'),
  getAyar: (anahtar: string) => ipcRenderer.invoke('db:getAyar', anahtar),
  setAyar: (anahtar: string, deger: string) => ipcRenderer.invoke('db:setAyar', anahtar, deger),
  setAyarlar: (ayarlar: Record<string, string>) => ipcRenderer.invoke('db:setAyarlar', ayarlar),
  
  // Kullanıcı yönetimi
  getKullanicilar: () => ipcRenderer.invoke('db:getKullanicilar'),
  addKullanici: (kullanici: {
    kullaniciAdi: string
    sifre: string
    adSoyad: string
    rol: string
  }) => ipcRenderer.invoke('db:addKullanici', kullanici),
  updateKullanici: (id: string, kullanici: Partial<{
    kullaniciAdi: string
    adSoyad: string
    rol: string
  }>) => ipcRenderer.invoke('db:updateKullanici', id, kullanici),
  deleteKullanici: (id: string) => ipcRenderer.invoke('db:deleteKullanici', id),
  changePassword: (id: string, eskiSifre: string, yeniSifre: string) => 
    ipcRenderer.invoke('db:changePassword', id, eskiSifre, yeniSifre)
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
