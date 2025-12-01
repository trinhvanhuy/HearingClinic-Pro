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
import SpeechAudiometryChart, { SpeechAudiometryPoint, SpeechAudiometryData } from '../../components/SpeechAudiometryChart'
import DiscriminationLossChart, { DiscriminationLossData } from '../../components/DiscriminationLossChart'
import TympanogramChart, { TympanogramPoint, TympanogramData } from '../../components/TympanogramChart'
import { useI18n } from '../../i18n/I18nContext'

interface SpeechAudiometry {
  // Legacy format (for backward compatibility)
  SAT?: { R?: number; L?: number; Bi?: number }
  SRT?: { R?: number; L?: number; Bi?: number }
  Mask?: { R?: number; L?: number; Bi?: number }
  MCL?: { R?: number; L?: number; Bi?: number }
  UCL?: { R?: number; L?: number; Bi?: number }
  // New format for chart
  points?: SpeechAudiometryPoint[]
}

interface DiscriminationLoss {
  // Legacy format (for backward compatibility)
  WR?: { R?: number; L?: number; Bi?: number }
  WRLevel?: { R?: number; L?: number; Bi?: number }
  WRMask?: { R?: number; L?: number; Bi?: number }
  WRN?: { R?: number; L?: number; Bi?: number }
  WRNLevel?: { R?: number; L?: number; Bi?: number }
  WRNMask?: { R?: number; L?: number; Bi?: number }
  // New format for chart
  rightCorrectPercent?: number
  leftCorrectPercent?: number
}

interface Tympanogram {
  // Legacy format (for backward compatibility)
  type?: string
  pressure?: number
  compliance?: number
  volume?: number
  // New format for chart
  points?: TympanogramPoint[]
}

