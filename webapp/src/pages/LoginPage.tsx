import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const REMEMBER_ME_KEY = 'hearing_clinic_remember_me'
const REMEMBERED_USERNAME_KEY = 'hearing_clinic_username'

export default function LoginPage() {
  const [accountName, setAccountName] = useState('')
  const [userId, setUserId] = useState('')
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
  const navigate = useNavigate()

  // Load remembered username on mount
  useEffect(() => {
    if (rememberMe) {
      const rememberedUsername = localStorage.getItem(REMEMBERED_USERNAME_KEY)
      if (rememberedUsername) {
        setUserId(rememberedUsername)
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
        <div className="text-white text-lg">Loading...</div>
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
      // Use userId as username for login
      await login({ username: userId, password, rememberMe })
      
      // Save username to localStorage if rememberMe is checked
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true')
        localStorage.setItem(REMEMBERED_USERNAME_KEY, userId)
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY)
        localStorage.removeItem(REMEMBERED_USERNAME_KEY)
      }
      
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await requestPasswordReset(email)
      toast.success('Password reset email sent!')
      setShowForgotPassword(false)
      setEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email')
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xl font-bold">+</span>
              </div>
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white text-xl font-bold">+</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Hearing Clinic</h1>
          </div>
        </div>

        {/* Login Panel */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-300 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Sign In</h2>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Account Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter account name"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">User ID</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
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
                  <span className="text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-white hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Logging in...' : 'Log In'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-center text-white text-sm hover:underline"
              >
                Can't access your account?
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Send Reset Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setEmail('')
                }}
                className="w-full text-center text-white text-sm hover:underline"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Section - Promotional */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background geometric shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-orange-400 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-300 rounded-full opacity-10 blur-3xl"></div>
        </div>

        {/* Language Selector */}
        <div className="absolute top-8 right-8 z-10">
          <button className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-orange-600 transition-colors">
            English (EN)
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-12">
          {/* Doctor Illustration Placeholder */}
          <div className="mb-8 relative">
            <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-32 h-32 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {/* Stethoscope icon */}
            <div className="absolute -bottom-4 right-4 bg-orange-500 p-3 rounded-full shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white rounded-xl p-4 shadow-xl mb-6 w-full max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-gray-800">50k+</span>
              <span className="text-gray-600 text-sm">Customers</span>
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

          {/* Connect with Doctor Card */}
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Connect with a Doctor</h3>
                <p className="text-sm text-gray-500">Schedule your appointment today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

