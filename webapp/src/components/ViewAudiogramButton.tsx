import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import Parse from '../api/parseClient'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

interface ViewAudiogramButtonProps {
  clientId: string
  className?: string
  iconOnly?: boolean
}

export default function ViewAudiogramButton({ clientId, className = '', iconOnly = false }: ViewAudiogramButtonProps) {
  const { t } = useI18n()
  const { data: latestReport, isLoading } = useQuery({
    queryKey: ['hearing-reports', 'client', clientId, 'latest', 'view-audiogram-button'],
    queryFn: async () => {
      if (!clientId || typeof clientId !== 'string' || clientId.trim() === '' || clientId === 'Client' || clientId.length < 10) {
        console.warn('ViewAudiogramButton - Invalid clientId:', clientId)
        return null
      }
      
      try {
        const validClientId = clientId.trim()
        
        // Verify clientId before creating pointer
        if (!validClientId || validClientId === 'Client' || validClientId.length < 10) {
          console.error('ViewAudiogramButton - Cannot create pointer with invalid clientId:', validClientId)
          return null
        }
        
        // Query directly without cache to ensure fresh data
        const query = new Parse.Query(HearingReport)
        
        // Create pointer using Parse pointer format directly
        query.equalTo('client', {
          __type: 'Pointer',
          className: 'Client',
          objectId: validClientId,
        } as any)
        query.descending('updatedAt')
        query.addDescending('testDate')
        query.include('client')
        query.include('audiologist')
        query.limit(1)
        
        const reports = await query.find()
        return reports.length > 0 ? reports[0] : null
      } catch (error) {
        console.error('ViewAudiogramButton - Error fetching latest hearing report:', error)
        return null
      }
    },
    enabled: !!clientId,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  if (isLoading) {
    if (iconOnly) {
      return (
        <div className={`inline-flex items-center justify-center w-8 h-8 text-gray-400 ${className}`}>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )
    }
    return (
      <span className={`text-xs text-gray-400 ${className}`}>
        {t.common.loading}
      </span>
    )
  }

  if (latestReport) {
    const reportId = latestReport.id || (latestReport as any).objectId || (latestReport as any)._id
    // Redirect to edit page (form page) so user can view and edit
    if (iconOnly) {
      return (
        <Link
          to={`/hearing-reports/${reportId}/edit`}
          className={`inline-flex items-center justify-center w-8 h-8 text-primary hover:bg-primary/10 rounded transition-colors ${className}`}
          onClick={(e) => e.stopPropagation()}
          title={t.hearingReports.viewAudiogram}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </Link>
      )
    }
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

  if (iconOnly) {
    return (
      <Link
        to={`/hearing-reports/new?clientId=${clientId}`}
        className={`inline-flex items-center justify-center w-8 h-8 text-primary hover:bg-primary/10 rounded transition-colors ${className}`}
        onClick={(e) => e.stopPropagation()}
        title={t.hearingReports.createAudiogram}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
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

