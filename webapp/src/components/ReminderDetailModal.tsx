import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reminderService } from '../api/reminderService'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { ReminderStatus, ReminderType, ReminderPriority } from '@hearing-clinic/shared/src/models/reminder'
import toast from 'react-hot-toast'
import ConfirmDeleteModal from './ConfirmDeleteModal'

// Helper functions to get translated labels
const getReminderTypeLabel = (type: ReminderType, t: any): string => {
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

const getReminderPriorityLabel = (priority: ReminderPriority, t: any): string => {
  const priorityMap: Record<ReminderPriority, keyof typeof t.reminders> = {
    low: 'priorityLow',
    medium: 'priorityMedium',
    high: 'priorityHigh',
  }
  return t.reminders[priorityMap[priority]] || priority
}

interface ReminderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reminderId: string
}

export default function ReminderDetailModal({
  isOpen,
  onClose,
  reminderId,
}: ReminderDetailModalProps) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const { data: reminder, isLoading } = useQuery({
    queryKey: ['reminder', reminderId],
    queryFn: () => reminderService.getById(reminderId),
    enabled: !!reminderId && isOpen,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReminderStatus }) => {
      return reminderService.update(id, { status })
    },
    onSuccess: () => {
      toast.success(t.reminders.reminderUpdated)
      queryClient.invalidateQueries({ queryKey: ['reminder', reminderId] })
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || t.reminders.reminderUpdated)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => reminderService.delete(reminderId),
    onSuccess: () => {
      toast.success(t.reminders.reminderDeleted)
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || t.reminders.reminderDeleted)
    },
  })

  const handleStatusChange = (newStatus: ReminderStatus) => {
    updateStatusMutation.mutate({ id: reminderId, status: newStatus })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t.reminders.reminderDetail}</h2>
          <div className="flex items-center gap-2">
            {!isLoading && reminder && reminder.get('status') !== 'done' && (
              <button
                onClick={() => handleStatusChange('done')}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 transition-colors text-sm"
                disabled={updateStatusMutation.isPending}
              >
                {t.reminders.markDone}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">{t.common.loading}</div>
            </div>
          ) : !reminder ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600 mb-4">{t.reminders.reminderNotFound}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title and Status */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{reminder.get('title')}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const status = reminder.get('status') as ReminderStatus
                      return (
                        <span
                          className={`px-3 py-1 text-sm rounded-full font-medium ${
                            status === 'done'
                              ? 'bg-secondary-100 text-secondary-800'
                              : status === 'overdue'
                              ? 'bg-danger-100 text-danger-800'
                              : 'bg-accent-100 text-accent-800'
                          }`}
                        >
                          {t.reminders[status as keyof typeof t.reminders] || status}
                        </span>
                      )
                    })()}
                    {reminder.get('priority') && (
                      <span
                        className={`px-3 py-1 text-sm rounded-full font-medium ${
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
                    {reminder.get('type') && (
                      <span className="px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-800">
                        {getReminderTypeLabel(reminder.get('type') as ReminderType, t)}
                      </span>
                    )}
                    {reminder.get('isAutoGenerated') && (
                      <span className="px-3 py-1 text-sm rounded-full font-medium bg-purple-100 text-purple-800">
                        {t.reminders.autoGenerated}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {reminder.get('description') && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.reminders.description}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{reminder.get('description')}</p>
                </div>
              )}

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                {/* Client */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.dashboard.client}</h4>
                  {reminder.get('client') ? (
                    <Link
                      to={`/clients/${reminder.get('client').id}`}
                      className="text-primary hover:underline font-medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                    >
                      {reminder.get('client').get('fullName')}
                    </Link>
                  ) : (
                    <p className="text-gray-500">{t.common.notAvailable}</p>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.dashboard.due}</h4>
                  <p className="text-gray-900">{formatDate(reminder.get('dueAt'))}</p>
                </div>

                {/* Created Date */}
                {reminder.get('createdAt') && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.reminders.createdAt}</h4>
                    <p className="text-gray-600">{formatDate(reminder.get('createdAt'))}</p>
                  </div>
                )}

                {/* Updated Date */}
                {reminder.get('updatedAt') && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.reminders.updatedAt}</h4>
                    <p className="text-gray-600">{formatDate(reminder.get('updatedAt'))}</p>
                  </div>
                )}
              </div>

              {/* Status Change Buttons */}
              {reminder.get('status') !== 'done' && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t.reminders.changeStatus}</h4>
                  <div className="flex gap-2">
                    {reminder.get('status') !== 'pending' && (
                      <button
                        onClick={() => handleStatusChange('pending')}
                        className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 transition-colors text-sm"
                        disabled={updateStatusMutation.isPending}
                      >
                        {t.reminders.markAsPending}
                      </button>
                    )}
                    {reminder.get('status') !== 'overdue' && (
                      <button
                        onClick={() => handleStatusChange('overdue')}
                        className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-600 disabled:opacity-50 transition-colors text-sm"
                        disabled={updateStatusMutation.isPending}
                      >
                        {t.reminders.markAsOverdue}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-600 transition-colors text-sm ml-auto"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete button for done reminders */}
              {reminder.get('status') === 'done' && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-600 transition-colors text-sm"
                  >
                    {t.common.delete}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t.reminders.deleteReminder}
        message={t.reminders.confirmDelete}
        itemName={reminder?.get('title')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

