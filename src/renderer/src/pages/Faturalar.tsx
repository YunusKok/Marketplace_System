import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical, 
  Loader2,
  X,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'

// Tipler
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
  cari_unvan?: string
}

interface CariSimple {
  id: string
  unvan: string
  kod: string
}

interface FaturaFormData {
  cariId: string
  tarih: string
  faturaNo: string
  tutar: string
  kdvOrani: string
  faturaTipi: 'ALIS' | 'SATIS'
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

const Faturalar: React.FC = () => {
  // State
  const [faturalar, setFaturalar] = useState<FaturaData[]>([])
  const [cariler, setCariler] = useState<CariSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'ALIS' | 'SATIS'>('ALL')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState<FaturaFormData>({
    cariId: '',
    tarih: new Date().toLocaleDateString('tr-TR'),
    faturaNo: '',
    tutar: '',
    kdvOrani: '20',
    faturaTipi: 'SATIS',
    aciklama: ''
  })

  // Veri yükleme
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [faturalarData, carilerData] = await Promise.all([
        window.db.getFaturalar(),
        window.db.getCariler()
      ])
      setFaturalar(faturalarData)
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
    if (!formData.cariId || !formData.faturaNo || !formData.tutar) {
      alert('Lütfen zorunlu alanları doldurun')
      return
    }

    setFormLoading(true)
    try {
      const tutar = parseFloat(formData.tutar)
      const kdvOrani = parseFloat(formData.kdvOrani)
      const kdv = tutar * (kdvOrani / 100)
      const genelToplam = tutar + kdv

      await window.db.addFatura({
        cariId: formData.cariId,
        tarih: formData.tarih,
        faturaNo: formData.faturaNo,
        tutar,
        kdv,
        genelToplam,
        faturaTipi: formData.faturaTipi,
        aciklama: formData.aciklama
      })

      // Listeyi güncelle
      const newFaturalar = await window.db.getFaturalar()
      setFaturalar(newFaturalar)
      
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Fatura eklenemedi:', error)
      alert('Fatura eklenirken bir hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bu faturayı silmek istediğinize emin misiniz?')) {
      try {
        await window.db.deleteFatura(id)
        setFaturalar(prev => prev.filter(f => f.id !== id))
      } catch (error) {
        console.error('Fatura silinemedi:', error)
        alert('Fatura silinirken bir hata oluştu')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      cariId: '',
      tarih: new Date().toLocaleDateString('tr-TR'),
      faturaNo: '',
      tutar: '',
      kdvOrani: '20',
      faturaTipi: 'SATIS',
      aciklama: ''
    })
  }

  // Filtreleme
  const filteredFaturalar = faturalar.filter(f => {
    const matchesSearch = 
      (f.fatura_no?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (f.cari_unvan?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    
    const matchesFilter = filterType === 'ALL' || f.fatura_tipi === filterType

    return matchesSearch && matchesFilter
  })

  // İstatistikler
  const totalSatis = faturalar
    .filter(f => f.fatura_tipi === 'SATIS')
    .reduce((sum, f) => sum + f.genel_toplam, 0)

  const totalAlis = faturalar
    .filter(f => f.fatura_tipi === 'ALIS')
    .reduce((sum, f) => sum + f.genel_toplam, 0)

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
          <h1>Faturalar</h1>
          <p>Satış ve alış faturalarınızı yönetin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Yeni Fatura
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          <div className="summary-card card-primary">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Net Durum</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCurrency(totalSatis - totalAlis)}
            </div>
          </div>
          <div className="summary-card card-success">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Satış</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {formatCurrency(totalSatis)}
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="summary-card card-danger">
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Alış</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {formatCurrency(totalAlis)}
              <ArrowDownLeft size={20} />
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="search-box">
            <Search />
            <input 
              type="text" 
              placeholder="Fatura No veya Cari Ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('ALL')}
            >
              Tümü
            </button>
            <button 
              className={`btn ${filterType === 'SATIS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('SATIS')}
            >
              Satışlar
            </button>
            <button 
              className={`btn ${filterType === 'ALIS' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('ALIS')}
            >
              Alışlar
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Fatura No</th>
                <th>Cari</th>
                <th>Açıklama</th>
                <th>Tip</th>
                <th style={{ textAlign: 'right' }}>Tutar</th>
                <th style={{ textAlign: 'right' }}>KDV</th>
                <th style={{ textAlign: 'right' }}>Genel Toplam</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredFaturalar.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <FileText size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <div>Kayıtlı fatura bulunamadı</div>
                  </td>
                </tr>
              ) : (
                filteredFaturalar.map((fatura) => (
                  <tr key={fatura.id}>
                    <td>{formatDate(fatura.tarih)}</td>
                    <td style={{ fontWeight: 500 }}>{fatura.fatura_no}</td>
                    <td>{fatura.cari_unvan}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fatura.aciklama || '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${fatura.fatura_tipi === 'SATIS' ? 'success' : 'danger'}`}>
                        {fatura.fatura_tipi === 'SATIS' ? 'Satış' : 'Alış'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(fatura.toplam)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(fatura.kdv)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(fatura.genel_toplam)}</td>
                    <td>
                      <button 
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === fatura.id ? null : fatura.id)
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeMenu === fatura.id && (
                        <div className="dropdown-menu">
                          <button 
                            className="dropdown-item danger"
                            onClick={() => handleDelete(fatura.id)}
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

      {/* Yeni Fatura Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>Yeni Fatura</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Cari Hesap</label>
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
                    <label>Fatura Tipi</label>
                    <select 
                      name="faturaTipi" 
                      value={formData.faturaTipi} 
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="SATIS">Satış Faturası</option>
                      <option value="ALIS">Alış Faturası</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tarih</label>
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
                    <label>Fatura No</label>
                    <input 
                      type="text" 
                      name="faturaNo" 
                      value={formData.faturaNo} 
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tutar (KDV Hariç)</label>
                    <input 
                      type="number" 
                      name="tutar" 
                      value={formData.tutar} 
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>KDV Oranı (%)</label>
                    <select 
                      name="kdvOrani" 
                      value={formData.kdvOrani} 
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Açıklama</label>
                    <textarea 
                      name="aciklama" 
                      value={formData.aciklama} 
                      onChange={handleInputChange}
                      rows={3}
                      className="form-input"
                    />
                  </div>
                  
                  {formData.tutar && (
                    <div style={{ gridColumn: 'span 2', background: 'var(--bg-secondary)', padding: 15, borderRadius: 8, marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span>Tutar:</span>
                          <span>{formatCurrency(parseFloat(formData.tutar))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span>KDV (%{formData.kdvOrani}):</span>
                          <span>{formatCurrency(parseFloat(formData.tutar) * (parseFloat(formData.kdvOrani)/100))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 18, borderTop: '1px solid var(--border-color)', paddingTop: 5 }}>
                          <span>Genel Toplam:</span>
                          <span>{formatCurrency(parseFloat(formData.tutar) * (1 + parseFloat(formData.kdvOrani)/100))}</span>
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

export default Faturalar
