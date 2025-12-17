import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Veritabanı dosya yolu
// Veritabanı dosya yolu
const getDbPath = (): string => {
  let dbDir: string
  
  if (app.isPackaged) {
    // Production: AppData klasörü (Kalıcı veri)
    const userDataPath = app.getPath('userData')
    dbDir = join(userDataPath, 'data')
  } else {
    // Development: Proje klasörü (Kolay erişim)
    dbDir = join(process.cwd(), 'data')
  }
  
  // data klasörü yoksa oluştur
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  
  console.log('Database Path Configured:', {
    isPackaged: app.isPackaged,
    path: join(dbDir, 'hal.db')
  })
  
  return join(dbDir, 'hal.db')
}

let db: Database.Database | null = null

// Veritabanını başlat
export const initDatabase = (): Database.Database => {
  if (db) return db
  
  const dbPath = getDbPath()
  console.log('Database path:', dbPath)
  
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  // Tabloları oluştur
  createTables()
  
  // Demo verileri ekle (sadece ilk kez)
  insertDemoData()

  // Tutarlılık Kontrolü: Silinmiş carilere ait orphan kayıtları temizle
  try {
    console.log('Cleaning orphan records...')
    db.prepare('DELETE FROM hareketler WHERE cari_id IS NOT NULL AND cari_id NOT IN (SELECT id FROM cariler)').run()
    db.prepare('DELETE FROM cek_senet WHERE cari_id IS NOT NULL AND cari_id NOT IN (SELECT id FROM cariler)').run()
    db.prepare('DELETE FROM faturalar WHERE cari_id IS NOT NULL AND cari_id NOT IN (SELECT id FROM cariler)').run()
    db.prepare('DELETE FROM kasa WHERE cari_id IS NOT NULL AND cari_id NOT IN (SELECT id FROM cariler)').run()
    db.prepare('DELETE FROM mustahsiller WHERE cari_id IS NOT NULL AND cari_id NOT IN (SELECT id FROM cariler)').run()
    console.log('Orphan records cleaned.')
  } catch (err) {
    console.error('Cleanup error:', err)
  }
  
  return db
}

