import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Eye, EyeOff, LogIn } from 'lucide-react'

interface LoginProps {
  onLogin: (username: string) => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simüle edilmiş giriş kontrolü
    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        onLogin(username)
        navigate('/dashboard')
      } else if (username && password) {
        // Demo için her kullanıcıyı kabul et
        onLogin(username)
        navigate('/dashboard')
      } else {
        setError('Kullanıcı adı ve şifre gereklidir')
      }
      setIsLoading(false)
    }, 800)
  }

  const handleDemoLogin = () => {
    setUsername('demo')
    setPassword('demo')
    onLogin('Demo Kullanıcı')
    navigate('/dashboard')
  }

  return (
    <div className="login-container">
      <div className="login-background" />
      
      <div className="login-card">
        <div className="login-logo">
          <div style={{ 
            width: 64, 
            height: 64, 
            background: 'var(--gradient-primary)', 
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Store size={32} color="white" />
          </div>
          <h1>HAL PROGRAMI</h1>
          <p>Hal Komisyoncu Yönetim Sistemi</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Kullanıcı Adı</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="Kullanıcı adınızı girin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                placeholder="Şifrenizi girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--accent-danger-light)',
              border: '1px solid var(--accent-danger)',
              borderRadius: 8,
              color: 'var(--accent-danger)',
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Beni hatırla</label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <span>Giriş yapılıyor...</span>
            ) : (
              <>
                <LogIn size={20} />
                <span>Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>veya</span>
        </div>

        <button 
          type="button"
          className="btn demo-btn"
          onClick={handleDemoLogin}
        >
          🎯 Demo ile Giriş Yap
        </button>

        <p style={{ 
          textAlign: 'center', 
          marginTop: 24, 
          fontSize: 13, 
          color: 'var(--text-muted)' 
        }}>
          Demo giriş: admin / admin
        </p>
      </div>
    </div>
  )
}

export default Login
