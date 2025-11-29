import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const { login, requestPasswordReset, isLoggingIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login({ username, password })
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">Hearing Clinic System</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email / Username</label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn btn-primary w-full"
              >
                {isLoggingIn ? 'Logging in...' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-600 hover:underline w-full text-center"
              >
                Forgot password?
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Send Reset Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false)
                  setEmail('')
                }}
                className="text-sm text-primary-600 hover:underline w-full text-center"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

