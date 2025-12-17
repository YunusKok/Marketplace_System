import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart3, 
  Download, 
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  FileText,
  Loader2,
  X,
  Clock,
  Building2
} from 'lucide-react'

// Tipler
interface DashboardStats {
  toplamCari: number
  toplamBorc: number
  toplamAlacak: number
  netBakiye: number
}

interface CekSenetOzet {
  toplamCek: number
  toplamSenet: number
  bekleyen: number
  tahsilEdilen: number
  bekleyenAdet: number
  tahsilEdilenAdet: number
}

interface CariData {
  id: string
  kod: string
  unvan: string
  bakiye: number
  bakiye_turu: string
}

interface CekSenetData {
  id: string
  tip: 'CEK' | 'SENET'
  numara?: string
  banka?: string
  vade_tarihi: string
  tutar: number
  durum: string
  cari_unvan?: string
}

interface FaturaData {
  id: string
  fatura_no: string
  tarih: string
  genel_toplam: number
  fatura_tipi: string
  cari_unvan?: string
}

interface KasaIslem {
  id: string
  tarih: string
  aciklama: string
  tutar: number
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

const formatDate = (dateString: string): string => {
  try {
    if (dateString.includes('.')) return dateString
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR')
  } catch {
    return dateString
  }
}

const Raporlar: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [cekSenetOzet, setCekSenetOzet] = useState<CekSenetOzet | null>(null)
  
  // Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalData, setModalData] = useState<{
    borcluCariler?: CariData[]
    alacakliCariler?: CariData[]
    vadesiGelenler?: CekSenetData[]
    faturalar?: FaturaData[]
    kasaIslemleri?: KasaIslem[]
  }>({})

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [dashboardStats, cekSenetData] = await Promise.all([
        window.db.getDashboardStats(),
        window.db.getCekSenetOzet()
      ])
      setStats(dashboardStats)
      setCekSenetOzet(cekSenetData)
    } catch (error) {
      console.error('Veriler yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const openReport = async (reportId: string) => {
    setActiveModal(reportId)
    setModalLoading(true)
    
    try {
      switch (reportId) {
        case 'borclu': {
          // A = Cari bize borçlu = BİZİM ALACAĞIMIZ
          const cariler = await window.db.getCariler()
          const borcluCariler = cariler.filter(c => c.bakiye_turu === 'A' && c.bakiye > 0)
          setModalData({ borcluCariler })
          break
        }
        case 'alacakli': {
          // B = Biz cariye borçluyuz = BİZİM BORCUMUZ
          const cariler = await window.db.getCariler()
          const alacakliCariler = cariler.filter(c => c.bakiye_turu === 'B' && c.bakiye > 0)
          setModalData({ alacakliCariler })
          break
        }
        case 'vade': {
          const cekSenetler = await window.db.getCekSenetler()
          const vadesiGelenler = cekSenetler.filter(cs => cs.durum === 'BEKLEMEDE')
          setModalData({ vadesiGelenler })
          break
        }
        case 'fatura': {
          const faturalar = await window.db.getFaturalar()
          setModalData({ faturalar })
          break
        }
        case 'kasa': {
          const kasaIslemleri = await window.db.getKasaIslemleri()
          setModalData({ kasaIslemleri })
          break
        }
      }
    } catch (error) {
      console.error('Rapor verileri yüklenemedi:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const exportExcel = async (type: string) => {
    try {
      let result
      switch (type) {
        case 'cariler':
          result = await window.db.exportToExcel('cariler', 'cari_listesi.xlsx')
          break
        case 'hareketler':
          result = await window.db.exportToExcel('hareketler', 'hareketler.xlsx')
          break
        default:
          alert('Bu rapor için export özelliği henüz eklenmedi')
          return
      }
      
      if (result.success) {
        alert(`Dosya başarıyla kaydedildi: ${result.filePath}`)
      } else if (result.error !== 'İptal edildi') {
        alert(`Hata: ${result.error}`)
      }
    } catch (error) {
      console.error('Export hatası:', error)
      alert('Export sırasında bir hata oluştu')
    }
  }

  const raporlar = [
    { 
      id: 'borclu', 
      title: 'Alacaklarımız', 
      desc: 'Bize borçlu olan cariler (A bakiyeli)', 
      icon: TrendingUp, 
      color: 'var(--accent-success)',
      bg: 'rgba(16, 185, 129, 0.15)'
    },
    { 
      id: 'alacakli', 
      title: 'Borçlarımız', 
      desc: 'Bize alacaklı cariler (B bakiyeli)', 
      icon: TrendingDown, 
      color: 'var(--accent-danger)',
      bg: 'rgba(239, 68, 68, 0.15)'
    },
    { 
      id: 'vade', 
      title: 'Çek/Senet Vade Raporu', 
      desc: 'Vadesi bekleyen çek ve senetler', 
      icon: CreditCard, 
      color: 'var(--accent-warning)',
      bg: 'rgba(245, 158, 11, 0.15)'
    },
    { 
      id: 'fatura', 
      title: 'Fatura Listesi', 
      desc: 'Tüm alış ve satış faturaları', 
      icon: FileText, 
      color: 'var(--accent-info)',
      bg: 'rgba(59, 130, 246, 0.15)'
    },
    { 
      id: 'kasa', 
      title: 'Kasa Hareketleri', 
      desc: 'Kasa tahsilat ve ödemeleri', 
      icon: Wallet, 
      color: 'var(--accent-primary)',
      bg: 'rgba(139, 92, 246, 0.15)'
    },
    { 
      id: 'cari-export', 
      title: 'Cari Listesi Export', 
      desc: 'Tüm carileri Excel\'e aktar', 
      icon: Users, 
      color: 'var(--accent-success)',
      bg: 'rgba(16, 185, 129, 0.15)',
      directExport: true,
      exportType: 'cariler'
    }
  ]

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
          <h1>Raporlar</h1>
          <p>Detaylı analiz ve raporlara erişin</p>
        </div>
      </div>

      <div className="page-content">
        {/* Özet Kartları */}
        {/* Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          <Link to="/cariler" state={{ filter: 'all' }} className="summary-card card-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Toplam Cari</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{stats?.toplamCari || 0}</div>
              </div>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Users size={20} color="var(--accent-primary)" />
              </div>
            </div>
          </Link>

          <Link to="/cariler" state={{ filter: 'alacakli' }} className="summary-card card-danger" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Bizim Borçlarımız</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-danger)' }}>
                  {formatCurrency(stats?.toplamBorc || 0)}
                </div>
              </div>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <TrendingDown size={20} color="var(--accent-danger)" />
              </div>
            </div>
          </Link>

          <Link to="/cariler" state={{ filter: 'borclu' }} className="summary-card card-success" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Bizim Alacaklarımız</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-success)' }}>
                  {formatCurrency(stats?.toplamAlacak || 0)}
                </div>
              </div>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <TrendingUp size={20} color="var(--accent-success)" />
              </div>
            </div>
          </Link>

          <Link 
            to="/cek-senet"
            state={{ filterDurum: 'BEKLEMEDE' }}
            className="summary-card card-warning"
            style={{ transition: 'all 0.2s ease', border: '1px solid transparent', textDecoration: 'none', color: 'inherit' }}
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
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Bekleyen Çek/Senet</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-warning)' }}>
                  {cekSenetOzet?.bekleyenAdet || 0} adet
                </div>
              </div>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, 
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Clock size={20} color="var(--accent-warning)" />
              </div>
            </div>
          </Link>
        </div>

        {/* Rapor Kartları */}
        <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Rapor Seçenekleri</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20
        }}>
          {raporlar.map(rapor => (
            <div
              key={rapor.id}
              onClick={() => rapor.directExport ? exportExcel(rapor.exportType!) : openReport(rapor.id)}
              style={{
                padding: 24,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = rapor.color
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 25px ${rapor.bg}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: rapor.bg,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: rapor.color
                }}>
                  <rapor.icon size={24} />
                </div>
                <span style={{
                  padding: '6px 12px',
                  background: rapor.bg,
                  borderRadius: 6,
                  color: rapor.color,
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {rapor.directExport ? <Download size={14} /> : <BarChart3 size={14} />}
                  {rapor.directExport ? 'Export' : 'Görüntüle'}
                </span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{rapor.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rapor.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Borçlu Cariler Modal */}
      {activeModal === 'borclu' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3><TrendingUp size={20} color="var(--accent-success)" /> Alacaklarımız (Bize Borçlu Cariler)</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} /></div>
              ) : modalData.borcluCariler?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Borçlu cari bulunamadı</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kod</th>
                      <th>Ünvan</th>
                      <th style={{ textAlign: 'right' }}>Borç</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.borcluCariler?.map(cari => (
                      <tr key={cari.id}>
                        <td>{cari.kod}</td>
                        <td>{cari.unvan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-success)' }}>
                          {formatCurrency(cari.bakiye)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Kapat</button>
              <button className="btn btn-primary" onClick={() => exportExcel('cariler')}>
                <Download size={18} /> Excel'e Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alacaklı Cariler Modal */}
      {activeModal === 'alacakli' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3><TrendingDown size={20} color="var(--accent-danger)" /> Borçlarımız (Bizden Alacaklı Cariler)</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} /></div>
              ) : modalData.alacakliCariler?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Alacaklı cari bulunamadı</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Kod</th>
                      <th>Ünvan</th>
                      <th style={{ textAlign: 'right' }}>Alacak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.alacakliCariler?.map(cari => (
                      <tr key={cari.id}>
                        <td>{cari.kod}</td>
                        <td>{cari.unvan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-danger)' }}>
                          {formatCurrency(cari.bakiye)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Kapat</button>
              <button className="btn btn-primary" onClick={() => exportExcel('cariler')}>
                <Download size={18} /> Excel'e Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Çek/Senet Vade Modal */}
      {activeModal === 'vade' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3><CreditCard size={20} color="var(--accent-warning)" /> Bekleyen Çek/Senetler</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} /></div>
              ) : modalData.vadesiGelenler?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Bekleyen çek/senet bulunamadı</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tip</th>
                      <th>Numara</th>
                      <th>Cari</th>
                      <th>Banka</th>
                      <th>Vade</th>
                      <th style={{ textAlign: 'right' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.vadesiGelenler?.map(cs => (
                      <tr key={cs.id}>
                        <td><span className={`status-badge ${cs.tip === 'CEK' ? 'info' : 'primary'}`}>{cs.tip === 'CEK' ? 'Çek' : 'Senet'}</span></td>
                        <td style={{ fontFamily: 'monospace' }}>{cs.numara || '-'}</td>
                        <td>{cs.cari_unvan || '-'}</td>
                        <td><Building2 size={14} style={{ opacity: 0.6, marginRight: 4 }} />{cs.banka || '-'}</td>
                        <td>{formatDate(cs.vade_tarihi)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(cs.tutar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Fatura Listesi Modal */}
      {activeModal === 'fatura' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3><FileText size={20} color="var(--accent-info)" /> Fatura Listesi</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} /></div>
              ) : modalData.faturalar?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Fatura bulunamadı</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fatura No</th>
                      <th>Cari</th>
                      <th>Tarih</th>
                      <th>Tip</th>
                      <th style={{ textAlign: 'right' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.faturalar?.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontFamily: 'monospace' }}>{f.fatura_no}</td>
                        <td>{f.cari_unvan || '-'}</td>
                        <td>{formatDate(f.tarih)}</td>
                        <td><span className={`status-badge ${f.fatura_tipi === 'SATIS' ? 'success' : 'info'}`}>{f.fatura_tipi === 'SATIS' ? 'Satış' : 'Alış'}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(f.genel_toplam)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Kasa Hareketleri Modal */}
      {activeModal === 'kasa' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3><Wallet size={20} color="var(--accent-primary)" /> Kasa Hareketleri</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 className="animate-spin" size={32} /></div>
              ) : modalData.kasaIslemleri?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Kasa işlemi bulunamadı</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Cari</th>
                      <th>Açıklama</th>
                      <th>Tip</th>
                      <th style={{ textAlign: 'right' }}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.kasaIslemleri?.map(k => (
                      <tr key={k.id}>
                        <td>{formatDate(k.tarih)}</td>
                        <td>{k.cari_unvan || '-'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.aciklama}</td>
                        <td><span className={`status-badge ${k.islem_tipi === 'TAHSILAT' ? 'success' : 'danger'}`}>{k.islem_tipi === 'TAHSILAT' ? 'Tahsilat' : 'Ödeme'}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: k.islem_tipi === 'TAHSILAT' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                          {k.islem_tipi === 'TAHSILAT' ? '+' : '-'}{formatCurrency(k.tutar)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Raporlar
