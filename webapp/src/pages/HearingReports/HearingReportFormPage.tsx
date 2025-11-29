import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hearingReportService } from '../../api/hearingReportService'
import { clientService } from '../../api/clientService'
import { HearingReport, EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'
import Parse from 'parse'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

export default function HearingReportFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: report, isLoading } = useQuery({
    queryKey: ['hearing-report', id],
    queryFn: () => hearingReportService.getById(id!),
    enabled: isEdit,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ isActive: true }),
  })

  const [formData, setFormData] = useState({
    clientId: clientId || '',
    audiologist: '',
    testDate: new Date().toISOString().split('T')[0],
    typeOfTest: 'pure tone audiometry',
    leftEarThresholds: {} as EarThresholds,
    rightEarThresholds: {} as EarThresholds,
    diagnosis: '',
    recommendations: '',
    hearingAidSuggested: '',
  })

  useEffect(() => {
    if (report) {
      const client = report.get('client')
      setFormData({
        clientId: client?.id || '',
        audiologist: typeof report.get('audiologist') === 'string' 
          ? report.get('audiologist') 
          : report.get('audiologist')?.id || '',
        testDate: report.get('testDate')
          ? new Date(report.get('testDate')).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        typeOfTest: report.get('typeOfTest') || 'pure tone audiometry',
        leftEarThresholds: report.get('leftEarThresholds') || {},
        rightEarThresholds: report.get('rightEarThresholds') || {},
        diagnosis: report.get('diagnosis') || '',
        recommendations: report.get('recommendations') || '',
        hearingAidSuggested: report.get('hearingAidSuggested') || '',
      })
    }
  }, [report])

  const mutation = useMutation({
    mutationFn: async (data: Partial<HearingReport>) => {
      const client = Parse.Object.createWithoutData('Client', data.clientId as any)
      const reportData = {
        ...data,
        client,
        testDate: new Date(data.testDate as any),
      }
      if (isEdit) {
        return hearingReportService.update(id!, reportData)
      } else {
        return hearingReportService.create(reportData)
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Report updated' : 'Report created')
      queryClient.invalidateQueries({ queryKey: ['hearing-reports'] })
      navigate('/hearing-reports')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save report')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData as any)
  }

  const updateThreshold = (
    ear: 'leftEarThresholds' | 'rightEarThresholds',
    frequency: keyof EarThresholds,
    value: string
  ) => {
    setFormData({
      ...formData,
      [ear]: {
        ...formData[ear],
        [frequency]: value ? parseFloat(value) : undefined,
      },
    })
  }

  const frequencies: (keyof EarThresholds)[] = [250, 500, 1000, 2000, 4000, 8000]

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Edit Hearing Report' : 'New Hearing Report'}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Client *</label>
          <select
            className="input"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
            disabled={!!clientId}
          >
            <option value="">Select client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.get('fullName')}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Test Date *</label>
            <input
              type="date"
              className="input"
              value={formData.testDate}
              onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Type of Test</label>
            <select
              className="input"
              value={formData.typeOfTest}
              onChange={(e) => setFormData({ ...formData, typeOfTest: e.target.value })}
            >
              <option value="pure tone audiometry">Pure Tone Audiometry</option>
              <option value="speech audiometry">Speech Audiometry</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Audiologist</label>
          <input
            type="text"
            className="input"
            value={formData.audiologist}
            onChange={(e) => setFormData({ ...formData, audiologist: e.target.value })}
            placeholder="Audiologist name"
          />
        </div>

        {/* Hearing Thresholds */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Hearing Thresholds (dB HL)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2">Frequency (Hz)</th>
                  {frequencies.map((freq) => (
                    <th key={freq} className="border px-4 py-2">
                      {freq}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2 font-medium">Left Ear</td>
                  {frequencies.map((freq) => (
                    <td key={freq} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded"
                        value={formData.leftEarThresholds[freq] || ''}
                        onChange={(e) => updateThreshold('leftEarThresholds', freq, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">Right Ear</td>
                  {frequencies.map((freq) => (
                    <td key={freq} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded"
                        value={formData.rightEarThresholds[freq] || ''}
                        onChange={(e) => updateThreshold('rightEarThresholds', freq, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <label className="label">Diagnosis</label>
          <textarea
            className="input"
            rows={4}
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Recommendations</label>
          <textarea
            className="input"
            rows={4}
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Hearing Aid Suggested</label>
          <input
            type="text"
            className="input"
            value={formData.hearingAidSuggested}
            onChange={(e) => setFormData({ ...formData, hearingAidSuggested: e.target.value })}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate('/hearing-reports')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

