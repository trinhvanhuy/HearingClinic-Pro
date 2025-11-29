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
            className="input flex-1"
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
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t.clients.name}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t.clients.dob}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t.clients.phone}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t.clients.email}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t.clients.lastVisitDate}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/clients/${client.id}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {client.get('fullName')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {client.get('dateOfBirth') ? formatDate(client.get('dateOfBirth')) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatPhone(client.get('phone'))}</td>
                    <td className="px-4 py-3 text-sm">{client.get('email') || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {client.get('lastVisitDate') ? formatDate(client.get('lastVisitDate')) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          {t.common.view}
                        </Link>
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="text-primary-600 hover:underline text-sm"
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

