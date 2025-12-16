import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Veritabanı dosya yolu
const getDbPath = (): string => {
  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')
  
  // data klasörü yoksa oluştur
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }
  
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
      borc REAL DEFAULT 0,
      alacak REAL DEFAULT 0,
      bakiye REAL DEFAULT 0,
      bakiye_turu TEXT DEFAULT 'A',
      islem_tipi TEXT,
      olusturma_tarihi TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cari_id) REFERENCES cariler(id) ON DELETE CASCADE
    )
  `)

  // Faturalar tablosu
  db.exec(`
    CREATE TABLE IF NOT EXISTS faturalar (
      id TEXT PRIMARY KEY,
      cari_id TEXT NOT NULL,
      fatura_no TEXT UNIQUE,
      tarih TEXT NOT NULL,
      toplam REAL DEFAULT 0,
      kdv REAL DEFAULT 0,
      genel_toplam REAL DEFAULT 0,
      fatura_tipi TEXT DEFAULT 'SATIS',
      aciklama TEXT,
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

  console.log('Database tables created successfully')
}

// Demo verileri ekle
const insertDemoData = (): void => {
  if (!db) return

  // Zaten veri var mı kontrol et
  const count = db.prepare('SELECT COUNT(*) as count FROM cariler').get() as { count: number }
  if (count.count > 0) {
    console.log('Demo data already exists, skipping...')
    return
  }

  console.log('Inserting demo data...')

  // Demo cariler
  const insertCari = db.prepare(`
    INSERT INTO cariler (id, kod, unvan, yetkili, telefon, adres, vergi_dairesi, vergi_no, bakiye, bakiye_turu)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const demoCariler = [
    ['0392', '0392', 'ALİ ALTIN-AKSU', 'Ali Altın', '0532 123 4567', 'Antalya Hali', 'Antalya', '1234567890', 1170720, 'A'],
    ['0245', '0245', 'MEHMET YILMAZ TİCARET', 'Mehmet Yılmaz', '0533 234 5678', 'İstanbul Hali', 'Kadıköy', '9876543210', 450000, 'B'],
    ['0567', '0567', 'ÖZGÜR KARATAŞ', 'Özgür Karataş', '0534 345 6789', 'Ankara Hali', 'Çankaya', '5678901234', 892500, 'A'],
    ['0123', '0123', 'AHMET DEMİR GIDA', 'Ahmet Demir', '0535 456 7890', 'İzmir Hali', 'Konak', '3456789012', 325000, 'A'],
    ['0789', '0789', 'FATMA KAYA MÜSTAHSİL', 'Fatma Kaya', '0536 567 8901', 'Bursa Hali', 'Nilüfer', '7890123456', 178500, 'B'],
    ['0456', '0456', 'KEMAL ÖZTÜRK TİCARET', 'Kemal Öztürk', '0537 678 9012', 'Konya Hali', 'Selçuklu', '2345678901', 567000, 'A'],
    ['0234', '0234', 'AYŞE YILDIZ SEBZE', 'Ayşe Yıldız', '0538 789 0123', 'Adana Hali', 'Seyhan', '4567890123', 234500, 'B'],
    ['0678', '0678', 'MUSTAFA ŞAHİN NAKLİYE', 'Mustafa Şahin', '0539 890 1234', 'Mersin Hali', 'Akdeniz', '6789012345', 445000, 'A'],
  ]

  const insertCariler = db.transaction(() => {
    for (const cari of demoCariler) {
      insertCari.run(...cari)
    }
  })
  insertCariler()

  // Demo hareketler
  const insertHareket = db.prepare(`
    INSERT INTO hareketler (id, cari_id, tarih, aciklama, borc, alacak, bakiye, bakiye_turu, islem_tipi)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const demoHareketler = [
    ['h1', '0392', '03.12.2025', '17/03/2026-0036369-KUVEYT ÇEK', 100000, 0, 1170720, 'A', 'CEK'],
    ['h2', '0392', '03.12.2025', 'S26-SER', 0, 78875, 1270720, 'A', 'FATURA'],
    ['h3', '0392', '29.11.2025', 'HAVALE', 200000, 0, 1191845, 'A', 'HAVALE'],
    ['h4', '0392', '29.11.2025', 'S24-SER', 0, 231675, 1168110, 'A', 'FATURA'],
    ['h5', '0392', '29.11.2025', 'S23-SER', 0, 268890, 936435, 'A', 'FATURA'],
    ['h6', '0392', '28.11.2025', 'S22-SER', 0, 195000, 667545, 'A', 'FATURA'],
    ['h7', '0392', '27.11.2025', 'HAVALE-ÖZGÜR KARATAŞ', 400000, 0, 472545, 'A', 'HAVALE'],
    ['h8', '0392', '26.11.2025', 'S21-SER', 0, 312500, 872545, 'A', 'FATURA'],
    ['h9', '0245', '25.11.2025', 'S20-SER', 0, 189750, 560045, 'A', 'FATURA'],
    ['h10', '0567', '24.11.2025', '15/02/2026-TEB ÇEK', 150000, 0, 370295, 'A', 'CEK'],
  ]

  const insertHareketler = db.transaction(() => {
    for (const hareket of demoHareketler) {
      insertHareket.run(...hareket)
    }
  })
  insertHareketler()

  // Demo kullanıcı
  db.prepare(`
    INSERT OR IGNORE INTO kullanicilar (id, kullanici_adi, sifre, ad_soyad, rol)
    VALUES ('u1', 'admin', 'admin', 'Sistem Yöneticisi', 'admin')
  `).run()

  console.log('Demo data inserted successfully')
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
