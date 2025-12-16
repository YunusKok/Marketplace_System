import { ipcMain } from 'electron'
import { getDatabase } from './database'
import * as XLSX from 'xlsx'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { app, dialog } from 'electron'

// ===================================
// CARİ İŞLEMLERİ
// ===================================

// Tüm carileri getir
ipcMain.handle('db:getCariler', async () => {
  const db = getDatabase()
  if (!db) return []
  
  return db.prepare(`
    SELECT * FROM cariler ORDER BY kod
  `).all()
})

// Tek cari getir
ipcMain.handle('db:getCari', async (_, id: string) => {
  const db = getDatabase()
  if (!db) return null
  
  return db.prepare(`
    SELECT * FROM cariler WHERE id = ?
  `).get(id)
})

// Cari ekle
ipcMain.handle('db:addCari', async (_, cari: {
  kod: string
  unvan: string
  yetkili?: string
  telefon?: string
  adres?: string
  vergiDairesi?: string
  vergiNo?: string
}) => {
  const db = getDatabase()
  if (!db) return null
  
  const id = `c${Date.now()}`
  
  db.prepare(`
    INSERT INTO cariler (id, kod, unvan, yetkili, telefon, adres, vergi_dairesi, vergi_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cari.kod, cari.unvan, cari.yetkili, cari.telefon, cari.adres, cari.vergiDairesi, cari.vergiNo)
  
  return db.prepare('SELECT * FROM cariler WHERE id = ?').get(id)
})

// Cari güncelle
ipcMain.handle('db:updateCari', async (_, id: string, cari: Partial<{
  kod: string
  unvan: string
  yetkili?: string
  telefon?: string
  adres?: string
  vergiDairesi?: string
  vergiNo?: string
  bakiye: number
  bakiyeTuru: string
}>) => {
  const db = getDatabase()
  if (!db) return null
  
  const updates: string[] = []
  const values: (string | number)[] = []
  
  if (cari.kod) { updates.push('kod = ?'); values.push(cari.kod) }
  if (cari.unvan) { updates.push('unvan = ?'); values.push(cari.unvan) }
  if (cari.yetkili !== undefined) { updates.push('yetkili = ?'); values.push(cari.yetkili || '') }
  if (cari.telefon !== undefined) { updates.push('telefon = ?'); values.push(cari.telefon || '') }
  if (cari.adres !== undefined) { updates.push('adres = ?'); values.push(cari.adres || '') }
  if (cari.vergiDairesi !== undefined) { updates.push('vergi_dairesi = ?'); values.push(cari.vergiDairesi || '') }
  if (cari.vergiNo !== undefined) { updates.push('vergi_no = ?'); values.push(cari.vergiNo || '') }
  if (cari.bakiye !== undefined) { updates.push('bakiye = ?'); values.push(cari.bakiye) }
  if (cari.bakiyeTuru !== undefined) { updates.push('bakiye_turu = ?'); values.push(cari.bakiyeTuru) }
  
  updates.push("guncelleme_tarihi = datetime('now')")
  values.push(id)
  
  db.prepare(`UPDATE cariler SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  
  return db.prepare('SELECT * FROM cariler WHERE id = ?').get(id)
})

// Cari sil
ipcMain.handle('db:deleteCari', async (_, id: string) => {
  const db = getDatabase()
  if (!db) return false
  
  db.prepare('DELETE FROM cariler WHERE id = ?').run(id)
  return true
})

// ===================================
// HAREKET İŞLEMLERİ
// ===================================

// Cari hareketleri getir
ipcMain.handle('db:getHareketler', async (_, cariId?: string) => {
  const db = getDatabase()
  if (!db) return []
  
  if (cariId) {
    return db.prepare(`
      SELECT * FROM hareketler WHERE cari_id = ? ORDER BY tarih DESC
    `).all(cariId)
  }
  
  return db.prepare(`
    SELECT h.*, c.unvan as cari_unvan 
    FROM hareketler h 
    LEFT JOIN cariler c ON h.cari_id = c.id 
    ORDER BY h.tarih DESC
  `).all()
})

// Hareket ekle
ipcMain.handle('db:addHareket', async (_, hareket: {
  cariId: string
  tarih: string
  aciklama: string
  borc: number
  alacak: number
  islemTipi: string
}) => {
  const db = getDatabase()
  if (!db) return null
  
  const id = `h${Date.now()}`
  
  // Önceki bakiyeyi al
  const sonHareket = db.prepare(`
    SELECT bakiye, bakiye_turu FROM hareketler 
    WHERE cari_id = ? ORDER BY olusturma_tarihi DESC LIMIT 1
  `).get(hareket.cariId) as { bakiye: number; bakiye_turu: string } | undefined
  
  let yeniBakiye = sonHareket?.bakiye || 0
  let bakiyeTuru = sonHareket?.bakiye_turu || 'A'
  
  // Bakiye hesapla (Alacak +, Borç -)
  yeniBakiye = yeniBakiye + hareket.alacak - hareket.borc
  
  if (yeniBakiye < 0) {
    bakiyeTuru = 'B'
    yeniBakiye = Math.abs(yeniBakiye)
  } else {
    bakiyeTuru = 'A'
  }
  
  db.prepare(`
    INSERT INTO hareketler (id, cari_id, tarih, aciklama, borc, alacak, bakiye, bakiye_turu, islem_tipi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, hareket.cariId, hareket.tarih, hareket.aciklama, hareket.borc, hareket.alacak, yeniBakiye, bakiyeTuru, hareket.islemTipi)
  
  // Cari bakiyesini güncelle
  db.prepare(`
    UPDATE cariler SET bakiye = ?, bakiye_turu = ?, guncelleme_tarihi = datetime('now')
    WHERE id = ?
  `).run(yeniBakiye, bakiyeTuru, hareket.cariId)
  
  return db.prepare('SELECT * FROM hareketler WHERE id = ?').get(id)
})

// ===================================
// DASHBOARD VERİLERİ
// ===================================

ipcMain.handle('db:getDashboardStats', async () => {
  const db = getDatabase()
  if (!db) return null
  
  const toplamCari = db.prepare('SELECT COUNT(*) as count FROM cariler').get() as { count: number }
  
  const toplamBorc = db.prepare(`
    SELECT COALESCE(SUM(bakiye), 0) as total FROM cariler WHERE bakiye_turu = 'B'
  `).get() as { total: number }
  
  const toplamAlacak = db.prepare(`
    SELECT COALESCE(SUM(bakiye), 0) as total FROM cariler WHERE bakiye_turu = 'A'
  `).get() as { total: number }
  
  const sonHareketler = db.prepare(`
    SELECT h.*, c.unvan as cari_unvan 
    FROM hareketler h 
    LEFT JOIN cariler c ON h.cari_id = c.id 
    ORDER BY h.olusturma_tarihi DESC 
    LIMIT 15
  `).all()
  
  return {
    toplamCari: toplamCari.count,
    toplamBorc: toplamBorc.total,
    toplamAlacak: toplamAlacak.total,
    netBakiye: toplamAlacak.total - toplamBorc.total,
    sonHareketler
  }
})

// ===================================
// EXCEL EXPORT
// ===================================

ipcMain.handle('db:exportToExcel', async (_, tableName: string, fileName?: string) => {
  const db = getDatabase()
  if (!db) return { success: false, error: 'Veritabanı bağlantısı yok' }
  
  try {
    let data: unknown[]
    let sheetName: string
    
    switch (tableName) {
      case 'cariler':
        data = db.prepare('SELECT kod, unvan, yetkili, telefon, adres, vergi_dairesi, vergi_no, bakiye, bakiye_turu FROM cariler ORDER BY kod').all()
        sheetName = 'Cariler'
        break
      case 'hareketler':
        data = db.prepare(`
          SELECT h.tarih, c.unvan as cari, h.aciklama, h.borc, h.alacak, h.bakiye, h.bakiye_turu, h.islem_tipi 
          FROM hareketler h 
          LEFT JOIN cariler c ON h.cari_id = c.id 
          ORDER BY h.tarih DESC
        `).all()
        sheetName = 'Hareketler'
        break
      default:
        return { success: false, error: 'Geçersiz tablo adı' }
    }
    
    // Excel oluştur
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    // Dosya kaydet dialog
    const defaultPath = join(app.getPath('documents'), fileName || `${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
    })
    
    if (result.canceled || !result.filePath) {
      return { success: false, error: 'İptal edildi' }
    }
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    writeFileSync(result.filePath, buffer)
    
    return { success: true, filePath: result.filePath }
  } catch (error) {
    console.error('Excel export error:', error)
    return { success: false, error: String(error) }
  }
})

