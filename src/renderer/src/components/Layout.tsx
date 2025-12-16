import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

interface LayoutProps {
  username: string
  onLogout: () => void
}

const Layout: React.FC<LayoutProps> = ({ username, onLogout }) => {
  return (
    <div className="app-layout">
      <Sidebar username={username} onLogout={onLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
