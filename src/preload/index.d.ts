import { ElectronAPI } from '@electron-toolkit/preload'

// Cari tipi
interface CariData {
  id: string
  kod: string
  unvan: string
  yetkili?: string
  telefon?: string
  adres?: string
  vergi_dairesi?: string
  vergi_no?: string
  bakiye: number
  bakiye_turu: string
  olusturma_tarihi?: string
  guncelleme_tarihi?: string
}

// Hareket tipi
interface HareketData {
  id: string
  cari_id: string
  tarih: string
  aciklama: string
  borc: number
  alacak: number
  bakiye: number
  bakiye_turu: string
  islem_tipi: string
  olusturma_tarihi?: string
  cari_unvan?: string
}

// Dashboard stats tipi
interface DashboardStats {
  toplamCari: number
  toplamBorc: number
  toplamAlacak: number
  netBakiye: number
  sonHareketler: HareketData[]
}

// Export sonucu
interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}

// Kullanıcı tipi
interface UserData {
  id: string
  kullanici_adi: string
  ad_soyad: string
  rol: string
}

// Database API tipi
interface DatabaseAPI {
  // Cari işlemleri
  getCariler: () => Promise<CariData[]>
  getCari: (id: string) => Promise<CariData | null>
  addCari: (cari: {
    kod: string
    unvan: string
    yetkili?: string
    telefon?: string
    adres?: string
    vergiDairesi?: string
    vergiNo?: string
  }) => Promise<CariData | null>
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
  }>) => Promise<CariData | null>
  deleteCari: (id: string) => Promise<boolean>
  
  // Hareket işlemleri
  getHareketler: (cariId?: string) => Promise<HareketData[]>
  addHareket: (hareket: {
    cariId: string
    tarih: string
    aciklama: string
    borc: number
    alacak: number
    islemTipi: string
  }) => Promise<HareketData | null>
  
  // Dashboard
  getDashboardStats: () => Promise<DashboardStats | null>
  
  // Excel export
  exportToExcel: (tableName: string, fileName?: string) => Promise<ExportResult>
  exportCariEkstre: (cariId: string) => Promise<ExportResult>
  
  // Auth
  login: (username: string, password: string) => Promise<UserData | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    db: DatabaseAPI
  }
}

export { CariData, HareketData, DashboardStats, ExportResult, UserData, DatabaseAPI }
