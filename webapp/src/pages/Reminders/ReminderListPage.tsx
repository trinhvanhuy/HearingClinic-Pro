import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { reminderService } from '../../api/reminderService'
import { ReminderStatus } from '@hearing-clinic/shared/src/models/reminder'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import toast from 'react-hot-toast'

export default function ReminderListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>(
    (searchParams.get('status') as ReminderStatus | 'all') || 'all'
  )
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
      toast.success('Reminder updated')
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update reminder')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reminderService.delete(id),
    onSuccess: () => {
      toast.success('Reminder deleted')
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete reminder')
    },
  })

  const handleStatusChange = (id: string, newStatus: ReminderStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <Link to="/reminders/new" className="btn btn-primary">
          New Reminder
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
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="done">Done</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No reminders found</div>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => {
              const client = reminder.get('client')
              const status = reminder.get('status')
              return (
                <div
                  key={reminder.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{reminder.get('title')}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            status === 'done'
                              ? 'bg-green-100 text-green-800'
                              : status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      {reminder.get('description') && (
                        <p className="text-gray-600 mb-2">{reminder.get('description')}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Client:{' '}
                          <Link
                            to={`/clients/${client?.id}`}
                            className="text-primary-600 hover:underline"
                          >
                            {client?.get('fullName')}
                          </Link>
                        </span>
                        <span>Due: {formatDate(reminder.get('dueAt'))}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {status !== 'done' && (
                        <button
                          onClick={() => handleStatusChange(reminder.id, 'done')}
                          className="btn btn-secondary text-sm"
                        >
                          Mark Done
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this reminder?')) {
                            deleteMutation.mutate(reminder.id)
                          }
                        }}
                        className="btn btn-danger text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

