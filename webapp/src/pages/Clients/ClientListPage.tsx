import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clientService } from '../../api/clientService'
import { useI18n } from '../../i18n/I18nContext'
import { formatDate, formatPhone } from '@hearing-clinic/shared/src/utils/formatting'
import ViewAudiogramButton from '../../components/ViewAudiogramButton'

export default function ClientListPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search, isActiveFilter],
    queryFn: () => clientService.getAll({ search, isActive: isActiveFilter }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.clients.title}</h1>
        <Link to="/clients/new" className="btn btn-primary">
          {t.clients.newClient}
        </Link>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder={t.clients.searchPlaceholder}
            className="input-search flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-48"
            value={isActiveFilter === undefined ? 'all' : isActiveFilter ? 'active' : 'inactive'}
            onChange={(e) => {
              const value = e.target.value
              setIsActiveFilter(value === 'all' ? undefined : value === 'active')
            }}
          >
            <option value="all">{t.clients.allClients}</option>
            <option value="active">{t.clients.activeOnly}</option>
            <option value="inactive">{t.clients.inactiveOnly}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">{t.common.loading}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t.clients.noClientsFound}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.clients.name}</th>
                  <th>{t.clients.dob}</th>
                  <th>{t.clients.phone}</th>
                  <th>{t.clients.email}</th>
                  <th>{t.clients.lastVisitDate}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {client.get('fullName')}
                      </Link>
                    </td>
                    <td>
                      {client.get('dateOfBirth') ? formatDate(client.get('dateOfBirth')) : '-'}
                    </td>
                    <td>{formatPhone(client.get('phone'))}</td>
                    <td>{client.get('email') || '-'}</td>
                    <td>
                      {client.get('lastVisitDate') ? formatDate(client.get('lastVisitDate')) : '-'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 text-primary hover:bg-primary/10 rounded transition-colors"
                          title={t.common.view}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="inline-flex items-center justify-center w-8 h-8 text-primary hover:bg-primary/10 rounded transition-colors"
                          title={t.common.edit}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <ViewAudiogramButton clientId={client.id} iconOnly={true} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

