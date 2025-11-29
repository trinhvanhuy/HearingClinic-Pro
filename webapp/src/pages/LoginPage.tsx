import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n/I18nContext'
import Logo from '../components/Logo'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
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
    <div className="min-h-screen flex bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: 'url(/assets/background.png)' }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" />
      
      {/* Content Container */}
      <div className="relative z-10 w-full flex">
        {/* Left Section - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12">
          {/* Logo */}
          <div className="mb-12">
            <Logo variant="full" size="lg" className="mb-2" />
          </div>

          {/* Login Panel */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-300 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white text-center mb-8">{t.login.title}</h2>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.login.username}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.login.username}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.login.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
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
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm">{t.login.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-white hover:underline"
                >
                  {t.login.forgotPassword}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? t.login.loggingIn : t.login.login}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-white text-sm hover:underline"
              >
                {t.login.cantAccessAccount}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">{t.clients.email}</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.clients.email}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {t.login.sendResetEmail}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setEmail('')
                }}
                className="w-full text-center text-white text-sm hover:underline"
              >
                {t.login.backToLogin}
              </button>
            </form>
          )}
          </div>
        </div>

        {/* Right Section - Promotional */}
        <div className="hidden lg:flex lg:w-1/2 relative">
            {/* Background geometric shapes */}
            <div className="absolute inset-0">
              <div className="absolute top-20 right-20 w-64 h-64 bg-orange-400 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full opacity-10 blur-3xl"></div>
            </div>

            {/* Language Selector */}
            <div className="absolute top-8 right-8 z-20">
              <button 
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg"
              >
                {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-12 w-full">
              {/* Doctor Image */}
              <div className="mb-8 relative flex items-center justify-center">
                <img 
                  src="/assets/background.png" 
                  alt="Doctor"
                  className="max-w-md w-auto h-auto object-contain"
                  style={{ 
                    maxHeight: '500px',
                    filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.25))'
                  }}
                />
                
                {/* Customers Card - Positioned near doctor */}
                <div className="absolute top-20 right-0 bg-white rounded-xl p-4 shadow-xl w-48">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-800">50k+</span>
                    <span className="text-gray-600 text-sm">{language === 'vi' ? 'Khách hàng' : 'Customers'}</span>
                  </div>
                  <div className="flex items-center -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white"></div>
                    ))}
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      +
                    </div>
                  </div>
                </div>
              </div>

              {/* Connect with Doctor Card */}
              <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{language === 'vi' ? 'Kết nối với Bác sĩ' : 'Connect with a Doctor'}</h3>
                    <p className="text-sm text-gray-500">{language === 'vi' ? 'Đặt lịch hẹn ngay hôm nay' : 'Schedule your appointment today'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

