import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentService } from '../../api/appointmentService'
import { clientService } from '../../api/clientService'
import { useAuth } from '../../hooks/useAuth'
import { AppointmentType, AppointmentStatus } from '@hearing-clinic/shared/src/models/appointment'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/I18nContext'

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, { en: string; vi: string }> = {
  REPAIR: { en: 'Repair', vi: 'Sửa máy' },
  PURCHASE: { en: 'Purchase', vi: 'Mua máy' },
  AUDIOGRAM: { en: 'Audiogram', vi: 'Đo thính lực' },
  COUNSELING: { en: 'Counseling', vi: 'Tư vấn thính học' },
}

const STATUS_LABELS: Record<AppointmentStatus, { en: string; vi: string }> = {
  COMPLETED: { en: 'Completed', vi: 'Hoàn thành' },
  CANCELED: { en: 'Canceled', vi: 'Đã hủy' },
  SCHEDULED: { en: 'Scheduled', vi: 'Đang chờ' },
}

export default function AppointmentFormPage() {
  const { t, language } = useI18n()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isEdit = !!id

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentService.getById(id!),
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
    type: 'AUDIOGRAM' as AppointmentType,
    date: new Date().toISOString().slice(0, 16), // For datetime-local input
    status: 'COMPLETED' as AppointmentStatus,
    note: '',
    hearingReportId: '',
  })

  useEffect(() => {
    if (appointment) {
      const appointmentDate = appointment.get('date')
      setFormData({
        clientId: appointment.get('client')?.id || '',
        type: appointment.get('type'),
        date: appointmentDate
          ? new Date(appointmentDate).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        status: appointment.get('status'),
        note: appointment.get('note') || '',
        hearingReportId: appointment.get('hearingReport')?.id || '',
      })
    } else if (user) {
      // Set default staff name from user
      const userName = user.get('fullName') || user.get('username') || ''
      setFormData(prev => ({
        ...prev,
        note: prev.note || '',
      }))
    }
  }, [appointment, user, clientId])

  const mutation = useMutation({
    mutationFn: async (data: {
      clientId: string
      type: AppointmentType
      date: Date
      status: AppointmentStatus
      note?: string
      hearingReportId?: string
    }) => {
      if (isEdit) {
        return appointmentService.update(id!, {
          type: data.type,
          date: data.date,
          status: data.status,
          note: data.note,
          hearingReportId: data.hearingReportId,
        })
      } else {
        const staffName = user?.get('fullName') || user?.get('username') || ''
        return appointmentService.create({
          ...data,
          staffName,
        })
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? t.appointments.counselingUpdated : t.appointments.counselingCreated)
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      if (formData.clientId) {
        queryClient.invalidateQueries({ queryKey: ['appointments', 'client', formData.clientId] })
        queryClient.invalidateQueries({ queryKey: ['client', formData.clientId] })
        navigate(`/clients/${formData.clientId}`)
      } else {
        navigate('/dashboard')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t.appointments.failedToSaveCounseling)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId) {
      toast.error(t.appointments.selectClient)
      return
    }

    const appointmentDate = new Date(formData.date)

    mutation.mutate({
      clientId: formData.clientId,
      type: formData.type,
      date: appointmentDate,
      status: formData.status,
      note: formData.note || undefined,
      hearingReportId: formData.hearingReportId || undefined,
    })
  }

  const getTypeLabel = (type: AppointmentType): string => {
    return APPOINTMENT_TYPE_LABELS[type]?.[language] || type
  }

  const getStatusLabel = (status: AppointmentStatus): string => {
    return STATUS_LABELS[status]?.[language] || status
  }

  if (isEdit && isLoading) {
    return <div className="text-center py-8">{t.common.loading}</div>
  }

  const client = selectedClient || clients.find(c => c.id === formData.clientId)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? t.appointments.editCounselingTitle : t.appointments.counselingTitle}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.clients.client || 'Client'} *
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            required
            disabled={!!clientId} // Disable if clientId is in URL
          >
            <option value="">{t.appointments.selectClient}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.get('fullName')} - {c.get('phone')}
              </option>
            ))}
          </select>
          {clientId && client && (
            <p className="mt-1 text-sm text-gray-500">
              {client.get('fullName')}
            </p>
          )}
        </div>

        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.clientDetail.type || 'Type'} *
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AppointmentType })}
            required
          >
            {(['REPAIR', 'PURCHASE', 'AUDIOGRAM', 'COUNSELING'] as AppointmentType[]).map((type) => (
              <option key={type} value={type}>
                {getTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.clientDetail.date || 'Date & Time'} *
          </label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.clientDetail.status || 'Status'} *
          </label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
            required
          >
            {(['COMPLETED', 'SCHEDULED', 'CANCELED'] as AppointmentStatus[]).map((status) => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t.clientDetail.description || 'Description / Note'}
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg"
            rows={4}
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder={t.appointments.counselingNote}
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              if (formData.clientId) {
                navigate(`/clients/${formData.clientId}`)
              } else {
                navigate('/dashboard')
              }
            }}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t.common.saving : isEdit ? t.appointments.counselingUpdated.replace('updated', 'Update') : t.appointments.counselingCreated.replace('created', 'Create')}
          </button>
        </div>
      </form>
    </div>
  )
}

