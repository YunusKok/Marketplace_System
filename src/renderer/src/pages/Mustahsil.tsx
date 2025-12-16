import React, { useState, useEffect } from 'react'
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical, 
  Loader2,
  X,
  Scale,
  TrendingDown
} from 'lucide-react'

// Tipler
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
  cari_unvan?: string
}

interface CariSimple {
  id: string
  unvan: string
  kod: string
}

interface MustahsilFormData {
  cariId: string
  tarih: string
  makbuzNo: string
  urunAdi: string
  miktar: string
  birim: string
  birimFiyat: string
  stopajOrani: string
  aciklama: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ₺'
}

const formatDate = (dateString: string): string => {
  try {
    const [day, month, year] = dateString.split('.')
    return `${day}.${month}.${year}`
  } catch {
    return dateString
  }
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

const Mustahsil: React.FC = () => {
  // State
  const [mustahsiller, setMustahsiller] = useState<MustahsilData[]>([])
  const [cariler, setCariler] = useState<CariSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState<MustahsilFormData>({
    cariId: '',
    tarih: new Date().toLocaleDateString('tr-TR'),
    makbuzNo: '',
    urunAdi: '',
    miktar: '',
    birim: 'KG',
    birimFiyat: '',
    stopajOrani: '2',
    aciklama: ''
  })

  // Veri yükleme
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [mustahsillerData, carilerData] = await Promise.all([
        window.db.getMustahsiller(),
        window.db.getCariler()
      ])
      setMustahsiller(mustahsillerData)
      setCariler(carilerData.map(c => ({ id: c.id, unvan: c.unvan, kod: c.kod })))
    } catch (error) {
      console.error('Veriler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    if (activeMenu) {
      const handleClickOutside = () => setActiveMenu(null)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [activeMenu])

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.cariId || !formData.makbuzNo || !formData.urunAdi || !formData.miktar || !formData.birimFiyat) {
      alert('Lütfen zorunlu alanları doldurun')
      return
    }

    setFormLoading(true)
    try {
      await window.db.addMustahsil({
        cariId: formData.cariId,
        tarih: formData.tarih,
        makbuzNo: formData.makbuzNo,
        urunAdi: formData.urunAdi,
        miktar: parseFloat(formData.miktar),
        birim: formData.birim,
        birimFiyat: parseFloat(formData.birimFiyat),
        stopajOrani: parseFloat(formData.stopajOrani),
        aciklama: formData.aciklama
      })

      // Listeyi güncelle
      const newMustahsiller = await window.db.getMustahsiller()
      setMustahsiller(newMustahsiller)
      
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Müstahsil makbuzu eklenemedi:', error)
      alert('Müstahsil makbuzu eklenirken bir hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bu müstahsil makbuzunu silmek istediğinize emin misiniz?')) {
      try {
        await window.db.deleteMustahsil(id)
        setMustahsiller(prev => prev.filter(m => m.id !== id))
      } catch (error) {
        console.error('Müstahsil makbuzu silinemedi:', error)
        alert('Müstahsil makbuzu silinirken bir hata oluştu')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      cariId: '',
      tarih: new Date().toLocaleDateString('tr-TR'),
      makbuzNo: '',
      urunAdi: '',
      miktar: '',
      birim: 'KG',
      birimFiyat: '',
      stopajOrani: '2',
      aciklama: ''
    })
  }

  // Filtreleme
  const filteredMustahsiller = mustahsiller.filter(m => {
    const matchesSearch = 
      (m.makbuz_no?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (m.cari_unvan?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (m.urun_adi?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    
    return matchesSearch
  })

  // İstatistikler
  const totalToplam = mustahsiller.reduce((sum, m) => sum + m.toplam, 0)
  const totalStopaj = mustahsiller.reduce((sum, m) => sum + m.stopaj_tutari, 0)
  const totalNet = mustahsiller.reduce((sum, m) => sum + m.net_tutar, 0)

  // Hesaplama değerleri
  const miktar = parseFloat(formData.miktar) || 0
  const birimFiyat = parseFloat(formData.birimFiyat) || 0
  const stopajOrani = parseFloat(formData.stopajOrani) || 0
  const hesaplananToplam = miktar * birimFiyat
  const hesaplananStopaj = hesaplananToplam * (stopajOrani / 100)
  const hesaplananNet = hesaplananToplam - hesaplananStopaj

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Müstahsil Makbuzları</h1>
          <p>Müstahsil makbuzlarınızı oluşturun ve yönetin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Yeni Makbuz
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          <div className="summary-card card-primary">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Tutar</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {formatCurrency(totalToplam)}
              <Scale size={20} />
            </div>
          </div>
          <div className="summary-card card-danger">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Stopaj</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {formatCurrency(totalStopaj)}
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="summary-card">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Net Tutar</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)' }}>
              {formatCurrency(totalNet)}
            </div>
          </div>
        </div>

        {/* Arama */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="search-box">
            <Search />
            <input 
              type="text" 
              placeholder="Makbuz No, Cari veya Ürün Ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
            Toplam {filteredMustahsiller.length} makbuz
          </div>
        </div>

        {/* Tablo */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Makbuz No</th>
                <th>Cari</th>
                <th>Ürün</th>
                <th style={{ textAlign: 'right' }}>Miktar</th>
                <th style={{ textAlign: 'right' }}>Birim Fiyat</th>
                <th style={{ textAlign: 'right' }}>Toplam</th>
                <th style={{ textAlign: 'right' }}>Stopaj</th>
                <th style={{ textAlign: 'right' }}>Net Tutar</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredMustahsiller.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <Receipt size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <div>Kayıtlı müstahsil makbuzu bulunamadı</div>
                  </td>
                </tr>
              ) : (
                filteredMustahsiller.map((mustahsil) => (
                  <tr key={mustahsil.id}>
                    <td>{formatDate(mustahsil.tarih)}</td>
                    <td style={{ fontWeight: 500 }}>{mustahsil.makbuz_no}</td>
                    <td>{mustahsil.cari_unvan}</td>
                    <td>{mustahsil.urun_adi}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(mustahsil.miktar)} {mustahsil.birim}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(mustahsil.birim_fiyat)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(mustahsil.toplam)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-danger)' }}>
                      %{mustahsil.stopaj_orani} ({formatCurrency(mustahsil.stopaj_tutari)})
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-success)' }}>
                      {formatCurrency(mustahsil.net_tutar)}
                    </td>
                    <td>
                      <button 
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === mustahsil.id ? null : mustahsil.id)
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeMenu === mustahsil.id && (
                        <div className="dropdown-menu">
                          <button 
                            className="dropdown-item danger"
                            onClick={() => handleDelete(mustahsil.id)}
                          >
                            <Trash2 size={16} />
                            Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yeni Müstahsil Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 650, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Yeni Müstahsil Makbuzu</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Üretici (Cari Hesap) *</label>
                    <select 
                      name="cariId" 
                      value={formData.cariId} 
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    >
                      <option value="">Seçiniz...</option>
                      {cariler.map(cari => (
                        <option key={cari.id} value={cari.id}>
                          {cari.kod} - {cari.unvan}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Tarih *</label>
                    <input 
                      type="text" 
                      name="tarih" 
                      value={formData.tarih} 
                      onChange={handleInputChange}
                      placeholder="GG.AA.YYYY"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Makbuz No *</label>
                    <input 
                      type="text" 
                      name="makbuzNo" 
                      value={formData.makbuzNo} 
                      onChange={handleInputChange}
                      placeholder="M-001"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Ürün Adı *</label>
                    <input 
                      type="text" 
                      name="urunAdi" 
                      value={formData.urunAdi} 
                      onChange={handleInputChange}
                      placeholder="Domates, Biber, Elma..."
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Miktar *</label>
                    <input 
                      type="number" 
                      name="miktar" 
                      value={formData.miktar} 
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Birim</label>
                    <select 
                      name="birim" 
                      value={formData.birim} 
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="KG">Kilogram (KG)</option>
                      <option value="TON">Ton</option>
                      <option value="ADET">Adet</option>
                      <option value="KASA">Kasa</option>
                      <option value="PAKET">Paket</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Birim Fiyat *</label>
                    <input 
                      type="number" 
                      name="birimFiyat" 
                      value={formData.birimFiyat} 
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Stopaj Oranı (%)</label>
                    <select 
                      name="stopajOrani" 
                      value={formData.stopajOrani} 
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="0">0</option>
                      <option value="2">2</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Açıklama</label>
                    <textarea 
                      name="aciklama" 
                      value={formData.aciklama} 
                      onChange={handleInputChange}
                      rows={2}
                      className="form-input"
                    />
                  </div>
                  
                  {(formData.miktar && formData.birimFiyat) && (
                    <div style={{ gridColumn: 'span 2', background: 'var(--bg-secondary)', padding: 15, borderRadius: 8, marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Miktar:</span>
                        <span>{formatNumber(miktar)} {formData.birim} x {formatCurrency(birimFiyat)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Brüt Tutar:</span>
                        <span>{formatCurrency(hesaplananToplam)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--accent-danger)' }}>
                        <span>Stopaj (%{stopajOrani}):</span>
                        <span>- {formatCurrency(hesaplananStopaj)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 18, borderTop: '1px solid var(--border-color)', paddingTop: 10, color: 'var(--accent-success)' }}>
                        <span>Net Ödeme:</span>
                        <span>{formatCurrency(hesaplananNet)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Mustahsil
