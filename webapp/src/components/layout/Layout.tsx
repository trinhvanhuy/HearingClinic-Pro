import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { connectionStatus } from '../../services/connectionStatus'
import { syncService } from '../../services/syncService'
import { useState, useEffect } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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

  // Icon components (using SVG inline until lucide-react is installed)
  const MenuIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )

  const ChevronLeftIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )

  const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )

  const LayoutGridIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )

  const UsersRoundIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )

  const AlarmClockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  const GlobeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )

  const LogOutIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )

  const WifiOffIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
    </svg>
  )

  const navItems = [
    { path: '/dashboard', label: t.nav.dashboard, icon: LayoutGridIcon },
    { path: '/clients', label: t.nav.clients, icon: UsersRoundIcon },
    { path: '/reminders', label: t.nav.reminders, icon: AlarmClockIcon },
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
        className={`fixed top-0 left-0 z-50 h-full bg-white shadow-lg border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-20' : 'w-[280px]'}`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4 pt-6">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                        sidebarCollapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-4 border-primary font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-[15px] font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              title={sidebarCollapsed ? t.nav.language : ''}
            >
              <span className={`flex items-center gap-3 ${sidebarCollapsed ? 'gap-0' : ''}`}>
                <GlobeIcon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="text-[15px] font-medium">{t.nav.language}</span>
                    <span className="text-sm font-medium ml-auto">{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
                  </>
                )}
              </span>
            </button>
            
            {!sidebarCollapsed && (
              <div className="mb-2 px-4 py-2">
                <p className="text-sm font-medium text-gray-900">{user?.get('username') || user?.get('email')}</p>
                <p className="text-xs text-gray-500">{t.clients.staff}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-3 text-left text-danger hover:bg-danger-50 rounded-lg transition-colors flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? t.nav.logout : ''}
            >
              <LogOutIcon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-[15px] font-medium">{t.nav.logout}</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'}`}>
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Left: Menu Toggle Button + Logo */}
            <div className="flex items-center gap-4">
              {/* Menu Toggle Button */}
              <div className="flex items-center gap-2">
                {/* Mobile: Toggle sidebar open/close */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
                {/* Desktop: Toggle sidebar collapse/expand */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors"
                  title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>
              
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/assets/logo-transparent.png"
                  alt="Hearing Clinic Pro"
                  className="h-10 w-auto"
                />
                <span className="font-semibold text-lg hidden sm:block" style={{ color: '#2D2D2D' }}>
                  Hearing Clinic Pro
                </span>
              </div>
            </div>
            
            <div className="flex-1" />
            
            {/* Right: Connection Status Indicator */}
            <div className="flex items-center gap-3">
                {isSyncing && (
                  <div className="flex items-center gap-2 text-primary text-sm">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang đồng bộ...</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  connectionState === 'online'
                    ? 'bg-secondary-100 text-secondary-800'
                    : connectionState === 'offline'
                    ? 'bg-[#FFEBEE] text-[#D32F2F]'
                    : 'bg-accent-100 text-accent-800'
                }`}>
                  {connectionState === 'offline' && <WifiOffIcon className="w-4 h-4" />}
                  <div className={`w-2 h-2 rounded-full ${
                    connectionState === 'online'
                      ? 'bg-secondary'
                      : connectionState === 'offline'
                      ? 'bg-[#D32F2F]'
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
        <main className="p-6" style={{ backgroundColor: '#F5F7FA' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

