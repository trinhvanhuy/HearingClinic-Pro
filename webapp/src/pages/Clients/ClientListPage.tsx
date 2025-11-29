import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { clientService } from '../../api/clientService'
import { formatDate, formatPhone } from '@hearing-clinic/shared/src/utils/formatting'

export default function ClientListPage() {
  const [search, setSearch] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(true)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search, isActiveFilter],
    queryFn: () => clientService.getAll({ search, isActive: isActiveFilter }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Link to="/clients/new" className="btn btn-primary">
          New Client
        </Link>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
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
            <option value="all">All Clients</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No clients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">DOB</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Visit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
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
                          View
                        </Link>
                        <Link
                          to={`/clients/${client.id}/edit`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          Edit
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

