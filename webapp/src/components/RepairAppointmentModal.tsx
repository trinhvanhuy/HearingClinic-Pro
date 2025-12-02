import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { appointmentService } from '../api/appointmentService'
import { hearingReportService } from '../api/hearingReportService'
import { staffService } from '../api/staffService'
import { clientService } from '../api/clientService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { useI18n } from '../i18n/I18nContext'

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

  // Get all hearing reports for dropdown
  const { data: hearingReports = [] } = useQuery({
    queryKey: ['hearing-reports', 'client', clientId, 'all'],
    queryFn: () => hearingReportService.getAll({ clientId, limit: 100 }),
    enabled: isOpen && !!clientId,
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

  // Load appointment data when editing
  useEffect(() => {
    if (appointment && isEdit && staffList.length > 0) {
      const staffName = appointment.get('staffName') || ''
      // Try to find staff by name
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
    } else if (!isEdit) {
      // Reset form for new appointment - set latest report as default if available
      const latestReport = hearingReports.length > 0 ? hearingReports[0] : null
      const latestReportId = latestReport
        ? (latestReport.id || (latestReport as any).objectId || '')
        : ''
      
      setFormData({
        hearingReportId: latestReportId,
        deviceName: '',
        ear: 'LEFT',
        repairDate: new Date().toISOString().slice(0, 16),
        staffId: user?.id || '',
        note: '',
        price: '',
        isPaid: false,
        paymentMethod: 'CASH',
        paymentCollectorId: '',
      })
    }
  }, [appointment, isEdit, user, staffList, hearingReports])

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
      toast.success(isEdit ? 'Repair appointment updated' : 'Repair appointment created')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointments', 'client', clientId] })
      queryClient.invalidateQueries({ queryKey: ['client', clientId] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save repair appointment')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.deviceName.trim()) {
      toast.error('Vui lòng nhập tên máy cần sửa')
      return
    }

    if (!formData.staffId) {
      toast.error('Vui lòng chọn người sửa')
      return
    }

    const price = formData.price.trim() ? parseFloat(formData.price) : null
    if (price !== null && isNaN(price)) {
      toast.error('Giá tiền không hợp lệ')
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
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEdit ? 'Sửa thông tin sửa máy' : 'Thông tin sửa máy'}
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
              1. Thính lực hiện tại
            </label>
            {hearingReports.length > 0 ? (
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
                    : 'Không có ngày'
                  return (
                    <option key={reportId} value={reportId}>
                      {dateStr} - {report.get('typeOfTest') || 'Đo thính lực'}
                    </option>
                  )
                })}
              </select>
            ) : (
              <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg border">
                Chưa có báo cáo thính lực
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
                  <span className="font-medium">SĐT:</span> {client.get('phone') || '-'}
                </p>
                {client.get('email') && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {client.get('email')}
                  </p>
                )}
                {client.get('address') && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Địa chỉ:</span> {client.get('address')}
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
              3. Máy cần sửa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              placeholder="Nhập tên máy cần sửa"
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
                <span>Trái</span>
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
                <span>Phải</span>
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
                <span>Cả hai</span>
              </label>
            </div>
          </div>

          {/* 5. Repair Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              5. Ngày sửa <span className="text-red-500">*</span>
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
          <div>
            <label className="block text-sm font-medium mb-2">
              6. Người sửa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                placeholder="Tìm kiếm nhân viên..."
                value={staffSearchTerm}
                onChange={(e) => setStaffSearchTerm(e.target.value)}
              />
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                required
              >
                <option value="">Chọn nhân viên</option>
                {staffList
                  .filter((staff) => {
                    if (!staffSearchTerm) return true
                    const searchLower = staffSearchTerm.toLowerCase()
                    const fullName = (staff.get('fullName') || '').toLowerCase()
                    const username = (staff.get('username') || '').toLowerCase()
                    return fullName.includes(searchLower) || username.includes(searchLower)
                  })
                  .map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.get('fullName') || staff.get('username')}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 7. Note */}
          <div>
            <label className="block text-sm font-medium mb-2">
              7. Nội dung sửa
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Nhập nội dung sửa máy"
            />
          </div>

          {/* 8. Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              8. Giá tiền
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Nhập giá tiền"
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
              <span className="text-sm font-medium">9. Đã thanh toán</span>
            </label>
          </div>

          {/* 10. Payment Method */}
          {formData.isPaid && (
            <div>
              <label className="block text-sm font-medium mb-2">
                10. Phương thức thanh toán
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
            <div>
              <label className="block text-sm font-medium mb-2">
                11. Người thu tiền
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                  placeholder="Tìm kiếm nhân viên..."
                  value={paymentCollectorSearchTerm}
                  onChange={(e) => setPaymentCollectorSearchTerm(e.target.value)}
                />
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.paymentCollectorId}
                  onChange={(e) => setFormData({ ...formData, paymentCollectorId: e.target.value })}
                >
                  <option value="">Chọn người thu tiền</option>
                  {staffList
                    .filter((staff) => {
                      if (!paymentCollectorSearchTerm) return true
                      const searchLower = paymentCollectorSearchTerm.toLowerCase()
                      const fullName = (staff.get('fullName') || '').toLowerCase()
                      const username = (staff.get('username') || '').toLowerCase()
                      return fullName.includes(searchLower) || username.includes(searchLower)
                    })
                    .map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.get('fullName') || staff.get('username')}
                      </option>
                    ))}
                </select>
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
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

