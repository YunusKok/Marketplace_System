import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  CreditCard, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical, 
  Loader2,
  X,
  Check,
  Ban,
  FileText,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Edit
} from 'lucide-react'

// Tipler
interface CekSenet {
  id: string
  cari_id?: string
  tip: 'CEK' | 'SENET'
  numara?: string
  banka?: string
  vade_tarihi: string
  tutar: number
  durum: 'BEKLEMEDE' | 'TAHSIL_EDILDI' | 'IPTAL'
  aciklama?: string
  olusturma_tarihi?: string
  cari_unvan?: string
}

interface CariSimple {
  id: string
  unvan: string
  kod: string
}

interface CekSenetOzet {
  toplamCek: number
  toplamSenet: number
  bekleyen: number
  tahsilEdilen: number
  bekleyenAdet: number
  tahsilEdilenAdet: number
}

interface FormData {
  cariId: string
  tip: 'CEK' | 'SENET'
  numara: string
  banka: string
  vadeTarihi: string
  tutar: string
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
    if (dateString.includes('.')) {
      return dateString
    }
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR')
  } catch {
    return dateString
  }
}

const CekSenet: React.FC = () => {
  const location = useLocation()
  // State
  const [cekSenetler, setCekSenetler] = useState<CekSenet[]>([])
  const [cariler, setCariler] = useState<CariSimple[]>([])
  const [ozet, setOzet] = useState<CekSenetOzet>({ 
    toplamCek: 0, 
    toplamSenet: 0, 
    bekleyen: 0, 
    tahsilEdilen: 0, 
    bekleyenAdet: 0, 
    tahsilEdilenAdet: 0 
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTip, setFilterTip] = useState<'ALL' | 'CEK' | 'SENET'>('ALL')
  const [filterDurum, setFilterDurum] = useState<'ALL' | 'BEKLEMEDE' | 'TAHSIL_EDILDI' | 'IPTAL'>('ALL')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  
  // Custom Filter Dropdown States
  const [showFilterTipDropdown, setShowFilterTipDropdown] = useState(false)
  const [showFilterDurumDropdown, setShowFilterDurumDropdown] = useState(false)

  // Custom Filter Labels
  const getFilterTipLabel = () => {
    switch (filterTip) {
      case 'CEK': return 'Çek'
      case 'SENET': return 'Senet'
      default: return 'Tüm Tipler'
    }
  }

  const getFilterDurumLabel = () => {
    switch (filterDurum) {
      case 'BEKLEMEDE': return 'Beklemede'
      case 'TAHSIL_EDILDI': return 'Tahsil Edildi'
      case 'IPTAL': return 'İptal'
      default: return 'Tüm Durumlar'
    }
  }

  // Location state'den filtreyi al
  useEffect(() => {
    if (location.state && (location.state as any).filterDurum) {
      setFilterDurum((location.state as any).filterDurum)
      // State'i temizle (opsiyonel)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    cariId: '',
    tip: 'CEK',
    numara: '',
    banka: '',
    vadeTarihi: new Date().toLocaleDateString('tr-TR'),
    tutar: '',
    aciklama: ''
  })

  // Veri yükleme
  useEffect(() => {
    fetchData()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    if (activeMenu || showFilterTipDropdown || showFilterDurumDropdown) {
      const handleClickOutside = () => {
        setActiveMenu(null)
        setShowFilterTipDropdown(false)
        setShowFilterDurumDropdown(false)
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [activeMenu, showFilterTipDropdown, showFilterDurumDropdown])

  const fetchData = async () => {
    try {
      const [cekSenetData, ozetData, carilerData] = await Promise.all([
        window.db.getCekSenetler(),
        window.db.getCekSenetOzet(),
        window.db.getCariler()
      ])
      setCekSenetler(cekSenetData)
      setOzet(ozetData)
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
  const openModal = (cekSenet?: CekSenet) => {
    if (cekSenet) {
      setEditingId(cekSenet.id)
      setFormData({
        cariId: cekSenet.cari_id || '',
        tip: cekSenet.tip,
        numara: cekSenet.numara || '',
        banka: cekSenet.banka || '',
        vadeTarihi: formatDate(cekSenet.vade_tarihi),
        tutar: cekSenet.tutar.toString(),
        aciklama: cekSenet.aciklama || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        cariId: '',
        tip: 'CEK',
        numara: '',
        banka: '',
        vadeTarihi: new Date().toLocaleDateString('tr-TR'),
        tutar: '',
        aciklama: ''
      })
    }
    setShowModal(true)
  }

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tutar || !formData.vadeTarihi) {
      alert('Lütfen zorunlu alanları doldurun')
      return
    }

    setFormLoading(true)
    try {
      if (editingId) {
        await window.db.updateCekSenet(editingId, {
          cariId: formData.cariId || undefined,
          tip: formData.tip,
          numara: formData.numara,
          banka: formData.banka,
          vadeTarihi: formData.vadeTarihi,
          tutar: parseFloat(formData.tutar),
          aciklama: formData.aciklama
        })
      } else {
        await window.db.addCekSenet({
          cariId: formData.cariId || undefined,
          tip: formData.tip,
          numara: formData.numara,
          banka: formData.banka,
          vadeTarihi: formData.vadeTarihi,
          tutar: parseFloat(formData.tutar),
          aciklama: formData.aciklama
        })
      }

      // Verileri güncelle
      const [newCekSenetler, newOzet] = await Promise.all([
        window.db.getCekSenetler(),
        window.db.getCekSenetOzet()
      ])
      setCekSenetler(newCekSenetler)
      setOzet(newOzet)
      
      setShowModal(false)
    } catch (error) {
      console.error('İşlem eklenemedi:', error)
      alert('İşlem eklenirken bir hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bu çek/senedi silmek istediğinize emin misiniz?')) {
      try {
        await window.db.deleteCekSenet(id)
        setCekSenetler(prev => prev.filter(i => i.id !== id))
        // Özeti güncelle
        const newOzet = await window.db.getCekSenetOzet()
        setOzet(newOzet)
      } catch (error) {
        console.error('İşlem silinemedi:', error)
        alert('İşlem silinirken bir hata oluştu')
      }
    }
  }

  const handleDurumChange = async (id: string, durum: 'BEKLEMEDE' | 'TAHSIL_EDILDI' | 'IPTAL') => {
    try {
      await window.db.updateCekSenet(id, { durum })
      const [newCekSenetler, newOzet] = await Promise.all([
        window.db.getCekSenetler(),
        window.db.getCekSenetOzet()
      ])
      setCekSenetler(newCekSenetler)
      setOzet(newOzet)
      setActiveMenu(null)
    } catch (error) {
      console.error('Durum güncellenemedi:', error)
      alert('Durum güncellenirken bir hata oluştu')
    }
  }

  // Filtreleme
  const filteredCekSenetler = cekSenetler.filter(cs => {
    const matchesSearch = 
      (cs.numara?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (cs.banka?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (cs.cari_unvan?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    
    const matchesTip = filterTip === 'ALL' || cs.tip === filterTip
    const matchesDurum = filterDurum === 'ALL' || cs.durum === filterDurum

    return matchesSearch && matchesTip && matchesDurum
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
          <h1>Çek / Senet</h1>
          <p>Çek ve senet takibinizi yönetin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} />
            Yeni Çek/Senet
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
          <div 
            className="summary-card card-info"
            style={{ transition: 'all 0.2s ease', border: '1px solid transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-info)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Çek</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-info)' }}>
                  {formatCurrency(ozet.toplamCek)}
                </div>
              </div>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCard size={20} color="var(--accent-info)" />
              </div>
            </div>
          </div>

          <div 
            className="summary-card card-primary"
            style={{ transition: 'all 0.2s ease', border: '1px solid transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Senet</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {formatCurrency(ozet.toplamSenet)}
                </div>
              </div>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="var(--accent-primary)" />
              </div>
            </div>
          </div>

          <div 
            className="summary-card card-warning"
            style={{ transition: 'all 0.2s ease', border: '1px solid transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-warning)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Bekleyen ({ozet.bekleyenAdet} adet)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {formatCurrency(ozet.bekleyen)}
                  <Clock size={20} />
                </div>
              </div>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 10, 
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} color="var(--accent-warning)" />
              </div>
            </div>
          </div>

          <div 
            className="summary-card card-success"
            style={{ transition: 'all 0.2s ease', border: '1px solid transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-success)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Tahsil Edilen ({ozet.tahsilEdilenAdet} adet)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {formatCurrency(ozet.tahsilEdilen)}
                  <CheckCircle2 size={20} />
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
                <Check size={20} color="var(--accent-success)" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        {/* Filtreler */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div 
            className="search-box"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 10, 
              padding: '0 14px', 
              width: 320,
              height: 42,
              transition: 'all 0.2s ease'
            }}
          >
            <Search size={18} style={{ color: 'var(--text-muted)', marginRight: 10 }} />
            <input 
              type="text" 
              placeholder="Numara, Banka veya Cari Ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                outline: 'none', 
                height: '100%', 
                width: '100%', 
                color: 'var(--text-primary)',
                fontSize: 14
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Filter Tip Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className="form-input" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFilterTipDropdown(!showFilterTipDropdown)
                  setShowFilterDurumDropdown(false)
                }}
                style={{ 
                  minWidth: 140, 
                  height: 42,
                  padding: '0 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: showFilterTipDropdown ? 'var(--bg-card-hover)' : 'var(--bg-secondary)'
                }}
              >
                <span>{getFilterTipLabel()}</span>
                <div style={{ marginLeft: 8, opacity: 0.5 }}>▼</div>
              </button>
              
              {showFilterTipDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                  zIndex: 9999,
                  minWidth: 160,
                  animation: 'fadeIn 0.2s ease',
                  overflow: 'hidden'
                }}>
                  {[
                    { value: 'ALL', label: 'Tüm Tipler' },
                    { value: 'CEK', label: 'Çek' },
                    { value: 'SENET', label: 'Senet' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterTip(opt.value as any)
                        setShowFilterTipDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: filterTip === opt.value ? 'var(--bg-card-hover)' : 'transparent',
                        border: 'none',
                        color: filterTip === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = filterTip === opt.value ? 'var(--bg-card-hover)' : 'transparent'}
                    >
                      {opt.label}
                      {filterTip === opt.value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Durum Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className="form-input" 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFilterDurumDropdown(!showFilterDurumDropdown)
                  setShowFilterTipDropdown(false)
                }}
                style={{ 
                  minWidth: 160, 
                  height: 42,
                  padding: '0 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: showFilterDurumDropdown ? 'var(--bg-card-hover)' : 'var(--bg-secondary)'
                }}
              >
                <span>{getFilterDurumLabel()}</span>
                <div style={{ marginLeft: 8, opacity: 0.5 }}>▼</div>
              </button>

              {showFilterDurumDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                  zIndex: 9999,
                  minWidth: 180,
                  animation: 'fadeIn 0.2s ease',
                  overflow: 'hidden'
                }}>
                  {[
                    { value: 'ALL', label: 'Tüm Durumlar' },
                    { value: 'BEKLEMEDE', label: 'Beklemede' },
                    { value: 'TAHSIL_EDILDI', label: 'Tahsil Edildi' },
                    { value: 'IPTAL', label: 'İptal' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterDurum(opt.value as any)
                        setShowFilterDurumDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: filterDurum === opt.value ? 'var(--bg-card-hover)' : 'transparent',
                        border: 'none',
                        color: filterDurum === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)',
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = filterDurum === opt.value ? 'var(--bg-card-hover)' : 'transparent'}
                    >
                      {opt.label}
                      {filterDurum === opt.value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tip</th>
                <th>Numara</th>
                <th>Cari</th>
                <th>Banka</th>
                <th>Vade Tarihi</th>
                <th style={{ textAlign: 'right' }}>Tutar</th>
                <th>Durum</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredCekSenetler.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <CreditCard size={48} style={{ marginBottom: 10, opacity: 0.5 }} />
                    <div>Kayıtlı çek/senet bulunamadı</div>
                  </td>
                </tr>
              ) : (
                filteredCekSenetler.map((cs) => (
                  <tr key={cs.id}>
                    <td>
                      <span className={`status-badge ${cs.tip === 'CEK' ? 'info' : 'primary'}`}>
                        {cs.tip === 'CEK' ? 'Çek' : 'Senet'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{cs.numara || '-'}</td>
                    <td>{cs.cari_unvan || '-'}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={14} style={{ opacity: 0.6 }} />
                        {cs.banka || '-'}
                      </span>
                    </td>
                    <td>{formatDate(cs.vade_tarihi)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(cs.tutar)}
                    </td>
                    <td>
                      <span className={`status-badge ${
                        cs.durum === 'TAHSIL_EDILDI' ? 'success' : 
                        cs.durum === 'IPTAL' ? 'danger' : 'warning'
                      }`}>
                        {cs.durum === 'TAHSIL_EDILDI' ? 'Tahsil Edildi' : 
                         cs.durum === 'IPTAL' ? 'İptal' : 'Beklemede'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === cs.id ? null : cs.id)
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {activeMenu === cs.id && (
                        <div className="dropdown-menu">
                          <button 
                            className="dropdown-item"
                            onClick={() => { setActiveMenu(null); openModal(cs) }}
                          >
                            <Edit size={16} />
                            Düzenle
                          </button>
                          {cs.durum === 'BEKLEMEDE' && (
                            <>
                              <button 
                                className="dropdown-item success"
                                onClick={() => handleDurumChange(cs.id, 'TAHSIL_EDILDI')}
                              >
                                <Check size={16} />
                                Tahsil Et
                              </button>
                              <button 
                                className="dropdown-item warning"
                                onClick={() => handleDurumChange(cs.id, 'IPTAL')}
                              >
                                <Ban size={16} />
                                İptal Et
                              </button>
                            </>
                          )}
                          {cs.durum !== 'BEKLEMEDE' && (
                            <button 
                              className="dropdown-item"
                              onClick={() => handleDurumChange(cs.id, 'BEKLEMEDE')}
                            >
                              <Clock size={16} />
                              Bekleyene Al
                            </button>
                          )}
                          <button 
                            className="dropdown-item danger"
                            onClick={() => handleDelete(cs.id)}
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

      {/* Yeni/Düzenle Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 550, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={20} color="var(--accent-primary)" />
                  {editingId ? 'Çek/Senet Düzenle' : 'Yeni Çek/Senet'}
                </span>
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tip *</label>
                    <select 
                      name="tip" 
                      value={formData.tip} 
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="CEK">Çek</option>
                      <option value="SENET">Senet</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Numara</label>
                    <input 
                      type="text" 
                      name="numara" 
                      value={formData.numara} 
                      onChange={handleInputChange}
                      placeholder="Çek/Senet numarası"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Cari Hesap</label>
                    <select 
                      name="cariId" 
                      value={formData.cariId} 
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Seçiniz (Opsiyonel)...</option>
                      {cariler.map(cari => (
                        <option key={cari.id} value={cari.id}>
                          {cari.kod} - {cari.unvan}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Banka</label>
                    <input 
                      type="text" 
                      name="banka" 
                      value={formData.banka} 
                      onChange={handleInputChange}
                      placeholder="Banka adı"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Vade Tarihi *</label>
                    <input 
                      type="text" 
                      name="vadeTarihi" 
                      value={formData.vadeTarihi} 
                      onChange={handleInputChange}
                      placeholder="GG.AA.YYYY"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Tutar *</label>
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
                      rows={2}
                      placeholder="Ek notlar..."
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
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default CekSenet
