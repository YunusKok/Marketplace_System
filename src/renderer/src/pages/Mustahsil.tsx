import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  User,
  Loader2,
  X,
  Banknote,
  FileText
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Tipler
interface CariSimple {
  id: string
  unvan: string
  kod: string
  bakiye: number
  bakiye_turu: string
}

interface EkstreSatir {
  id: string
  tarih: string
  aciklama: string
  borc: number
  alacak: number
  bakiye: number
  bakiye_turu: string
  islem_tipi: string
  // Detaylar
  parti_no?: string
  miktar?: number
  birim?: string
  birim_fiyat?: number
  urun_adi?: string
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
  
  // Form State
  const [formData, setFormData] = useState({
    tarih: new Date().toLocaleDateString('tr-TR'),
    partiNo: '',
    urunAdi: '',
    miktar: '',
    birimFiyat: '',
    birim: 'KG'
  })

  // Ödeme Modal State
  const [isOdemeModalOpen, setIsOdemeModalOpen] = useState(false)
  const [odemeForm, setOdemeForm] = useState({
    tutar: '',
    aciklama: 'Cari Hesaba Mahsuben Ödeme'
  })

  // Çek/Senet Modal State
  const [isCekModalOpen, setIsCekModalOpen] = useState(false)
  const [cekForm, setCekForm] = useState({
    tip: 'CEK',
    numara: '',
    banka: '',
    vadeTarihi: new Date().toLocaleDateString('tr-TR'),
    tutar: '',
    aciklama: 'Cari Hesaba Çek Çıkışı'
  })

  // Veri yükleme (Cariler)
  useEffect(() => {
    loadCariler()
  }, [])

