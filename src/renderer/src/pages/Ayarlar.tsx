import React, { useState } from 'react'
import { Settings as SettingsIcon, Building2, Users, Palette, Database, Bell, Shield } from 'lucide-react'

const Ayarlar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('firma')

  const tabs = [
    { id: 'firma', icon: Building2, label: 'Firma Bilgileri' },
    { id: 'kullanicilar', icon: Users, label: 'Kullanıcılar' },
    { id: 'gorunum', icon: Palette, label: 'Görünüm' },
    { id: 'veritabani', icon: Database, label: 'Veritabanı' },
    { id: 'bildirimler', icon: Bell, label: 'Bildirimler' },
    { id: 'guvenlik', icon: Shield, label: 'Güvenlik' }
  ]

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Ayarlar</h1>
          <p>Uygulama ve sistem ayarlarını yönetin</p>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Sidebar Tabs */}
          <div style={{
            width: 240,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 8,
            height: 'fit-content'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 4,
                  transition: 'all 0.15s ease'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: 32
          }}>
            {activeTab === 'firma' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Firma Bilgileri</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                  <div className="form-group">
                    <label>Firma Adı</label>
                    <input type="text" className="form-input" placeholder="Firma adı" defaultValue="Demo Hal Komisyonculuk" />
                  </div>
                  <div className="form-group">
                    <label>Vergi Dairesi</label>
                    <input type="text" className="form-input" placeholder="Vergi dairesi" defaultValue="Antalya" />
                  </div>
                  <div className="form-group">
                    <label>Vergi No</label>
                    <input type="text" className="form-input" placeholder="Vergi numarası" defaultValue="1234567890" />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input type="text" className="form-input" placeholder="Telefon" defaultValue="0242 123 4567" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Adres</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Adres" 
                      rows={3}
                      defaultValue="Antalya Toptancı Hali, A Blok No: 123"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-secondary">İptal</button>
                  <button className="btn btn-primary">Kaydet</button>
                </div>
              </>
            )}

            {activeTab !== 'firma' && (
              <div className="empty-state">
                <SettingsIcon size={48} />
                <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
                <p>Bu ayar sayfası geliştirme aşamasındadır.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Ayarlar
