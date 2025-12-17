import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Building2, 
  Users, 
  Palette, 
  Database, 
  Shield,
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Moon,
  Sun,
  Download,
  Upload,
  Eye,
  EyeOff,
  UserPlus,
  Key
} from 'lucide-react'

// Tipler
interface Kullanici {
  id: string
  kullanici_adi: string
  ad_soyad: string
  rol: string
  olusturma_tarihi?: string
}

interface FirmaAyarlari {
  firma_adi: string
  vergi_dairesi: string
  vergi_no: string
  telefon: string
  adres: string
  email: string
}

const Ayarlar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('firma')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Firma Bilgileri State
  const [firmaAyarlari, setFirmaAyarlari] = useState<FirmaAyarlari>({
    firma_adi: '',
    vergi_dairesi: '',
    vergi_no: '',
    telefon: '',
    adres: '',
    email: ''
  })

  // Kullanıcılar State
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([])
  const [showKullaniciModal, setShowKullaniciModal] = useState(false)
  const [editingKullanici, setEditingKullanici] = useState<Kullanici | null>(null)
  const [kullaniciForm, setKullaniciForm] = useState({
    kullaniciAdi: '',
    sifre: '',
    adSoyad: '',
    rol: 'kullanici'
  })

  // Görünüm State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Güvenlik State (Şifre Değiştirme)
  const [passwordForm, setPasswordForm] = useState({
    eskiSifre: '',
    yeniSifre: '',
    yeniSifreTekrar: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    eski: false,
    yeni: false,
    tekrar: false
  })

  // Logged in user (from localStorage)
  const [currentUser, setCurrentUser] = useState<{ id: string; kullanici_adi: string; ad_soyad: string; rol: string } | null>(null)

  const tabs = [
    { id: 'firma', icon: Building2, label: 'Firma Bilgileri' },
    { id: 'kullanicilar', icon: Users, label: 'Kullanıcılar' },
    { id: 'gorunum', icon: Palette, label: 'Görünüm' },
    { id: 'veritabani', icon: Database, label: 'Veritabanı' },
    { id: 'guvenlik', icon: Shield, label: 'Güvenlik' }
  ]

  // Veri yükleme
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Ayarları yükle
      const ayarlar = await window.db.getAyarlar()
      setFirmaAyarlari({
        firma_adi: ayarlar.firma_adi || '',
        vergi_dairesi: ayarlar.vergi_dairesi || '',
        vergi_no: ayarlar.vergi_no || '',
        telefon: ayarlar.telefon || '',
        adres: ayarlar.adres || '',
        email: ayarlar.email || ''
      })

      // Tema ayarını yükle
      const savedTheme = ayarlar.theme || 'dark'
      setTheme(savedTheme as 'dark' | 'light')

      // Kullanıcıları yükle
      const kullanicilarData = await window.db.getKullanicilar()
      setKullanicilar(kullanicilarData)

      // Current user from localStorage
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSaveMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text })
    setTimeout(() => setSaveMessage(null), 3000)
  }

  // Firma bilgilerini kaydet
  const handleSaveFirma = async () => {
    setSaving(true)
    try {
      await window.db.setAyarlar({
        firma_adi: firmaAyarlari.firma_adi,
        vergi_dairesi: firmaAyarlari.vergi_dairesi,
        vergi_no: firmaAyarlari.vergi_no,
        telefon: firmaAyarlari.telefon,
        adres: firmaAyarlari.adres,
        email: firmaAyarlari.email
      })
      showSaveMessage('success', 'Firma bilgileri başarıyla kaydedildi')
    } catch (error) {
      console.error('Kayıt hatası:', error)
      showSaveMessage('error', 'Kayıt sırasında bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Tema değiştir
  const handleThemeChange = async (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    await window.db.setAyar('theme', newTheme)
    showSaveMessage('success', `Tema ${newTheme === 'dark' ? 'koyu' : 'açık'} olarak değiştirildi`)
  }

  // Kullanıcı modal aç
  const openKullaniciModal = (kullanici?: Kullanici) => {
    if (kullanici) {
      setEditingKullanici(kullanici)
      setKullaniciForm({
        kullaniciAdi: kullanici.kullanici_adi,
        sifre: '',
        adSoyad: kullanici.ad_soyad,
        rol: kullanici.rol
      })
    } else {
      setEditingKullanici(null)
      setKullaniciForm({
        kullaniciAdi: '',
        sifre: '',
        adSoyad: '',
        rol: 'kullanici'
      })
    }
    setShowKullaniciModal(true)
  }

  // Kullanıcı kaydet
  const handleSaveKullanici = async () => {
    if (!kullaniciForm.kullaniciAdi || !kullaniciForm.adSoyad) {
      showSaveMessage('error', 'Kullanıcı adı ve Ad Soyad zorunludur')
      return
    }

    if (!editingKullanici && !kullaniciForm.sifre) {
      showSaveMessage('error', 'Yeni kullanıcı için şifre zorunludur')
      return
    }

    setSaving(true)
    try {
      if (editingKullanici) {
        await window.db.updateKullanici(editingKullanici.id, {
          kullaniciAdi: kullaniciForm.kullaniciAdi,
          adSoyad: kullaniciForm.adSoyad,
          rol: kullaniciForm.rol
        })
        showSaveMessage('success', 'Kullanıcı başarıyla güncellendi')
      } else {
        await window.db.addKullanici({
          kullaniciAdi: kullaniciForm.kullaniciAdi,
          sifre: kullaniciForm.sifre,
          adSoyad: kullaniciForm.adSoyad,
          rol: kullaniciForm.rol
        })
        showSaveMessage('success', 'Kullanıcı başarıyla eklendi')
      }

      // Listeyi güncelle
      const kullanicilarData = await window.db.getKullanicilar()
      setKullanicilar(kullanicilarData)
      setShowKullaniciModal(false)
    } catch (error) {
      console.error('Kullanıcı kayıt hatası:', error)
      showSaveMessage('error', 'Kayıt sırasında bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Kullanıcı sil
  const handleDeleteKullanici = async (id: string) => {
    if (currentUser?.id === id) {
      showSaveMessage('error', 'Kendi hesabınızı silemezsiniz')
      return
    }

    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      try {
        await window.db.deleteKullanici(id)
        setKullanicilar(prev => prev.filter(k => k.id !== id))
        showSaveMessage('success', 'Kullanıcı başarıyla silindi')
      } catch (error) {
        console.error('Silme hatası:', error)
        showSaveMessage('error', 'Silme sırasında bir hata oluştu')
      }
    }
  }

  // Şifre değiştir
  const handleChangePassword = async () => {
    if (!passwordForm.eskiSifre || !passwordForm.yeniSifre || !passwordForm.yeniSifreTekrar) {
      showSaveMessage('error', 'Tüm alanları doldurun')
      return
    }

    if (passwordForm.yeniSifre !== passwordForm.yeniSifreTekrar) {
      showSaveMessage('error', 'Yeni şifreler eşleşmiyor')
      return
    }

    if (passwordForm.yeniSifre.length < 4) {
      showSaveMessage('error', 'Şifre en az 4 karakter olmalıdır')
      return
    }

    if (!currentUser) {
      showSaveMessage('error', 'Oturum bilgisi bulunamadı')
      return
    }

    setSaving(true)
    try {
      const result = await window.db.changePassword(currentUser.id, passwordForm.eskiSifre, passwordForm.yeniSifre)
      if (result.success) {
        showSaveMessage('success', 'Şifreniz başarıyla değiştirildi')
        setPasswordForm({ eskiSifre: '', yeniSifre: '', yeniSifreTekrar: '' })
      } else {
        showSaveMessage('error', result.error || 'Şifre değiştirilemedi')
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error)
      showSaveMessage('error', 'Şifre değiştirme sırasında bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  // Excel export
  const handleExportCariler = async () => {
    try {
      const result = await window.db.exportToExcel('cariler')
      if (result.success) {
        showSaveMessage('success', 'Cariler dışa aktarıldı: ' + result.filePath)
      } else {
        showSaveMessage('error', result.error || 'Dışa aktarma başarısız')
      }
    } catch (error) {
      console.error('Export hatası:', error)
      showSaveMessage('error', 'Dışa aktarma sırasında bir hata oluştu')
    }
  }

  const handleExportHareketler = async () => {
    try {
      const result = await window.db.exportToExcel('hareketler')
      if (result.success) {
        showSaveMessage('success', 'Hareketler dışa aktarıldı: ' + result.filePath)
      } else {
        showSaveMessage('error', result.error || 'Dışa aktarma başarısız')
      }
    } catch (error) {
      console.error('Export hatası:', error)
      showSaveMessage('error', 'Dışa aktarma sırasında bir hata oluştu')
    }
  }

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
          <h1>Ayarlar</h1>
          <p>Uygulama ve sistem ayarlarını yönetin</p>
        </div>
      </div>

      {/* Kayıt Mesajı */}
      {saveMessage && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '12px 20px',
          borderRadius: 8,
          background: saveMessage.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          {saveMessage.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {saveMessage.text}
        </div>
      )}

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
            {/* Firma Bilgileri */}
            {activeTab === 'firma' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building2 size={24} color="var(--accent-primary)" />
                  Firma Bilgileri
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                  <div className="form-group">
                    <label>Firma Adı</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Firma adı" 
                      value={firmaAyarlari.firma_adi}
                      onChange={(e) => setFirmaAyarlari(prev => ({ ...prev, firma_adi: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>E-posta</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="E-posta adresi" 
                      value={firmaAyarlari.email}
                      onChange={(e) => setFirmaAyarlari(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vergi Dairesi</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Vergi dairesi" 
                      value={firmaAyarlari.vergi_dairesi}
                      onChange={(e) => setFirmaAyarlari(prev => ({ ...prev, vergi_dairesi: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vergi No</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Vergi numarası" 
                      value={firmaAyarlari.vergi_no}
                      onChange={(e) => setFirmaAyarlari(prev => ({ ...prev, vergi_no: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefon</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Telefon" 
                      value={firmaAyarlari.telefon}
                      onChange={(e) => setFirmaAyarlari(prev => ({ ...prev, telefon: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Adres</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Adres" 
                      rows={3}
                      value={firmaAyarlari.adres}
                      onChange={(e) => setFirmaAyarlari(prev => ({ ...prev, adres: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveFirma}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Kaydet
                  </button>
                </div>
              </>
            )}

            {/* Kullanıcılar */}
            {activeTab === 'kullanicilar' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={24} color="var(--accent-primary)" />
                    Kullanıcı Yönetimi
                  </h2>
                  <button className="btn btn-primary" onClick={() => openKullaniciModal()}>
                    <UserPlus size={18} />
                    Yeni Kullanıcı
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kullanıcı Adı</th>
                        <th>Ad Soyad</th>
                        <th>Rol</th>
                        <th>Oluşturma Tarihi</th>
                        <th style={{ width: 100 }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kullanicilar.map(kullanici => (
                        <tr key={kullanici.id}>
                          <td>
                            <span style={{ fontWeight: 500 }}>{kullanici.kullanici_adi}</span>
                            {currentUser?.id === kullanici.id && (
                              <span style={{ 
                                fontSize: 11, 
                                marginLeft: 8, 
                                padding: '2px 6px', 
                                background: 'var(--accent-primary)', 
                                borderRadius: 4,
                                color: 'white'
                              }}>
                                Siz
                              </span>
                            )}
                          </td>
                          <td>{kullanici.ad_soyad}</td>
                          <td>
                            <span className={`status-badge ${kullanici.rol === 'admin' ? 'primary' : 'secondary'}`}>
                              {kullanici.rol === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                            </span>
                          </td>
                          <td>{kullanici.olusturma_tarihi ? new Date(kullanici.olusturma_tarihi).toLocaleDateString('tr-TR') : '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                className="icon-btn" 
                                title="Düzenle"
                                onClick={() => openKullaniciModal(kullanici)}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="icon-btn" 
                                title="Sil"
                                onClick={() => handleDeleteKullanici(kullanici.id)}
                                style={{ color: 'var(--accent-danger)' }}
                                disabled={currentUser?.id === kullanici.id}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Görünüm */}
            {activeTab === 'gorunum' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Palette size={24} color="var(--accent-primary)" />
                  Görünüm Ayarları
                </h2>

                <div style={{ marginBottom: 32 }}>
                  <label style={{ display: 'block', marginBottom: 12, fontWeight: 500 }}>Tema</label>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      style={{
                        flex: 1,
                        padding: 20,
                        background: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                        border: theme === 'dark' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        background: '#1e1e2e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <Moon size={28} color="#a78bfa" />
                      </div>
                      <span style={{ fontWeight: 500, color: theme === 'dark' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        Koyu Tema
                      </span>
                      {theme === 'dark' && (
                        <Check size={18} color="var(--accent-primary)" />
                      )}
                    </button>

                    <button
                      onClick={() => handleThemeChange('light')}
                      style={{
                        flex: 1,
                        padding: 20,
                        background: theme === 'light' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                        border: theme === 'light' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}>
                        <Sun size={28} color="#f59e0b" />
                      </div>
                      <span style={{ fontWeight: 500, color: theme === 'light' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        Açık Tema
                      </span>
                      {theme === 'light' && (
                        <Check size={18} color="var(--accent-primary)" />
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ 
                  padding: 16, 
                  background: 'var(--bg-secondary)', 
                  borderRadius: 8, 
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: 'var(--text-secondary)'
                }}>
                  <SettingsIcon size={20} />
                  <span>Tema değişikliği anlık olarak uygulanır.</span>
                </div>
              </>
            )}

            {/* Veritabanı */}
            {activeTab === 'veritabani' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={24} color="var(--accent-primary)" />
                  Veritabanı İşlemleri
                </h2>

                <div style={{ display: 'grid', gap: 20 }}>
                  {/* Dışa Aktarma */}
                  <div style={{
                    padding: 24,
                    background: 'var(--bg-secondary)',
                    borderRadius: 12,
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Download size={20} color="var(--accent-success)" />
                      Verileri Dışa Aktar
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Verilerinizi Excel formatında dışa aktarın.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-secondary" onClick={handleExportCariler}>
                        <Download size={16} />
                        Carileri Dışa Aktar
                      </button>
                      <button className="btn btn-secondary" onClick={handleExportHareketler}>
                        <Download size={16} />
                        Hareketleri Dışa Aktar
                      </button>
                    </div>
                  </div>

                  {/* Yedekleme */}
                  <div style={{
                    padding: 24,
                    background: 'var(--bg-secondary)',
                    borderRadius: 12,
                    border: '1px solid var(--border-color)'
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Upload size={20} color="var(--accent-warning)" />
                      Yedekleme
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Veritabanı dosyası şu konumda saklanmaktadır: <br />
                      <code style={{ 
                        background: 'var(--bg-card)', 
                        padding: '4px 8px', 
                        borderRadius: 4, 
                        fontSize: 12,
                        marginTop: 8,
                        display: 'inline-block'
                      }}>
                        %APPDATA%/hal-programi/data/hal.db
                      </code>
                    </p>
                    <div style={{ 
                      padding: 12, 
                      background: 'rgba(245, 158, 11, 0.1)', 
                      borderRadius: 8, 
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: 'var(--accent-warning)',
                      fontSize: 13
                    }}>
                      ⚠️ Yedekleme için bu dosyayı güvenli bir konuma kopyalayın.
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Güvenlik */}
            {activeTab === 'guvenlik' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={24} color="var(--accent-primary)" />
                  Güvenlik Ayarları
                </h2>

                <div style={{
                  padding: 24,
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  maxWidth: 450
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key size={20} />
                    Şifre Değiştir
                  </h3>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div className="form-group">
                      <label>Mevcut Şifre</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPasswords.eski ? 'text' : 'password'}
                          className="form-input" 
                          placeholder="Mevcut şifrenizi girin" 
                          value={passwordForm.eskiSifre}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, eskiSifre: e.target.value }))}
                          style={{ paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, eski: !prev.eski }))}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {showPasswords.eski ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Yeni Şifre</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPasswords.yeni ? 'text' : 'password'}
                          className="form-input" 
                          placeholder="Yeni şifrenizi girin" 
                          value={passwordForm.yeniSifre}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, yeniSifre: e.target.value }))}
                          style={{ paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, yeni: !prev.yeni }))}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {showPasswords.yeni ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Yeni Şifre (Tekrar)</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPasswords.tekrar ? 'text' : 'password'}
                          className="form-input" 
                          placeholder="Yeni şifrenizi tekrar girin" 
                          value={passwordForm.yeniSifreTekrar}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, yeniSifreTekrar: e.target.value }))}
                          style={{ paddingRight: 40 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, tekrar: !prev.tekrar }))}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {showPasswords.tekrar ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: 20, width: '100%' }}
                    onClick={handleChangePassword}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Key size={18} />}
                    Şifreyi Değiştir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Kullanıcı Modal */}
      {showKullaniciModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3>
                {editingKullanici ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit2 size={20} />
                    Kullanıcı Düzenle
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserPlus size={20} />
                    Yeni Kullanıcı
                  </span>
                )}
              </h3>
              <button className="modal-close" onClick={() => setShowKullaniciModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="form-group">
                  <label>Kullanıcı Adı *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Kullanıcı adı" 
                    value={kullaniciForm.kullaniciAdi}
                    onChange={(e) => setKullaniciForm(prev => ({ ...prev, kullaniciAdi: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Ad Soyad *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ad Soyad" 
                    value={kullaniciForm.adSoyad}
                    onChange={(e) => setKullaniciForm(prev => ({ ...prev, adSoyad: e.target.value }))}
                  />
                </div>

                {!editingKullanici && (
                  <div className="form-group">
                    <label>Şifre *</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Şifre" 
                      value={kullaniciForm.sifre}
                      onChange={(e) => setKullaniciForm(prev => ({ ...prev, sifre: e.target.value }))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Rol</label>
                  <select 
                    className="form-input" 
                    value={kullaniciForm.rol}
                    onChange={(e) => setKullaniciForm(prev => ({ ...prev, rol: e.target.value }))}
                  >
                    <option value="kullanici">Kullanıcı</option>
                    <option value="admin">Yönetici</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowKullaniciModal(false)}>
                İptal
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveKullanici}
                disabled={saving}
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {editingKullanici ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Ayarlar
