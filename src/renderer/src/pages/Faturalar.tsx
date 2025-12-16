import React from 'react'
import { FileText, Plus } from 'lucide-react'

const Faturalar: React.FC = () => {
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Faturalar</h1>
          <p>Satış ve alış faturalarınızı yönetin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary">
            <Plus size={18} />
            Yeni Fatura
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="empty-state">
          <FileText size={64} />
          <h3>Faturalar Modülü</h3>
          <p>Bu modül geliştirme aşamasındadır. Yakında satış ve alış faturalarınızı buradan yönetebileceksiniz.</p>
        </div>
      </div>
    </>
  )
}

export default Faturalar
