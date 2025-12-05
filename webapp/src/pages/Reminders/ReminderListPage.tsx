import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { reminderService } from '../../api/reminderService'
import { useI18n } from '../../i18n/I18nContext'
import { ReminderStatus, ReminderType, ReminderPriority } from '@hearing-clinic/shared/src/models/reminder'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import toast from 'react-hot-toast'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'
import ReminderDetailModal from '../../components/ReminderDetailModal'

// Constants for reminder types and priorities
const REMINDER_TYPES: ReminderType[] = [
  'FOLLOW_UP_COUNSELING',
  'AUDIOGRAM_DUE',
  'MAINTENANCE_DUE',
  'WARRANTY_EXPIRING',
  'POST_REPAIR_CHECK',
  'POST_PURCHASE_SUPPORT',
  'CLIENT_INACTIVE',
  'BIRTHDAY',
  'RECOMMENDATION_FOLLOW_UP',
  'CUSTOM',
]

const REMINDER_PRIORITIES: ReminderPriority[] = ['low', 'medium', 'high']

// Helper functions to get translated labels
const getReminderTypeLabel = (type: ReminderType | 'all', t: any): string => {
  if (type === 'all') return t.reminders.all
  const typeMap: Record<ReminderType, keyof typeof t.reminders> = {
    FOLLOW_UP_COUNSELING: 'typeFollowUpCounseling',
    AUDIOGRAM_DUE: 'typeAudiogramDue',
    MAINTENANCE_DUE: 'typeMaintenanceDue',
    WARRANTY_EXPIRING: 'typeWarrantyExpiring',
    POST_REPAIR_CHECK: 'typePostRepairCheck',
    POST_PURCHASE_SUPPORT: 'typePostPurchaseSupport',
    CLIENT_INACTIVE: 'typeClientInactive',
    BIRTHDAY: 'typeBirthday',
    RECOMMENDATION_FOLLOW_UP: 'typeRecommendationFollowUp',
    CUSTOM: 'typeCustom',
  }
  return t.reminders[typeMap[type]] || type
}

const getReminderPriorityLabel = (priority: ReminderPriority | 'all', t: any): string => {
  if (priority === 'all') return t.reminders.all
  const priorityMap: Record<ReminderPriority, keyof typeof t.reminders> = {
    low: 'priorityLow',
    medium: 'priorityMedium',
    high: 'priorityHigh',
  }
  return t.reminders[priorityMap[priority]] || priority
}

