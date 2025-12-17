import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Eye,
  Loader2
} from 'lucide-react'

// Veritabanından gelen veri tipleri
interface DashboardStats {
  toplamCari: number
  toplamBorc: number
  toplamAlacak: number
  netBakiye: number
  sonHareketler: HareketData[]
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
  cari_unvan?: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ₺'
}

// Yeni İşlem Modal Bileşeni
interface NewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const actions = [
    { icon: FileText, label: 'Satış Faturası', path: '/faturalar', color: 'var(--accent-primary)' },
    { icon: Receipt, label: 'Müstahsil Makbuzu', path: '/mustahsil', color: 'var(--accent-success)' },
    { icon: CreditCard, label: 'Çek/Senet Girişi', path: '/cek-senet', color: 'var(--accent-warning)' },
    { icon: Wallet, label: 'Kasa İşlemi', path: '/kasa', color: 'var(--accent-info)' },
    { icon: Users, label: 'Yeni Cari', path: '/cariler', color: 'var(--accent-danger)' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Yeni İşlem Oluştur</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
            Oluşturmak istediğiniz işlem türünü seçin:
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {actions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  width: '100%',
                  padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color
                  e.currentTarget.style.background = 'var(--bg-card-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `${action.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: action.color
                }}>
                  <action.icon size={22} />
                </div>
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Animated Transaction Row Component
interface AnimatedRowProps {
  hareket: HareketData
  index: number
  onRowClick: (cariId: string) => void
}

const AnimatedRow: React.FC<AnimatedRowProps> = ({ hareket, index, onRowClick }) => {
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
      onClick={() => onRowClick(hareket.cari_id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td>{hareket.tarih}</td>
      <td>{hareket.aciklama}</td>
      <td>
        <span style={{
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          background: hareket.islem_tipi === 'FATURA' ? 'rgba(99, 102, 241, 0.15)' :
                      hareket.islem_tipi === 'HAVALE' ? 'rgba(34, 197, 94, 0.15)' :
                      hareket.islem_tipi === 'CEK' ? 'rgba(245, 158, 11, 0.15)' :
                      hareket.islem_tipi === 'NAKIT' ? 'rgba(59, 130, 246, 0.15)' :
                      'rgba(148, 163, 184, 0.15)',
          color: hareket.islem_tipi === 'FATURA' ? 'var(--accent-primary)' :
                 hareket.islem_tipi === 'HAVALE' ? 'var(--accent-success)' :
                 hareket.islem_tipi === 'CEK' ? 'var(--accent-warning)' :
                 hareket.islem_tipi === 'NAKIT' ? 'var(--accent-info)' :
                 'var(--text-secondary)'
        }}>
          {hareket.islem_tipi}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        {hareket.borc > 0 ? (
          <span className="amount borc">{formatCurrency(hareket.borc)}</span>
        ) : '-'}
      </td>
      <td style={{ textAlign: 'right' }}>
        {hareket.alacak > 0 ? (
          <span className="amount alacak">{formatCurrency(hareket.alacak)}</span>
        ) : '-'}
      </td>
      <td style={{ textAlign: 'right' }}>
        <span className={`bakiye-tag ${hareket.bakiye_turu === 'A' ? 'alacak' : 'borc'}`}>
          {formatCurrency(hareket.bakiye)} {hareket.bakiye_turu}
        </span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <Link
          to={`/ekstre/${hareket.cari_id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: 6,
            display: 'inline-flex',
            background: isHovered ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            border: 'none',
            borderRadius: 6,
            color: isHovered ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'all 0.15s ease'
          }}
          title="Ekstre Görüntüle"
        >
          <Eye size={18} />
        </Link>
      </td>
    </tr>
  )
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Veritabanından verileri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await window.db.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Dashboard verileri alınamadı:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleTransactionClick = useCallback((cariId: string) => {
    navigate(`/ekstre/${cariId}`)
  }, [navigate])

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
          <h1>Dashboard</h1>
          <p>Hoş geldiniz! İşte günlük özet bilgileriniz.</p>
        </div>
        <div className="page-actions">
          <Link to="/raporlar" className="btn btn-secondary">
            <BarChart3 size={18} />
            Rapor
          </Link>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewTransactionModal(true)}
          >
            <Plus size={18} />
            Yeni İşlem
          </button>
        </div>
      </div>

      <div className="page-content" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 85px)' }}>
        {/* Stats Grid */}
        <div className="stats-grid animate-fade-in">
          <Link to="/cariler" state={{ filter: 'all' }} className="stat-card card-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon primary">
                <Users size={24} />
              </div>
            </div>
            <div className="stat-card-value">{stats?.toplamCari || 0}</div>
            <div className="stat-card-label">Toplam Cari</div>
            <div className="stat-card-trend up">
              <TrendingUp size={14} />
              <span>Aktif hesaplar</span>
            </div>
          </Link>

          <Link to="/cariler" state={{ filter: 'borclu' }} className="stat-card card-danger" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon danger">
                <ArrowDownRight size={24} />
              </div>
            </div>
            <div className="stat-card-value">{formatCurrency(stats?.toplamBorc || 0)}</div>
            <div className="stat-card-label">Toplam Borç</div>
            <div className="stat-card-trend down">
              <TrendingDown size={14} />
              <span>Borçlu cariler</span>
            </div>
          </Link>

          <Link to="/cariler" state={{ filter: 'alacakli' }} className="stat-card card-success" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon success">
                <ArrowUpRight size={24} />
              </div>
            </div>
            <div className="stat-card-value">{formatCurrency(stats?.toplamAlacak || 0)}</div>
            <div className="stat-card-label">Toplam Alacak</div>
            <div className="stat-card-trend up">
              <TrendingUp size={14} />
              <span>Alacaklı cariler</span>
            </div>
          </Link>

          <Link to="/kasa" className="stat-card card-warning" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-card-header">
              <div className="stat-card-icon warning">
                <Wallet size={24} />
              </div>
            </div>
            <div className="stat-card-value">{formatCurrency(stats?.netBakiye || 0)}</div>
            <div className="stat-card-label">Net Bakiye</div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Link to="/faturalar" className="quick-action-btn">
            <FileText />
            <span>Yeni Satış Faturası</span>
          </Link>
          <Link to="/mustahsil" className="quick-action-btn">
            <Receipt />
            <span>Müstahsil Makbuzu</span>
          </Link>
          <Link to="/cek-senet" className="quick-action-btn">
            <CreditCard />
            <span>Çek/Senet Girişi</span>
          </Link>
          <Link to="/cariler" className="quick-action-btn">
            <Users />
            <span>Yeni Cari Ekle</span>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div 
          className="data-card"
          style={{
            marginBottom: 32
          }}
        >
          <div className="data-card-header">
            <h3 className="data-card-title">Son İşlemler</h3>
            <Link to="/cariler" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
              Tümünü Gör
            </Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>İşlem Tipi</th>
                <th style={{ textAlign: 'right' }}>Borç</th>
                <th style={{ textAlign: 'right' }}>Alacak</th>
                <th style={{ textAlign: 'right' }}>Bakiye</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {stats?.sonHareketler?.map((hareket, index) => (
                <AnimatedRow
                  key={hareket.id}
                  hareket={hareket}
                  index={index}
                  onRowClick={handleTransactionClick}
                />
              ))}
              {(!stats?.sonHareketler || stats.sonHareketler.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Henüz işlem bulunmuyor
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ height: 30 }} />
      </div>

      <NewTransactionModal
        isOpen={showNewTransactionModal}
        onClose={() => setShowNewTransactionModal(false)}
      />
    </>
  )
}

export default Dashboard
