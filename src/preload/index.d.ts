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

// Fatura tipi
interface FaturaData {
  id: string
  cari_id: string
  fatura_no: string
  tarih: string
  toplam: number
  kdv: number
  genel_toplam: number
  fatura_tipi: 'ALIS' | 'SATIS'
  aciklama?: string
  olusturma_tarihi?: string
  cari_unvan?: string
}

// Export sonucu
interface ExportResult {
  success: boolean
  filePath?: string
  error?: string
}

// Müstahsil tipi
interface MustahsilData {
  id: string
  cari_id: string
  makbuz_no: string
  tarih: string
  urun_adi: string
  miktar: number
  birim: string
  birim_fiyat: number
  toplam: number
  stopaj_orani: number
  stopaj_tutari: number
  net_tutar: number
  aciklama?: string
  olusturma_tarihi?: string
  cari_unvan?: string
}

// Kullanıcı tipi
interface UserData {
  id: string
  kullanici_adi: string
  ad_soyad: string
  rol: string
}

// Kasa işlem tipi
interface KasaIslemData {
  id: string
  cari_id?: string
  tarih: string
  aciklama: string
  tutar: number
  islem_tipi: 'TAHSILAT' | 'ODEME'
  olusturma_tarihi?: string
  cari_unvan?: string
}

// Kasa bakiye tipi
interface KasaBakiyeData {
  bakiye: number
  tahsilat: number
  odeme: number
}

// Çek/Senet tipi
interface CekSenetData {
  id: string
  cari_id?: string
  tip: 'CEK' | 'SENET'
  numara?: string
  banka?: string
  vade_tarihi: string
  tutar: number
  durum: 'BEKLEMEDE' | 'TAHSIL_EDILDI' | 'IPTAL'
  aciklama?: string
  olusturma_tarihi?: string
  cari_unvan?: string
}

// Çek/Senet özet tipi
interface CekSenetOzetData {
  toplamCek: number
  toplamSenet: number
  bekleyen: number
  tahsilEdilen: number
  bekleyenAdet: number
  tahsilEdilenAdet: number
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
  
  // Fatura işlemleri
  getFaturalar: () => Promise<FaturaData[]>
  addFatura: (fatura: {
    cariId: string
    tarih: string
    faturaNo: string
    tutar: number
    kdv: number
    genelToplam: number
    faturaTipi: 'ALIS' | 'SATIS'
    aciklama?: string
  }) => Promise<FaturaData | null>
  deleteFatura: (id: string) => Promise<boolean>
  
  // Müstahsil işlemleri
  getMustahsiller: () => Promise<MustahsilData[]>
  addMustahsil: (mustahsil: {
    cariId: string
    tarih: string
    makbuzNo: string
    urunAdi: string
    miktar: number
    birim: string
    birimFiyat: number
    stopajOrani: number
    aciklama?: string
  }) => Promise<MustahsilData | null>
  deleteMustahsil: (id: string) => Promise<boolean>
  
  // Kasa işlemleri
  getKasaIslemleri: () => Promise<KasaIslemData[]>
  getKasaBakiye: () => Promise<KasaBakiyeData>
  addKasaIslem: (islem: {
    cariId?: string
    tarih: string
    aciklama: string
    tutar: number
    islemTipi: 'TAHSILAT' | 'ODEME'
  }) => Promise<KasaIslemData | null>
  deleteKasaIslem: (id: string) => Promise<boolean>
  
  // Çek/Senet işlemleri
  getCekSenetler: () => Promise<CekSenetData[]>
  getCekSenetOzet: () => Promise<CekSenetOzetData>
  addCekSenet: (cekSenet: {
    cariId?: string
    tip: 'CEK' | 'SENET'
    numara?: string
    banka?: string
    vadeTarihi: string
    tutar: number
    durum?: string
    aciklama?: string
  }) => Promise<CekSenetData | null>
  updateCekSenet: (id: string, cekSenet: Partial<{
    cariId?: string
    tip: 'CEK' | 'SENET'
    numara?: string
    banka?: string
    vadeTarihi?: string
    tutar?: number
    durum?: string
    aciklama?: string
  }>) => Promise<CekSenetData | null>
  deleteCekSenet: (id: string) => Promise<boolean>
  
  // Auth
  login: (username: string, password: string) => Promise<UserData | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    db: DatabaseAPI
  }
}

export { CariData, HareketData, FaturaData, MustahsilData, KasaIslemData, KasaBakiyeData, CekSenetData, CekSenetOzetData, DashboardStats, ExportResult, UserData, DatabaseAPI }
