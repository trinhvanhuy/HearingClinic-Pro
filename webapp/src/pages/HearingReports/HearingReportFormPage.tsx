import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hearingReportService } from '../../api/hearingReportService'
import { clientService } from '../../api/clientService'
import { configService } from '../../api/configService'
import { useAuth } from '../../hooks/useAuth'
import { HearingReport, EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'
import Parse from '../../api/parseClient'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import AudiogramChart from '../../components/AudiogramChart'

interface SpeechAudiometry {
  SAT?: { R?: number; L?: number; Bi?: number }
  SRT?: { R?: number; L?: number; Bi?: number }
  Mask?: { R?: number; L?: number; Bi?: number }
  MCL?: { R?: number; L?: number; Bi?: number }
  UCL?: { R?: number; L?: number; Bi?: number }
}

interface DiscriminationLoss {
  WR?: { R?: number; L?: number; Bi?: number }
  WRLevel?: { R?: number; L?: number; Bi?: number }
  WRMask?: { R?: number; L?: number; Bi?: number }
  WRN?: { R?: number; L?: number; Bi?: number }
  WRNLevel?: { R?: number; L?: number; Bi?: number }
  WRNMask?: { R?: number; L?: number; Bi?: number }
}

interface Tympanogram {
  type?: string
  pressure?: number
  compliance?: number
  volume?: number
}

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

  const { data: selectedClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId!),
    enabled: !!clientId,
  })

  const [formData, setFormData] = useState({
    clientId: clientId || '',
    audiologist: '',
    testDate: new Date().toISOString().split('T')[0],
    typeOfTest: 'pure tone audiometry',
    leftEarThresholds: {} as EarThresholds,
    rightEarThresholds: {} as EarThresholds,
    caseHistory: '',
    speechAudiometry: {} as SpeechAudiometry,
    discriminationLoss: {} as DiscriminationLoss,
    leftTympanogram: {} as Tympanogram,
    rightTympanogram: {} as Tympanogram,
    results: '',
    recommendations: '',
    signature: '',
    printName: '',
    licenseNo: '',
    signatureDate: new Date().toISOString().split('T')[0],
  })

  const [activeEar, setActiveEar] = useState<'left' | 'right'>('right')
  const [expandedSections, setExpandedSections] = useState({
    speechAudiometry: false,
    discriminationLoss: false,
    tympanograms: false,
  })
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)
  const { user } = useAuth()

  const { data: clinicConfig } = useQuery({
    queryKey: ['clinic-config'],
    queryFn: () => configService.getConfig(),
  })

  useEffect(() => {
    // Close floating menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.floating-menu-container')) {
        setShowFloatingMenu(false)
      }
    }
    if (showFloatingMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFloatingMenu])

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
        caseHistory: (report as any).get('caseHistory') || '',
        speechAudiometry: (report as any).get('speechAudiometry') || {},
        discriminationLoss: (report as any).get('discriminationLoss') || {},
        leftTympanogram: (report as any).get('leftTympanogram') || {},
        rightTympanogram: (report as any).get('rightTympanogram') || {},
        results: report.get('diagnosis') || '',
        recommendations: report.get('recommendations') || '',
        signature: (report as any).get('signature') || '',
        printName: (report as any).get('printName') || '',
        licenseNo: (report as any).get('licenseNo') || '',
        signatureDate: (report as any).get('signatureDate') 
          ? new Date((report as any).get('signatureDate')).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
    } else if (user) {
      // Set default signature to current user's name
      const userName = user.get('fullName') || user.get('username') || ''
      setFormData(prev => ({
        ...prev,
        signature: userName,
        printName: userName,
      }))
    }
  }, [report, user])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const client = Parse.Object.createWithoutData('Client', data.clientId)
      const reportData = {
        ...data,
        client,
        testDate: new Date(data.testDate),
        signatureDate: data.signatureDate ? new Date(data.signatureDate) : undefined,
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
    mutation.mutate(formData)
  }

  const updateThreshold = (
    ear: 'leftEarThresholds' | 'rightEarThresholds',
    frequency: number,
    value: string | number | undefined
  ) => {
    const numValue = typeof value === 'string' ? (value ? parseFloat(value) : undefined) : value
    setFormData({
      ...formData,
      [ear]: {
        ...formData[ear],
        [frequency]: numValue,
      },
    })
  }

  const updateSpeechAudiometry = (field: keyof SpeechAudiometry, ear: 'R' | 'L' | 'Bi', value: string) => {
    setFormData({
      ...formData,
      speechAudiometry: {
        ...formData.speechAudiometry,
        [field]: {
          ...formData.speechAudiometry[field],
          [ear]: value ? parseFloat(value) : undefined,
        },
      },
    })
  }

  const updateDiscriminationLoss = (field: keyof DiscriminationLoss, ear: 'R' | 'L' | 'Bi', value: string) => {
    setFormData({
      ...formData,
      discriminationLoss: {
        ...formData.discriminationLoss,
        [field]: {
          ...formData.discriminationLoss[field],
          [ear]: value ? parseFloat(value) : undefined,
        },
      },
    })
  }

  const updateTympanogram = (ear: 'leftTympanogram' | 'rightTympanogram', field: keyof Tympanogram, value: string) => {
    setFormData({
      ...formData,
      [ear]: {
        ...formData[ear],
        [field]: field === 'type' ? value : (value ? parseFloat(value) : undefined),
      },
    })
  }

  const frequencies = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const client = selectedClient || clients.find(c => c.id === formData.clientId)

  const handlePrint = () => {
    if (id) {
      window.open(`/hearing-reports/${id}/print`, '_blank')
    } else {
      toast.error('Please save the report first')
    }
  }

  const handleShareEmail = () => {
    if (id && client) {
      const email = client.get('email')
      if (email) {
        window.location.href = `mailto:${email}?subject=Hearing Report&body=Please find attached your hearing report.`
      } else {
        toast.error('Client email not found')
      }
    } else {
      toast.error('Please save the report first')
    }
  }

  const handleDownloadPDF = () => {
    if (id) {
      window.open(`/hearing-reports/${id}/print`, '_blank')
      setTimeout(() => {
        window.print()
      }, 500)
    } else {
      toast.error('Please save the report first')
    }
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 relative">
      {/* Floating Action Button */}
      {id && (
        <div className="fixed bottom-8 right-8 z-50 floating-menu-container">
          <button
            type="button"
            onClick={() => setShowFloatingMenu(!showFloatingMenu)}
            className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {showFloatingMenu && (
            <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border p-2 min-w-[180px]">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                type="button"
                onClick={handleShareEmail}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Share Email
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img src="/assets/logo-transparent.png" alt="Logo" className="h-16" />
          <h1 className="text-2xl font-bold">Hearing Loss Assessment</h1>
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-semibold">{clinicConfig?.clinicName || 'Hearing Clinic Pro'}</p>
          <p>{clinicConfig?.clinicAddress || ''}</p>
          {clinicConfig?.clinicPhone && <p>Tel: {clinicConfig.clinicPhone}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Patient Information */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient (Last Name) *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={client?.get('lastName') || ''}
                disabled
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={client?.get('firstName') || ''}
                disabled
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address (Street)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={client?.get('address') || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City/Town</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={client?.get('city') || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telephone Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={client?.get('phone') || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={client?.get('dateOfBirth') ? new Date(client.get('dateOfBirth')).toISOString().split('T')[0] : ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Service *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={formData.testDate}
                onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Puretone Audiometry */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Puretone Audiometry</h2>
          
          {/* Interactive Audiogram */}
          <div className="mb-6">
            <AudiogramChart
              leftEar={formData.leftEarThresholds}
              rightEar={formData.rightEarThresholds}
              mode={activeEar}
              onModeChange={setActiveEar}
              onChangeRight={(frequency, value) => {
                updateThreshold('rightEarThresholds', frequency, value)
              }}
              onChangeLeft={(frequency, value) => {
                updateThreshold('leftEarThresholds', frequency, value)
              }}
            />
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left">Frequency (Hz)</th>
                  {frequencies.map((freq) => (
                    <th key={freq} className="border px-4 py-2">
                      {freq}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2 font-medium" style={{ color: '#E53935' }}>Right</td>
                  {frequencies.map((freq) => (
                    <td key={freq} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.rightEarThresholds[freq as keyof EarThresholds] || ''}
                        onChange={(e) => updateThreshold('rightEarThresholds', freq, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium" style={{ color: '#1E88E5' }}>Left</td>
                  {frequencies.map((freq) => (
                    <td key={freq} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.leftEarThresholds[freq as keyof EarThresholds] || ''}
                        onChange={(e) => updateThreshold('leftEarThresholds', freq, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Speech Audiometry */}
        <div className="border rounded-lg p-6">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, speechAudiometry: !prev.speechAudiometry }))}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-bold">Speech Audiometry</h2>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.speechAudiometry ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.speechAudiometry && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-left">Test</th>
                      <th className="border px-4 py-2">R</th>
                      <th className="border px-4 py-2">L</th>
                      <th className="border px-4 py-2">Bi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['SAT', 'SRT', 'Mask', 'MCL', 'UCL'] as const).map((test) => (
                      <tr key={test}>
                        <td className="border px-4 py-2 font-medium">{test}</td>
                        {(['R', 'L', 'Bi'] as const).map((ear) => (
                          <td key={ear} className="border px-4 py-2">
                            <input
                              type="number"
                              className="w-full px-2 py-1 border rounded text-sm"
                              value={formData.speechAudiometry[test]?.[ear] || ''}
                              onChange={(e) => updateSpeechAudiometry(test, ear, e.target.value)}
                              placeholder="-"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Discrimination Loss */}
        <div className="border rounded-lg p-6">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, discriminationLoss: !prev.discriminationLoss }))}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-bold">Discrimination Loss</h2>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.discriminationLoss ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.discriminationLoss && (
            <div className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-left">Test</th>
                      <th className="border px-4 py-2">R</th>
                      <th className="border px-4 py-2">L</th>
                      <th className="border px-4 py-2">Bi</th>
                    </tr>
                  </thead>
                  <tbody>
                <tr>
                  <td className="border px-4 py-2 font-medium">WR %</td>
                  {(['R', 'L', 'Bi'] as const).map((ear) => (
                    <td key={ear} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.discriminationLoss.WR?.[ear] || ''}
                        onChange={(e) => updateDiscriminationLoss('WR', ear, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">WR Level</td>
                  {(['R', 'L', 'Bi'] as const).map((ear) => (
                    <td key={ear} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.discriminationLoss.WRLevel?.[ear] || ''}
                        onChange={(e) => updateDiscriminationLoss('WRLevel', ear, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">WR Mask</td>
                  {(['R', 'L', 'Bi'] as const).map((ear) => (
                    <td key={ear} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.discriminationLoss.WRMask?.[ear] || ''}
                        onChange={(e) => updateDiscriminationLoss('WRMask', ear, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">WRN %</td>
                  {(['R', 'L', 'Bi'] as const).map((ear) => (
                    <td key={ear} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.discriminationLoss.WRN?.[ear] || ''}
                        onChange={(e) => updateDiscriminationLoss('WRN', ear, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">WRN Level</td>
                  {(['R', 'L', 'Bi'] as const).map((ear) => (
                    <td key={ear} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.discriminationLoss.WRNLevel?.[ear] || ''}
                        onChange={(e) => updateDiscriminationLoss('WRNLevel', ear, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border px-4 py-2 font-medium">WRN Mask</td>
                  {(['R', 'L', 'Bi'] as const).map((ear) => (
                    <td key={ear} className="border px-4 py-2">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-sm"
                        value={formData.discriminationLoss.WRNMask?.[ear] || ''}
                        onChange={(e) => updateDiscriminationLoss('WRNMask', ear, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Tympanograms */}
        <div className="border rounded-lg p-6">
          <button
            type="button"
            onClick={() => setExpandedSections(prev => ({ ...prev, tympanograms: !prev.tympanograms }))}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-bold">Tympanograms (Pressure mmH20)</h2>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.tympanograms ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.tympanograms && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Left Ear</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.leftTympanogram.type || ''}
                    onChange={(e) => updateTympanogram('leftTympanogram', 'type', e.target.value)}
                    placeholder="A, B, C, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pressure</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.leftTympanogram.pressure || ''}
                    onChange={(e) => updateTympanogram('leftTympanogram', 'pressure', e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Compliance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.leftTympanogram.compliance || ''}
                    onChange={(e) => updateTympanogram('leftTympanogram', 'compliance', e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Volume</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.leftTympanogram.volume || ''}
                    onChange={(e) => updateTympanogram('leftTympanogram', 'volume', e.target.value)}
                    placeholder="-"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Note: Graph visualization can be added here</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Right Ear</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.rightTympanogram.type || ''}
                    onChange={(e) => updateTympanogram('rightTympanogram', 'type', e.target.value)}
                    placeholder="A, B, C, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pressure</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.rightTympanogram.pressure || ''}
                    onChange={(e) => updateTympanogram('rightTympanogram', 'pressure', e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Compliance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.rightTympanogram.compliance || ''}
                    onChange={(e) => updateTympanogram('rightTympanogram', 'compliance', e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Volume</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full px-3 py-2 border rounded"
                    value={formData.rightTympanogram.volume || ''}
                    onChange={(e) => updateTympanogram('rightTympanogram', 'volume', e.target.value)}
                    placeholder="-"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Note: Graph visualization can be added here</p>
            </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Results</h2>
          <textarea
            className="w-full px-3 py-2 border rounded"
            rows={4}
            value={formData.results}
            onChange={(e) => setFormData({ ...formData, results: e.target.value })}
            placeholder="Enter results summary..."
          />
        </div>

        {/* Recommendations */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Recommendations</h2>
          <textarea
            className="w-full px-3 py-2 border rounded"
            rows={4}
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
            placeholder="Enter recommendations..."
          />
        </div>

        {/* Signature */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Signature</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Signature</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={formData.signature}
                onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                placeholder="Enter signature name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Print Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={formData.printName}
                onChange={(e) => setFormData({ ...formData, printName: e.target.value })}
                placeholder="Enter print name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lic. No</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                placeholder="Enter license number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={formData.signatureDate}
                onChange={(e) => setFormData({ ...formData, signatureDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/hearing-reports')}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Report' : 'Create Report'}
          </button>
        </div>
      </form>
    </div>
  )
}
