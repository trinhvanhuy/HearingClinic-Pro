import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { appointmentService } from '../api/appointmentService'
import { hearingReportService } from '../api/hearingReportService'
import { staffService, StaffRole } from '../api/staffService'
import { clientService } from '../api/clientService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { useI18n } from '../i18n/I18nContext'
import Parse from '../api/parseClient'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'
import { getStaffRoleColor } from '../pages/Staff/StaffListPage'

interface RepairAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  appointmentId?: string // For edit mode
}

export default function RepairAppointmentModal({
  isOpen,
  onClose,
  clientId,
  appointmentId,
}: RepairAppointmentModalProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!appointmentId

  // Helper function to get staff ID consistently
  const getStaffId = (staff: Parse.User | null | undefined): string => {
    if (!staff) return ''
    
    // Try multiple ways to get the ID
    // Parse.User.id is a getter that returns objectId, but it might not work if objectId isn't set
    let id = ''
    
    // First try the id property (getter)
    try {
      id = staff.id || ''
    } catch (e) {
      // id getter might fail
    }
    
    // If id is empty, try objectId directly
    if (!id) {
      id = (staff as any).objectId || ''
    }
    
    // Try _id as fallback
    if (!id) {
      id = (staff as any)._id || ''
    }
    
    // Try getting from attributes
    if (!id) {
      try {
        id = staff.get('objectId') || ''
      } catch (e) {
        // get might fail
      }
    }
    
    // Try from JSON
    if (!id && staff.toJSON) {
      try {
        const json = staff.toJSON()
        id = json.objectId || json.id || ''
      } catch (e) {
        // toJSON might fail
      }
    }
    
    // Debug log if still no ID
    if (!id && staff) {
      console.warn('Staff ID not found:', {
        staff: staff.toJSON ? staff.toJSON() : staff,
        hasId: !!staff.id,
        hasObjectId: !!(staff as any).objectId,
        has_id: !!(staff as any)._id,
        className: (staff as any).className,
      })
    }
    
    return id
  }

  // Get all hearing reports for dropdown - query directly to avoid cache issues
  const { data: hearingReports = [], isLoading: hearingReportsLoading } = useQuery({
    queryKey: ['hearing-reports', 'client', clientId, 'all', 'repair-modal'],
    queryFn: async () => {
      if (!clientId) {
        console.warn('RepairAppointmentModal - No clientId provided')
        return []
      }
      
      // Validate clientId
      if (typeof clientId !== 'string' || clientId.trim() === '' || clientId === 'Client' || clientId.length < 10) {
        console.error('RepairAppointmentModal - Invalid clientId:', {
          clientId,
          type: typeof clientId,
          length: typeof clientId === 'string' ? clientId.length : 'N/A',
        })
        return []
      }
      
      const validClientId = clientId.trim()
      console.log('RepairAppointmentModal - Querying hearing reports for clientId:', validClientId)
      
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
      query.limit(100)
      
      const reports = await query.find()
      
      console.log('RepairAppointmentModal - Hearing reports fetched:', {
        clientId,
        count: reports.length,
        reports: reports.map((r: any) => ({
          id: r.id || r.objectId,
          testDate: r.get('testDate'),
          client: r.get('client')?.id,
          clientIdMatch: r.get('client')?.id === clientId,
        })),
      })
      
      return reports
    },
    enabled: isOpen && !!clientId,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  // Get client info
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId),
    enabled: isOpen && !!clientId,
  })

  // Get staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff', 'all'],
    queryFn: () => staffService.getAll({ limit: 100 }),
    enabled: isOpen,
  })

  // Get appointment data if editing
  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId!),
    enabled: isEdit && isOpen && !!appointmentId,
  })

  const [formData, setFormData] = useState({
    hearingReportId: '',
    deviceName: '',
    ear: 'LEFT' as 'LEFT' | 'RIGHT' | 'BOTH',
    repairDate: new Date().toISOString().slice(0, 16),
    staffId: '',
    note: '',
    price: '',
    isPaid: false,
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER',
    paymentCollectorId: '',
  })
  
  // Store selected staff object reference to avoid ID issues
  const [selectedStaffRef, setSelectedStaffRef] = useState<Parse.User | null>(null)
  const [selectedPaymentCollectorRef, setSelectedPaymentCollectorRef] = useState<Parse.User | null>(null)

  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [paymentCollectorSearchTerm, setPaymentCollectorSearchTerm] = useState('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const [showPaymentCollectorDropdown, setShowPaymentCollectorDropdown] = useState(false)
  
  // Track if form has been initialized to avoid infinite loops
  const formInitializedRef = useRef(false)

  // Load appointment data when editing
  useEffect(() => {
    if (!isOpen || !isEdit || !appointment) {
      formInitializedRef.current = false
      return
    }
    
    // Only update once when appointment is loaded
    if (formInitializedRef.current) return
    
    if (staffList.length === 0) return // Wait for staff list
    
    const staffName = appointment.get('staffName') || ''
    const foundStaff = staffList.find(
      (s) => s.get('fullName') === staffName || s.get('username') === staffName
    )
    
    const hearingReport = appointment.get('hearingReport')
    const hearingReportId = hearingReport?.id || hearingReport?.objectId || ''
    
    const paymentCollectorName = appointment.get('paymentCollectorName') || ''
    const foundPaymentCollector = staffList.find(
      (s) => s.get('fullName') === paymentCollectorName || s.get('username') === paymentCollectorName
    )

    setFormData({
      hearingReportId,
      deviceName: appointment.get('deviceName') || '',
      ear: (appointment.get('ear') as 'LEFT' | 'RIGHT' | 'BOTH') || 'LEFT',
      repairDate: appointment.get('date')
        ? new Date(appointment.get('date')).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      staffId: foundStaff ? getStaffId(foundStaff) : '',
      // Also set the ref
      // Note: We can't set refs in setFormData, so we'll set it separately
      note: appointment.get('note') || '',
      price: appointment.get('price') ? String(appointment.get('price')) : '',
      isPaid: appointment.get('isPaid') || false,
      paymentMethod: (appointment.get('paymentMethod') as 'CASH' | 'BANK_TRANSFER') || 'CASH',
      paymentCollectorId: foundPaymentCollector ? getStaffId(foundPaymentCollector) : '',
    })
    
    // Also set refs for selected staff
    if (foundStaff) {
      setSelectedStaffRef(foundStaff)
    }
    if (foundPaymentCollector) {
      setSelectedPaymentCollectorRef(foundPaymentCollector)
    }
    
    formInitializedRef.current = true
  }, [isOpen, isEdit, appointment?.id, staffList.length])

  // Track modal open state to reset form only once
  const modalOpenRef = useRef(false)
  
  // Load initial form data for new appointment - separate useEffect
  useEffect(() => {
    if (!isOpen || isEdit) {
      formInitializedRef.current = false
      modalOpenRef.current = false
      return
    }
    
    // Only reset form once when modal first opens
    if (modalOpenRef.current) return
    
    modalOpenRef.current = true
    formInitializedRef.current = false
    
    // Reset form for new appointment (hearing report will be set separately)
    setFormData({
      hearingReportId: '',
      deviceName: '',
      ear: 'LEFT' as 'LEFT' | 'RIGHT' | 'BOTH',
      repairDate: new Date().toISOString().slice(0, 16),
      staffId: user ? getStaffId(user) : '',
      note: '',
      price: '',
      isPaid: false,
      paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER',
      paymentCollectorId: '',
    })
    
    // Also set ref for user if available
    if (user) {
      setSelectedStaffRef(user)
    } else {
      setSelectedStaffRef(null)
    }
    setSelectedPaymentCollectorRef(null)
  }, [isOpen, isEdit, user?.id])
  
  // Set latest hearing report when available (only once after form reset)
  const latestReportSetRef = useRef(false)
  useEffect(() => {
    if (!isOpen || isEdit || !modalOpenRef.current || latestReportSetRef.current) return
    
    if (hearingReports.length > 0) {
      const latestReport = hearingReports[0]
      const latestReportId = latestReport.id || (latestReport as any).objectId || ''
      
      if (latestReportId) {
        setFormData(prev => ({
          ...prev,
          hearingReportId: latestReportId,
        }))
        latestReportSetRef.current = true
        formInitializedRef.current = true
      }
    }
  }, [isOpen, isEdit])

  const mutation = useMutation({
    mutationFn: async (data: {
      clientId: string
      hearingReportId?: string
      deviceName: string
      ear: 'LEFT' | 'RIGHT' | 'BOTH'
      repairDate: Date
      staffId: string
      note: string
      price: number | null
      isPaid: boolean
      paymentMethod: 'CASH' | 'BANK_TRANSFER'
      paymentCollectorId: string
    }) => {
      const staff = staffList.find((s) => getStaffId(s) === data.staffId)
      const staffName = staff?.get('fullName') || staff?.get('username') || ''
      
      const paymentCollector = staffList.find((s) => getStaffId(s) === data.paymentCollectorId)
      const paymentCollectorName = paymentCollector?.get('fullName') || paymentCollector?.get('username') || ''

      if (isEdit && appointmentId) {
        return appointmentService.update(appointmentId, {
          date: data.repairDate,
          note: data.note || undefined,
          staffName,
          deviceName: data.deviceName,
          ear: data.ear,
          price: data.price,
          hearingReportId: data.hearingReportId || undefined,
          isPaid: data.isPaid,
          paymentMethod: data.paymentMethod,
          paymentCollectorName: paymentCollectorName || undefined,
        })
      } else {
        return appointmentService.create({
          clientId: data.clientId,
          type: 'REPAIR',
          date: data.repairDate,
          status: 'COMPLETED',
          note: data.note || undefined,
          staffName,
          deviceName: data.deviceName,
          ear: data.ear,
          price: data.price,
          hearingReportId: data.hearingReportId || undefined,
          isPaid: data.isPaid,
          paymentMethod: data.paymentMethod,
          paymentCollectorName: paymentCollectorName || undefined,
        })
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? t.appointments.repairUpdated : t.appointments.repairCreated)
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'client', clientId] })
      queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || t.appointments.failedToSaveRepair)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.deviceName.trim()) {
      toast.error(t.appointments.deviceNameRequired)
      return
    }

    // Get staffId - try multiple sources in order of priority
    let staffId = formData.staffId?.trim() || ''
    
    // Priority 1: Use selectedStaffRef if available (most reliable)
    if (!staffId && selectedStaffRef) {
      try {
        const json = selectedStaffRef.toJSON()
        staffId = (json.objectId || json.id || '').trim()
        console.log('Got staffId from selectedStaffRef.toJSON():', staffId)
      } catch (e) {
        staffId = getStaffId(selectedStaffRef).trim()
        console.log('Got staffId from selectedStaffRef.getStaffId():', staffId)
      }
    }
    
    // Priority 2: Try selectedStaff (found from staffList)
    if (!staffId && selectedStaff) {
      try {
        const json = selectedStaff.toJSON()
        staffId = (json.objectId || json.id || '').trim()
        console.log('Got staffId from selectedStaff.toJSON():', staffId)
      } catch (e) {
        staffId = getStaffId(selectedStaff).trim()
        console.log('Got staffId from selectedStaff.getStaffId():', staffId)
      }
    }
    
    console.log('Form submit - checking staffId:', {
      formDataStaffId: formData.staffId,
      formDataStaffIdTrimmed: formData.staffId?.trim(),
      resolvedStaffId: staffId,
      staffIdType: typeof staffId,
      staffIdLength: staffId?.length,
      isEmpty: !staffId || staffId === '',
      formData: { ...formData },
      selectedStaff: selectedStaff ? {
        id: getStaffId(selectedStaff),
        jsonId: selectedStaff.toJSON ? (selectedStaff.toJSON().objectId || selectedStaff.toJSON().id) : null,
        name: selectedStaff.get('fullName') || selectedStaff.get('username'),
        json: selectedStaff.toJSON ? selectedStaff.toJSON() : null
      } : null,
      staffList: staffList.map(s => {
        const json = s.toJSON ? s.toJSON() : null
        return { 
          id: getStaffId(s),
          jsonId: json?.objectId || json?.id,
          name: s.get('fullName') || s.get('username'),
          json: json
        }
      })
    })
    
    if (!staffId || staffId === '') {
      console.error('Validation failed: staffId is empty after all attempts', { 
        formData: { ...formData },
        resolvedStaffId: staffId,
        selectedStaff: selectedStaff ? {
          id: getStaffId(selectedStaff),
          json: selectedStaff.toJSON ? selectedStaff.toJSON() : null
        } : null,
        staffList: staffList.map(s => ({ 
          id: getStaffId(s), 
          jsonId: s.toJSON ? (s.toJSON().objectId || s.toJSON().id) : null,
          name: s.get('fullName') || s.get('username'),
          json: s.toJSON ? s.toJSON() : null
        })) 
      })
      toast.error(t.appointments.selectRepairer)
      return
    }

    const price = formData.price.trim() ? parseFloat(formData.price) : null
    if (price !== null && isNaN(price)) {
      toast.error(t.appointments.invalidPrice)
      return
    }

    mutation.mutate({
      clientId,
      hearingReportId: formData.hearingReportId || undefined,
      deviceName: formData.deviceName,
      ear: formData.ear,
      repairDate: new Date(formData.repairDate),
      staffId: staffId, // Use resolved staffId
      note: formData.note,
      price,
      isPaid: formData.isPaid,
      paymentMethod: formData.paymentMethod,
      paymentCollectorId: formData.paymentCollectorId,
    })
  }

  // Reset search terms when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStaffSearchTerm('')
      setPaymentCollectorSearchTerm('')
      setShowStaffDropdown(false)
      setShowPaymentCollectorDropdown(false)
      setSelectedStaffRef(null)
      setSelectedPaymentCollectorRef(null)
      formInitializedRef.current = false
      latestReportSetRef.current = false
    }
  }, [isOpen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.staff-dropdown-container')) {
        setShowStaffDropdown(false)
      }
      if (!target.closest('.payment-collector-dropdown-container')) {
        setShowPaymentCollectorDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter staff based on search term
  const filteredStaff = staffList.filter((staff) => {
    if (!staffSearchTerm) return true
    const searchLower = staffSearchTerm.toLowerCase()
    const fullName = (staff.get('fullName') || '').toLowerCase()
    const username = (staff.get('username') || '').toLowerCase()
    return fullName.includes(searchLower) || username.includes(searchLower)
  })

  const filteredPaymentCollectors = staffList.filter((staff) => {
    if (!paymentCollectorSearchTerm) return true
    const searchLower = paymentCollectorSearchTerm.toLowerCase()
    const fullName = (staff.get('fullName') || '').toLowerCase()
    const username = (staff.get('username') || '').toLowerCase()
    return fullName.includes(searchLower) || username.includes(searchLower)
  })

  // Find selected staff - try multiple ID comparison methods
  const selectedStaff = staffList.find((s) => {
    const staffId = getStaffId(s)
    // Also try toJSON comparison
    try {
      const json = s.toJSON()
      const jsonId = json.objectId || json.id
      return staffId === formData.staffId || jsonId === formData.staffId
    } catch (e) {
      return staffId === formData.staffId
    }
  })
  
  const selectedPaymentCollector = staffList.find((s) => {
    const staffId = getStaffId(s)
    try {
      const json = s.toJSON()
      const jsonId = json.objectId || json.id
      return staffId === formData.paymentCollectorId || jsonId === formData.paymentCollectorId
    } catch (e) {
      return staffId === formData.paymentCollectorId
    }
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {isEdit ? t.appointments.editRepairTitle : t.appointments.repairTitle}
            </h2>
            {appointment?.get('repairCode') && (
              <p className="text-sm text-gray-600 mt-1">
                {t.appointments.repairCode}: <span className="font-mono font-semibold text-primary">{appointment.get('repairCode')}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Current Hearing Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              1. {t.appointments.currentHearingStatus}
            </label>
            {hearingReportsLoading ? (
              <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border">
                {t.common.loading}
              </p>
            ) : hearingReports.length > 0 ? (
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.hearingReportId}
                onChange={(e) => setFormData({ ...formData, hearingReportId: e.target.value })}
              >
                {hearingReports.map((report) => {
                  const reportId = report.id || (report as any).objectId
                  const testDate = report.get('testDate')
                  const dateStr = testDate
                    ? new Date(testDate).toLocaleDateString('vi-VN')
                    : t.appointments.noDateAvailable
                  return (
                    <option key={reportId} value={reportId}>
                      {dateStr} - {report.get('typeOfTest') || t.appointments.hearingTestType}
                    </option>
                  )
                })}
              </select>
            ) : (
              <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border">
                {t.appointments.noHearingReports}
              </p>
            )}
          </div>

          {/* 2. Client Information */}
          <div>
            <label className="block text-sm font-medium mb-2">
              2. Thông tin khách hàng
            </label>
            {client && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-900">
                  {client.get('fullName')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{t.appointments.phone}:</span> {client.get('phone') || '-'}
                </p>
                {client.get('email') && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {client.get('email')}
                  </p>
                )}
                {client.get('address') && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{t.appointments.address}:</span> {client.get('address')}
                  </p>
                )}
                {client.get('dateOfBirth') && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ngày sinh:</span>{' '}
                    {new Date(client.get('dateOfBirth')).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3. Device Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              3. {t.appointments.deviceName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              placeholder={t.appointments.enterDeviceName}
              required
            />
          </div>

          {/* 4. Ear Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              4. Tai <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label key="ear-left" className="flex items-center">
                <input
                  type="radio"
                  name="ear"
                  value="LEFT"
                  checked={formData.ear === 'LEFT'}
                  onChange={(e) => setFormData({ ...formData, ear: e.target.value as 'LEFT' | 'RIGHT' | 'BOTH' })}
                  className="mr-2"
                />
                <span>{t.hearingReports.left}</span>
              </label>
              <label key="ear-right" className="flex items-center">
                <input
                  type="radio"
                  name="ear"
                  value="RIGHT"
                  checked={formData.ear === 'RIGHT'}
                  onChange={(e) => setFormData({ ...formData, ear: e.target.value as 'LEFT' | 'RIGHT' | 'BOTH' })}
                  className="mr-2"
                />
                <span>{t.hearingReports.right}</span>
              </label>
              <label key="ear-both" className="flex items-center">
                <input
                  type="radio"
                  name="ear"
                  value="BOTH"
                  checked={formData.ear === 'BOTH'}
                  onChange={(e) => setFormData({ ...formData, ear: e.target.value as 'LEFT' | 'RIGHT' | 'BOTH' })}
                  className="mr-2"
                />
                <span>{t.common.both}</span>
              </label>
            </div>
          </div>

          {/* 5. Repair Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              5. {t.appointments.repairDate} <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.repairDate}
              onChange={(e) => setFormData({ ...formData, repairDate: e.target.value })}
              required
            />
          </div>

          {/* 6. Staff Selection */}
          <div className="staff-dropdown-container">
            <label className="block text-sm font-medium mb-2">
              6. {t.appointments.selectRepairer.replace('Vui lòng chọn ', '')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowStaffDropdown(!showStaffDropdown)
                  setShowPaymentCollectorDropdown(false)
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left bg-white flex items-center justify-between"
                required
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className={selectedStaff ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedStaff
                      ? selectedStaff.get('fullName') || selectedStaff.get('username')
                      : t.appointments.selectStaff}
                  </span>
                  {selectedStaff?.get('staffRole') && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStaffRoleColor(selectedStaff.get('staffRole') as StaffRole)}`}>
                      {selectedStaff.get('staffRole')}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${showStaffDropdown ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStaffDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={t.appointments.searchStaff}
                      value={staffSearchTerm}
                      onChange={(e) => setStaffSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredStaff.length > 0 ? (
                      filteredStaff.map((staff, index) => (
                        <button
                          key={getStaffId(staff) || `staff-${staff.get('username') || index}`}
                          type="button"
                          onClick={() => {
                            // Get staff ID - prioritize toJSON() as it's most reliable
                            let staffId = ''
                            
                            // First try toJSON to get the raw data (most reliable)
                            try {
                              const json = staff.toJSON()
                              staffId = json.objectId || json.id || ''
                              console.log('Got staffId from toJSON:', { staffId, json })
                            } catch (e) {
                              console.warn('toJSON failed:', e)
                            }
                            
                            // If still no ID, try direct properties
                            if (!staffId) {
                              staffId = (staff as any).objectId || ''
                              if (staffId) console.log('Got staffId from objectId property:', staffId)
                            }
                            
                            // Try id getter
                            if (!staffId) {
                              try {
                                staffId = staff.id || ''
                                if (staffId) console.log('Got staffId from id getter:', staffId)
                              } catch (e) {
                                // id getter might fail
                              }
                            }
                            
                            // Try _id as last resort
                            if (!staffId) {
                              staffId = (staff as any)._id || ''
                              if (staffId) console.log('Got staffId from _id:', staffId)
                            }
                            
                            console.log('Selected staff - final result:', { 
                              staffId, 
                              staffIdType: typeof staffId,
                              staffIdLength: staffId?.length,
                              isValid: !!(staffId && staffId.trim() !== ''),
                              staffJson: staff.toJSON ? staff.toJSON() : null,
                              staffIdProp: staff.id,
                              staffObjectId: (staff as any).objectId,
                              formDataBefore: { ...formData }
                            })
                            
                            if (!staffId || staffId.trim() === '') {
                              console.error('Cannot get staff ID - all methods failed:', {
                                staff,
                                json: staff.toJSON ? staff.toJSON() : null,
                                id: staff.id,
                                objectId: (staff as any).objectId,
                                _id: (staff as any)._id,
                                className: (staff as any).className
                              })
                              toast.error('Không thể lấy ID nhân viên. Vui lòng thử lại.')
                              return
                            }
                            
                            // Use functional update to ensure state is updated correctly
                            setFormData(prev => {
                              const updated = { ...prev, staffId: staffId.trim() }
                              console.log('FormData updated:', { 
                                before: prev, 
                                after: updated,
                                staffIdSet: updated.staffId,
                                staffIdLength: updated.staffId?.length
                              })
                              return updated
                            })
                            // Also store staff object reference
                            setSelectedStaffRef(staff)
                            setShowStaffDropdown(false)
                            setStaffSearchTerm('')
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                            formData.staffId === getStaffId(staff) ? 'bg-primary/10 text-primary font-medium' : ''
                          }`}
                        >
                          <span>{staff.get('fullName') || staff.get('username')}</span>
                          {staff.get('staffRole') && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStaffRoleColor(staff.get('staffRole') as StaffRole)}`}>
                              {staff.get('staffRole')}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">{t.appointments.noStaffFound}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 7. Note */}
          <div>
            <label className="block text-sm font-medium mb-2">
              7. {t.appointments.repairNote}
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder={t.appointments.enterRepairContent}
            />
          </div>

          {/* 8. Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              8. {t.appointments.price}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder={t.appointments.enterPrice}
                min="0"
                step="1000"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {formData.price && !isNaN(parseFloat(formData.price))
                  ? `${(parseFloat(formData.price) / 1000).toFixed(0)}k VND`
                  : 'VND'}
              </span>
            </div>
          </div>

          {/* 9. Payment Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-medium">9. {t.appointments.isPaid}</span>
            </label>
          </div>

          {/* 10. Payment Method */}
          {formData.isPaid && (
            <div>
              <label className="block text-sm font-medium mb-2">
                10. {t.appointments.paymentMethod}
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as 'CASH' | 'BANK_TRANSFER' })}
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </div>
          )}

          {/* 11. Payment Collector */}
          {formData.isPaid && (
            <div className="payment-collector-dropdown-container">
              <label className="block text-sm font-medium mb-2">
                11. {t.appointments.paymentCollector}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentCollectorDropdown(!showPaymentCollectorDropdown)
                    setShowStaffDropdown(false)
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left bg-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className={selectedPaymentCollector ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedPaymentCollector
                        ? selectedPaymentCollector.get('fullName') || selectedPaymentCollector.get('username')
                        : t.appointments.selectPaymentCollector}
                    </span>
                    {selectedPaymentCollector?.get('staffRole') && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStaffRoleColor(selectedPaymentCollector.get('staffRole') as StaffRole)}`}>
                        {selectedPaymentCollector.get('staffRole')}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${showPaymentCollectorDropdown ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPaymentCollectorDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder={t.appointments.searchStaff}
                        value={paymentCollectorSearchTerm}
                        onChange={(e) => setPaymentCollectorSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredPaymentCollectors.length > 0 ? (
                        filteredPaymentCollectors.map((staff, index) => (
                          <button
                            key={getStaffId(staff) || `payment-collector-${staff.get('username') || index}`}
                            type="button"
                          onClick={() => {
                            // Get staff ID - prioritize toJSON() as it's most reliable
                            let staffId = ''
                            
                            // First try toJSON to get the raw data (most reliable)
                            try {
                              const json = staff.toJSON()
                              staffId = json.objectId || json.id || ''
                            } catch (e) {
                              staffId = getStaffId(staff)
                            }
                            
                            if (!staffId || staffId.trim() === '') {
                              console.error('Cannot get payment collector ID:', staff)
                              toast.error('Không thể lấy ID người thu tiền. Vui lòng thử lại.')
                              return
                            }
                            
                            setFormData(prev => ({ ...prev, paymentCollectorId: staffId.trim() }))
                            setSelectedPaymentCollectorRef(staff)
                            setShowPaymentCollectorDropdown(false)
                            setPaymentCollectorSearchTerm('')
                          }}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                              formData.paymentCollectorId === getStaffId(staff) ? 'bg-primary/10 text-primary font-medium' : ''
                            }`}
                          >
                            <span>{staff.get('fullName') || staff.get('username')}</span>
                            {staff.get('staffRole') && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStaffRoleColor(staff.get('staffRole') as StaffRole)}`}>
                                {staff.get('staffRole')}
                              </span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">{t.appointments.noStaffFound}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t.common.saving : isEdit ? t.common.updating : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