// Cari ekstre Excel export
ipcMain.handle('db:exportCariEkstre', async (_, cariId: string) => {
  const db = getDatabase()
  if (!db) return { success: false, error: 'Veritabanı bağlantısı yok' }
  
  try {
    const cari = db.prepare('SELECT * FROM cariler WHERE id = ?').get(cariId) as { kod: string; unvan: string } | undefined
    if (!cari) return { success: false, error: 'Cari bulunamadı' }
    
    const hareketler = db.prepare(`
      SELECT tarih, aciklama, borc, alacak, bakiye, bakiye_turu, islem_tipi 
      FROM hareketler 
      WHERE cari_id = ? 
      ORDER BY tarih DESC
    `).all(cariId)
    
    // Excel oluştur
    const worksheet = XLSX.utils.json_to_sheet(hareketler)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ekstre')
    
    // Dosya kaydet dialog
    const defaultPath = join(app.getPath('documents'), `${cari.kod}_${cari.unvan}_ekstre.xlsx`)
    
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
    })
    
    if (result.canceled || !result.filePath) {
      return { success: false, error: 'İptal edildi' }
    }
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    writeFileSync(result.filePath, buffer)
    
    return { success: true, filePath: result.filePath }
  } catch (error) {
    console.error('Excel export error:', error)
    return { success: false, error: String(error) }
  }
})

