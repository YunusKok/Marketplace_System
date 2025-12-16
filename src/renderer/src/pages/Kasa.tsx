import React, { useState, useEffect } from 'react'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical, 
  Loader2,
  X,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

// Tipler
interface KasaIslem {
  id: string
  cari_id?: string
  tarih: string
  aciklama: string
  tutar: number
  islem_tipi: 'TAHSILAT' | 'ODEME'
  olusturma_tarihi?: string
  cari_unvan?: string
}

interface CariSimple {
  id: string
  unvan: string
  kod: string
}

interface KasaBakiye {
  bakiye: number
  tahsilat: number
  odeme: number
}

interface KasaFormData {
  cariId: string
  tarih: string
  aciklama: string
  tutar: string
  islemTipi: 'TAHSILAT' | 'ODEME'
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
    if (dateString.includes('.')) {
      return dateString
    }
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR')
  } catch {
    return dateString
  }
}

const Kasa: React.FC = () => {
  // State
  const [islemler, setIslemler] = useState<KasaIslem[]>([])
  const [cariler, setCariler] = useState<CariSimple[]>([])
  const [kasaBakiye, setKasaBakiye] = useState<KasaBakiye>({ bakiye: 0, tahsilat: 0, odeme: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'TAHSILAT' | 'ODEME'>('ALL')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'TAHSILAT' | 'ODEME'>('TAHSILAT')
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState<KasaFormData>({
    cariId: '',
    tarih: new Date().toLocaleDateString('tr-TR'),
    aciklama: '',
    tutar: '',
    islemTipi: 'TAHSILAT'
  })

  // Veri yükleme
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [islemlerData, bakiyeData, carilerData] = await Promise.all([
        window.db.getKasaIslemleri(),
        window.db.getKasaBakiye(),
        window.db.getCariler()
      ])
      setIslemler(islemlerData)
      setKasaBakiye(bakiyeData)
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

  // Modal açma
  const openModal = (type: 'TAHSILAT' | 'ODEME') => {
    setModalType(type)
    setFormData({
      cariId: '',
      tarih: new Date().toLocaleDateString('tr-TR'),
      aciklama: '',
      tutar: '',
      islemTipi: type
    })
    setShowModal(true)
  }

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tutar || !formData.aciklama) {
      alert('Lütfen zorunlu alanları doldurun')
      return
    }

    setFormLoading(true)
    try {
      await window.db.addKasaIslem({
        cariId: formData.cariId || undefined,
        tarih: formData.tarih,
        aciklama: formData.aciklama,
        tutar: parseFloat(formData.tutar),
        islemTipi: formData.islemTipi
      })

      // Verileri güncelle
      const [newIslemler, newBakiye] = await Promise.all([
        window.db.getKasaIslemleri(),
        window.db.getKasaBakiye()
      ])
      setIslemler(newIslemler)
      setKasaBakiye(newBakiye)
      
      setShowModal(false)
    } catch (error) {
      console.error('İşlem eklenemedi:', error)
      alert('İşlem eklenirken bir hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      try {
        await window.db.deleteKasaIslem(id)
        setIslemler(prev => prev.filter(i => i.id !== id))
        // Bakiyeyi güncelle
        const newBakiye = await window.db.getKasaBakiye()
        setKasaBakiye(newBakiye)
      } catch (error) {
        console.error('İşlem silinemedi:', error)
        alert('İşlem silinirken bir hata oluştu')
      }
    }
  }

  // Filtreleme
  const filteredIslemler = islemler.filter(i => {
    const matchesSearch = 
      (i.aciklama?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (i.cari_unvan?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    
    const matchesFilter = filterType === 'ALL' || i.islem_tipi === filterType

    return matchesSearch && matchesFilter
  })

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
          <h1>Kasa</h1>
          <p>Kasa işlemlerinizi takip edin</p>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--accent-danger)' }}
            onClick={() => openModal('ODEME')}
          >
            <ArrowUpRight size={18} />
            Ödeme
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ color: 'var(--accent-success)' }}
            onClick={() => openModal('TAHSILAT')}
          >
            <ArrowDownRight size={18} />
            Tahsilat
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
          <div className="summary-card card-primary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Kasa Bakiyesi</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: kasaBakiye.bakiye >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {formatCurrency(kasaBakiye.bakiye)}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={24} color="white" />
              </div>
            </div>
          </div>

          <div className="summary-card card-danger">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Ödeme</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {formatCurrency(kasaBakiye.odeme)}
                  <TrendingDown size={20} />
                </div>
              </div>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowUpRight size={20} color="var(--accent-danger)" />
              </div>
            </div>
          </div>

          <div className="summary-card card-success">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Tahsilat</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {formatCurrency(kasaBakiye.tahsilat)}
                  <TrendingUp size={20} />
                </div>
              </div>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowDownRight size={20} color="var(--accent-success)" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="search-box">
            <Search />
            <input 
              type="text" 
              placeholder="Açıklama veya Cari Ara..." 
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
              className={`btn ${filterType === 'TAHSILAT' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('TAHSILAT')}
            >
              Tahsilatlar
            </button>
            <button 
              className={`btn ${filterType === 'ODEME' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('ODEME')}
            >
              Ödemeler
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Cari</th>
                <th>Açıklama</th>
                <th>İşlem Tipi</th>
                <th style={{ textAlign: 'right' }}>Tutar</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredIslemler.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <Wallet size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <div>Kayıtlı kasa işlemi bulunamadı</div>
                  </td>
                </tr>
              ) : (
                filteredIslemler.map((islem) => (
                  <tr key={islem.id}>
                    <td>{formatDate(islem.tarih)}</td>
                    <td>{islem.cari_unvan || '-'}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {islem.aciklama}
                    </td>
                    <td>
                      <span className={`status-badge ${islem.islem_tipi === 'TAHSILAT' ? 'success' : 'danger'}`}>
                        {islem.islem_tipi === 'TAHSILAT' ? 'Tahsilat' : 'Ödeme'}
                      </span>
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 600,
                      color: islem.islem_tipi === 'TAHSILAT' ? 'var(--accent-success)' : 'var(--accent-danger)'
                    }}>
                      {islem.islem_tipi === 'TAHSILAT' ? '+' : '-'}{formatCurrency(islem.tutar)}
                    </td>
                    <td>
                      <button 
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === islem.id ? null : islem.id)
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeMenu === islem.id && (
                        <div className="dropdown-menu">
                          <button 
                            className="dropdown-item danger"
                            onClick={() => handleDelete(islem.id)}
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

      {/* Yeni İşlem Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>
                {modalType === 'TAHSILAT' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowDownRight size={20} color="var(--accent-success)" />
                    Yeni Tahsilat
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowUpRight size={20} color="var(--accent-danger)" />
                    Yeni Ödeme
                  </span>
                )}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Cari Hesap (Opsiyonel)</label>
                    <select 
                      name="cariId" 
                      value={formData.cariId} 
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz (Cari bağlanmadan işlem)...</option>
                      {cariler.map(cari => (
                        <option key={cari.id} value={cari.id}>
                          {cari.kod} - {cari.unvan}
                        </option>
                      ))}
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
                    <label>Tutar</label>
                    <input 
                      type="number" 
                      name="tutar" 
                      value={formData.tutar} 
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Açıklama</label>
                    <textarea 
                      name="aciklama" 
                      value={formData.aciklama} 
                      onChange={handleInputChange}
                      rows={3}
                      required
                      placeholder={modalType === 'TAHSILAT' ? 'Örn: Nakit tahsilat, Havale, Çek...' : 'Örn: Nakit ödeme, Fatura ödemesi...'}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={formLoading}
                  style={{ 
                    background: modalType === 'TAHSILAT' ? 'var(--accent-success)' : 'var(--accent-danger)' 
                  }}
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  {modalType === 'TAHSILAT' ? 'Tahsilat Ekle' : 'Ödeme Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Kasa
