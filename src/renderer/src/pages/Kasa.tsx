import React from 'react'
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount) + ' ₺'
}

const Kasa: React.FC = () => {
  const kasaBakiye = 125000

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Kasa</h1>
          <p>Kasa işlemlerinizi takip edin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" style={{ color: 'var(--accent-success)' }}>
            <ArrowDownRight size={18} />
            Tahsilat
          </button>
          <button className="btn btn-primary" style={{ background: 'var(--accent-danger)' }}>
            <ArrowUpRight size={18} />
            Ödeme
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Kasa Bakiyesi */}
        <div style={{
          padding: 32,
          background: 'var(--gradient-primary)',
          borderRadius: 16,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
            Güncel Kasa Bakiyesi
          </div>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'white' }}>
            {formatCurrency(kasaBakiye)}
          </div>
        </div>

        <div className="empty-state">
          <Wallet size={64} />
          <h3>Kasa Modülü</h3>
          <p>Bu modül geliştirme aşamasındadır. Yakında kasa işlemlerinizi buradan yönetebileceksiniz.</p>
        </div>
      </div>
    </>
  )
}

export default Kasa
