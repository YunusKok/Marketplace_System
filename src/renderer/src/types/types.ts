// Cari (Müşteri/Tedarikçi) Tipi
export interface Cari {
  id: string
  kod: string
  unvan: string
  yetkili?: string
  telefon?: string
  adres?: string
  vergiDairesi?: string
  vergiNo?: string
  bakiye: number
  bakiyeTuru: 'A' | 'B' // A: Alacak, B: Borç
  olusturmaTarihi: string
  guncellemeTarihi: string
}

// Cari Hareket Tipi (Cari Defteri için)
export interface CariHareket {
  id: string
  cariId: string
  tarih: string
  aciklama: string
  borc: number
  alacak: number
  bakiye: number
  bakiyeTuru: 'A' | 'B'
  islemTipi: 'FATURA' | 'HAVALE' | 'CEK' | 'NAKIT' | 'IADE' | 'DIGER'
  belgeNo?: string
}

// Fatura Tipi
export interface Fatura {
  id: string
  faturaNo: string
  cariId: string
  tarih: string
  vadeTarihi?: string
  toplamTutar: number
  kdvTutari: number
  genelToplam: number
  durum: 'BEKLEMEDE' | 'ODENDI' | 'KISMI' | 'IPTAL'
  kalemler: FaturaKalem[]
}

export interface FaturaKalem {
  id: string
  urunAdi: string
  miktar: number
  birim: string
  birimFiyat: number
  kdvOrani: number
  toplam: number
}

// Kasa İşlem Tipi
export interface KasaIslem {
  id: string
  tarih: string
  islemTipi: 'TAHSILAT' | 'ODEME' | 'VIRMAN'
  tutar: number
  aciklama: string
  cariId?: string
  belgeNo?: string
}

// Dashboard Özet Tipi
export interface DashboardOzet {
  toplamCari: number
  toplamBorc: number
  toplamAlacak: number
  netBakiye: number
  bugunkuIslem: number
  bekleyenFatura: number
}

// Kullanıcı Tipi
export interface Kullanici {
  id: string
  kullaniciAdi: string
  adSoyad: string
  rol: 'ADMIN' | 'KULLANICI' | 'MUHASEBE'
  sonGiris?: string
}

// Auth State
export interface AuthState {
  isAuthenticated: boolean
  kullanici: Kullanici | null
}
