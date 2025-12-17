import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  ArrowUpDown,
  Loader2,
  X,
  Check
} from 'lucide-react'

// Veritabanından gelen cari tipi
interface CariData {
  id: string
  kod: string
  unvan: string
  yetkili?: string
  telefon?: string
  adres?: string
  vergi_dairesi?: string
  vergi_no?: string
  bakiye: number
  bakiye_turu: string
  tip?: string
}

// Sıralama seçenekleri
type SortField = 'kod' | 'unvan' | 'bakiye'
type SortDirection = 'asc' | 'desc'

// Filtre seçenekleri
type FilterType = 'all' | 'borclu' | 'alacakli'

// Form veri tipi
interface CariFormData {
  kod: string
  unvan: string
  yetkili: string
  telefon: string
  adres: string
  vergiDairesi: string
  vergiNo: string
  tip: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ₺'
}

// Animated Cari Row Component
interface AnimatedCariRowProps {
  cari: CariData
  index: number
  onViewEkstre: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (cari: CariData) => void
}

const AnimatedCariRow: React.FC<AnimatedCariRowProps> = ({ 
  cari, 
  index, 
  onViewEkstre,
  onDelete,
  onEdit
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const currentRef = rowRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, index * 50)
        } else {
          setIsVisible(false)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      }
    )

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [index])

  return (
    <tr
      ref={rowRef}
      style={{
        cursor: 'pointer',
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? isHovered 
            ? 'translateY(0) scale(1.01)' 
            : 'translateY(0) scale(1)' 
          : 'translateY(20px) scale(0.95)',
        background: isHovered ? 'var(--bg-card-hover)' : 'transparent',
        boxShadow: isHovered ? '0 4px 12px rgba(99, 102, 241, 0.1)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1,
        position: 'relative'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewEkstre(cari.id)}
    >
      <td>
        <span style={{ 
          fontWeight: 600, 
          color: 'var(--accent-primary)' 
        }}>
          {cari.kod}
        </span>
      </td>
      <td>
        <div style={{ fontWeight: 500 }}>{cari.unvan}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cari.adres || '-'}</div>
      </td>
      <td>{cari.yetkili || '-'}</td>
      <td>{cari.telefon || '-'}</td>
      <td style={{ textAlign: 'right' }}>
        <span className={`bakiye-tag ${cari.bakiye_turu === 'A' ? 'alacak' : 'borc'}`}>
          {formatCurrency(cari.bakiye)} {cari.bakiye_turu}
        </span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewEkstre(cari.id)
            }}
            title="Ekstre Görüntüle"
            style={{
              padding: 6,
              background: 'rgba(59, 130, 246, 0.1)',
              border: 'none',
              borderRadius: 6,
              color: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
          >
            <Eye size={18} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(cari)
            }}
            title="Düzenle"
            style={{
              padding: 6,
              background: 'rgba(245, 158, 11, 0.1)',
              border: 'none',
              borderRadius: 6,
              color: '#f59e0b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'}
          >
            <Edit size={18} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm(`"${cari.unvan}" silinecek. Emin misiniz?`)) {
                onDelete(cari.id)
              }
            }}
            title="Sil"
            style={{
              padding: 6,
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              borderRadius: 6,
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface CariListesiProps {
  filter?: 'borclu' | 'alacakli'
}

const CariListesi: React.FC<CariListesiProps> = ({ filter }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [cariler, setCariler] = useState<CariData[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingCari, setEditingCari] = useState<CariData | null>(null)
  const [formData, setFormData] = useState<CariFormData>({
    kod: '',
    unvan: '',
    yetkili: '',
    telefon: '',
    adres: '',
    vergiDairesi: '',
    vergiNo: '',
    tip: 'DIGER'
  })
  const [formLoading, setFormLoading] = useState(false)
  
  // Filter & Sort states
  const [localFilter, setLocalFilter] = useState<FilterType>('all')
  const [sortField, setSortField] = useState<SortField>('kod')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Location state'den filtreyi al
  useEffect(() => {
    if (location.state && (location.state as any).filter) {
      setLocalFilter((location.state as any).filter)
      // State'i temizle ki sayfa yenilendiğinde kalmasın (opsiyonel)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // Veritabanından carileri çek
  useEffect(() => {
    const fetchCariler = async () => {
      try {
        const data = await window.db.getCariler()
        setCariler(data)
      } catch (error) {
        console.error('Cariler alınamadı:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCariler()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    if (showFilterDropdown || showSortDropdown) {
      const handleClickOutside = () => {
        setShowFilterDropdown(false)
        setShowSortDropdown(false)
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [showFilterDropdown, showSortDropdown])

  // Modal açma/kapatma
  const openNewCariModal = () => {
    setEditingCari(null)
    setFormData({
      kod: '',
      unvan: '',
      yetkili: '',
      telefon: '',
      adres: '',
      vergiDairesi: '',
      vergiNo: '',
      tip: 'DIGER'
    })
    setShowModal(true)
  }

  const openEditCariModal = (cari: CariData) => {
    setEditingCari(cari)
    setFormData({
      kod: cari.kod,
      unvan: cari.unvan,
      yetkili: cari.yetkili || '',
      telefon: cari.telefon || '',
      adres: cari.adres || '',
      vergiDairesi: cari.vergi_dairesi || '',
      vergiNo: cari.vergi_no || '',
      tip: cari.tip || 'DIGER'
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCari(null)
    setFormData({
      kod: '',
      unvan: '',
      yetkili: '',
      telefon: '',
      adres: '',
      vergiDairesi: '',
      vergiNo: '',
      tip: 'DIGER'
    })
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.kod || !formData.unvan) {
      alert('Kod ve Ünvan alanları zorunludur!')
      return
    }
    
    setFormLoading(true)
    
    try {
      if (editingCari) {
        // Cari güncelle
        const updatedCari = await window.db.updateCari(editingCari.id, {
          kod: formData.kod,
          unvan: formData.unvan,
          yetkili: formData.yetkili || undefined,
          telefon: formData.telefon || undefined,
          adres: formData.adres || undefined,
          vergiDairesi: formData.vergiDairesi || undefined,
          vergiNo: formData.vergiNo || undefined,
          tip: formData.tip
        })
        
        if (!updatedCari) {
          throw new Error('Güncelleme başarısız oldu')
        }
        
        // State'i güncelle
        setCariler(prev => prev.map(c => 
          c.id === editingCari.id 
            ? updatedCari
            : c
        ))
      } else {
        // Yeni cari ekle
        const newCari = await window.db.addCari({
          kod: formData.kod,
          unvan: formData.unvan,
          yetkili: formData.yetkili || undefined,
          telefon: formData.telefon || undefined,
          adres: formData.adres || undefined,
          vergiDairesi: formData.vergiDairesi || undefined,
          vergiNo: formData.vergiNo || undefined,
          tip: formData.tip
        })
        
        // Yeni cariyi listeye ekle
        const data = await window.db.getCariler()
        setCariler(data)
        console.log('Yeni cari eklendi:', newCari)
      }
      
      closeModal()
    } catch (error) {
      console.error('Cari kaydedilemedi:', error)
      alert('Cari kaydedilirken bir hata oluştu!')
    } finally {
      setFormLoading(false)
    }
  }

  // Filtre uygula
  const getFilteredCariler = () => {
    let result = cariler

    // Props'tan gelen bakiye türüne göre filtrele
    if (filter === 'borclu') {
      result = result.filter(cari => cari.bakiye_turu === 'B')
    } else if (filter === 'alacakli') {
      result = result.filter(cari => cari.bakiye_turu === 'A')
    }
    
    // Dropdown'dan seçilen filtre
    if (localFilter === 'borclu') {
      result = result.filter(cari => cari.bakiye_turu === 'B')
    } else if (localFilter === 'alacakli') {
      result = result.filter(cari => cari.bakiye_turu === 'A')
    }

    // Arama terimine göre filtrele
    if (searchTerm) {
      result = result.filter(cari =>
        cari.unvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cari.kod.includes(searchTerm) ||
        cari.yetkili?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Sıralama uygula
    result = [...result].sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'kod') {
        comparison = a.kod.localeCompare(b.kod)
      } else if (sortField === 'unvan') {
        comparison = a.unvan.localeCompare(b.unvan)
      } else if (sortField === 'bakiye') {
        comparison = a.bakiye - b.bakiye
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }

  const filteredCariler = getFilteredCariler()

  const handleViewEkstre = (cariId: string) => {
    navigate(`/ekstre/${cariId}`)
  }

  const handleDelete = async (cariId: string) => {
    try {
      const success = await window.db.deleteCari(cariId)
      if (success) {
        setCariler(prev => prev.filter(c => c.id !== cariId))
        // Başarılı uyarısı opsiyonel
      } else {
        alert('Cari silinemedi! İşlem veritabanında gerçekleştirilemedi.')
      }
    } catch (error) {
      console.error('Cari silinemedi:', error)
      alert('Silme sırasında bir hata oluştu.')
    }
  }

  const handleExportExcel = async () => {
    try {
      const result = await window.db.exportToExcel('cariler')
      if (result.success) {
        alert(`Excel dosyası kaydedildi: ${result.filePath}`)
      } else {
        alert(`Hata: ${result.error}`)
      }
    } catch (error) {
      console.error('Excel export hatası:', error)
    }
  }

  // Toplam hesaplamaları
  const toplamBorc = cariler
    .filter(c => c.bakiye_turu === 'B')
    .reduce((sum, c) => sum + c.bakiye, 0)
  
  const toplamAlacak = cariler
    .filter(c => c.bakiye_turu === 'A')
    .reduce((sum, c) => sum + c.bakiye, 0)
  
  // Filter label
  const getFilterLabel = () => {
    switch (localFilter) {
      case 'borclu': return 'Borçlular'
      case 'alacakli': return 'Alacaklılar'
      default: return 'Tümü'
    }
  }
  
  // Sort label
  const getSortLabel = () => {
    const fieldLabel = sortField === 'kod' ? 'Kod' : sortField === 'unvan' ? 'Ünvan' : 'Bakiye'
    const dirLabel = sortDirection === 'asc' ? '↑' : '↓'
    return `${fieldLabel} ${dirLabel}`
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'var(--text-secondary)'
      }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: 12 }}>Yükleniyor...</span>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>
            {filter === 'borclu' ? 'Borçlu Cariler' : 
             filter === 'alacakli' ? 'Alacaklı Cariler' : 
             'Cariler'}
          </h1>
          <p>
            {filter === 'borclu' ? 'Borçlu cari hesaplarınız' : 
             filter === 'alacakli' ? 'Alacaklı cari hesaplarınız' : 
             'Tüm cari hesaplarınızı yönetin'}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            <Download size={18} />
            Dışa Aktar
          </button>
          <button className="btn btn-primary" onClick={openNewCariModal}>
            <Plus size={18} />
            Yeni Cari
          </button>
        </div>
      </div>

      <div className="page-content" style={{ overflowY: 'auto', height: 'calc(100vh - 85px)', paddingBottom: 200 }}>
        {/* Summary Cards */}
        <div 
          className="animate-fade-in"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: 20, 
            marginBottom: 24 
          }}
        >
          <div 
            onClick={() => setLocalFilter('all')}
            className={`summary-card card-primary ${localFilter === 'all' ? 'active-all' : ''}`}
          >
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Toplam Cari
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
              {cariler.length}
            </div>
          </div>
          <div 
            onClick={() => setLocalFilter('borclu')}
            className={`summary-card card-danger ${localFilter === 'borclu' ? 'active-borclu' : ''}`}
          >
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Toplam Borçlu
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-danger)' }}>
              {formatCurrency(toplamBorc)}
            </div>
          </div>
          <div 
            onClick={() => setLocalFilter('alacakli')}
            className={`summary-card card-success ${localFilter === 'alacakli' ? 'active-alacakli' : ''}`}
          >
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Toplam Alacaklı
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-success)' }}>
              {formatCurrency(toplamAlacak)}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div 
          className="animate-fade-in"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 20,
            animationDelay: '0.15s',
            position: 'relative',
            zIndex: 50
          }}
        >
          <div className="search-box">
            <Search />
            <input
              type="text"
              placeholder="Cari ara... (Kod, Ünvan, Yetkili)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Filtrele Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '10px 16px' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFilterDropdown(!showFilterDropdown)
                  setShowSortDropdown(false)
                }}
              >
                <Filter size={16} />
                {getFilterLabel()}
              </button>
              {showFilterDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                  zIndex: 1000,
                  minWidth: 140,
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <button
                    onClick={() => { setLocalFilter('all'); setShowFilterDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: localFilter === 'all' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Tümü
                    {localFilter === 'all' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                  <button
                    onClick={() => { setLocalFilter('borclu'); setShowFilterDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: localFilter === 'borclu' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--accent-danger)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Borçlular
                    {localFilter === 'borclu' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                  <button
                    onClick={() => { setLocalFilter('alacakli'); setShowFilterDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: localFilter === 'alacakli' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--accent-success)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Alacaklılar
                    {localFilter === 'alacakli' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                </div>
              )}
            </div>
            
            {/* Sırala Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '10px 16px' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSortDropdown(!showSortDropdown)
                  setShowFilterDropdown(false)
                }}
              >
                <ArrowUpDown size={16} />
                {getSortLabel()}
              </button>
              {showSortDropdown && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
                  zIndex: 1000,
                  minWidth: 160,
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Sıralama Alanı</div>
                  <button
                    onClick={() => { setSortField('kod'); setShowSortDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: sortField === 'kod' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Kod
                    {sortField === 'kod' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                  <button
                    onClick={() => { setSortField('unvan'); setShowSortDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: sortField === 'unvan' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Ünvan
                    {sortField === 'unvan' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                  <button
                    onClick={() => { setSortField('bakiye'); setShowSortDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: sortField === 'bakiye' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Bakiye
                    {sortField === 'bakiye' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                  <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>Yön</div>
                  <button
                    onClick={() => { setSortDirection('asc'); setShowSortDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: sortDirection === 'asc' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Artan ↑
                    {sortDirection === 'asc' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                  <button
                    onClick={() => { setSortDirection('desc'); setShowSortDropdown(false) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: sortDirection === 'desc' ? 'var(--bg-card-hover)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    Azalan ↓
                    {sortDirection === 'desc' && <Check size={16} color="var(--accent-primary)" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cari Table */}
        <div 
          className="data-card"
          style={{
            marginBottom: 32
          }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Ünvan</th>
                <th>Yetkili</th>
                <th>Telefon</th>
                <th style={{ textAlign: 'right' }}>Bakiye</th>
                <th style={{ textAlign: 'center', width: 100 }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredCariler.map((cari, index) => (
                <AnimatedCariRow
                  key={cari.id}
                  cari={cari}
                  index={index}
                  onViewEkstre={handleViewEkstre}
                  onDelete={handleDelete}
                  onEdit={openEditCariModal}
                />
              ))}
              {filteredCariler.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    {searchTerm ? 'Arama kriterlerine uygun cari bulunamadı' : 'Henüz cari eklenmemiş'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ height: 30 }} />
      </div>

      {/* Cari Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={closeModal}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 500,
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideUp 0.3s ease'
            }}

          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24
            }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {editingCari ? 'Cari Düzenle' : 'Yeni Cari Ekle'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>Cari Tipi</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '10px', 
                    borderRadius: 6, 
                    border: formData.tip === 'MUSTAHSIL' ? '1px solid #10b981' : '1px solid var(--border-color)',
                    background: formData.tip === 'MUSTAHSIL' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-default)',
                    color: formData.tip === 'MUSTAHSIL' ? '#10b981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="radio" 
                      name="tip" 
                      value="MUSTAHSIL" 
                      checked={formData.tip === 'MUSTAHSIL'} 
                      onChange={e => setFormData({...formData, tip: e.target.value})}
                      style={{ display: 'none' }}
                    />
                    🧑‍🌾 Müstahsil
                  </label>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '10px', 
                    borderRadius: 6, 
                    border: formData.tip === 'FIRMA' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    background: formData.tip === 'FIRMA' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-default)',
                    color: formData.tip === 'FIRMA' ? '#3b82f6' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="radio" 
                      name="tip" 
                      value="FIRMA" 
                      checked={formData.tip === 'FIRMA'} 
                      onChange={e => setFormData({...formData, tip: e.target.value})}
                      style={{ display: 'none' }}
                    />
                    🏢 Firma
                  </label>
                  <label style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '10px', 
                    borderRadius: 6, 
                    border: formData.tip === 'DIGER' ? '1px solid var(--text-secondary)' : '1px solid var(--border-color)',
                    background: formData.tip === 'DIGER' ? 'rgba(107, 114, 128, 0.1)' : 'var(--bg-default)',
                    color: formData.tip === 'DIGER' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: 13,
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="radio" 
                      name="tip" 
                      value="DIGER" 
                      checked={formData.tip === 'DIGER'} 
                      onChange={e => setFormData({...formData, tip: e.target.value})}
                      style={{ display: 'none' }}
                    />
                    Diğer
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Kod *
                  </label>
                  <input
                    type="text"
                    value={formData.kod}
                    onChange={(e) => setFormData({ ...formData, kod: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                    placeholder="Örn: 0001"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Ünvan *
                  </label>
                  <input
                    type="text"
                    value={formData.unvan}
                    onChange={(e) => setFormData({ ...formData, unvan: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                    placeholder="Firma veya kişi adı"
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                  Yetkili
                </label>
                <input
                  type="text"
                  value={formData.yetkili}
                  onChange={(e) => setFormData({ ...formData, yetkili: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: 14
                  }}
                  placeholder="Yetkili kişi"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                    placeholder="0532 xxx xxxx"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Adres
                  </label>
                  <input
                    type="text"
                    value={formData.adres}
                    onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                    placeholder="Adres"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Vergi Dairesi
                  </label>
                  <input
                    type="text"
                    value={formData.vergiDairesi}
                    onChange={(e) => setFormData({ ...formData, vergiDairesi: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                    placeholder="Vergi dairesi"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Vergi No
                  </label>
                  <input
                    type="text"
                    value={formData.vergiNo}
                    onChange={(e) => setFormData({ ...formData, vergiNo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14
                    }}
                    placeholder="Vergi numarası"
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Kaydediliyor...
                    </>
                  ) : editingCari ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default CariListesi
