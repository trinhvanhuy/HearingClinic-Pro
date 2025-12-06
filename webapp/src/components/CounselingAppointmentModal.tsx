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

interface CounselingAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string
  appointmentId?: string // For edit mode
}

export default function CounselingAppointmentModal({
  isOpen,
  onClose,
  clientId,
  appointmentId,
}: CounselingAppointmentModalProps) {
  const { t } = useI18n()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!appointmentId

  // Get all hearing reports for dropdown
  const { data: hearingReports = [], isLoading: hearingReportsLoading } = useQuery({
    queryKey: ['hearing-reports', 'client', clientId, 'all', 'counseling-modal'],
    queryFn: async () => {
      if (!clientId) {
        return []
      }
      
      const validClientId = clientId.trim()
      if (!validClientId || validClientId === 'Client' || validClientId.length < 10) {
        return []
      }
      
      const query = new Parse.Query(HearingReport)
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
      
      return query.find()
    },
    enabled: isOpen && !!clientId,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  // Get client info
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientService.getById(clientId!),
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
    counselingDate: new Date().toISOString().slice(0, 16),
    staffId: '',
    note: '',
  })

  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [showStaffDropdown, setShowStaffDropdown] = useState(false)
  const formInitializedRef = useRef(false)
  const modalOpenRef = useRef(false)
  const latestReportSetRef = useRef(false)

  // Load appointment data when editing
  useEffect(() => {
    if (!isOpen || !isEdit || !appointment) {
      formInitializedRef.current = false
      return
    }
    
    if (formInitializedRef.current) return
    if (staffList.length === 0) return
    
    const staffName = appointment.get('staffName') || ''
    const foundStaff = staffList.find(
      (s) => s.get('fullName') === staffName || s.get('username') === staffName
    )
    
    const hearingReport = appointment.get('hearingReport')
    const hearingReportId = hearingReport?.id || hearingReport?.objectId || ''

    setFormData({
      hearingReportId,
      counselingDate: appointment.get('date')
        ? new Date(appointment.get('date')).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      staffId: foundStaff?.id || '',
      note: appointment.get('note') || '',
    })
    
    formInitializedRef.current = true
  }, [isOpen, isEdit, appointment?.id, staffList.length])

  // Load initial form data for new appointment
  useEffect(() => {
    if (!isOpen || isEdit) {
      formInitializedRef.current = false
      modalOpenRef.current = false
      return
    }
    
    if (modalOpenRef.current) return
    
    modalOpenRef.current = true
    formInitializedRef.current = false
    
    setFormData({
      hearingReportId: '',
      counselingDate: new Date().toISOString().slice(0, 16),
      staffId: user?.id || '',
      note: '',
    })
  }, [isOpen, isEdit, user?.id])
  
  // Set latest hearing report when available
  useEffect(() => {
    if (!isOpen || isEdit || !modalOpenRef.current || latestReportSetRef.current) return
    
    if (hearingReports.length > 0 && clientId) {
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
  }, [isOpen, isEdit, hearingReports.length, clientId])

  const mutation = useMutation({
    mutationFn: async (data: {
      clientId: string
      hearingReportId?: string
      counselingDate: Date
      staffId: string
      note: string
    }) => {
      const staff = staffList.find((s) => s.id === data.staffId)
      const staffName = staff?.get('fullName') || staff?.get('username') || ''

      if (isEdit && appointmentId) {
        return appointmentService.update(appointmentId, {
          date: data.counselingDate,
          note: data.note || undefined,
          staffName,
          hearingReportId: data.hearingReportId || undefined,
        })
      } else {
        return appointmentService.create({
          clientId: data.clientId,
          type: 'COUNSELING',
          date: data.counselingDate,
          status: 'COMPLETED',
          note: data.note || undefined,
          staffName,
          hearingReportId: data.hearingReportId || undefined,
        })
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? t.appointments.counselingUpdated : t.appointments.counselingCreated)
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['appointments', 'client', clientId] })
        queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      }
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || t.appointments.failedToSaveCounseling)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId) {
      toast.error(t.appointments.selectClient)
      return
    }

    if (!formData.staffId) {
      toast.error(t.appointments.selectCounselorStaff)
      return
    }

    mutation.mutate({
      clientId,
      hearingReportId: formData.hearingReportId || undefined,
      counselingDate: new Date(formData.counselingDate),
      staffId: formData.staffId,
      note: formData.note,
    })
  }

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStaffSearchTerm('')
      setShowStaffDropdown(false)
      formInitializedRef.current = false
      latestReportSetRef.current = false
      modalOpenRef.current = false
    }
  }, [isOpen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.staff-dropdown-container')) {
        setShowStaffDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter staff
  const filteredStaff = staffList.filter((staff) => {
    if (!staffSearchTerm) return true
    const searchLower = staffSearchTerm.toLowerCase()
    const fullName = (staff.get('fullName') || '').toLowerCase()
    const username = (staff.get('username') || '').toLowerCase()
    return fullName.includes(searchLower) || username.includes(searchLower)
  })

  const selectedStaff = staffList.find((s) => s.id === formData.staffId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEdit ? t.appointments.editCounselingTitle : t.appointments.counselingTitle}
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
          {clientId && (
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
          )}

          {/* 2. Client Information */}
          {client && (
            <div>
              <label className="block text-sm font-medium mb-2">
                2. {t.appointments.clientInfo}
              </label>
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
              </div>
            </div>
          )}

          {/* 3. Counseling Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
                3. {t.appointments.counselingDate} <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.counselingDate}
              onChange={(e) => setFormData({ ...formData, counselingDate: e.target.value })}
              required
            />
          </div>

          {/* 4. Staff Selection */}
          <div className="staff-dropdown-container">
            <label className="block text-sm font-medium mb-2">
              4. Người tư vấn <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left bg-white flex items-center justify-between"
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
                      placeholder="Tìm kiếm nhân viên..."
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
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${
                            formData.staffId === staff.id ? 'bg-primary/10 text-primary font-medium' : ''
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

          {/* 5. Note */}
          <div>
            <label className="block text-sm font-medium mb-2">
              5. {t.appointments.counselingContent}
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder={t.appointments.enterCounselingContent}
            />
          </div>

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

