import React from 'react'
import { BarChart3, Download, Calendar } from 'lucide-react'

const Raporlar: React.FC = () => {
  const raporlar = [
    { id: 1, title: 'Cari Ekstre Raporu', desc: 'Carilerinizin detaylı ekstre raporları' },
    { id: 2, title: 'Günlük Satış Raporu', desc: 'Günlük satış özeti ve detayları' },
    { id: 3, title: 'Aylık Gelir/Gider', desc: 'Aylık bazda gelir ve gider analizi' },
    { id: 4, title: 'Çek/Senet Vade Raporu', desc: 'Vadesi gelen çek ve senetler' },
    { id: 5, title: 'Kasa Raporu', desc: 'Kasa hareketleri ve bakiye durumu' },
    { id: 6, title: 'Borç/Alacak Yaşlandırma', desc: 'Yaşlandırma bazında borç/alacak analizi' }
  ]

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Raporlar</h1>
          <p>Detaylı analiz ve raporlara erişin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Calendar size={18} />
            Tarih Seç
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20
        }}>
          {raporlar.map(rapor => (
            <div
              key={rapor.id}
              style={{
                padding: 24,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  background: 'rgba(99, 102, 241, 0.15)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}>
                  <BarChart3 size={24} />
                </div>
                <button style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12
                }}>
                  <Download size={14} />
                  İndir
                </button>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{rapor.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{rapor.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Raporlar
