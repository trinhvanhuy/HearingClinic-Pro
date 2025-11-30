import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { connectionStatus } from '../../services/connectionStatus'
import { syncService } from '../../services/syncService'
import Logo from '../Logo'
import { useState, useEffect } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [connectionState, setConnectionState] = useState<'online' | 'offline' | 'checking'>('checking')
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const unsubscribeConnection = connectionStatus.subscribe(setConnectionState)
    const unsubscribeSync = syncService.subscribe(setIsSyncing)
    
    return () => {
      unsubscribeConnection()
      unsubscribeSync()
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi')
  }

  const navItems = [
    { path: '/dashboard', label: t.nav.dashboard, icon: '📊' },
    { path: '/clients', label: t.nav.clients, icon: '👥' },
    { path: '/reminders', label: t.nav.reminders, icon: '🔔' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <Logo variant="full" size="md" />
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-50 hover:text-primary transition-colors text-gray-900"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="w-full px-4 py-2 text-left text-primary hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>🌐</span>
                <span>{t.nav.language}</span>
              </span>
              <span className="text-sm font-medium">{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
            </button>
            
            <div className="mb-2 px-4">
              <p className="text-sm font-medium text-gray-900">{user?.get('username') || user?.get('email')}</p>
              <p className="text-xs text-gray-500">{t.clients.staff}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-danger hover:bg-danger-50 rounded-lg transition-colors"
            >
              {t.nav.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-900"
            >
              <span className="text-2xl">☰</span>
            </button>
            <div className="flex-1" />
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              {isSyncing && (
                <div className="flex items-center gap-2 text-primary text-sm">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đồng bộ...</span>
                </div>
              )}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                connectionState === 'online'
                  ? 'bg-secondary-100 text-secondary-800'
                  : connectionState === 'offline'
                  ? 'bg-danger-100 text-danger-800'
                  : 'bg-accent-100 text-accent-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionState === 'online'
                    ? 'bg-secondary'
                    : connectionState === 'offline'
                    ? 'bg-danger'
                    : 'bg-accent'
                }`} />
                <span>
                  {connectionState === 'online'
                    ? 'Đang kết nối'
                    : connectionState === 'offline'
                    ? 'Ngoại tuyến'
                    : 'Đang kiểm tra...'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

