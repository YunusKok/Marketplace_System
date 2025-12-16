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

export {}
