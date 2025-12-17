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

} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

const Mustahsil: React.FC = () => {
  const navigate = useNavigate()
  
  // State
  const [cariler, setCariler] = useState<CariSimple[]>([])
  const [selectedCariId, setSelectedCariId] = useState<string>('')
  const [ekstre, setEkstre] = useState<EkstreSatir[]>([])
  const [loading, setLoading] = useState(true)
  const [cariSearch, setCariSearch] = useState('')
  
  // Modal State
  const [activeModal, setActiveModal] = useState<'NONE' | 'MAL' | 'FINANS' | 'RAPOR'>('NONE')

  // Rapor Filtreleri
  const [reportStartDate, setReportStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('tr-TR')
  )
  const [reportEndDate, setReportEndDate] = useState(
    new Date().toLocaleDateString('tr-TR')
  )
  
  // Mal İşlemi Form
  const [malForm, setMalForm] = useState({
    tip: 'SATIS', // SATIS (Borçlandır) veya ALIS (Alacaklandır)
    tarih: new Date().toLocaleDateString('tr-TR'),
    partiNo: '',
    urunAdi: '',
    miktar: '',

    birimFiyat: '',
    // Kesintiler
    stopajOran: 2,
    bagkurOran: 0,
    borsaOran: 0,
    digerKesinti: 0
  })
  
  // Finansal İşlem Form
  const [finansForm, setFinansForm] = useState({
    tip: 'TAHSILAT', // TAHSILAT (Alacaklandır) veya ODEME (Borçlandır)
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
    if (selectedCariId) {
      loadEkstre(selectedCariId)
    } else {
      setEkstre([])
    }
  }, [selectedCariId])

  const loadCariler = async () => {
    try {
      const data = await window.db.getCariler()
      setCariler(data.map(c => ({ 
        id: c.id, 
        unvan: c.unvan, 
        kod: c.kod,
        bakiye: c.bakiye,

        bakiye_turu: c.bakiye_turu,
        tip: c.tip
      })))
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
  const hesaplananMalTutar = useMemo(() => {
    const miktar = parseFloat(malForm.miktar) || 0
    const birimFiyat = parseFloat(malForm.birimFiyat) || 0
    return miktar * birimFiyat
  }, [malForm.miktar, malForm.birimFiyat])

  const handleMalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCariId || !malForm.urunAdi || hesaplananMalTutar <= 0) {
      alert('Lütfen geçerli bilgiler girin')
      return

    }

    try {
      const isAlis = malForm.tip === 'ALIS'
      // Kesinti Hesabı
      let netAlacak = hesaplananMalTutar
      let kesintiAciklama = ''
      
      const cari = cariler.find(c => c.id === selectedCariId)
      
      if (isAlis && cari?.tip === 'MUSTAHSIL') {
         const stopaj = hesaplananMalTutar * (malForm.stopajOran / 100)
         const bagkur = hesaplananMalTutar * (malForm.bagkurOran / 100)
         const borsa = hesaplananMalTutar * (malForm.borsaOran / 100)
         const diger = parseFloat(malForm.digerKesinti as any) || 0
         
         const toplamKesinti = stopaj + bagkur + borsa + diger
         netAlacak = hesaplananMalTutar - toplamKesinti
         
         kesintiAciklama = ` (Kesinti: ${formatCurrency(toplamKesinti)})`
      }

      await window.db.addHareket({
        cariId: selectedCariId,
        tarih: malForm.tarih,
        aciklama: (malForm.partiNo ? `${malForm.partiNo}-${malForm.urunAdi}` : malForm.urunAdi) + kesintiAciklama,
        partiNo: malForm.partiNo,
        miktar: parseFloat(malForm.miktar),
        birimFiyat: parseFloat(malForm.birimFiyat),
        // ALIS -> Alacaklandır (Tedarikçi Alacağı Artar) ama NET tutar kadar
        borc: isAlis ? 0 : hesaplananMalTutar, 
        alacak: isAlis ? netAlacak : 0, 
        islemTipi: isAlis ? 'ALIS' : 'SATIS'
      })
      
      setActiveModal('NONE')
      loadEkstre(selectedCariId)
      loadCariler()
    } catch (error) {
      console.error('Hata:', error)
      alert('İşlem kaydedilemedi')
    }
  }

  const handleFinansSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(finansForm.tutar)
    if (!selectedCariId || !amount || amount <= 0) {
      alert('Lütfen geçerli bir tutar girin')
      return
    }

    try {
      const isTahsilat = finansForm.tip === 'TAHSILAT'
      // Açıklama oluştur
      let desc = finansForm.aciklama || finansForm.odemeTuru
      if (finansForm.odemeTuru === 'CEK' || finansForm.odemeTuru === 'SENET') {
        desc += ` - ${finansForm.belgeNo}`
      }

      await window.db.addHareket({
        cariId: selectedCariId,
        tarih: finansForm.tarih,
        aciklama: desc,
        // TAHSILAT -> Alacaklandır (Borç Düşer), ODEME -> Borçlandır (Alacak Düşer)
        borc:  isTahsilat ? 0 : amount, 
        alacak: isTahsilat ? amount : 0,
        islemTipi: isTahsilat ? 'TAHSILAT' : 'ODEME',
        // Entegrasyon
        odemeTuru: finansForm.odemeTuru,
        belgeNo: finansForm.belgeNo,
        vadeTarihi: finansForm.vadeTarihi,
        banka: finansForm.banka
      })
      
      setActiveModal('NONE')
      loadEkstre(selectedCariId)
      loadCariler()
    } catch (error) {
      console.error('Hata:', error)
      alert('İşlem kaydedilemedi')
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

  // Parti Raporu Oluştur
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
      // Alacak (Mal Alışı/Girişi) -> Alış
      // Borç (Mal Satışı/Çıkışı) -> Satış
      if (row.alacak > 0 && row.miktar) {
        item.alisMiktar += row.miktar
        item.alisTutar += row.alacak
      }
      if (row.borc > 0 && row.miktar) {
        item.satisMiktar += row.miktar
        item.satisTutar += row.borc
      }
    })
    
    return Array.from(map.values())
  }, [ekstre, reportStartDate, reportEndDate])

  // Excel Export
  const handleExportExcel = async () => {
    if (partiRaporu.length === 0) return

    const data = partiRaporu.map(item => ({
       'Parti No': item.parti,
       'Ürün Adı': item.urun,
       'Alış Miktarı': item.alisMiktar,
       'Alış Tutarı': item.alisTutar,
       'Satış Miktarı': item.satisMiktar,
       'Satış Tutarı': item.satisTutar,
       'Fark (Net)': item.satisTutar - item.alisTutar
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
          <h1>Cari Defteri</h1>
          <p>Komisyon işlemleri ve cari takibi</p>
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
                placeholder="Cari Ara..." 
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
                    {cari.tip === 'MUSTAHSIL' && <span title="Müstahsil" style={{ fontSize: 10, background: '#10b981', color: 'white', padding: '1px 5px', borderRadius: 4 }}>M</span>}
                    {cari.tip === 'FIRMA' && <span title="Firma" style={{ fontSize: 10, background: '#3b82f6', color: 'white', padding: '1px 5px', borderRadius: 4 }}>F</span>}
                    <span>{cari.kod}</span>
                  </div>
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
                    style={{ background: '#3b82f6', border: 'none', display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <ShoppingCart size={16} /> Mal İşlemi
                  </button>
                  <button 
                    onClick={() => setActiveModal('FINANS')}
                    className="btn btn-primary"
                    style={{ background: '#8b5cf6', border: 'none', display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <Wallet size={16} /> Finansal İşlem
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
                  <div style={{ fontSize: 18, fontWeight: 700, color: selectedCari?.bakiye_turu === 'A' ? '#10b981' : '#ef4444' }}>
                    {formatCurrency(selectedCari?.bakiye || 0)} {selectedCari?.bakiye_turu}
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
                        <th style={{ textAlign: 'right', width: 110 }}>Borç</th>
                        <th style={{ textAlign: 'right', width: 110 }}>Alacak</th>
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
                  <div>Toplam Borç: <span style={{ fontWeight: 600, color: '#ef4444' }}>{formatCurrency(toplamBorc)}</span></div>
                  <div>Toplam Alacak: <span style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(toplamAlacak)}</span></div>
                </div>
              </div>
            </>
          ) : (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
               <div style={{ textAlign: 'center' }}>
                 <User size={64} style={{ opacity: 0.2 }} />
                 <p>Cari seçiniz</p>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* MODAL - MAL İŞLEMİ */}
      {activeModal === 'MAL' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 450 }}>
            <div className="modal-header">
              <h3>Mal İşlemi</h3>
              <button onClick={() => setActiveModal('NONE')}><X size={18} /></button>
            </div>
            <form onSubmit={handleMalSubmit} className="modal-body">
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setMalForm(p => ({ ...p, tip: 'SATIS' }))}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: malForm.tip === 'SATIS' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                    background: malForm.tip === 'SATIS' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-default)',
                    color: malForm.tip === 'SATIS' ? '#ef4444' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📤 Mal Satışı (Borçlandır)
                </button>
                <button
                  type="button"
                  onClick={() => setMalForm(p => ({ ...p, tip: 'ALIS' }))}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: malForm.tip === 'ALIS' ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: malForm.tip === 'ALIS' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-default)',
                    color: malForm.tip === 'ALIS' ? '#10b981' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📥 Mal Alışı (Alacaklandır)
                </button>
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
                <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Ürün Adı</label>
                <input type="text" value={malForm.urunAdi} onChange={e => setMalForm(p => ({ ...p, urunAdi: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Miktar (KG)</label>
                  <input type="number" step="0.01" value={malForm.miktar} onChange={e => setMalForm(p => ({ ...p, miktar: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Birim Fiyat</label>
                  <input type="number" step="0.01" value={malForm.birimFiyat} onChange={e => setMalForm(p => ({ ...p, birimFiyat: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {malForm.tip === 'ALIS' && selectedCari?.tip === 'MUSTAHSIL' && (
                <div style={{ marginTop: 16, padding: 14, background: 'rgba(234, 179, 8, 0.08)', borderRadius: 8, border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                   <h4 style={{ fontSize: 13, fontWeight: 600, color: '#b45309', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>⚡ Müstahsil Kesintileri (%)</h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      <div>
                         <label style={{fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4}}>Stopaj</label>
                         <input type="number" value={malForm.stopajOran} onChange={e => setMalForm(p => ({...p, stopajOran: parseFloat(e.target.value)}))} style={{...inputStyle, padding: 8}} />
                      </div>
                      <div>
                         <label style={{fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4}}>Bağkur</label>
                         <input type="number" value={malForm.bagkurOran} onChange={e => setMalForm(p => ({...p, bagkurOran: parseFloat(e.target.value)}))} style={{...inputStyle, padding: 8}} />
                      </div>
                      <div>
                         <label style={{fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4}}>Borsa</label>
                         <input type="number" value={malForm.borsaOran} onChange={e => setMalForm(p => ({...p, borsaOran: parseFloat(e.target.value)}))} style={{...inputStyle, padding: 8}} />
                      </div>
                      <div>
                         <label style={{fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4}}>Diğer (TL)</label>
                         <input type="number" value={malForm.digerKesinti} onChange={e => setMalForm(p => ({...p, digerKesinti: parseFloat(e.target.value)}))} style={{...inputStyle, padding: 8}} />
                      </div>
                   </div>
                   <div style={{ marginTop: 10, fontSize: 12, textAlign: 'right', color: '#92400e' }}>
                      Kesinti Toplamı: <b>{formatCurrency(
                        (hesaplananMalTutar * malForm.stopajOran / 100) + 
                        (hesaplananMalTutar * malForm.bagkurOran / 100) + 
                        (hesaplananMalTutar * malForm.borsaOran / 100) + 
                        (parseFloat(malForm.digerKesinti as any) || 0)
                      )}</b>
                   </div>
                </div>
              )}
              
              <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Brüt Tutar:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(hesaplananMalTutar)} ₺</span>
                 </div>
                 {malForm.tip === 'ALIS' && selectedCari?.tip === 'MUSTAHSIL' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', borderTop: '1px solid #ddd', paddingTop: 4, marginTop: 4 }}>
                       <span>Net Ele Geçen:</span>
                       <span style={{ fontWeight: 700 }}>
                         {formatCurrency(
                           hesaplananMalTutar - (
                             (hesaplananMalTutar * malForm.stopajOran / 100) + 
                             (hesaplananMalTutar * malForm.bagkurOran / 100) + 
                             (hesaplananMalTutar * malForm.borsaOran / 100) + 
                             (parseFloat(malForm.digerKesinti as any) || 0)
                           )
                         )} ₺
                       </span>
                    </div>
                 )}
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary w-full">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - FİNANSAL İŞLEM */}
      {activeModal === 'FINANS' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 450 }}>
            <div className="modal-header">
              <h3>Finansal İşlem</h3>
              <button onClick={() => setActiveModal('NONE')}><X size={18} /></button>
            </div>
            <form onSubmit={handleFinansSubmit} className="modal-body">
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setFinansForm(p => ({ ...p, tip: 'ODEME' }))}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: finansForm.tip === 'ODEME' ? '2px solid #ef4444' : '1px solid var(--border-color)',
                    background: finansForm.tip === 'ODEME' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-default)',
                    color: finansForm.tip === 'ODEME' ? '#ef4444' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  💸 Ödeme Yap (Borçlandır)
                </button>
                <button
                  type="button"
                  onClick={() => setFinansForm(p => ({ ...p, tip: 'TAHSILAT' }))}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    border: finansForm.tip === 'TAHSILAT' ? '2px solid #10b981' : '1px solid var(--border-color)',
                    background: finansForm.tip === 'TAHSILAT' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-default)',
                    color: finansForm.tip === 'TAHSILAT' ? '#10b981' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  💰 Tahsilat Al (Alacaklandır)
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                 <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>Ödeme Yöntemi</label>
                 <select 
                    value={finansForm.odemeTuru} 
                    onChange={e => setFinansForm(p => ({ ...p, odemeTuru: e.target.value as any }))}
                    style={inputStyle}
                 >
                   <option value="NAKIT">NAKİT</option>
                   <option value="HAVALE">HAVALE</option>
                   <option value="CEK">ÇEK</option>
                   <option value="SENET">SENET</option>
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
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - RAPOR */}
      {activeModal === 'RAPOR' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 600 }}>
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
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button 
                    onClick={handleExportExcel}
                    className="no-print"
                    style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <FileText size={14} /> Excel İndir
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="no-print"
                    style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                  >
                    🖨️ Yazdır
                  </button>
                </div>
             </div>

             <div className="modal-body" style={{ padding: 0, maxHeight: '60vh', overflowY: 'auto' }}>
               <table className="data-table">
                 <thead style={{ background: 'var(--bg-secondary)' }}>
                   <tr>
                     <th>Parti No</th>
                     <th>Ürün</th>
                     <th style={{ textAlign: 'right' }}>Mal Giriş (Alacak)</th>
                     <th style={{ textAlign: 'right' }}>Mal Çıkış (Borç)</th>
                     <th style={{ textAlign: 'right' }}>Fark</th>
                   </tr>
                 </thead>
                 <tbody>
                   {partiRaporu.length === 0 ? (
                     <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Veri bulunamadı</td></tr>
                   ) : (
                     partiRaporu.map((row, idx) => (
                       <tr key={idx}>
                         <td style={{ fontWeight: 600 }}>{row.parti}</td>
                         <td>{row.urun}</td>
                         <td style={{ textAlign: 'right', color: '#10b981' }}>{formatCurrency(row.alisTutar)}</td>
                         <td style={{ textAlign: 'right', color: '#ef4444' }}>{formatCurrency(row.satisTutar)}</td>
                         <td style={{ textAlign: 'right', fontWeight: 700 }}>
                           {formatCurrency(row.satisTutar - row.alisTutar)}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body {
            visibility: hidden;
          }
          /* Overlay'i sayfaya yay */
          .modal-overlay {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            min-height: 100vh;
            background: white;
            z-index: 9999;
            display: block !important; /* Flex yerine block */
            padding: 0 !important;
          }
          /* İçeriği göster ve hizala */
          .modal-content {
            visibility: visible;
            position: relative; /* Absolute yerine relative */
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          /* İçerikleri görünür yap */
          .modal-content * {
            visibility: visible;
          }
          
          .modal-body {
             max-height: none !important;
             overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-filter-header {
             border-bottom: 2px solid #000 !important;
          }
          .print-filter-header input {
            border: none;
            background: transparent;
          }
          /* Tablo ayarları */
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; color: black !important; }
        }
      `}</style>
    </>
  )
}

export default Mustahsil
