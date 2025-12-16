import React from 'react'
import { Receipt, Plus } from 'lucide-react'

const Mustahsil: React.FC = () => {
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Müstahsil Makbuzları</h1>
          <p>Müstahsil makbuzlarınızı oluşturun ve yönetin</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary">
            <Plus size={18} />
            Yeni Makbuz
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="empty-state">
          <Receipt size={64} />
          <h3>Müstahsil Modülü</h3>
          <p>Bu modül geliştirme aşamasındadır. Yakında müstahsil makbuzlarınızı buradan yönetebileceksiniz.</p>
        </div>
      </div>
    </>
  )
}

export default Mustahsil