// Tabloları oluştur
const createTables = (): void => {
  if (!db) return

  // Cariler tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS cariler (
      id TEXT PRIMARY KEY,
      kod TEXT UNIQUE NOT NULL,
      unvan TEXT NOT NULL,
      yetkili TEXT,
      telefon TEXT,
      adres TEXT,
      vergi_dairesi TEXT,
      vergi_no TEXT,
      bakiye REAL DEFAULT 0,
      bakiye_turu TEXT DEFAULT 'A',
      tip TEXT DEFAULT 'DIGER', -- MUSTAHSIL, FIRMA, DIGER
      olusturma_tarihi TEXT DEFAULT (datetime('now')),
      guncelleme_tarihi TEXT DEFAULT (datetime('now'))
    )
  `)

  // Hareketler tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS hareketler (
      id TEXT PRIMARY KEY,
      cari_id TEXT NOT NULL,
      tarih TEXT NOT NULL,
      aciklama TEXT,
      parti_no TEXT,
      miktar REAL DEFAULT 0,
      birim_fiyat REAL DEFAULT 0,
      borc REAL DEFAULT 0,
      alacak REAL DEFAULT 0,
      bakiye REAL DEFAULT 0,
      bakiye_turu TEXT DEFAULT 'A',
      islem_tipi TEXT,
      olusturma_tarihi TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cari_id) REFERENCES cariler(id) ON DELETE CASCADE
    )
  `)



  // Kasa işlemleri tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS kasa (
      id TEXT PRIMARY KEY,
      cari_id TEXT,
      tarih TEXT NOT NULL,
      aciklama TEXT,
      tutar REAL DEFAULT 0,
      islem_tipi TEXT NOT NULL,
      olusturma_tarihi TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cari_id) REFERENCES cariler(id) ON DELETE SET NULL
    )
  `)

  // Çek/Senet tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS cek_senet (
      id TEXT PRIMARY KEY,
      cari_id TEXT,
      tip TEXT NOT NULL,
      yon TEXT DEFAULT 'ALINAN', -- ALINAN (Giriş/Tahsilat) or VERILEN (Çıkış/Ödeme)
      numara TEXT,
      banka TEXT,
      vade_tarihi TEXT,
      tutar REAL DEFAULT 0,
      durum TEXT DEFAULT 'BEKLEMEDE',
      aciklama TEXT,
      olusturma_tarihi TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cari_id) REFERENCES cariler(id) ON DELETE SET NULL
    )
  `)

  // Müstahsil makbuzları tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS mustahsiller (
      id TEXT PRIMARY KEY,
      cari_id TEXT,
      makbuz_no TEXT UNIQUE NOT NULL,
      parti_no TEXT,
      tarih TEXT NOT NULL,
      urun_adi TEXT NOT NULL,
      miktar REAL DEFAULT 0,
      birim TEXT DEFAULT 'KG',
      birim_fiyat REAL DEFAULT 0,
      toplam REAL DEFAULT 0,
      stopaj_orani REAL DEFAULT 2,
      stopaj_tutari REAL DEFAULT 0,
      net_tutar REAL DEFAULT 0,
      aciklama TEXT,
      olusturma_tarihi TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cari_id) REFERENCES cariler(id) ON DELETE SET NULL
    )
  `)

  // Kullanıcılar tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS kullanicilar (
      id TEXT PRIMARY KEY,
      kullanici_adi TEXT UNIQUE NOT NULL,
      sifre TEXT NOT NULL,
      ad_soyad TEXT,
      rol TEXT DEFAULT 'kullanici',
      olusturma_tarihi TEXT DEFAULT (datetime('now'))
    )
  `)

  // Firma ayarları tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS ayarlar (
      anahtar TEXT PRIMARY KEY,
      deger TEXT
    )
  `)
  
  // Şema güncellemeleri (Migrations)
  try {
    const mustahsilInfo = db.prepare("PRAGMA table_info(mustahsiller)").all() as { name: string }[]
    const hasPartiNo = mustahsilInfo.some(col => col.name === 'parti_no')
    
    if (!hasPartiNo) {
      console.log('Adding parti_no column to mustahsiller table...')
      db.prepare("ALTER TABLE mustahsiller ADD COLUMN parti_no TEXT").run()
    }

    const cekSenetInfo = db.prepare("PRAGMA table_info(cek_senet)").all() as { name: string }[]
    const hasYon = cekSenetInfo.some(col => col.name === 'yon')
    
    if (!hasYon) {
      console.log('Adding yon column to cek_senet table...')
      db.prepare("ALTER TABLE cek_senet ADD COLUMN yon TEXT DEFAULT 'ALINAN'").run()
    }

    // Hareketler tablosuna yeni sütunlar ekle
    const hareketlerInfo = db.prepare("PRAGMA table_info(hareketler)").all() as { name: string }[]
    
    if (!hareketlerInfo.some(col => col.name === 'parti_no')) {
      console.log('Adding parti_no column to hareketler table...')
      db.prepare("ALTER TABLE hareketler ADD COLUMN parti_no TEXT").run()
    }
    if (!hareketlerInfo.some(col => col.name === 'miktar')) {
      console.log('Adding miktar column to hareketler table...')
      db.prepare("ALTER TABLE hareketler ADD COLUMN miktar REAL DEFAULT 0").run()
    }
    if (!hareketlerInfo.some(col => col.name === 'birim_fiyat')) {
      console.log('Adding birim_fiyat column to hareketler table...')
      db.prepare("ALTER TABLE hareketler ADD COLUMN birim_fiyat REAL DEFAULT 0").run()
    }

    // Cariler tablosuna tip sütunu ekle
    const carilerInfo = db.prepare("PRAGMA table_info(cariler)").all() as { name: string }[]
    if (!carilerInfo.some(col => col.name === 'tip')) {
      console.log('Adding tip column to cariler table...')
      db.prepare("ALTER TABLE cariler ADD COLUMN tip TEXT DEFAULT 'DIGER'").run()
    }
  } catch (error) {
    console.error('Schema migration error:', error)
  }

  console.log('Database tables created successfully')
}

// Demo verileri ekle
const insertDemoData = (): void => {
  if (!db) return

  // Demo kullanıcı - Sistem erişimi için gerekli
  db.prepare(`
    INSERT OR IGNORE INTO kullanicilar (id, kullanici_adi, sifre, ad_soyad, rol)
    VALUES ('u1', 'admin', 'admin', 'Sistem Yöneticisi', 'admin')
  `).run()

  console.log('System check completed (Admin user confirmed)')
}

// Veritabanını kapat
export const closeDatabase = (): void => {
  if (db) {
    db.close()
    db = null
    console.log('Database closed')
  }
}

// Veritabanı nesnesini al
export const getDatabase = (): Database.Database | null => db

export default { initDatabase, closeDatabase, getDatabase }
