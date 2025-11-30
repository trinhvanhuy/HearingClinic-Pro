import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n/I18nContext'
import toast from 'react-hot-toast'

const REMEMBER_ME_KEY = 'hearing_clinic_remember_me'
const REMEMBERED_USERNAME_KEY = 'hearing_clinic_username'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => {
    // Load rememberMe preference from localStorage
    const saved = localStorage.getItem(REMEMBER_ME_KEY)
    return saved === 'true'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const { login, requestPasswordReset, isLoggingIn, user, loading } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()

  // Load remembered username on mount
  useEffect(() => {
    if (rememberMe) {
      const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY)
      if (rememberedUsername) {
        setUsername(rememberedUsername)
      }
    }
  }, [rememberMe])

  // Redirect to dashboard if already logged in (from remember me)
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  // Show loading while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E14D4D' }}>
        <div className="text-white text-lg">{t.common.loading}</div>
      </div>
    )
  }

  // Don't render login form if already logged in (will redirect)
  if (user) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({ username, password, rememberMe })
      
      // Save username to localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true')
        localStorage.setItem(REMEMBERED_USERNAME_KEY, username)
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY)
        localStorage.removeItem(REMEMBERED_USERNAME_KEY)
      }
      
      toast.success(t.login.loginSuccessful)
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || t.login.loginFailed)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await requestPasswordReset(email)
      toast.success(t.login.passwordResetSent)
      setShowForgotPassword(false)
      setEmail('')
    } catch (error: any) {
      toast.error(error.message || t.login.passwordResetSent)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="/assets/login_background.jpeg"
          alt="Hearing Clinic"
          className="w-full h-full object-cover"
        />
        {/* Language Selector - Overlay on image */}
        <div className="absolute top-8 right-8 z-20">
          <button 
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
            style={{ color: '#E14D4D' }}
          >
            {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 lg:px-16 py-12 relative">
        {/* Language Selector - Mobile */}
        <div className="lg:hidden absolute top-8 right-8 z-20">
          <button 
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
            style={{ color: '#E14D4D' }}
          >
            {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Logo and App Name */}
        <div className="mb-12 flex items-center gap-4">
          <img
            src="/assets/logo-transparent.png"
            alt="Hearing Clinic Pro"
            className="h-16"
          />
          <h1 className="text-3xl font-bold" style={{ color: '#E14D4D' }}>Hearing Clinic Pro</h1>
        </div>

        {/* Login Panel */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#E14D4D' }}>{t.login.title}</h2>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t.login.username}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 text-gray-900"
                  style={{ '--tw-ring-color': '#E14D4D' } as React.CSSProperties}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.login.username}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t.login.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 pr-12 text-gray-900"
                    style={{ '--tw-ring-color': '#E14D4D' } as React.CSSProperties}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.login.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-2 mr-2"
                  style={{ accentColor: '#E14D4D' }}
                  />
                  <span className="text-sm">{t.login.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm hover:underline"
                  style={{ color: '#E14D4D' }}
                >
                  {t.login.forgotPassword}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ backgroundColor: '#E14D4D' }}
              >
                {isLoggingIn ? t.login.loggingIn : t.login.login}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-gray-600 text-sm hover:underline"
              >
                {t.login.cantAccessAccount}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t.clients.email}</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 text-gray-900"
                  style={{ '--tw-ring-color': '#E14D4D' } as React.CSSProperties}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.clients.email}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full py-3 rounded-lg font-semibold hover:opacity-90 transition-colors text-white" style={{ backgroundColor: '#E14D4D' }}>
                {t.login.sendResetEmail}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setEmail('')
                }}
                className="w-full text-center text-gray-600 text-sm hover:underline"
              >
                {t.login.backToLogin}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