export default function ReminderListPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null)
  const clientId = searchParams.get('clientId')
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>(
    (searchParams.get('status') as ReminderStatus | 'all') || 'all'
  )
  const [typeFilter, setTypeFilter] = useState<ReminderType | 'all'>(
    (searchParams.get('type') as ReminderType | 'all') || 'all'
  )
  const [priorityFilter, setPriorityFilter] = useState<ReminderPriority | 'all'>(
    (searchParams.get('priority') as ReminderPriority | 'all') || 'all'
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<{ id: string; title: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', clientId, statusFilter, typeFilter, priorityFilter],
    queryFn: () =>
      reminderService.getAll({
        clientId: clientId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      }),
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReminderStatus }) => {
      return reminderService.update(id, { status })
    },
    onSuccess: () => {
      toast.success(t.reminders.reminderUpdated)
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || t.reminders.reminderUpdated)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reminderService.delete(id),
    onSuccess: () => {
      toast.success(t.reminders.reminderDeleted)
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || t.reminders.reminderDeleted)
    },
  })

  const handleStatusChange = (id: string, newStatus: ReminderStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.reminders.title}</h1>
        <Link to="/reminders/new" className="btn btn-primary">
          {t.reminders.newReminder}
        </Link>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4 flex-wrap">
          <select
            className="input w-48"
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value as ReminderStatus | 'all'
              setStatusFilter(value)
              const newParams = { ...Object.fromEntries(searchParams) }
              if (value === 'all') delete newParams.status
              else newParams.status = value
              setSearchParams(newParams)
            }}
          >
            <option value="all">{t.reminders.allStatus}</option>
            <option value="pending">{t.reminders.pending}</option>
            <option value="overdue">{t.reminders.overdue}</option>
            <option value="done">{t.reminders.done}</option>
          </select>
          
          <select
            className="input w-48"
            value={typeFilter}
            onChange={(e) => {
              const value = e.target.value as ReminderType | 'all'
              setTypeFilter(value)
              const newParams = { ...Object.fromEntries(searchParams) }
              if (value === 'all') delete newParams.type
              else newParams.type = value
              setSearchParams(newParams)
            }}
          >
            <option value="all">{t.reminders.all}</option>
            {REMINDER_TYPES.map((type) => (
              <option key={type} value={type}>
                {getReminderTypeLabel(type, t)}
              </option>
            ))}
          </select>
          
          <select
            className="input w-48"
            value={priorityFilter}
            onChange={(e) => {
              const value = e.target.value as ReminderPriority | 'all'
              setPriorityFilter(value)
              const newParams = { ...Object.fromEntries(searchParams) }
              if (value === 'all') delete newParams.priority
              else newParams.priority = value
              setSearchParams(newParams)
            }}
          >
            <option value="all">{t.reminders.all}</option>
            {REMINDER_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {getReminderPriorityLabel(priority, t)}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">{t.common.loading}</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t.reminders.noReminders}</div>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => {
              const client = reminder.get('client')
              const status = reminder.get('status')
              return (
                <div
                  key={reminder.id}
                  onClick={() => setSelectedReminderId(reminder.id)}
                  className="card-reminder cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-medium text-lg">{reminder.get('title')}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            status === 'done'
                              ? 'bg-secondary-100 text-secondary-800'
                              : status === 'overdue'
                              ? 'bg-danger-100 text-danger-800'
                              : 'bg-accent-100 text-accent-800'
                          }`}
                        >
                          {t.reminders[status as keyof typeof t.reminders] || status}
                        </span>
                        {reminder.get('type') && (
                          <span className="px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-800">
                            {getReminderTypeLabel(reminder.get('type') as ReminderType, t)}
                          </span>
                        )}
                        {reminder.get('priority') && (
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              reminder.get('priority') === 'high'
                                ? 'bg-red-100 text-red-800'
                                : reminder.get('priority') === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getReminderPriorityLabel(reminder.get('priority') as ReminderPriority, t)}
                          </span>
                        )}
                        {reminder.get('isAutoGenerated') && (
                          <span className="px-2 py-1 text-xs rounded font-medium bg-purple-100 text-purple-800">
                            {t.reminders.autoGenerated}
                          </span>
                        )}
                      </div>
                      {reminder.get('description') && (
                        <p className="text-gray-600 mb-2">{reminder.get('description')}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {t.dashboard.client}:{' '}
                          <Link
                            to={`/clients/${client?.id}`}
                            className="text-primary hover:underline"
                          >
                            {client?.get('fullName')}
                          </Link>
                        </span>
                        <span>{t.dashboard.due}: {formatDate(reminder.get('dueAt'))}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {status !== 'done' && (
                        <button
                          onClick={() => handleStatusChange(reminder.id, 'done')}
                          className="btn btn-secondary text-sm"
                        >
                          {t.reminders.markDone}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReminderToDelete({ id: reminder.id, title: reminder.get('title') })
                          setDeleteModalOpen(true)
                        }}
                        className="btn btn-danger text-sm"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setReminderToDelete(null)
        }}
        onConfirm={() => {
          if (reminderToDelete) {
            deleteMutation.mutate(reminderToDelete.id)
          }
        }}
        title={t.reminders.deleteReminder}
        message={t.reminders.confirmDelete}
        itemName={reminderToDelete?.title}
        isLoading={deleteMutation.isPending}
      />

      {/* Reminder Detail Modal */}
      {selectedReminderId && (
        <ReminderDetailModal
          isOpen={!!selectedReminderId}
          onClose={() => setSelectedReminderId(null)}
          reminderId={selectedReminderId}
        />
      )}
    </div>
  )
}

