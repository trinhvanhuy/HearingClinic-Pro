import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { I18nProvider } from './i18n/I18nContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientListPage from './pages/Clients/ClientListPage'
import ClientDetailPage from './pages/Clients/ClientDetailPage'
import ClientFormPage from './pages/Clients/ClientFormPage'
import HearingReportFormPage from './pages/HearingReports/HearingReportFormPage'
import HearingReportDetailPage from './pages/HearingReports/HearingReportDetailPage'
import HearingReportPrintPage from './pages/HearingReports/HearingReportPrintPage'
import ReminderListPage from './pages/Reminders/ReminderListPage'
import StaffListPage from './pages/Staff/StaffListPage'
import StaffFormPage from './pages/Staff/StaffFormPage'
import ConfigPage from './pages/Config/ConfigPage'
import Layout from './components/layout/Layout'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients" element={<ClientListPage />} />
            <Route path="clients/new" element={<ClientFormPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="clients/:id/edit" element={<ClientFormPage />} />
            <Route path="hearing-reports/new" element={<HearingReportFormPage />} />
            <Route path="hearing-reports/:id/edit" element={<HearingReportFormPage />} />
            <Route path="hearing-reports/:id" element={<HearingReportDetailPage />} />
            <Route path="hearing-reports/:id/print" element={<HearingReportPrintPage />} />
            <Route path="reminders" element={<ReminderListPage />} />
            <Route path="staff" element={<StaffListPage />} />
            <Route path="staff/new" element={<StaffFormPage />} />
            <Route path="staff/:id/edit" element={<StaffFormPage />} />
            <Route path="config" element={<ConfigPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}

export default App

