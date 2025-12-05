import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { appointmentService } from '../api/appointmentService'
import { hearingReportService } from '../api/hearingReportService'
import { staffService } from '../api/staffService'
import { clientService } from '../api/clientService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { useI18n } from '../i18n/I18nContext'
import Parse from '../api/parseClient'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

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
      staffId: foundStaff?.id || '',
      note: appointment.get('note') || '',
      price: appointment.get('price') ? String(appointment.get('price')) : '',
      isPaid: appointment.get('isPaid') || false,
      paymentMethod: (appointment.get('paymentMethod') as 'CASH' | 'BANK_TRANSFER') || 'CASH',
      paymentCollectorId: foundPaymentCollector?.id || '',
    })
    
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
      staffId: user?.id || '',
      note: '',
      price: '',
      isPaid: false,
      paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER',
      paymentCollectorId: '',
    })
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
      const staff = staffList.find((s) => s.id === data.staffId)
      const staffName = staff?.get('fullName') || staff?.get('username') || ''
      
      const paymentCollector = staffList.find((s) => s.id === data.paymentCollectorId)
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

    if (!formData.staffId) {
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
      staffId: formData.staffId,
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

  const selectedStaff = staffList.find((s) => s.id === formData.staffId)
  const selectedPaymentCollector = staffList.find((s) => s.id === formData.paymentCollectorId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEdit ? t.appointments.editRepairTitle : t.appointments.repairTitle}
          </h2>
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
              <label className="flex items-center">
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
              <label className="flex items-center">
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
              <label className="flex items-center">
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
                <span className={selectedStaff ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedStaff
                    ? selectedStaff.get('fullName') || selectedStaff.get('username')
                    : t.appointments.selectStaff}
                </span>
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
                      filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, staffId: staff.id })
                            setShowStaffDropdown(false)
                            setStaffSearchTerm('')
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                            formData.staffId === staff.id ? 'bg-primary/10 text-primary font-medium' : ''
                          }`}
                        >
                          {staff.get('fullName') || staff.get('username')}
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
                  <span className={selectedPaymentCollector ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedPaymentCollector
                      ? selectedPaymentCollector.get('fullName') || selectedPaymentCollector.get('username')
                      : t.appointments.selectPaymentCollector}
                  </span>
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
                        filteredPaymentCollectors.map((staff) => (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, paymentCollectorId: staff.id })
                              setShowPaymentCollectorDropdown(false)
                              setPaymentCollectorSearchTerm('')
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${
                              formData.paymentCollectorId === staff.id ? 'bg-primary/10 text-primary font-medium' : ''
                            }`}
                          >
                            {staff.get('fullName') || staff.get('username')}
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

