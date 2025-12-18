import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  User,
  Loader2,
  X,
  ShoppingCart,
  Wallet,
  Trash2,
  FileText,
  Printer
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

// Tipler
interface CariSimple {
  id: string
  unvan: string
  kod: string
  bakiye: number
  bakiye_turu: string
  tip?: string
}

interface EkstreSatir {
  id: string
  tarih: string
  aciklama: string
  parti_no?: string
  miktar?: number
  birim_fiyat?: number
  borc: number
  alacak: number
  bakiye: number
  bakiye_turu: string
  islem_tipi: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const SatisFirmalari: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // State
  const [cariler, setCariler] = useState<CariSimple[]>([])
  const [selectedCariId, setSelectedCariId] = useState<string>('')
  const [ekstre, setEkstre] = useState<EkstreSatir[]>([])
  const [loading, setLoading] = useState(true)
  const [cariSearch, setCariSearch] = useState('')
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'NONE' | 'MAL' | 'FINANS' | 'RAPOR'>('NONE')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Rapor Filtreleri
  const [reportStartDate, setReportStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('tr-TR')
  )
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toLocaleDateString('tr-TR')
  )
  
  // Mal İşlemi Form - SADECE SATIŞ (Mal Çıkışı/Müşteriye)
  const [malForm, setMalForm] = useState({
    tip: 'SATIS', // Sadece SATIS (Borçlandır)
    tarih: new Date().toLocaleDateString('tr-TR'),
    partiNo: '',
    urunAdi: '',
    miktar: '',

    // birimFiyat: '', (YENİ: Tutar manuel girilecek)
    tutar: ''
  })
  
  // Finansal İşlem Form - SADECE TAHSİLAT (Müşteriden Para Al)
  const [finansForm, setFinansForm] = useState({
    tip: 'TAHSILAT', // Sadece TAHSILAT (Alacaklandır)
    tarih: new Date().toLocaleDateString('tr-TR'),
    odemeTuru: 'NAKIT' as 'NAKIT' | 'HAVALE' | 'CEK' | 'SENET',
    tutar: '',
    aciklama: '',
    // Çek/Senet Detayları
    belgeNo: '',
    vadeTarihi: new Date().toLocaleDateString('tr-TR'),
    banka: ''
  })

  // Veri yükleme
  useEffect(() => {
    loadCariler()
  }, [])

  useEffect(() => {
    if (location.state?.cariId) {
      setSelectedCariId(location.state.cariId)
    }
  }, [location.state])

  useEffect(() => {
    if (selectedCariId) {
      loadEkstre(selectedCariId)
    } else {
      setEkstre([])
    }
  }, [selectedCariId])

  const loadCariler = async () => {
    try {
      const data = await window.db.getCariler()
      // SADECE FİRMA OLANLARI FİLTRELE
      // Not: 'DIGER' tiplerini de dahil edebiliriz veya sadece 'FIRMA'. Kullanıcı "Satış Firmaları" dedi.
      const filtered = data
        .filter(c => c.tip === 'FIRMA' || c.tip === 'DIGER')
        .map(c => ({ 
          id: c.id, 
          unvan: c.unvan, 
          kod: c.kod,
          bakiye: c.bakiye,
          bakiye_turu: c.bakiye_turu,
          tip: c.tip
        }))
      setCariler(filtered)
    } catch (error) {
      console.error('Cariler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEkstre = async (cariId: string) => {
    setLoading(true)
    try {
      const data = await window.db.getHareketler(cariId)
      setEkstre(data)
    } catch (error) {
      console.error('Ekstre yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  // Hesaplanan tutar (Mal işlemi için)
  // Hesaplanan tutar (Mal işlemi için) - ARTIK MANUEL
  const hesaplananMalTutar = useMemo(() => {
    return parseFloat(malForm.tutar) || 0
  }, [malForm.tutar])

  // Birim Fiyat (Otomatik Hesapla: Tutar / Miktar)
  const hesaplananBirimFiyat = useMemo(() => {
    const miktar = parseFloat(malForm.miktar) || 0
    const tutar = parseFloat(malForm.tutar) || 0
    if (miktar > 0) return tutar / miktar
    return 0
  }, [malForm.miktar, malForm.tutar])

   const handleMalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCariId || hesaplananMalTutar <= 0) {
      alert('Lütfen geçerli bilgiler girin')
      return
    }

    setIsSubmitting(true)
    try {
      await window.db.addHareket({
        cariId: selectedCariId,
        tarih: malForm.tarih,
        aciklama: (malForm.partiNo ? `${malForm.partiNo}${malForm.urunAdi ? `-${malForm.urunAdi}` : ''}` : (malForm.urunAdi || 'Mal Satışı')),
        partiNo: malForm.partiNo,
        miktar: parseFloat(malForm.miktar) || 0,
        birimFiyat: hesaplananBirimFiyat,
        // SATIS -> Borçlandır (Müşteri Borcu Artar)
        borc: hesaplananMalTutar, 
        alacak: 0, 
        islemTipi: 'SATIS'
      })
      
      // Reset Form
      setMalForm({
        tip: 'SATIS',
        tarih: new Date().toLocaleDateString('tr-TR'),
        partiNo: '',
        urunAdi: '',
        miktar: '',
        tutar: ''
      })
      
      setActiveModal('NONE')
      loadEkstre(selectedCariId)
      loadCariler()
    } catch (error) {
      console.error('Hata:', error)
      alert('İşlem kaydedilemedi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinansSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(finansForm.tutar)
    if (!selectedCariId || !amount || amount <= 0) {
      alert('Lütfen geçerli bir tutar girin')
      return
    }

    setIsSubmitting(true)
    try {
      // SADECE TAHSILAT
      // Açıklama oluştur
      let desc = finansForm.aciklama || finansForm.odemeTuru
      if (finansForm.odemeTuru === 'CEK' || finansForm.odemeTuru === 'SENET') {
        desc += ` - ${finansForm.belgeNo}`
      }

      await window.db.addHareket({
        cariId: selectedCariId,
        tarih: finansForm.tarih,
        aciklama: desc,
        // TAHSILAT -> Alacaklandır (Borç Düşer)
        borc:  0, 
        alacak: amount,
        islemTipi: 'TAHSILAT',
        // Entegrasyon
        odemeTuru: finansForm.odemeTuru,
        belgeNo: finansForm.belgeNo,
        vadeTarihi: finansForm.vadeTarihi,
        banka: finansForm.banka
      })
      
      // Reset Form
      setFinansForm({
        tip: 'TAHSILAT',
        tarih: new Date().toLocaleDateString('tr-TR'),
        odemeTuru: 'NAKIT',
        tutar: '',
        aciklama: '',
        belgeNo: '',
        vadeTarihi: new Date().toLocaleDateString('tr-TR'),
        banka: ''
      })
      
      setActiveModal('NONE')
      loadEkstre(selectedCariId)
      loadCariler()
    } catch (error) {
      console.error('Hata:', error)
      alert('İşlem kaydedilemedi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hareketi silmek istediğinize emin misiniz? Bakiye güncellenecektir.')) return
    
    try {
      const result = await window.db.deleteHareket(id)
      if (result) {
        loadEkstre(selectedCariId)
        loadCariler()
      } else {
        alert('Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Silme hatası:', error)
    }
  }

  const filteredCariler = useMemo(() => {
    return cariler.filter(c => 
      (c.unvan || '').toLocaleLowerCase('tr-TR').includes(cariSearch.toLocaleLowerCase('tr-TR')) || 
      (c.kod || '').toLocaleLowerCase('tr-TR').includes(cariSearch.toLocaleLowerCase('tr-TR'))
    )
  }, [cariler, cariSearch])

  const selectedCari = cariler.find(c => c.id === selectedCariId)

  // Toplamlar
  const toplamBorc = ekstre.reduce((sum, row) => sum + row.borc, 0)
  const toplamAlacak = ekstre.reduce((sum, row) => sum + row.alacak, 0)

  // Parti Raporu Oluştur (Satış Firması için anlamlı mı? Evet, ne kadar sattık)
  const partiRaporu = useMemo(() => {
    const map = new Map<string, {
      parti: string, 
      urun: string, 
      alisMiktar: number, 
      satisMiktar: number, 
      alisTutar: number, 
      satisTutar: number 
    }>()

    // Tarih formatını parse et (DD.MM.YYYY -> Date)
    const parseDate = (dateStr: string) => {
      const parts = dateStr.split('.')
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      }
      return new Date(0)
    }

    const start = parseDate(reportStartDate)
    const end = parseDate(reportEndDate)
    end.setHours(23, 59, 59, 999)

    ekstre.forEach(row => {
      if (!row.parti_no) return

      // Tarih Filtresi
      const rowDate = parseDate(row.tarih)
      if (rowDate < start || rowDate > end) return
      
      if (!map.has(row.parti_no)) {
        map.set(row.parti_no, { 
          parti: row.parti_no, 
          urun: row.aciklama.split('-').pop()?.trim() || 'Bilinmeyen', 
          alisMiktar: 0, 
          satisMiktar: 0, 
          alisTutar: 0, 
          satisTutar: 0 
        })
      }
      
      const item = map.get(row.parti_no)!
      // Alacak (Tahsilat veya İade Alış)
      // Borç (Satış)
      if (row.alacak > 0 && row.miktar) {
         // Müşteriden mal geri gelirse? Veya sadece tahsilat.
         // Burada raporlama mantığı Parti bazlı.
         // Genelde Müşteriye SATIŞ yaparız (Borç).
         // Müşteriden ALIS yapmayız normalde (İade hariç).
         // Basit tutalım:
         item.alisMiktar += row.miktar // Bu raporda Müşteri için "Alış" bizim "İade almamız" olabilir ama kafa karıştırmayalım
         item.alisTutar += row.alacak
      }
      if (row.borc > 0 && row.miktar) {
        item.satisMiktar += row.miktar
        item.satisTutar += row.borc
      }
    })
    
    return Array.from(map.values())
  }, [ekstre, reportStartDate, reportEndDate])

  // Tahsilat Toplamı (Rapor Tarih Aralığı)
  const raporTahsilatToplam = useMemo(() => {
    // Tarih formatını parse et (DD.MM.YYYY -> Date)
    const parseDate = (dateStr: string) => {
      const parts = dateStr.split('.')
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      }
      return new Date(0)
    }

    const start = parseDate(reportStartDate)
    const end = parseDate(reportEndDate)
    end.setHours(23, 59, 59, 999)

    return ekstre.reduce((sum, row) => {
      // Sadece TAHSILAT işlemleri (Alacak > 0 ve islem_tipi TAHSILAT veya miktar yoksa)
      // Satış Firmasında Alacak = Tahsilat (genellikle, iade değilse)
      // Güvenli kontrol: row.alacak > 0
      const rowDate = parseDate(row.tarih)
      if (rowDate >= start && rowDate <= end) {
         return sum + row.alacak
      }
      return sum
    }, 0)
  }, [ekstre, reportStartDate, reportEndDate])

  // Excel Export
  const handleExportExcel = async () => {
    if (partiRaporu.length === 0) return

    const data = partiRaporu.map(item => ({
       'Parti No': item.parti,
       'Ürün Adı': item.urun,
       'Miktar': item.satisMiktar,
       'Tutar': item.satisTutar
    }))

    await window.db.exportDataToExcel(data, `${selectedCari?.unvan || 'Rapor'}_PartiRaporu.xlsx`)
  }

  const inputStyle = {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-default)',
    color: 'var(--text-primary)',
    fontSize: 13
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Satış Firmaları</h1>
          <p>Müşteri takibi ve tahsilat işlemleri</p>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', gap: 20, padding: 20, height: 'calc(100vh - 85px)', overflow: 'hidden' }}>
        
        {/* SOL PANEL - LİSTE */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)' }}>
            <div className="search-box" style={{ width: '100%' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Firma Ara..." 
                value={cariSearch}
                onChange={e => setCariSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && cariler.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
            ) : filteredCariler.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 13 }}>Sonuç yok</div>
            ) : filteredCariler.map(cari => (
              <div
                key={cari.id}
                onClick={() => setSelectedCariId(cari.id)}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  background: selectedCariId === cari.id ? 'var(--bg-card-hover)' : 'transparent',
                  borderLeft: selectedCariId === cari.id ? '3px solid var(--accent-primary)' : '3px solid transparent'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{cari.unvan}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 10, background: '#3b82f6', color: 'white', padding: '1px 5px', borderRadius: 4 }}>F</span>
                    <span>{cari.kod}</span>
                  </div>
                  {/* A = Cari bize borçlu (bizim alacağımız, yeşil), B = Biz cariye borçluyuz (bizim borcumuz, kırmızı) */}
                  <span style={{ color: cari.bakiye_turu === 'A' ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                    {formatCurrency(cari.bakiye)} {cari.bakiye_turu}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ padding: 10, borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: 13 }} onClick={() => navigate('/cariler')}>
              <Plus size={14} /> Yeni Cari
            </button>
          </div>
        </div>

        {/* SAĞ PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
          {selectedCariId ? (
            <>
              {/* HEADER ACTION BAR */}
              <div style={{ 
                background: 'var(--bg-card)', 
                padding: 16, 
                borderRadius: 8, 
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{selectedCari?.unvan}</h2>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selectedCari?.kod}</span>
                </div>
                
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => setActiveModal('MAL')}
                    className="btn btn-primary"
                    style={{ background: '#ef4444', border: 'none', display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <ShoppingCart size={16} /> Mal Satış
                  </button>
                  <button 
                    onClick={() => setActiveModal('FINANS')}
                    className="btn btn-primary"
                    style={{ background: '#10b981', border: 'none', display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <Wallet size={16} /> Tahsilat Al
                  </button>
                  <button 
                    onClick={() => setActiveModal('RAPOR')}
                    className="btn btn-secondary"
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <FileText size={16} /> Rapor
                  </button>
                </div>
                
                <div style={{ textAlign: 'right', padding: '8px 16px', background: selectedCari?.bakiye_turu === 'A' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>
                  {/* Satış Firması için Bakiye A ise = Cari bize borçlu = Alacağımız var (Yeşil) */}
                  {/* Bakiye B ise = Biz cariye borçluyuz = Fazla ödeme yapmışız (Kırmızı) */}
                  <div style={{ fontSize: 18, fontWeight: 700, color: selectedCari?.bakiye_turu === 'A' ? '#10b981' : '#ef4444' }}>
                    {formatCurrency(selectedCari?.bakiye || 0)} {selectedCari?.bakiye_turu}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                     Güncel Bakiye
                  </div>
                </div>
              </div>

              {/* TABLO */}
              <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table className="data-table">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ width: 100 }}>Tarih</th>
                        <th>Açıklama</th>
                        <th style={{ width: 80 }}>Parti</th>
                        <th style={{ width: 80 }}>Miktar</th>
                        <th style={{ width: 80 }}>Fiyat</th>
                        <th style={{ textAlign: 'right', width: 110 }}>Borç (Satış)</th>
                        <th style={{ textAlign: 'right', width: 110 }}>Alacak (Tahsilat)</th>
                        <th style={{ textAlign: 'right', width: 120 }}>Bakiye</th>
                        <th style={{ width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ekstre.map((row) => (
                        <tr key={row.id}>
                          <td>{row.tarih}</td>
                          <td>{row.aciklama}</td>
                          <td>{row.parti_no || '-'}</td>
                          <td>{row.miktar ? `${row.miktar} KG` : '-'}</td>
                          <td>{row.birim_fiyat ? formatCurrency(row.birim_fiyat) : '-'}</td>
                          <td style={{ textAlign: 'right', color: row.borc > 0 ? '#ef4444' : 'inherit' }}>
                            {row.borc > 0 ? formatCurrency(row.borc) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', color: row.alacak > 0 ? '#10b981' : 'inherit' }}>
                            {row.alacak > 0 ? formatCurrency(row.alacak) : '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(row.bakiye)} {row.bakiye_turu}
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDelete(row.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', opacity: 0.6 }}
                              title="Kaydı Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* FOOTER */}
                <div style={{ padding: 12, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 30, background: 'var(--bg-secondary)', fontSize: 13 }}>
                  <div>Toplam Satış: <span style={{ fontWeight: 600, color: '#ef4444' }}>{formatCurrency(toplamBorc)}</span></div>
                  <div>Toplam Tahsilat: <span style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(toplamAlacak)}</span></div>
                </div>
              </div>
            </>
          ) : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
               <div style={{ textAlign: 'center' }}>
                 <User size={64} style={{ opacity: 0.2 }} />
                 <p>Firma seçiniz</p>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* MODAL - MAL İŞLEMİ (SATIŞ) */}
      {activeModal === 'MAL' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 450 }}>
            <div className="modal-header">
              <h3>Mal Satış İşlemi</h3>
              <button onClick={() => setActiveModal('NONE')}><X size={18} /></button>
            </div>
            <form onSubmit={handleMalSubmit} className="modal-body">
              <div style={{ 
                marginBottom: 20, 
                padding: 12, 
                borderRadius: 8, 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#ef4444', 
                fontWeight: 600, 
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                📤 Mal Satışı (Müşteri Borçlanır)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Tarih</label>
                  <input type="text" value={malForm.tarih} onChange={e => setMalForm(p => ({ ...p, tarih: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Parti No</label>
                  <input type="text" value={malForm.partiNo} onChange={e => setMalForm(p => ({ ...p, partiNo: e.target.value }))} style={inputStyle} placeholder="Örn: S1" />
                </div>
              </div>
               <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Ürün Adı <span style={{opacity: 0.5, fontSize: 11}}>(Opsiyonel)</span></label>
                <input type="text" value={malForm.urunAdi} onChange={e => setMalForm(p => ({ ...p, urunAdi: e.target.value }))} style={inputStyle} placeholder="Boş bırakılabilir" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Miktar (KG) <span style={{opacity: 0.5, fontSize: 11}}>(Opsiyonel)</span></label>
                  <input type="number" step="0.01" value={malForm.miktar} onChange={e => setMalForm(p => ({ ...p, miktar: e.target.value }))} style={inputStyle} placeholder="Boş bırakılabilir" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Toplam Tutar (TL)</label>
                  <input type="number" step="0.01" value={malForm.tutar} onChange={e => setMalForm(p => ({ ...p, tutar: e.target.value }))} style={inputStyle} placeholder="Manuel giriniz" />
                </div>
              </div>
              
              <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Toplam Tutar:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(hesaplananMalTutar)} ₺</span>
                 </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Kaydediliyor...' : 'Satışı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - FİNANSAL İŞLEM (TAHSİLAT) */}
      {activeModal === 'FINANS' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 450 }}>
            <div className="modal-header">
              <h3>Tahsilat Al</h3>
              <button onClick={() => setActiveModal('NONE')}><X size={18} /></button>
            </div>
            <form onSubmit={handleFinansSubmit} className="modal-body">
              <div style={{ 
                marginBottom: 20, 
                padding: 12, 
                borderRadius: 8, 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#10b981', 
                fontWeight: 600, 
                textAlign: 'center',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                💰 Tahsilat Al (Kasa Girişi)
              </div>

              <div style={{ marginBottom: 16 }}>
                 <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Ödeme Yöntemi</label>
                 <select 
                    value={finansForm.odemeTuru} 
                    onChange={e => setFinansForm(p => ({ ...p, odemeTuru: e.target.value as any }))}
                    style={inputStyle}
                 >
                   <option value="NAKIT" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>NAKİT</option>
                   <option value="HAVALE" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>HAVALE</option>
                   <option value="CEK" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>ÇEK</option>
                   <option value="SENET" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>SENET</option>
                 </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Tarih</label>
                  <input type="text" value={finansForm.tarih} onChange={e => setFinansForm(p => ({ ...p, tarih: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Tutar</label>
                  <input type="number" step="0.01" value={finansForm.tutar} onChange={e => setFinansForm(p => ({ ...p, tutar: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {(finansForm.odemeTuru === 'CEK' || finansForm.odemeTuru === 'SENET') && (
                <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16, border: '1px solid var(--border-color)' }}>
                    <h5 style={{ marginBottom: 10, fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Belge Detayları</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Belge No</label>
                            <input type="text" value={finansForm.belgeNo} onChange={e => setFinansForm(p => ({ ...p, belgeNo: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Vade Tarihi</label>
                            <input type="text" value={finansForm.vadeTarihi} onChange={e => setFinansForm(p => ({ ...p, vadeTarihi: e.target.value }))} style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Banka / Şube</label>
                        <input type="text" value={finansForm.banka} onChange={e => setFinansForm(p => ({ ...p, banka: e.target.value }))} style={inputStyle} />
                    </div>
                </div>
              )}
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Açıklama</label>
                <input type="text" value={finansForm.aciklama} onChange={e => setFinansForm(p => ({ ...p, aciklama: e.target.value }))} style={inputStyle} placeholder="İsteğe bağlı açıklama..." />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                   {isSubmitting ? 'Kaydediliyor...' : 'Tahsilatı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* MODAL - RAPOR - Same as Mustahsil, just different content */}
      {activeModal === 'RAPOR' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 900 }}>
             <div className="modal-header">
               <h3>Parti Bazlı Rapor ({selectedCari?.unvan})</h3>
               <button onClick={() => setActiveModal('NONE')} className="no-print"><X size={18} /></button>
             </div>
             
             <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-default)', display: 'flex', gap: 12, alignItems: 'center' }} className="print-filter-header">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                   <label style={{ fontSize: 13 }}>Başlangıç:</label>
                   <input 
                     type="text" 
                     value={reportStartDate} 
                     onChange={e => setReportStartDate(e.target.value)}
                     style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border-color)', width: 100, fontSize: 13 }}
                     placeholder="GG.AA.YYYY"
                   />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                   <label style={{ fontSize: 13 }}>Bitiş:</label>
                   <input 
                     type="text" 
                     value={reportEndDate} 
                     onChange={e => setReportEndDate(e.target.value)}
                     style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border-color)', width: 100, fontSize: 13 }}
                     placeholder="GG.AA.YYYY"
                   />
                </div>
                <div style={{ flex: 1 }}></div>
                <button 
                  onClick={() => window.print()}
                  className="btn btn-primary no-print"
                  title="Yazdır"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', marginRight: 8 }}
                >
                  <Printer size={16} />
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="btn btn-secondary no-print"
                  style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}
                >
                  <FileText size={14} /> Excel
                </button>
             </div>

             <div className="modal-body" style={{ padding: 0 }}>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead style={{ position: 'sticky', top: 0 }}>
                      <tr>
                        <th>Parti</th>
                        <th>Ürün</th>
                        <th style={{ textAlign: 'right' }}>Miktar (KG)</th>
                        <th style={{ textAlign: 'right' }}>Satış Tutar (TL)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partiRaporu.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: '#999' }}>Bu aralıkta veri yok</td></tr>
                      ) : (
                        partiRaporu.map((row, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{row.parti}</td>
                            <td>{row.urun}</td>
                            <td style={{ textAlign: 'right' }}>{row.satisMiktar}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(row.satisTutar)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot style={{ position: 'sticky', bottom: 0, background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', padding: 12 }}>Toplam Satış:</td>
                        <td style={{ textAlign: 'right', padding: 12, color: '#ef4444' }}>
                          {formatCurrency(partiRaporu.reduce((s, r) => s + r.satisTutar, 0))} ₺
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', padding: 12 }}>Toplam Tahsilat:</td>
                        <td style={{ textAlign: 'right', padding: 12, color: '#10b981' }}>
                          {formatCurrency(raporTahsilatToplam)} ₺
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'right', padding: 12 }}>Fark (Kalan):</td>
                        <td style={{ textAlign: 'right', padding: 12 }}>
                          {formatCurrency(partiRaporu.reduce((s, r) => s + r.satisTutar, 0) - raporTahsilatToplam)} ₺
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SatisFirmalari
