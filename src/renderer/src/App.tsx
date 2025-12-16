import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/styles.css'

// Components
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CariListesi from './pages/CariListesi'
import CariEkstre from './pages/CariEkstre'
import Faturalar from './pages/Faturalar'
import Mustahsil from './pages/Mustahsil'
import Kasa from './pages/Kasa'
import CekSenet from './pages/CekSenet'
import Raporlar from './pages/Raporlar'
import Ayarlar from './pages/Ayarlar'

function App(): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')

  // LocalStorage'dan oturum bilgisini kontrol et
  useEffect(() => {
    const savedUser = localStorage.getItem('hal_user')
    if (savedUser) {
      setUsername(savedUser)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (user: string) => {
    setUsername(user)
    setIsAuthenticated(true)
    localStorage.setItem('hal_user', user)
  }

  const handleLogout = () => {
    setUsername('')
    setIsAuthenticated(false)
    localStorage.removeItem('hal_user')
  }

  return (
    <HashRouter>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            isAuthenticated ? (
              <Layout username={username} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cariler" element={<CariListesi />} />
          <Route path="/cariler/borclu" element={<CariListesi filter="borclu" />} />
          <Route path="/cariler/alacakli" element={<CariListesi filter="alacakli" />} />
          <Route path="/ekstre/:cariId" element={<CariEkstre />} />
          <Route path="/ekstre" element={<CariEkstre />} />
          <Route path="/faturalar" element={<Faturalar />} />
          <Route path="/mustahsil" element={<Mustahsil />} />
          <Route path="/kasa" element={<Kasa />} />
          <Route path="/cek-senet" element={<CekSenet />} />
          <Route path="/raporlar" element={<Raporlar />} />
          <Route path="/ayarlar" element={<Ayarlar />} />
        </Route>

        {/* Default Redirect */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </HashRouter>
  )
}

export default App
