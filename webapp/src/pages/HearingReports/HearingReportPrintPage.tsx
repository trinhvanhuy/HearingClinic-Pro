import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hearingReportService } from '../../api/hearingReportService'
import { configService } from '../../api/configService'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { useEffect } from 'react'
import { DEFAULT_LOGO } from '../../constants/logo'
import { useI18n } from '../../i18n/I18nContext'

export default function HearingReportPrintPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()

  const { data: report, isLoading } = useQuery({
    queryKey: ['hearing-report', id],
    queryFn: () => hearingReportService.getById(id!),
    enabled: !!id,
  })

  const { data: clinicConfig } = useQuery({
    queryKey: ['clinic-config'],
    queryFn: () => configService.getConfig(),
  })

  useEffect(() => {
    if (report) {
      // Auto-print when component mounts
      window.print()
    }
  }, [report])

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!report) {
    return <div className="text-center py-8">{t.hearingReports.noReports}</div>
  }

  const client = report.get('client')
  const leftEar = report.get('leftEarThresholds') || {}
  const rightEar = report.get('rightEarThresholds') || {}
  const frequencies = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]

  return (
    <div className="max-w-4xl mx-auto p-8 print:p-4">
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      `}</style>
      
      <div className="space-y-6">
        {/* Clinic Header */}
        <div className="text-center border-b pb-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img src={clinicConfig?.logoUrl || DEFAULT_LOGO} alt={t.config.defaultClinicName} className="h-16" />
            <h1 className="text-3xl font-bold">{t.hearingReports.hearingLossAssessment}</h1>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-semibold">{clinicConfig?.clinicName || t.config.defaultClinicName}</p>
            <p>{clinicConfig?.clinicAddress || ''}</p>
            {clinicConfig?.clinicPhone && <p>Tel: {clinicConfig.clinicPhone}</p>}
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t.clients.fullName}</h3>
            <p className="text-lg">{client?.get('fullName')}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t.hearingReports.date}</h3>
            <p className="text-lg">{formatDate(report.get('testDate'))}</p>
          </div>
          {client?.get('dateOfBirth') && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t.hearingReports.dateOfBirth}</h3>
              <p className="text-lg">{formatDate(client.get('dateOfBirth'))}</p>
            </div>
          )}
          {report.get('typeOfTest') && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t.appointments.hearingTestType}</h3>
              <p className="text-lg capitalize">{report.get('typeOfTest')}</p>
            </div>
          )}
        </div>

        {/* Hearing Thresholds */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{t.hearingReports.pureToneAudiometry}</h3>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-2">{t.hearingReports.frequency}</th>
                {frequencies.map((freq) => (
                  <th key={freq} className="border px-4 py-2">
                    {freq}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium" style={{ color: '#1E88E5' }}>Left</td>
                {frequencies.map((freq) => (
                  <td key={freq} className="border px-4 py-2 text-center">
                    {leftEar[freq as keyof typeof leftEar] ?? '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium" style={{ color: '#E53935' }}>{t.hearingReports.right}</td>
                {frequencies.map((freq) => (
                  <td key={freq} className="border px-4 py-2 text-center">
                    {rightEar[freq as keyof typeof rightEar] ?? '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Diagnosis */}
        {report.get('diagnosis') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Diagnosis</h3>
            <p className="whitespace-pre-wrap">{report.get('diagnosis')}</p>
          </div>
        )}

        {/* Recommendations */}
        {report.get('recommendations') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{t.hearingReports.recommendations}</h3>
            <p className="whitespace-pre-wrap">{report.get('recommendations')}</p>
          </div>
        )}

        {/* Hearing Aid Suggested */}
        {report.get('hearingAidSuggested') && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{t.hearingReports.hearingAidSuggested}</h3>
            <p>{report.get('hearingAidSuggested')}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>{t.hearingReports.generatedOn} {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  )
}

