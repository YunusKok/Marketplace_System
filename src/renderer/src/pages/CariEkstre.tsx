import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  X,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Building2
} from 'lucide-react'

// Database'den gelen veri tipleri
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

interface HareketData {
  id: string
  cari_id: string
  tarih: string
  aciklama: string
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

const formatDateForDisplay = (dateStr: string): string => {
  // Convert from YYYY-MM-DD or DD.MM.YYYY to DD.MM.YYYY
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-')
    return `${day}.${month}.${year}`
  }
  return dateStr
}



const parseDate = (dateStr: string): Date => {
  // Parse date from either format
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }
  return new Date(dateStr)
}

const CariEkstre: React.FC = () => {
  const { cariId } = useParams<{ cariId: string }>()
  const navigate = useNavigate()
  
  // State
  const [cari, setCari] = useState<CariData | null>(null)
  const [hareketler, setHareketler] = useState<HareketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  
  // Selection Mode State
  const [allCariler, setAllCariler] = useState<CariData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Date range filter
  const [showDateModal, setShowDateModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        if (!cariId) {
          // Load list for selection
          const carilerData = await window.db.getCariler()
          setAllCariler(carilerData)
          setLoading(false)
          return
        }

        setError(null)

        // Cari bilgilerini getir
        const cariData = await window.db.getCari(cariId)
        if (!cariData) {
          setError('Cari bulunamadı')
          setLoading(false)
          return
        }
        setCari(cariData)

        // Hareketleri getir
        const hareketlerData = await window.db.getHareketler(cariId)
        setHareketler(hareketlerData || [])
        
        // Set initial date range (first and last hareket dates)
        if (hareketlerData && hareketlerData.length > 0) {
          const dates = hareketlerData.map(h => parseDate(h.tarih)).sort((a, b) => a.getTime() - b.getTime())
          const firstDate = dates[0]
          const lastDate = dates[dates.length - 1]
          
          const formatForInput = (d: Date) => {
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          }
          
          setStartDate(formatForInput(firstDate))
          setEndDate(formatForInput(lastDate))
        }
      } catch (err) {
        console.error('Veri yüklenirken hata:', err)
        setError('Veriler yüklenirken bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [cariId])

  // Filtered Cariler for Selection Mode
  const filteredCariler = useMemo(() => {
    if (!searchTerm) return allCariler
    const lower = searchTerm.toLowerCase()
    return allCariler.filter(c => 
      c.unvan.toLowerCase().includes(lower) || 
      c.kod.toLowerCase().includes(lower)
    )
  }, [allCariler, searchTerm])

  // ... (Rest of existing hooks)

  // Filter hareketler by date range
  const filteredHareketler = useMemo(() => {
    if (!appliedStartDate && !appliedEndDate) {
      return hareketler
    }

    return hareketler.filter(h => {
      const hareketDate = parseDate(h.tarih)
      
      if (appliedStartDate) {
        const start = new Date(appliedStartDate)
        if (hareketDate < start) return false
      }
      
      if (appliedEndDate) {
        const end = new Date(appliedEndDate)
        end.setHours(23, 59, 59, 999) // Include the entire end day
        if (hareketDate > end) return false
      }
      
      return true
    })
  }, [hareketler, appliedStartDate, appliedEndDate])

  // Sort hareketler by date (oldest first for ekstre)
  const sortedHareketler = useMemo(() => {
    return [...filteredHareketler].sort((a, b) => {
      const dateA = parseDate(a.tarih)
      const dateB = parseDate(b.tarih)
      return dateA.getTime() - dateB.getTime()
    })
  }, [filteredHareketler])

  // Calculate totals
  const toplamBorc = useMemo(() => {
    return sortedHareketler.reduce((sum, h) => sum + h.borc, 0)
  }, [sortedHareketler])

  const toplamAlacak = useMemo(() => {
    return sortedHareketler.reduce((sum, h) => sum + h.alacak, 0)
  }, [sortedHareketler])

  const sonBakiye = useMemo(() => {
    if (sortedHareketler.length === 0) return null
    return sortedHareketler[sortedHareketler.length - 1]
  }, [sortedHareketler])

  // Get date range for display
  const dateRangeDisplay = useMemo(() => {
    if (appliedStartDate && appliedEndDate) {
      return `${formatDateForDisplay(appliedStartDate)} - ${formatDateForDisplay(appliedEndDate)}`
    }
    if (sortedHareketler.length > 0) {
      const firstDate = sortedHareketler[0].tarih
      const lastDate = sortedHareketler[sortedHareketler.length - 1].tarih
      return `${formatDateForDisplay(firstDate)} - ${formatDateForDisplay(lastDate)}`
    }
    return 'Tarih Aralığı'
  }, [appliedStartDate, appliedEndDate, sortedHareketler])

  // Apply date filter
  const applyDateFilter = () => {
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
    setShowDateModal(false)
  }

  // Clear date filter
  const clearDateFilter = () => {
    setAppliedStartDate('')
    setAppliedEndDate('')
    setStartDate('')
    setEndDate('')
    setShowDateModal(false)
  }

  // Export to Excel
  const handleExportExcel = async () => {
    if (!cariId) return
    
    try {
      setExporting(true)
      const result = await window.db.exportCariEkstre(cariId)
      
      if (!result.success && result.error !== 'İptal edildi') {
        alert(`Excel export hatası: ${result.error}`)
      }
    } catch (err) {
      console.error('Excel export error:', err)
      alert('Excel dosyası oluşturulurken bir hata oluştu')
    } finally {
      setExporting(false)
    }
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // Loading state
  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Veriler yükleniyor...</p>
        </div>
      </div>
    )
  }

  // SELECTION INTERFACE (When no cariId)
  if (!cariId) {
    // Calculate summary stats
    const toplamCari = allCariler.length
    const borcluCari = allCariler.filter(c => c.bakiye_turu === 'B').length
    const alacakliCari = allCariler.filter(c => c.bakiye_turu === 'A').length
    const toplamBakiye = allCariler.reduce((sum, c) => {
      return sum + (c.bakiye_turu === 'A' ? c.bakiye : -c.bakiye)
    }, 0)

    return (
      <>
        <div className="page-header">
          <div className="page-title">
            <h1>Cari Ekstre</h1>
            <p>Hesap hareketlerini görüntülemek için bir cari seçin</p>
          </div>
        </div>

        <div className="page-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 85px)' }}>
          {/* Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: 16,
            padding: 32,
            marginBottom: 32,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: '30%',
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  background: 'var(--gradient-primary)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
                }}>
                  <FileText size={28} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Cari Hesap Ekstresi</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Detaylı hesap hareketleri ve bakiye takibi</p>
                </div>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Users size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Toplam Cari</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{toplamCari}</div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TrendingDown size={16} color="var(--accent-danger)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Borçlu</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-danger)' }}>{borcluCari}</div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TrendingUp size={16} color="var(--accent-success)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Alacaklı</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)' }}>{alacakliCari}</div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Building2 size={16} color="var(--accent-warning)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Net Bakiye</span>
                  </div>
                  <div style={{ 
                    fontSize: 20, 
                    fontWeight: 700, 
                    color: toplamBakiye >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                  }}>
                    {formatCurrency(Math.abs(toplamBakiye))} {toplamBakiye >= 0 ? 'A' : 'B'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>Cari Seçimi</h3>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {filteredCariler.length} sonuç gösteriliyor
              </span>
            </div>
            <div className="search-box" style={{ width: '100%' }}>
              <Search />
              <input
                type="text"
                placeholder="Cari ara... (Kod veya Ünvan)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '14px 14px 14px 48px', fontSize: 15 }}
                autoFocus
              />
            </div>
          </div>

          {/* Grid List */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 20 
          }}>
            {filteredCariler.map((c, index) => (
              <div 
                key={c.id}
                onClick={() => navigate(`/ekstre/${c.id}`)}
                className={`summary-card ${c.bakiye_turu === 'A' ? 'card-success' : 'card-danger'}`}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 140,
                  animation: `fadeInUp 0.4s ease ${index * 0.03}s both`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ 
                      fontSize: 12, 
                      color: 'var(--accent-primary)', 
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.1)',
                      padding: '4px 8px',
                      borderRadius: 6
                    }}>
                      {c.kod}
                    </span>
                    {c.bakiye_turu === 'A' ? (
                      <TrendingUp size={16} color="var(--accent-success)" />
                    ) : (
                      <TrendingDown size={16} color="var(--accent-danger)" />
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 6, lineHeight: 1.3 }}>
                    {c.unvan}
                  </div>
                  {(c.yetkili || c.telefon) && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.yetkili && <span>{c.yetkili}</span>}
                      {c.yetkili && c.telefon && <span style={{ opacity: 0.5 }}>•</span>}
                      {c.telefon && <span>{c.telefon}</span>}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  marginTop: 16, 
                  paddingTop: 16, 
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Bakiye</div>
                    <span className={`bakiye-tag ${c.bakiye_turu === 'A' ? 'alacak' : 'borc'}`} style={{ fontSize: 14, padding: '6px 12px' }}>
                      {formatCurrency(c.bakiye)} ₺
                    </span>
                  </div>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            ))}
            
            {filteredCariler.length === 0 && (
              <div style={{ 
                gridColumn: '1/-1', 
                textAlign: 'center', 
                padding: 60, 
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                borderRadius: 16,
                border: '1px dashed var(--border-color)'
              }}>
                <Search size={56} style={{ marginBottom: 20, opacity: 0.3 }} />
                <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Sonuç Bulunamadı</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Aradığınız kriterlere uygun cari bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // Error state logic (only if carId exists but fetch failed)
  if (error || !cari) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--accent-danger)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-primary)', marginBottom: 16 }}>{error || 'Cari bulunamadı'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/cariler')}>
            <ArrowLeft size={18} />
            Listeye Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Cari Ekstre</h1>
            <p>{cari.kod} - {cari.unvan}</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setShowDateModal(true)}>
            <Calendar size={18} />
            Tarih Aralığı
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            Yazdır
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExportExcel}
            disabled={exporting}
          >
            {exporting ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
            Excel'e Aktar
          </button>
        </div>
      </div>

      <div className="page-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 85px)' }}>
        {/* Summary Cards Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 20, 
          marginBottom: 24 
        }}>
          <div className="stat-card card-primary" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                background: 'rgba(99, 102, 241, 0.15)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={22} color="var(--accent-primary)" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>İşlem Sayısı</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{sortedHareketler.length}</div>
          </div>

          <div className="stat-card card-danger" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                background: 'rgba(239, 68, 68, 0.15)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingDown size={22} color="var(--accent-danger)" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Toplam Borç</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-danger)' }}>
              {formatCurrency(toplamBorc)} ₺
            </div>
          </div>

          <div className="stat-card card-success" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                background: 'rgba(34, 197, 94, 0.15)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={22} color="var(--accent-success)" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Toplam Alacak</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)' }}>
              {formatCurrency(toplamAlacak)} ₺
            </div>
          </div>

          <div className="stat-card card-warning" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                background: sonBakiye?.bakiye_turu === 'A' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {sonBakiye?.bakiye_turu === 'A' 
                  ? <TrendingUp size={22} color="var(--accent-success)" />
                  : <TrendingDown size={22} color="var(--accent-danger)" />
                }
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Güncel Bakiye</span>
            </div>
            <div style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: sonBakiye?.bakiye_turu === 'A' ? 'var(--accent-success)' : 'var(--accent-danger)' 
            }}>
              {formatCurrency(sonBakiye?.bakiye || 0)} ₺
              <span style={{ 
                fontSize: 12, 
                marginLeft: 6, 
                padding: '2px 6px',
                background: sonBakiye?.bakiye_turu === 'A' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                borderRadius: 4
              }}>
                {sonBakiye?.bakiye_turu || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Cari Bilgi Kartı */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(26, 26, 37, 0.8) 100%)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '1px solid var(--border-color)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'var(--gradient-primary)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                }}>
                  <User size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{cari.unvan}</h2>
                  <span style={{ 
                    fontSize: 13, 
                    color: 'var(--accent-primary)', 
                    fontWeight: 500,
                    background: 'rgba(99, 102, 241, 0.1)',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}>
                    {cari.kod}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Dönem</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{dateRangeDisplay}</div>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 20,
              paddingTop: 20,
              borderTop: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 36, height: 36, 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-warning)'
                }}>
                  <Phone size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Telefon</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{cari.telefon || '-'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 36, height: 36, 
                  background: 'rgba(59, 130, 246, 0.15)', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-info)'
                }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Adres</div>
                  <div style={{ fontSize: 14, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cari.adres || '-'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ 
                  width: 36, height: 36, 
                  background: 'rgba(139, 92, 246, 0.15)', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8b5cf6'
                }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Vergi Dairesi</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{cari.vergi_dairesi || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ekstre Tablosu */}
        <div className="ekstre-table-wrapper">
          {sortedHareketler.length === 0 ? (
            <div style={{ 
              padding: 48, 
              textAlign: 'center', 
              color: 'var(--text-muted)' 
            }}>
              <FileText size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>Bu cari için hareket kaydı bulunamadı.</p>
            </div>
          ) : (
            <table className="ekstre-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Tarih</th>
                  <th>Açıklama</th>
                  <th style={{ textAlign: 'right', width: 140 }}>Borç</th>
                  <th style={{ textAlign: 'right', width: 140 }}>Alacak</th>
                  <th style={{ textAlign: 'right', width: 160 }}>Bakiye</th>
                </tr>
              </thead>
              <tbody>
                {sortedHareketler.map((hareket) => (
                  <tr key={hareket.id}>
                    <td style={{ fontWeight: 500 }}>{formatDateForDisplay(hareket.tarih)}</td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {hareket.islem_tipi === 'CEK' && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--accent-warning)',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                          }}>ÇEK</span>
                        )}
                        {hareket.islem_tipi === 'HAVALE' && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: 'var(--accent-success)',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                          }}>HAVALE</span>
                        )}
                        {hareket.islem_tipi === 'FATURA' && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--accent-primary)',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                          }}>FATURA</span>
                        )}
                        {hareket.islem_tipi === 'TAHSILAT' && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                          }}>TAHSİLAT</span>
                        )}
                        {hareket.islem_tipi === 'ODEME' && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                          }}>ÖDEME</span>
                        )}
                        {hareket.islem_tipi === 'MUSTAHSIL' && (
                          <span style={{
                            padding: '2px 6px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#a855f7',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600
                          }}>MÜSTAHSİL</span>
                        )}
                        {hareket.aciklama}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {hareket.borc > 0 ? (
                        <span className="amount borc">{formatCurrency(hareket.borc)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {hareket.alacak > 0 ? (
                        <span className="amount alacak">{formatCurrency(hareket.alacak)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`bakiye-tag ${hareket.bakiye_turu === 'A' ? 'alacak' : 'borc'}`}>
                        {formatCurrency(hareket.bakiye)} {hareket.bakiye_turu}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ fontWeight: 700 }}>
                    Genel Toplam: {sortedHareketler.length} işlem
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="amount borc" style={{ fontWeight: 700 }}>
                      {formatCurrency(toplamBorc)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="amount alacak" style={{ fontWeight: 700 }}>
                      {formatCurrency(toplamAlacak)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`bakiye-tag ${sonBakiye?.bakiye_turu === 'A' ? 'alacak' : 'borc'}`} style={{ fontSize: 14, padding: '6px 12px' }}>
                      {formatCurrency(sonBakiye?.bakiye || 0)} {sonBakiye?.bakiye_turu}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer Note */}
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'var(--bg-card)', 
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: 'var(--text-secondary)'
        }}>
          <span>Toplam {sortedHareketler.length} işlem</span>
          <span>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
        </div>
      </div>

      {/* Date Range Modal */}
      {showDateModal && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Tarih Aralığı Seç</h3>
              <button className="modal-close" onClick={() => setShowDateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={clearDateFilter}>
                Filtreyi Temizle
              </button>
              <button className="btn btn-primary" onClick={applyDateFilter}>
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CariEkstre
