import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function NotFoundPage() {
  const { t } = useI18n()
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">{t.notFound.title}</h1>
        <h2 className="text-2xl font-semibold mb-4">{t.notFound.subtitle}</h2>
        <p className="text-gray-600 mb-8">{t.notFound.message}</p>
        <Link to="/dashboard" className="btn btn-primary">
          {t.notFound.goToDashboard}
        </Link>
      </div>
    </div>
  )
}