  // Cari seçilince ekstre yükle
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
        bakiye_turu: c.bakiye_turu
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
      const data = await window.db.getMusthasilEkstre(cariId)
      setEkstre(data)
    } catch (error) {
      console.error('Ekstre yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleMalGiris = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCariId) {
      alert('Lütfen önce bir müstahsil seçin')
      return
    }

    if (!formData.urunAdi || !formData.miktar || !formData.birimFiyat) {
      alert('Lütfen zorunlu alanları doldurun')
      return
    }

    try {
      // Makbuz No otomatik oluştur (M-ZamanDamgası)
      const makbuzNo = `M-${Date.now().toString().slice(-6)}`
      
      await window.db.addMustahsil({
        cariId: selectedCariId,
        tarih: formData.tarih,
        makbuzNo: makbuzNo,
        partiNo: formData.partiNo || ((ekstre.length + 1).toString()), // Parti No girilmediyse sıradaki yap
        urunAdi: formData.urunAdi,
        miktar: parseFloat(formData.miktar),
        birim: formData.birim,
        birimFiyat: parseFloat(formData.birimFiyat),
        stopajOrani: 2, // Varsayılan %2
        aciklama: ''
      })

      // Formu temizle ve tabloyu yenile
      setFormData(prev => ({
        ...prev,
        urunAdi: '',
        miktar: '',
        birimFiyat: '',
        partiNo: '' // Parti no'yu temizle
      }))
      
      await loadEkstre(selectedCariId)
      await loadCariler() // Bakiyeleri güncelle
    } catch (error) {
      console.error('Kayıt eklenirken hata:', error)
      alert('Kayıt eklenirken bir hata oluştu.')
    }
  }

  const handleNakitOdeme = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCariId || !odemeForm.tutar) return

    try {
      await window.db.addKasaIslem({
        cariId: selectedCariId,
        tarih: new Date().toLocaleDateString('tr-TR'),
        aciklama: odemeForm.aciklama,
        tutar: parseFloat(odemeForm.tutar),
        islemTipi: 'ODEME'
      })
      
      setIsOdemeModalOpen(false)
      setOdemeForm({ tutar: '', aciklama: 'Cari Hesaba Mahsuben Ödeme' })
      await loadEkstre(selectedCariId)
      await loadCariler() // Bakiyeleri güncelle
    } catch (error) {
      console.error('Ödeme işlemi hatası:', error)
      alert('Ödeme işlemi başarısız.')
    }
  }

  const handleCekEkle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCariId || !cekForm.tutar) return

    try {
      await window.db.addCekSenet({
        cariId: selectedCariId,
        tip: cekForm.tip as 'CEK' | 'SENET',
        yon: 'VERILEN',
        numara: cekForm.numara,
        banka: cekForm.banka,
        vadeTarihi: cekForm.vadeTarihi,
        tutar: parseFloat(cekForm.tutar),
        aciklama: cekForm.aciklama,
        durum: 'BEKLEMEDE'
      })
      
      setIsCekModalOpen(false)
      setCekForm({
        tip: 'CEK',
        numara: '',
        banka: '',
        vadeTarihi: new Date().toLocaleDateString('tr-TR'),
        tutar: '',
        aciklama: 'Cari Hesaba Çek Çıkışı'
      })
      await loadEkstre(selectedCariId)
      await loadCariler() // Bakiyeleri güncelle
    } catch (error) {
      console.error('Çek ekleme hatası:', error)
      alert('Çek işlemi başarısız.')
    }
  }

  const filteredCariler = useMemo(() => {
    return cariler.filter(c => 
      c.unvan.toLowerCase().includes(cariSearch.toLowerCase()) || 
      c.kod.toLowerCase().includes(cariSearch.toLowerCase())
    )
  }, [cariler, cariSearch])

  const selectedCari = cariler.find(c => c.id === selectedCariId)

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Müstahsil İşlemleri</h1>
          <p>Günlük mal girişi ve müstahsil hesap takibi</p>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', gap: 24, padding: 24, height: 'calc(100vh - 85px)', overflow: 'hidden' }}>
        
        {/* SOL PANEL - LİSTE */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)' }}>
            <div className="search-box" style={{ width: '100%' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Müstahsil Ara..." 
                value={cariSearch}
                onChange={e => setCariSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <Loader2 className="animate-spin" size={24} color="var(--text-secondary)" />
              </div>
            ) : filteredCariler.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                Önce Kayıtlardan Müstahsil Ekleyin
              </div>
            ) : filteredCariler.map(cari => (
              <div
                key={cari.id}
                onClick={() => setSelectedCariId(cari.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  background: selectedCariId === cari.id ? 'var(--bg-card-hover)' : 'transparent',
                  borderLeft: selectedCariId === cari.id ? '3px solid var(--accent-primary)' : '3px solid transparent'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{cari.unvan}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>{cari.kod}</span>
                  <span style={{ 
                    color: cari.bakiye_turu === 'A' ? 'var(--accent-success)' : 'var(--accent-danger)',
                    fontWeight: 500 
                  }}>
                    {formatCurrency(cari.bakiye)} {cari.bakiye_turu}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ padding: 12, borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/cariler')}>
              <Plus size={16} /> Yeni Müstahsil Ekle
            </button>
          </div>
        </div>

        {/* SAĞ PANEL - İŞLEM VE DETAY */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'hidden' }}>
          
          {selectedCariId ? (
            <>
              {/* ÜST BİLGİ VE FORM */}
              <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedCari?.unvan}</h2>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Hesap Özeti ve Mal Girişi</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Güncel Bakiye</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: selectedCari?.bakiye_turu === 'A' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                      {formatCurrency(selectedCari?.bakiye || 0)} {selectedCari?.bakiye_turu}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleMalGiris} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1.5fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end', background: 'var(--bg-secondary)', padding: 16, borderRadius: 8 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Tarih</label>
                    <input type="text" name="tarih" value={formData.tarih} onChange={handleInputChange} className="form-input" style={{ height: 36 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Parti No</label>
                    <input type="text" name="partiNo" value={formData.partiNo} onChange={handleInputChange} className="form-input" placeholder="Oto" style={{ height: 36 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Ürün</label>
                    <input type="text" name="urunAdi" value={formData.urunAdi} onChange={handleInputChange} className="form-input" placeholder="Ürün Adı" style={{ height: 36 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Miktar (KG)</label>
                    <input type="number" name="miktar" value={formData.miktar} onChange={handleInputChange} className="form-input" placeholder="0" style={{ height: 36 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12 }}>Fiyat</label>
                    <input type="number" name="birimFiyat" value={formData.birimFiyat} onChange={handleInputChange} className="form-input" placeholder="0.00" style={{ height: 36 }} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                     <label style={{ fontSize: 12 }}>Stopaj</label>
                     <div style={{ height: 36, display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>%2 (Oto)</div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: 36 }}>
                    <Plus size={18} /> Ekle
                  </button>
                </form>

                {/* Ödeme Butonları */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setIsOdemeModalOpen(true)}
                    disabled={!selectedCariId}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: selectedCariId ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 500
                    }}
                  >
                    <Banknote size={18} />
                    Nakit Ödeme
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCekModalOpen(true)}
                    disabled={!selectedCariId}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: selectedCariId ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 500
                    }}
                  >
                    <FileText size={18} />
                    Çek/Senet Ver
                  </button>
                </div>
              </div>

              {/* TABLO - HESAP EKSTRESİ */}
              <div className="table-container" style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th style={{ width: 100 }}>Tarih</th>
                        <th style={{ width: 80 }}>Parti</th>
                        <th>Açıklama / Ürün</th>
                        <th style={{ textAlign: 'right', width: 100 }}>Kg/Adet</th>
                        <th style={{ textAlign: 'right', width: 100 }}>Fiyat</th>
                        <th style={{ textAlign: 'right', width: 120, color: 'var(--accent-danger)' }}>Borç (Verilen)</th>
                        <th style={{ textAlign: 'right', width: 120, color: 'var(--accent-success)' }}>Alacak (Mal)</th>
                        <th style={{ textAlign: 'right', width: 120 }}>Bakiye</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && selectedCariId ? (
                         <tr>
                           <td colSpan={8} style={{ textAlign: 'center', padding: 32 }}>
                             <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                               <Loader2 className="animate-spin" size={20} />
                               <span>Veriler yükleniyor...</span>
                             </div>
                           </td>
                         </tr>
                      ) : ekstre.length === 0 ? (
                         <tr>
                           <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>Henüz işlem kaydı yok.</td>
                         </tr>
                      ) : (
                        ekstre.map((row) => (
                          <tr key={row.id}>
                            <td>{row.tarih}</td>
                            <td style={{ textAlign: 'center' }}>
                              {row.parti_no ? <span style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{row.parti_no}</span> : '-'}
                            </td>
                            <td>
                              {row.urun_adi ? (
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.urun_adi}</span>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)' }}>{row.aciklama}</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {row.miktar ? (
                                <span>{new Intl.NumberFormat('tr-TR').format(row.miktar)} {row.birim}</span>
                              ) : '-'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {row.birim_fiyat ? (
                                <span>{formatCurrency(row.birim_fiyat)}</span>
                              ) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--accent-danger)', fontWeight: row.borc > 0 ? 600 : 400 }}>
                              {row.borc > 0 ? formatCurrency(row.borc) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--accent-success)', fontWeight: row.alacak > 0 ? 600 : 400 }}>
                              {row.alacak > 0 ? formatCurrency(row.alacak) : '-'}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(row.bakiye)} {row.bakiye_turu}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <User size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h3>Müstahsil Seçin</h3>
              <p>İşlem yapmak için soldaki listeden bir müstahsil seçin.</p>
            </div>
          )}
          
        </div>
      </div>

      {/* Nakit Ödeme Modal */}
      {isOdemeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: 24,
            borderRadius: 12,
            width: 400,
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Nakit Ödeme Yap</h3>
              <button 
                onClick={() => setIsOdemeModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleNakitOdeme} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Tutar</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={odemeForm.tutar}
                  onChange={e => setOdemeForm(prev => ({ ...prev, tutar: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Açıklama</label>
                <input
                  type="text"
                  required
                  value={odemeForm.aciklama}
                  onChange={e => setOdemeForm(prev => ({ ...prev, aciklama: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-default)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: 12,
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 10
                }}
              >
                Ödemeyi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Çek/Senet Modal */}
      {isCekModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: 24,
            borderRadius: 12,
            width: 450,
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Çek/Senet Çıkışı</h3>
              <button 
                onClick={() => setIsCekModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCekEkle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ flex: 1, cursor: 'pointer', padding: 10, border: `1px solid ${cekForm.tip === 'CEK' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 6, textAlign: 'center', background: cekForm.tip === 'CEK' ? 'rgba(52, 211, 153, 0.1)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="tip"
                    value="CEK"
                    checked={cekForm.tip === 'CEK'}
                    onChange={e => setCekForm(prev => ({ ...prev, tip: e.target.value }))}
                    style={{ display: 'none' }}
                  />
                  Çek
                </label>
                <label style={{ flex: 1, cursor: 'pointer', padding: 10, border: `1px solid ${cekForm.tip === 'SENET' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 6, textAlign: 'center', background: cekForm.tip === 'SENET' ? 'rgba(52, 211, 153, 0.1)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="tip"
                    value="SENET"
                    checked={cekForm.tip === 'SENET'}
                    onChange={e => setCekForm(prev => ({ ...prev, tip: e.target.value }))}
                    style={{ display: 'none' }}
                  />
                  Senet
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Tarih / Vade</label>
                  <input
                    type="text"
                    required
                    value={cekForm.vadeTarihi}
                    onChange={e => setCekForm(prev => ({ ...prev, vadeTarihi: e.target.value }))}
                    placeholder="GG.AA.YYYY"
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Tutar</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cekForm.tutar}
                    onChange={e => setCekForm(prev => ({ ...prev, tutar: e.target.value }))}
                    placeholder="0.00"
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-default)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Banka</label>
                  <input
                    type="text"
                    value={cekForm.banka}
                    onChange={e => setCekForm(prev => ({ ...prev, banka: e.target.value }))}
                    placeholder="Banka Adı"
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Çek/Senet No</label>
                  <input
                    type="text"
                    value={cekForm.numara}
                    onChange={e => setCekForm(prev => ({ ...prev, numara: e.target.value }))}
                    placeholder="Belge No"
                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-default)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Açıklama</label>
                <input
                  type="text"
                  value={cekForm.aciklama}
                  onChange={e => setCekForm(prev => ({ ...prev, aciklama: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-default)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: 12,
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 10
                }}
              >
                Çek/Senet Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Mustahsil