// ===================================
// AUTHENTICATION
// ===================================

ipcMain.handle('db:login', async (_, username: string, password: string) => {
  const db = getDatabase()
  if (!db) return null
  
  const user = db.prepare(`
    SELECT id, kullanici_adi, ad_soyad, rol FROM kullanicilar 
    WHERE kullanici_adi = ? AND sifre = ?
  `).get(username, password)
  
  return user || null
})

// ===================================
// FATURA İŞLEMLERİ
// ===================================

// Faturaları getir
ipcMain.handle('db:getFaturalar', async () => {
  const db = getDatabase()
  if (!db) return []
  
  return db.prepare(`
    SELECT f.*, c.unvan as cari_unvan 
    FROM faturalar f 
    LEFT JOIN cariler c ON f.cari_id = c.id 
    ORDER BY f.tarih DESC
  `).all()
})

// Fatura ekle
ipcMain.handle('db:addFatura', async (_, fatura: {
  cariId: string
  tarih: string
  faturaNo: string
  tutar: number
  kdv: number
  genelToplam: number
  faturaTipi: 'ALIS' | 'SATIS'
  aciklama?: string
}) => {
  const db = getDatabase()
  if (!db) return null
  
  const id = `f${Date.now()}`
  
  // Transaction başlat
  const transaction = db.transaction(() => {
    // 1. Faturayı ekle
    db.prepare(`
      INSERT INTO faturalar (id, cari_id, fatura_no, tarih, toplam, kdv, genel_toplam, fatura_tipi, aciklama)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      fatura.cariId, 
      fatura.faturaNo, 
      fatura.tarih, 
      fatura.tutar, 
      fatura.kdv, 
      fatura.genelToplam, 
      fatura.faturaTipi, 
      fatura.aciklama || ''
    )

    // 2. Hareketi ekle ve bakiyeyi güncelle
    // Satış faturası -> Cari Borçlanır (Borç artar)
    // Alış faturası -> Cari Alacaklanır (Alacak artar)
    
    let borc = 0
    let alacak = 0
    let islemTipi = 'FATURA'
    
    if (fatura.faturaTipi === 'SATIS') {
      borc = fatura.genelToplam
    } else {
      alacak = fatura.genelToplam
    }
    
    // Önceki bakiyeyi al
    const sonHareket = db.prepare(`
      SELECT bakiye, bakiye_turu FROM hareketler 
      WHERE cari_id = ? ORDER BY olusturma_tarihi DESC LIMIT 1
    `).get(fatura.cariId) as { bakiye: number; bakiye_turu: string } | undefined
    
    // let yeniBakiye = sonHareket?.bakiye || 0 // Unused variable removed
    // let bakiyeTuru = sonHareket?.bakiye_turu || 'A' // Not used currently, logic below handles it
    
    // Bakiye hesapla (Standart: Alacak - Borç = Bakiye)
    // Eğer Borç (Satış) ise bakiye azalır/negatife gider
    // Eğer Alacak (Alış) ise bakiye artar/pozitife gider
    // Ancak sistemde "Bakiye" mutlak değer ve "Bakiye Türü" (A/B) olarak tutuluyor.
    // Mevcut mantık:
    // Eğer Bakiye Türü A ise (+) bakiye
    // Eğer Bakiye Türü B ise (-) bakiye
    
    let mevcutNetBakiye = 0
    if (sonHareket) {
      if (sonHareket.bakiye_turu === 'A') {
        mevcutNetBakiye = sonHareket.bakiye
      } else {
        mevcutNetBakiye = -sonHareket.bakiye
      }
    }
    
    // Alacak (+) ekle, Borç (-) çıkar
    const yeniNetBakiye = mevcutNetBakiye + alacak - borc
    
    let yeniBakiyeTuru = 'A'
    let yeniMutlakBakiye = yeniNetBakiye
    
    if (yeniNetBakiye < 0) {
      yeniBakiyeTuru = 'B'
      yeniMutlakBakiye = Math.abs(yeniNetBakiye)
    }
    
    const hareketId = `h${Date.now()}`
    
    db.prepare(`
      INSERT INTO hareketler (id, cari_id, tarih, aciklama, borc, alacak, bakiye, bakiye_turu, islem_tipi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      hareketId, 
      fatura.cariId, 
      fatura.tarih, 
      `${fatura.faturaNo} Nolu ${fatura.faturaTipi === 'SATIS' ? 'Satış' : 'Alış'} Faturası`, 
      borc, 
      alacak, 
      yeniMutlakBakiye, 
      yeniBakiyeTuru, 
      islemTipi
    )
    
    // 3. Cari bakiyesini güncelle
    db.prepare(`
      UPDATE cariler SET bakiye = ?, bakiye_turu = ?, guncelleme_tarihi = datetime('now')
      WHERE id = ?
    `).run(yeniMutlakBakiye, yeniBakiyeTuru, fatura.cariId)
  })
  
  transaction()
  
  return db.prepare('SELECT * FROM faturalar WHERE id = ?').get(id)
})

// Fatura sil (Sadece faturayı siler, hareketi ŞİMDİLİK silmez - Manuel düzeltme gerekir uyarısı verilebilir frontend'de)
ipcMain.handle('db:deleteFatura', async (_, id: string) => {
  const db = getDatabase()
  if (!db) return false
  
  db.prepare('DELETE FROM faturalar WHERE id = ?').run(id)
  return true
})

// ===================================
// MÜSTAHSİL İŞLEMLERİ
// ===================================

// Müstahsilleri getir
ipcMain.handle('db:getMustahsiller', async () => {
  const db = getDatabase()
  if (!db) return []
  
  return db.prepare(`
    SELECT m.*, c.unvan as cari_unvan 
    FROM mustahsiller m 
    LEFT JOIN cariler c ON m.cari_id = c.id 
    ORDER BY m.tarih DESC
  `).all()
})

// Müstahsil ekle
ipcMain.handle('db:addMustahsil', async (_, mustahsil: {
  cariId: string
  tarih: string
  makbuzNo: string
  urunAdi: string
  miktar: number
  birim: string
  birimFiyat: number
  stopajOrani: number
  aciklama?: string
}) => {
  const db = getDatabase()
  if (!db) return null
  
  const id = `m${Date.now()}`
  
  // Hesaplamalar
  const toplam = mustahsil.miktar * mustahsil.birimFiyat
  const stopajTutari = toplam * (mustahsil.stopajOrani / 100)
  const netTutar = toplam - stopajTutari
  
  // Transaction başlat
  const transaction = db.transaction(() => {
    // 1. Müstahsili ekle
    db.prepare(`
      INSERT INTO mustahsiller (id, cari_id, makbuz_no, tarih, urun_adi, miktar, birim, birim_fiyat, toplam, stopaj_orani, stopaj_tutari, net_tutar, aciklama)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      mustahsil.cariId,
      mustahsil.makbuzNo,
      mustahsil.tarih,
      mustahsil.urunAdi,
      mustahsil.miktar,
      mustahsil.birim,
      mustahsil.birimFiyat,
      toplam,
      mustahsil.stopajOrani,
      stopajTutari,
      netTutar,
      mustahsil.aciklama || ''
    )

    // 2. Hareketi ekle - Müstahsil alımda üreticiye borç oluşur
    const sonHareket = db.prepare(`
      SELECT bakiye, bakiye_turu FROM hareketler 
      WHERE cari_id = ? ORDER BY olusturma_tarihi DESC LIMIT 1
    `).get(mustahsil.cariId) as { bakiye: number; bakiye_turu: string } | undefined
    
    let mevcutNetBakiye = 0
    if (sonHareket) {
      if (sonHareket.bakiye_turu === 'A') {
        mevcutNetBakiye = sonHareket.bakiye
      } else {
        mevcutNetBakiye = -sonHareket.bakiye
      }
    }
    
    // Müstahsil alımı = Borç (üreticiye ödeme yapılacak)
    const yeniNetBakiye = mevcutNetBakiye - netTutar
    
    let yeniBakiyeTuru = 'A'
    let yeniMutlakBakiye = yeniNetBakiye
    
    if (yeniNetBakiye < 0) {
      yeniBakiyeTuru = 'B'
      yeniMutlakBakiye = Math.abs(yeniNetBakiye)
    }
    
    const hareketId = `h${Date.now()}`
    
    db.prepare(`
      INSERT INTO hareketler (id, cari_id, tarih, aciklama, borc, alacak, bakiye, bakiye_turu, islem_tipi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      hareketId,
      mustahsil.cariId,
      mustahsil.tarih,
      `${mustahsil.makbuzNo} Nolu Müstahsil Makbuzu - ${mustahsil.urunAdi}`,
      netTutar, // Borç olarak işle
      0,
      yeniMutlakBakiye,
      yeniBakiyeTuru,
      'MUSTAHSIL'
    )
    
    // 3. Cari bakiyesini güncelle
    db.prepare(`
      UPDATE cariler SET bakiye = ?, bakiye_turu = ?, guncelleme_tarihi = datetime('now')
      WHERE id = ?
    `).run(yeniMutlakBakiye, yeniBakiyeTuru, mustahsil.cariId)
  })
  
  transaction()
  
  return db.prepare('SELECT * FROM mustahsiller WHERE id = ?').get(id)
})

// Müstahsil sil
ipcMain.handle('db:deleteMustahsil', async (_, id: string) => {
  const db = getDatabase()
  if (!db) return false
  
  db.prepare('DELETE FROM mustahsiller WHERE id = ?').run(id)
  return true
})

// ===================================
// KASA İŞLEMLERİ
// ===================================

// Kasa işlemlerini getir
ipcMain.handle('db:getKasaIslemleri', async () => {
  const db = getDatabase()
  if (!db) return []
  
  return db.prepare(`
    SELECT k.*, c.unvan as cari_unvan 
    FROM kasa k 
    LEFT JOIN cariler c ON k.cari_id = c.id 
    ORDER BY k.tarih DESC, k.olusturma_tarihi DESC
  `).all()
})

// Kasa bakiyesini getir
ipcMain.handle('db:getKasaBakiye', async () => {
  const db = getDatabase()
  if (!db) return { bakiye: 0, tahsilat: 0, odeme: 0 }
  
  const tahsilat = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as total FROM kasa WHERE islem_tipi = 'TAHSILAT'
  `).get() as { total: number }
  
  const odeme = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as total FROM kasa WHERE islem_tipi = 'ODEME'
  `).get() as { total: number }
  
  return {
    bakiye: tahsilat.total - odeme.total,
    tahsilat: tahsilat.total,
    odeme: odeme.total
  }
})

// Kasa işlemi ekle
ipcMain.handle('db:addKasaIslem', async (_, islem: {
  cariId?: string
  tarih: string
  aciklama: string
  tutar: number
  islemTipi: 'TAHSILAT' | 'ODEME'
}) => {
  const db = getDatabase()
  if (!db) return null
  
  const id = `k${Date.now()}`
  
  const transaction = db.transaction(() => {
    // 1. Kasa işlemini ekle
    db.prepare(`
      INSERT INTO kasa (id, cari_id, tarih, aciklama, tutar, islem_tipi)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      islem.cariId || null,
      islem.tarih,
      islem.aciklama,
      islem.tutar,
      islem.islemTipi
    )
    
    // 2. Eğer cari varsa, hareket ekle ve bakiye güncelle
    if (islem.cariId) {
      const sonHareket = db.prepare(`
        SELECT bakiye, bakiye_turu FROM hareketler 
        WHERE cari_id = ? ORDER BY olusturma_tarihi DESC LIMIT 1
      `).get(islem.cariId) as { bakiye: number; bakiye_turu: string } | undefined
      
      let mevcutNetBakiye = 0
      if (sonHareket) {
        if (sonHareket.bakiye_turu === 'A') {
          mevcutNetBakiye = sonHareket.bakiye
        } else {
          mevcutNetBakiye = -sonHareket.bakiye
        }
      }
      
      // Tahsilat = Cari borcu azalır (alacak)
      // Ödeme = Cari alacağı artar (borç)
      let borc = 0
      let alacak = 0
      
      if (islem.islemTipi === 'TAHSILAT') {
        alacak = islem.tutar // Cariden tahsilat yapıldı, borcu düşer
      } else {
        borc = islem.tutar // Cariye ödeme yapıldı, alacağı artar
      }
      
      const yeniNetBakiye = mevcutNetBakiye + alacak - borc
      
      let yeniBakiyeTuru = 'A'
      let yeniMutlakBakiye = yeniNetBakiye
      
      if (yeniNetBakiye < 0) {
        yeniBakiyeTuru = 'B'
        yeniMutlakBakiye = Math.abs(yeniNetBakiye)
      }
      
      const hareketId = `h${Date.now()}`
      
      db.prepare(`
        INSERT INTO hareketler (id, cari_id, tarih, aciklama, borc, alacak, bakiye, bakiye_turu, islem_tipi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        hareketId,
        islem.cariId,
        islem.tarih,
        islem.aciklama,
        borc,
        alacak,
        yeniMutlakBakiye,
        yeniBakiyeTuru,
        islem.islemTipi === 'TAHSILAT' ? 'TAHSILAT' : 'ODEME'
      )
      
      // 3. Cari bakiyesini güncelle
      db.prepare(`
        UPDATE cariler SET bakiye = ?, bakiye_turu = ?, guncelleme_tarihi = datetime('now')
        WHERE id = ?
      `).run(yeniMutlakBakiye, yeniBakiyeTuru, islem.cariId)
    }
  })
  
  transaction()
  
  return db.prepare('SELECT * FROM kasa WHERE id = ?').get(id)
})

// Kasa işlemi sil
ipcMain.handle('db:deleteKasaIslem', async (_, id: string) => {
  const db = getDatabase()
  if (!db) return false
  
  db.prepare('DELETE FROM kasa WHERE id = ?').run(id)
  return true
})

// ===================================
// ÇEK/SENET İŞLEMLERİ
// ===================================

// Çek/Senetleri getir
ipcMain.handle('db:getCekSenetler', async () => {
  const db = getDatabase()
  if (!db) return []
  
  return db.prepare(`
    SELECT cs.*, c.unvan as cari_unvan 
    FROM cek_senet cs 
    LEFT JOIN cariler c ON cs.cari_id = c.id 
    ORDER BY cs.vade_tarihi ASC
  `).all()
})

// Çek/Senet özet istatistikleri
ipcMain.handle('db:getCekSenetOzet', async () => {
  const db = getDatabase()
  if (!db) return { toplamCek: 0, toplamSenet: 0, bekleyen: 0, tahsilEdilen: 0, bekleyenAdet: 0, tahsilEdilenAdet: 0 }
  
  const toplamCek = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as total FROM cek_senet WHERE tip = 'CEK'
  `).get() as { total: number }
  
  const toplamSenet = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as total FROM cek_senet WHERE tip = 'SENET'
  `).get() as { total: number }
  
  const bekleyen = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as total, COUNT(*) as adet FROM cek_senet WHERE durum = 'BEKLEMEDE'
  `).get() as { total: number; adet: number }
  
  const tahsilEdilen = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as total, COUNT(*) as adet FROM cek_senet WHERE durum = 'TAHSIL_EDILDI'
  `).get() as { total: number; adet: number }
  
  return {
    toplamCek: toplamCek.total,
    toplamSenet: toplamSenet.total,
    bekleyen: bekleyen.total,
    tahsilEdilen: tahsilEdilen.total,
    bekleyenAdet: bekleyen.adet,
    tahsilEdilenAdet: tahsilEdilen.adet
  }
})