export default function HearingReportFormPage() {
  const { t } = useI18n()
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
    speechAudiometry: { points: [] } as SpeechAudiometry,
    discriminationLoss: { rightCorrectPercent: 0, leftCorrectPercent: 0 } as DiscriminationLoss,
    leftTympanogram: { points: [] } as Tympanogram,
    rightTympanogram: { points: [] } as Tympanogram,
    results: '',
    recommendations: '',
    signature: '',
    printName: '',
    licenseNo: '',
    signatureDate: new Date().toISOString().split('T')[0],
  })

  const [activeEar, setActiveEar] = useState<'left' | 'right'>('right')
  const [activeTestTab, setActiveTestTab] = useState<'pureTone' | 'speech' | 'discrimination' | 'tympanogram'>('pureTone')
  const [speechAudiometryMode, setSpeechAudiometryMode] = useState<'R' | 'L'>('R')
  const [tympanogramMode, setTympanogramMode] = useState<'R' | 'L'>('R')
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
        speechAudiometry: (report as any).get('speechAudiometry') || { points: [] },
        discriminationLoss: {
          ...((report as any).get('discriminationLoss') || {}),
          rightCorrectPercent: (report as any).get('discriminationLoss')?.rightCorrectPercent || 0,
          leftCorrectPercent: (report as any).get('discriminationLoss')?.leftCorrectPercent || 0,
        },
        leftTympanogram: (report as any).get('leftTympanogram') || { points: [] },
        rightTympanogram: (report as any).get('rightTympanogram') || { points: [] },
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
    retry: false, // Don't retry on error
    mutationFn: async (data: any) => {
      console.log('Mutation started at:', new Date().toISOString())
      
      if (!data.clientId || data.clientId.trim() === '') {
        throw new Error('Client is required')
      }
      
      // Validate clientId is a valid Parse object ID
      const clientIdStr = String(data.clientId).trim()
      if (!clientIdStr || clientIdStr === 'Client' || clientIdStr === 'client' || clientIdStr.length < 5) {
        throw new Error('Invalid client ID. Please select a valid client.')
      }
      
      // Verify client exists
      try {
        const client = await clientService.getById(clientIdStr)
        if (!client) {
          throw new Error(`Client not found: ${clientIdStr}`)
        }
      } catch (error: any) {
        console.error('Error fetching client:', error)
        throw new Error(`Invalid client ID: ${error.message || 'Client ID is not valid'}`)
      }
      
      // Prepare report data
      // CRITICAL: Pass clientId as string, NOT as Parse Object
      // Parse SDK has a bug where it serializes Parse.Object.createWithoutData incorrectly
      // Backend will convert string to proper pointer
      const reportData: any = {
        client: clientIdStr, // Pass as string - backend will handle conversion
        testDate: new Date(data.testDate),
        typeOfTest: data.typeOfTest,
        leftEarThresholds: data.leftEarThresholds,
        rightEarThresholds: data.rightEarThresholds,
        diagnosis: data.results || '',
        recommendations: data.recommendations || '',
      }
      
      // Add caseHistory if provided
      if (data.caseHistory) {
        reportData.caseHistory = data.caseHistory
      }
      
      // Add optional fields
      if (data.speechAudiometry && Object.keys(data.speechAudiometry).length > 0) {
        reportData.speechAudiometry = data.speechAudiometry
      }
      if (data.discriminationLoss && Object.keys(data.discriminationLoss).length > 0) {
        reportData.discriminationLoss = data.discriminationLoss
      }
      if (data.leftTympanogram && Object.keys(data.leftTympanogram).length > 0) {
        reportData.leftTympanogram = data.leftTympanogram
      }
      if (data.rightTympanogram && Object.keys(data.rightTympanogram).length > 0) {
        reportData.rightTympanogram = data.rightTympanogram
      }
      if (data.signature) {
        reportData.signature = data.signature
      }
      if (data.printName) {
        reportData.printName = data.printName
      }
      if (data.licenseNo) {
        reportData.licenseNo = data.licenseNo
      }
      if (data.signatureDate) {
        reportData.signatureDate = new Date(data.signatureDate)
      }
      if (data.audiologist) {
        // If audiologist is a string (ID), create pointer, otherwise use as is
        if (typeof data.audiologist === 'string' && data.audiologist.trim() !== '') {
          try {
            reportData.audiologist = Parse.Object.createWithoutData('_User', data.audiologist)
          } catch (error) {
            // If invalid, skip audiologist
            console.warn('Invalid audiologist ID:', error)
          }
        } else if (data.audiologist) {
          reportData.audiologist = data.audiologist
        }
      }
      
      if (isEdit) {
        console.log('Calling update...')
        return hearingReportService.update(id!, reportData)
      } else {
        console.log('Calling create...')
        return hearingReportService.create(reportData)
      }
    },
    onSuccess: () => {
      console.log('Mutation succeeded')
      toast.success(isEdit ? 'Report updated' : 'Report created')
      queryClient.invalidateQueries({ queryKey: ['hearing-reports'] })
      navigate('/hearing-reports')
    },
    onError: (error: any) => {
      console.error('Mutation error:', error)
      toast.error(error.message || 'Failed to save report')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (mutation.isPending) {
      return
    }
    
    // Validate client is selected
    if (!formData.clientId || formData.clientId.trim() === '') {
      toast.error('Please select a client')
      return
    }
    
    // Additional validation: ensure clientId is not just "Client" string
    const clientIdStr = String(formData.clientId).trim()
    if (clientIdStr === 'Client' || clientIdStr === 'client' || clientIdStr.length < 10) {
      toast.error('Invalid client. Please select a valid client from the list.')
      return
    }
    
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

  // Speech Audiometry points management
  const addSpeechAudiometryPoint = () => {
    const newPoint: SpeechAudiometryPoint = { ear: 'R', dbHL: 0, recognitionPercent: 0 }
    setFormData({
      ...formData,
      speechAudiometry: {
        ...formData.speechAudiometry,
        points: [...(formData.speechAudiometry.points || []), newPoint],
      },
    })
  }

  const updateSpeechAudiometryPoint = (index: number, field: keyof SpeechAudiometryPoint, value: string | number) => {
    const points = [...(formData.speechAudiometry.points || [])]
    points[index] = { ...points[index], [field]: value }
    setFormData({
      ...formData,
      speechAudiometry: {
        ...formData.speechAudiometry,
        points,
      },
    })
  }

  const removeSpeechAudiometryPoint = (index: number) => {
    const points = [...(formData.speechAudiometry.points || [])]
    points.splice(index, 1)
    setFormData({
      ...formData,
      speechAudiometry: {
        ...formData.speechAudiometry,
        points,
      },
    })
  }

  // Discrimination Loss management
  const updateDiscriminationLossPercent = (ear: 'right' | 'left', value: string) => {
    const percent = value ? parseFloat(value) : 0
    setFormData({
      ...formData,
      discriminationLoss: {
        ...formData.discriminationLoss,
        [ear === 'right' ? 'rightCorrectPercent' : 'leftCorrectPercent']: percent,
      },
    })
  }

  // Tympanogram points management
  const addTympanogramPoint = (ear: 'left' | 'right') => {
    const newPoint: TympanogramPoint = { ear: ear === 'right' ? 'R' : 'L', pressure: 0, admittance: 0 }
    const earKey = ear === 'right' ? 'rightTympanogram' : 'leftTympanogram'
    setFormData({
      ...formData,
      [earKey]: {
        ...formData[earKey],
        points: [...(formData[earKey].points || []), newPoint],
      },
    })
  }

  const updateTympanogramPoint = (ear: 'left' | 'right', index: number, field: 'pressure' | 'admittance', value: string) => {
    const earKey = ear === 'right' ? 'rightTympanogram' : 'leftTympanogram'
    const points = [...(formData[earKey].points || [])]
    points[index] = { ...points[index], [field]: value ? parseFloat(value) : 0 }
    setFormData({
      ...formData,
      [earKey]: {
        ...formData[earKey],
        points,
      },
    })
  }

  const removeTympanogramPoint = (ear: 'left' | 'right', index: number) => {
    const earKey = ear === 'right' ? 'rightTympanogram' : 'leftTympanogram'
    const points = [...(formData[earKey].points || [])]
    points.splice(index, 1)
    setFormData({
      ...formData,
      [earKey]: {
        ...formData[earKey],
        points,
      },
    })
  }

  // Prepare chart data
  const getSpeechAudiometryChartData = (): SpeechAudiometryData => {
    const points = formData.speechAudiometry.points || []
    return {
      rightEar: points.filter(p => p.ear === 'R'),
      leftEar: points.filter(p => p.ear === 'L'),
    }
  }

  const getDiscriminationLossChartData = (): DiscriminationLossData => {
    const rightPercent = formData.discriminationLoss.rightCorrectPercent || 0
    const leftPercent = formData.discriminationLoss.leftCorrectPercent || 0
    return {
      rightEar: {
        correctPercent: rightPercent,
        lossPercent: 100 - rightPercent,
      },
      leftEar: {
        correctPercent: leftPercent,
        lossPercent: 100 - leftPercent,
      },
    }
  }

  const getTympanogramChartData = (): TympanogramData => {
    return {
      rightEar: formData.rightTympanogram.points || [],
      leftEar: formData.leftTympanogram.points || [],
    }
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
        <div className="rounded-lg">
          <h2 className="text-lg font-bold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
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

        {/* Audiometry Tests - Tabbed Interface */}
        <div className="rounded-lg bg-white border border-gray-200">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-4">
              <button
                type="button"
                onClick={() => setActiveTestTab('pureTone')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTestTab === 'pureTone'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Puretone Audiometry
              </button>
              <button
                type="button"
                onClick={() => setActiveTestTab('speech')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTestTab === 'speech'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Speech Audiometry
              </button>
              <button
                type="button"
                onClick={() => setActiveTestTab('discrimination')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTestTab === 'discrimination'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Discrimination Loss
              </button>
              <button
                type="button"
                onClick={() => setActiveTestTab('tympanogram')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTestTab === 'tympanogram'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tympanograms (Pressure mmH₂O)
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Puretone Audiometry Tab */}
            {activeTestTab === 'pureTone' && (
              <div>
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
                              className="w-full px-2 py-1 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                              className="w-full px-2 py-1 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            )}

            {/* Speech Audiometry Tab */}
            {activeTestTab === 'speech' && (
              <div>
                {/* Speech Audiometry Chart */}
                <div className="mb-6">
                  <SpeechAudiometryChart 
                    data={getSpeechAudiometryChartData()} 
                    mode={speechAudiometryMode}
                    onModeChange={setSpeechAudiometryMode}
                    onAddPoint={(point) => {
                      setFormData({
                        ...formData,
                        speechAudiometry: {
                          ...formData.speechAudiometry,
                          points: [...(formData.speechAudiometry.points || []), point],
                        },
                      })
                    }}
                  />
                </div>

                {/* Data Input Table */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-semibold">Data Points</h3>
                    <button
                      type="button"
                      onClick={addSpeechAudiometryPoint}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                    >
                      + Add Row
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">Ear</th>
                          <th className="border px-4 py-2">dB HL</th>
                          <th className="border px-4 py-2">% Recognition</th>
                          <th className="border px-4 py-2 w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.speechAudiometry.points || []).map((point, index) => (
                          <tr key={index}>
                            <td className="border px-4 py-2">
                              <select
                                className="w-full px-2 py-1 border rounded text-sm"
                                value={point.ear}
                                onChange={(e) => updateSpeechAudiometryPoint(index, 'ear', e.target.value as 'R' | 'L')}
                              >
                                <option value="R">Right</option>
                                <option value="L">Left</option>
                              </select>
                            </td>
                            <td className="border px-4 py-2">
                              <input
                                type="number"
                                className="w-full px-2 py-1 border rounded text-sm"
                                value={point.dbHL || ''}
                                onChange={(e) => updateSpeechAudiometryPoint(index, 'dbHL', parseFloat(e.target.value) || 0)}
                                placeholder="0-120"
                                min="0"
                                max="120"
                              />
                            </td>
                            <td className="border px-4 py-2">
                              <input
                                type="number"
                                className="w-full px-2 py-1 border rounded text-sm"
                                value={point.recognitionPercent || ''}
                                onChange={(e) => updateSpeechAudiometryPoint(index, 'recognitionPercent', parseFloat(e.target.value) || 0)}
                                placeholder="0-100"
                                min="0"
                                max="100"
                              />
                            </td>
                            <td className="border px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeSpeechAudiometryPoint(index)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!formData.speechAudiometry.points || formData.speechAudiometry.points.length === 0) && (
                          <tr>
                            <td colSpan={4} className="border px-4 py-8 text-center text-gray-500">
                              No data points. Click "+ Add Row" to add data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Discrimination Loss Tab */}
            {activeTestTab === 'discrimination' && (
              <div>
                {/* Discrimination Loss Chart */}
                <div className="mb-6">
                  <DiscriminationLossChart data={getDiscriminationLossChartData()} />
                </div>

                {/* Data Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-md font-semibold mb-3">Right Ear</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Correct %</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded"
                          value={formData.discriminationLoss.rightCorrectPercent || ''}
                          onChange={(e) => updateDiscriminationLossPercent('right', e.target.value)}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Loss: {100 - (formData.discriminationLoss.rightCorrectPercent || 0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-md font-semibold mb-3">Left Ear</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Correct %</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border rounded"
                          value={formData.discriminationLoss.leftCorrectPercent || ''}
                          onChange={(e) => updateDiscriminationLossPercent('left', e.target.value)}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Loss: {100 - (formData.discriminationLoss.leftCorrectPercent || 0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tympanograms Tab */}
            {activeTestTab === 'tympanogram' && (
              <div>
                {/* Tympanogram Chart */}
                <div className="mb-6">
                  <TympanogramChart 
                    data={getTympanogramChartData()} 
                    mode={tympanogramMode}
                    onModeChange={setTympanogramMode}
                    onAddPoint={(point) => {
                      const earKey = point.ear === 'R' ? 'rightTympanogram' : 'leftTympanogram'
                      setFormData({
                        ...formData,
                        [earKey]: {
                          ...formData[earKey],
                          points: [...(formData[earKey].points || []), point],
                        },
                      })
                    }}
                  />
                </div>

                {/* Data Input Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Ear */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold">Left Ear</h3>
                      <button
                        type="button"
                        onClick={() => addTympanogramPoint('left')}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                      >
                        + Add Row
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border px-3 py-2 text-left">Pressure (mmH₂O)</th>
                            <th className="border px-3 py-2 text-left">Admittance</th>
                            <th className="border px-3 py-2 w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.leftTympanogram.points || []).map((point, index) => (
                            <tr key={index}>
                              <td className="border px-3 py-2">
                                <input
                                  type="number"
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  value={point.pressure || ''}
                                  onChange={(e) => updateTympanogramPoint('left', index, 'pressure', e.target.value)}
                                  placeholder="-400 to +200"
                                  min="-400"
                                  max="200"
                                />
                              </td>
                              <td className="border px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  value={point.admittance || ''}
                                  onChange={(e) => updateTympanogramPoint('left', index, 'admittance', e.target.value)}
                                  placeholder="Admittance"
                                />
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeTympanogramPoint('left', index)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!formData.leftTympanogram.points || formData.leftTympanogram.points.length === 0) && (
                            <tr>
                              <td colSpan={3} className="border px-3 py-4 text-center text-gray-500 text-sm">
                                No data points. Click "+ Add Row" to add data.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Ear */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold">Right Ear</h3>
                      <button
                        type="button"
                        onClick={() => addTympanogramPoint('right')}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                      >
                        + Add Row
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border px-3 py-2 text-left">Pressure (mmH₂O)</th>
                            <th className="border px-3 py-2 text-left">Admittance</th>
                            <th className="border px-3 py-2 w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(formData.rightTympanogram.points || []).map((point, index) => (
                            <tr key={index}>
                              <td className="border px-3 py-2">
                                <input
                                  type="number"
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  value={point.pressure || ''}
                                  onChange={(e) => updateTympanogramPoint('right', index, 'pressure', e.target.value)}
                                  placeholder="-400 to +200"
                                  min="-400"
                                  max="200"
                                />
                              </td>
                              <td className="border px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  value={point.admittance || ''}
                                  onChange={(e) => updateTympanogramPoint('right', index, 'admittance', e.target.value)}
                                  placeholder="Admittance"
                                />
                              </td>
                              <td className="border px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeTympanogramPoint('right', index)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!formData.rightTympanogram.points || formData.rightTympanogram.points.length === 0) && (
                            <tr>
                              <td colSpan={3} className="border px-3 py-4 text-center text-gray-500 text-sm">
                                No data points. Click "+ Add Row" to add data.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="rounded-lg">
          <h2 className="text-lg font-bold mb-4">{t.hearingReports.results}</h2>
          <textarea
            className="w-full px-3 py-2 border rounded"
            rows={4}
            value={formData.results}
            onChange={(e) => setFormData({ ...formData, results: e.target.value })}
            placeholder={t.hearingReports.enterResults}
          />
        </div>

        {/* Recommendations */}
        <div className="rounded-lg">
          <h2 className="text-lg font-bold mb-4">{t.hearingReports.recommendations}</h2>
          <textarea
            className="w-full px-3 py-2 border rounded"
            rows={4}
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
            placeholder={t.hearingReports.enterRecommendations}
          />
        </div>

        {/* Signature */}
        <div className="rounded-lg">
          <h2 className="text-lg font-bold mb-4">{t.hearingReports.signature}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.hearingReports.printName}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={formData.printName}
                onChange={(e) => setFormData({ ...formData, printName: e.target.value })}
                placeholder={t.hearingReports.enterPrintName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.hearingReports.signatureDate}</label>
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
