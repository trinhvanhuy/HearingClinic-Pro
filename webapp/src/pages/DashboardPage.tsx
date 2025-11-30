import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reminderService } from '../api/reminderService'
import { clientService } from '../api/clientService'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { format, startOfToday, endOfWeek, addDays } from 'date-fns'

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
        <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
        <div className="flex gap-2">
          <Link to="/clients/new" className="btn btn-primary">
            {t.dashboard.newClient}
          </Link>
          <Link to="/hearing-reports/new" className="btn btn-primary">
            {t.dashboard.newHearingReport}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Reminders */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t.dashboard.upcomingReminders}</h2>
          {todayReminders.length === 0 ? (
            <p className="text-gray-500">{t.dashboard.noUpcomingReminders}</p>
          ) : (
            <ul className="space-y-2">
              {todayReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="card-reminder"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{reminder.get('title')}</p>
                      <p className="text-sm text-gray-500">
                        {t.dashboard.client}: {reminder.get('client')?.get('fullName') || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.dashboard.due}: {formatDate(reminder.get('dueAt'))}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${
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
            className="mt-4 text-primary hover:underline text-sm font-medium"
          >
            {t.dashboard.viewAllReminders} →
          </Link>
        </div>

        {/* Recent Clients */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t.dashboard.recentClients}</h2>
          {recentClients.length === 0 ? (
            <p className="text-gray-500">{t.dashboard.noClients}</p>
          ) : (
            <ul className="space-y-2">
              {recentClients.map((client) => (
                <li
                  key={client.id}
                  className="card-client"
                >
                  <Link
                    to={`/clients/${client.id}`}
                    className="block hover:text-primary"
                  >
                    <p className="font-medium">{client.get('fullName')}</p>
                    <p className="text-sm text-gray-500">{client.get('phone')}</p>
                    {client.get('lastVisitDate') && (
                      <p className="text-xs text-gray-500">
                        {t.dashboard.lastVisit}: {formatDate(client.get('lastVisitDate'))}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/clients"
            className="mt-4 text-primary hover:underline text-sm font-medium"
          >
            {t.dashboard.viewAllClients} →
          </Link>
        </div>
      </div>
    </div>
  )
}

