import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hearingReportService } from '../../api/hearingReportService'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import toast from 'react-hot-toast'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'
import { useI18n } from '../../i18n/I18nContext'

export default function HearingReportDetailPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const { data: report, isLoading } = useQuery({
    queryKey: ['hearing-report', id],
    queryFn: () => hearingReportService.getById(id!),
    enabled: !!id,
  })

  // Redirect to edit page so user can view and edit with charts
  useEffect(() => {
    if (id && !isLoading && report) {
      navigate(`/hearing-reports/${id}/edit`, { replace: true })
    }
  }, [id, isLoading, report, navigate])

  const deleteMutation = useMutation({
    mutationFn: () => hearingReportService.delete(id!),
    onSuccess: () => {
      toast.success(t.hearingReports.reportDeleted)
      queryClient.invalidateQueries({ queryKey: ['hearing-reports'] })
      // Invalidate appointments to refresh Patient History
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      // Redirect to client detail page if we have a client, otherwise dashboard
      const clientId = report?.get('client')?.id
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['appointments', 'client', clientId] })
        queryClient.invalidateQueries({ queryKey: ['client', clientId] })
        navigate(`/clients/${clientId}`)
      } else {
        navigate('/dashboard')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t.hearingReports.failedToDelete)
    },
  })

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.hearingReports.title}</h1>
        <div className="flex gap-2">
          <Link to={`/hearing-reports/${id}/print`} className="btn btn-secondary">
            Print
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="btn btn-danger"
          >
            {t.common.delete}
          </button>
        </div>
      </div>

      <div className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t.hearingReports.client}</h3>
            <p className="text-lg">
              <Link
                to={`/clients/${client?.id}`}
                className="text-primary hover:underline"
              >
                {client?.get('fullName')}
              </Link>
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Test Date</h3>
            <p className="text-lg">{formatDate(report.get('testDate'))}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t.appointments.hearingTestType}</h3>
            <p className="text-lg capitalize">{report.get('typeOfTest') || '-'}</p>
          </div>
          {report.get('audiologist') && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Audiologist</h3>
              <p className="text-lg">
                {typeof report.get('audiologist') === 'string'
                  ? report.get('audiologist')
                  : report.get('audiologist')?.get('username') || '-'}
              </p>
            </div>
          )}
        </div>

        {/* Hearing Thresholds */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{t.hearingReports.pureToneAudiometry}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
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
                <td className="border px-4 py-2 font-medium" style={{ color: '#1E88E5' }}>{t.hearingReports.left}</td>
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
        </div>

        {report.get('diagnosis') && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Diagnosis</h3>
            <p className="whitespace-pre-wrap">{report.get('diagnosis')}</p>
          </div>
        )}

        {report.get('recommendations') && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{t.hearingReports.recommendations}</h3>
            <p className="whitespace-pre-wrap">{report.get('recommendations')}</p>
          </div>
        )}

        {report.get('hearingAidSuggested') && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Hearing Aid Suggested</h3>
            <p>{report.get('hearingAidSuggested')}</p>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t.hearingReports.reportDetails}
        message={t.hearingReports.confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

