import React from 'react'
import { CreditCard, Plus } from 'lucide-react'

const CekSenet: React.FC = () => {
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Çek / Senet</h1>
          <p>Çek ve senet takibinizi yönetin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary">
            <Plus size={18} />
            Yeni Çek/Senet
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="empty-state">
          <CreditCard size={64} />
          <h3>Çek/Senet Modülü</h3>
          <p>Bu modül geliştirme aşamasındadır. Yakında çek ve senetlerinizi buradan yönetebileceksiniz.</p>
        </div>
      </div>
    </>
  )
}

export default CekSenet
