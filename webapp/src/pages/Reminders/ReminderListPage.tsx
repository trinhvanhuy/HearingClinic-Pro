import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { reminderService } from '../../api/reminderService'
import { useI18n } from '../../i18n/I18nContext'
import { ReminderStatus } from '@hearing-clinic/shared/src/models/reminder'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import toast from 'react-hot-toast'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'

export default function ReminderListPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>(
    (searchParams.get('status') as ReminderStatus | 'all') || 'all'
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reminderToDelete, setReminderToDelete] = useState<{ id: string; title: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', clientId, statusFilter],
    queryFn: () =>
      reminderService.getAll({
        clientId: clientId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
        <div className="flex gap-4 mb-4">
          <select
            className="input w-48"
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value as ReminderStatus | 'all'
              setStatusFilter(value)
              setSearchParams({ ...Object.fromEntries(searchParams), status: value })
            }}
          >
            <option value="all">{t.reminders.allStatus}</option>
            <option value="pending">{t.reminders.pending}</option>
            <option value="overdue">{t.reminders.overdue}</option>
            <option value="done">{t.reminders.done}</option>
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
                  className="card-reminder"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
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
    </div>
  )
}

