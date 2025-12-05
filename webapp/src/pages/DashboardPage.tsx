import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reminderService } from '../api/reminderService'
import { clientService } from '../api/clientService'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { format, startOfToday, endOfWeek, addDays } from 'date-fns'
import ViewAudiogramButton from '../components/ViewAudiogramButton'

// Icon components
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

export default function DashboardPage() {
  const { t } = useI18n()
  const today = startOfToday()
  const weekEnd = endOfWeek(addDays(today, 7))

  const { data: todayReminders = [] } = useQuery({
    queryKey: ['reminders', 'today'],
    queryFn: () =>
      reminderService.getAll({
        dueFrom: today,
        dueTo: weekEnd,
        status: 'pending',
        limit: 10,
      }),
  })

  const { data: recentClients = [] } = useQuery({
    queryKey: ['clients', 'recent'],
    queryFn: () => clientService.getAll({ limit: 5 }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: '#2D2D2D' }}>{t.dashboard.title}</h1>
        <div className="flex gap-3">
          <Link 
            to="/clients/new" 
            className="bg-primary text-white rounded-xl shadow-sm px-4 py-2 flex items-center gap-2 hover:opacity-90 transition-all font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            {t.dashboard.newClient}
          </Link>
          <Link 
            to="/hearing-reports/new" 
            className="bg-primary text-white rounded-xl shadow-sm px-4 py-2 flex items-center gap-2 hover:opacity-90 transition-all font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            {t.dashboard.newHearingReport}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Reminders */}
        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white">
          <h2 className="text-lg font-semibold mb-6" style={{ color: '#2D2D2D' }}>
            {t.dashboard.upcomingReminders}
          </h2>
          {todayReminders.length === 0 ? (
            <p className="text-gray-500">{t.dashboard.noUpcomingReminders}</p>
          ) : (
            <ul className="space-y-3">
              {todayReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="rounded-[10px] border border-gray-200 bg-gray-50 p-3 hover:shadow-sm hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base mb-1" style={{ color: '#2D2D2D' }}>
                        {reminder.get('title')}
                      </p>
                      <p className="text-sm mb-1" style={{ color: '#9B9B9B' }}>
                        {t.dashboard.client}: {reminder.get('client')?.get('fullName') || 'N/A'}
                      </p>
                      <p className="text-xs" style={{ color: '#9B9B9B' }}>
                        {t.dashboard.due}: {formatDate(reminder.get('dueAt'))}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full font-medium ml-3 ${
                        reminder.get('status') === 'overdue'
                          ? 'bg-danger-100 text-danger-800'
                          : 'bg-accent-100 text-accent-800'
                      }`}
                    >
                      {t.reminders[reminder.get('status') as keyof typeof t.reminders] || reminder.get('status')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/reminders"
            className="mt-6 inline-block text-primary hover:underline text-sm font-medium"
          >
            {t.dashboard.viewAllReminders} →
          </Link>
        </div>

        {/* Recent Clients */}
        <div className="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white">
          <h2 className="text-lg font-semibold mb-6" style={{ color: '#2D2D2D' }}>
            {t.dashboard.recentClients}
          </h2>
          {recentClients.length === 0 ? (
            <p className="text-gray-500">{t.dashboard.noClients}</p>
          ) : (
            <ul className="space-y-2">
              {recentClients.map((client) => (
                <li key={client.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200">
                  <Link
                    to={`/clients/${client.id}`}
                      className="flex-1 min-w-0"
                  >
                      <p className="font-semibold text-sm mb-0.5 truncate" style={{ color: '#2D2D2D' }}>
                          {client.get('fullName')}
                        </p>
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon className="w-3 h-3" style={{ color: '#9B9B9B' }} />
                        <p className="text-xs truncate" style={{ color: '#9B9B9B' }}>
                            {client.get('phone')}
                          </p>
                        </div>
                        {client.get('lastVisitDate') && (
                        <p className="text-xs mt-0.5" style={{ color: '#9B9B9B' }}>
                            {t.dashboard.lastVisit}: {formatDate(client.get('lastVisitDate'))}
                          </p>
                        )}
                    </Link>
                    <div className="flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/clients/${client.id}`}
                        className="inline-flex items-center justify-center w-7 h-7 text-primary hover:bg-primary/10 rounded transition-colors"
                        title={t.common.view}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link
                        to={`/clients/${client.id}/edit`}
                        className="inline-flex items-center justify-center w-7 h-7 text-primary hover:bg-primary/10 rounded transition-colors"
                        title={t.common.edit}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <ViewAudiogramButton clientId={client.id || (client as any).objectId || (client as any)._id} iconOnly={true} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/clients"
            className="mt-6 inline-block text-primary hover:underline text-sm font-medium"
          >
            {t.dashboard.viewAllClients} →
          </Link>
        </div>
      </div>
    </div>
  )
}