// Çek/Senet ekle
ipcMain.handle('db:addCekSenet', async (_, cekSenet: {
  cariId?: string
  tip: 'CEK' | 'SENET'
  numara?: string
  banka?: string
  vadeTarihi: string
  tutar: number
  durum?: string
  aciklama?: string
}) => {
  const db = getDatabase()
  if (!db) return null
  
  const id = `cs${Date.now()}`
  
  db.prepare(`
    INSERT INTO cek_senet (id, cari_id, tip, numara, banka, vade_tarihi, tutar, durum, aciklama)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cekSenet.cariId || null,
    cekSenet.tip,
    cekSenet.numara || '',
    cekSenet.banka || '',
    cekSenet.vadeTarihi,
    cekSenet.tutar,
    cekSenet.durum || 'BEKLEMEDE',
    cekSenet.aciklama || ''
  )
  
  return db.prepare('SELECT * FROM cek_senet WHERE id = ?').get(id)
})

// Çek/Senet güncelle
ipcMain.handle('db:updateCekSenet', async (_, id: string, cekSenet: Partial<{
  cariId?: string
  tip: 'CEK' | 'SENET'
  numara?: string
  banka?: string
  vadeTarihi?: string
  tutar?: number
  durum?: string
  aciklama?: string
}>) => {
  const db = getDatabase()
  if (!db) return null
  
  const updates: string[] = []
  const values: (string | number | null)[] = []
  
  if (cekSenet.cariId !== undefined) { updates.push('cari_id = ?'); values.push(cekSenet.cariId || null) }
  if (cekSenet.tip) { updates.push('tip = ?'); values.push(cekSenet.tip) }
  if (cekSenet.numara !== undefined) { updates.push('numara = ?'); values.push(cekSenet.numara || '') }
  if (cekSenet.banka !== undefined) { updates.push('banka = ?'); values.push(cekSenet.banka || '') }
  if (cekSenet.vadeTarihi) { updates.push('vade_tarihi = ?'); values.push(cekSenet.vadeTarihi) }
  if (cekSenet.tutar !== undefined) { updates.push('tutar = ?'); values.push(cekSenet.tutar) }
  if (cekSenet.durum) { updates.push('durum = ?'); values.push(cekSenet.durum) }
  if (cekSenet.aciklama !== undefined) { updates.push('aciklama = ?'); values.push(cekSenet.aciklama || '') }
  
  if (updates.length === 0) return db.prepare('SELECT * FROM cek_senet WHERE id = ?').get(id)
  
  values.push(id)
  db.prepare(`UPDATE cek_senet SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  
  return db.prepare('SELECT * FROM cek_senet WHERE id = ?').get(id)
})

// Çek/Senet sil
ipcMain.handle('db:deleteCekSenet', async (_, id: string) => {
  const db = getDatabase()
  if (!db) return false
  
  db.prepare('DELETE FROM cek_senet WHERE id = ?').run(id)
  return true
})

export {}

