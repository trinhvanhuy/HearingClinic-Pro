import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { hearingReportService } from '../api/hearingReportService'
import { useI18n } from '../i18n/I18nContext'

interface ViewAudiogramButtonProps {
  clientId: string
  className?: string
}

export default function ViewAudiogramButton({ clientId, className = '' }: ViewAudiogramButtonProps) {
  const { t } = useI18n()
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['hearing-reports', 'client', clientId, 'latest'],
    queryFn: () => hearingReportService.getAll({ clientId, limit: 1 }),
    enabled: !!clientId,
  })

  const latestReport = reports[0]

  if (isLoading) {
    return (
      <span className={`text-xs text-gray-400 ${className}`}>
        {t.common.loading}
      </span>
    )
  }

  if (latestReport) {
    const reportId = latestReport.id || (latestReport as any).objectId
    // Redirect to edit page (form page) so user can view and edit
    return (
      <Link
        to={`/hearing-reports/${reportId}/edit`}
        className={`text-primary hover:underline text-sm ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {t.hearingReports.viewAudiogram}
      </Link>
    )
  }

  return (
    <Link
      to={`/hearing-reports/new?clientId=${clientId}`}
      className={`text-primary hover:underline text-sm ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {t.hearingReports.createAudiogram}
    </Link>
  )
}

