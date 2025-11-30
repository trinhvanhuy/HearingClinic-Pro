import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clientService } from '../../api/clientService'
import { useI18n } from '../../i18n/I18nContext'
import { formatDate, formatPhone } from '@hearing-clinic/shared/src/utils/formatting'

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
                      <div className="flex gap-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {t.common.view}
                        </Link>
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="text-primary hover:underline text-sm"
                        >
                          {t.common.edit}
                        </Link>
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

