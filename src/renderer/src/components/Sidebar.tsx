import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,

  BarChart3,
  Settings,
  LogOut,
  Store,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  ShoppingBag
} from 'lucide-react'

interface SidebarProps {
  username: string
  onLogout: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ username, onLogout }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const navItems = [
    {
      section: 'Ana Menü',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/cariler', icon: Users, label: 'Cariler' },
      ]
    },
    {
      section: 'İşlemler',
      items: [

        { path: '/mustahsil', icon: Receipt, label: 'Müstahsil' },
        { path: '/satis-firmalari', icon: ShoppingBag, label: 'Satış Firmaları' },
        { path: '/cek-senet', icon: CreditCard, label: 'Çek/Senet' },
      ]
    },
    {
      section: 'Raporlar',
      items: [
        { path: '/raporlar', icon: BarChart3, label: 'Raporlar' },
        { path: '/ekstre', icon: FileSpreadsheet, label: 'Cari Ekstre' },
      ]
    },
    {
      section: 'Sistem',
      items: [
        { path: '/ayarlar', icon: Settings, label: 'Ayarlar' },
      ]
    }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Store size={22} color="white" />
          </div>
          <div className="sidebar-logo-text">
            <h2>HAL PROGRAMI</h2>
            <span>Yönetim Sistemi</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h4>{username}</h4>
            <span>Yönetici</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-danger-light)'
            e.currentTarget.style.borderColor = 'var(--accent-danger)'
            e.currentTarget.style.color = 'var(--accent-danger)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--border-color)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <LogOut size={18} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
