import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  ArrowUpDown,
  Loader2
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
  activeMenu: string | null
  setActiveMenu: (id: string | null) => void
  onViewEkstre: (id: string) => void
  onDelete: (id: string) => void
}

const AnimatedCariRow: React.FC<AnimatedCariRowProps> = ({ 
  cari, 
  index, 
  activeMenu, 
  setActiveMenu, 
  onViewEkstre,
  onDelete
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
      <td style={{ textAlign: 'center', position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setActiveMenu(activeMenu === cari.id ? null : cari.id)
          }}
          style={{
            padding: 8,
            background: 'transparent',
            border: 'none',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <MoreVertical size={18} />
        </button>
        
        {activeMenu === cari.id && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10,
            minWidth: 160,
            animation: 'fadeIn 0.2s ease'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewEkstre(cari.id)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Eye size={16} />
              Ekstre Görüntüle
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Edit modal
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Edit size={16} />
              Düzenle
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`"${cari.unvan}" silinecek. Emin misiniz?`)) {
                  onDelete(cari.id)
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-danger)',
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={16} />
              Sil
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

interface CariListesiProps {
  filter?: 'borclu' | 'alacakli'
}

const CariListesi: React.FC<CariListesiProps> = ({ filter }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [cariler, setCariler] = useState<CariData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

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
    if (activeMenu) {
      const handleClickOutside = () => setActiveMenu(null)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [activeMenu])

  // Filtre uygula
  const getFilteredCariler = () => {
    let result = cariler

    // Bakiye türüne göre filtrele
    if (filter === 'borclu') {
      result = result.filter(cari => cari.bakiye_turu === 'B')
    } else if (filter === 'alacakli') {
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

    return result
  }

  const filteredCariler = getFilteredCariler()

  const handleViewEkstre = (cariId: string) => {
    navigate(`/ekstre/${cariId}`)
  }

  const handleDelete = async (cariId: string) => {
    try {
      await window.db.deleteCari(cariId)
      setCariler(prev => prev.filter(c => c.id !== cariId))
      setActiveMenu(null)
    } catch (error) {
      console.error('Cari silinemedi:', error)
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
          <button className="btn btn-primary">
            <Plus size={18} />
            Yeni Cari
          </button>
        </div>
      </div>

      <div className="page-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 85px)' }}>
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
          <div style={{
            padding: 20,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Toplam Cari
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
              {cariler.length}
            </div>
          </div>
          <div style={{
            padding: 20,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12
          }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Toplam Borçlu
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-danger)' }}>
              {formatCurrency(toplamBorc)}
            </div>
          </div>
          <div style={{
            padding: 20,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12
          }}>
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
            animationDelay: '0.15s'
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
            <button className="btn btn-secondary" style={{ padding: '10px 16px' }}>
              <Filter size={16} />
              Filtrele
            </button>
            <button className="btn btn-secondary" style={{ padding: '10px 16px' }}>
              <ArrowUpDown size={16} />
              Sırala
            </button>
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
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onViewEkstre={handleViewEkstre}
                  onDelete={handleDelete}
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
    </>
  )
}

export default CariListesi
