import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../api/clientService'
import { hearingReportService } from '../../api/hearingReportService'
import { reminderService } from '../../api/reminderService'
import { formatDate, formatPhone } from '@hearing-clinic/shared/src/utils/formatting'
import toast from 'react-hot-toast'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: !!id,
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['hearing-reports', 'client', id],
    queryFn: () => hearingReportService.getAll({ clientId: id }),
    enabled: !!id,
  })

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', 'client', id],
    queryFn: () => reminderService.getAll({ clientId: id }),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => clientService.delete(id!),
    onSuccess: () => {
      toast.success('Client deleted')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigate('/clients')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete client')
    },
  })

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!client) {
    return <div className="text-center py-8">Client not found</div>
  }

  const phone = client.get('phone')
  const email = client.get('email')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{client.get('fullName')}</h1>
        <div className="flex gap-2">
          <Link to={`/clients/${id}/edit`} className="btn btn-secondary">
            Edit
          </Link>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this client?')) {
                deleteMutation.mutate()
              }
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Info */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Client Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm">{client.get('firstName')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm">{client.get('lastName')}</dd>
            </div>
            {client.get('dateOfBirth') && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                <dd className="mt-1 text-sm">{formatDate(client.get('dateOfBirth'))}</dd>
              </div>
            )}
            {client.get('gender') && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm capitalize">{client.get('gender')}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1">
                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="text-primary-600 hover:underline"
                  >
                    {formatPhone(phone)}
                  </a>
                ) : (
                  '-'
                )}
              </dd>
            </div>
            {email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${email}`}
                    className="text-primary-600 hover:underline"
                  >
                    {email}
                  </a>
                </dd>
              </div>
            )}
            {client.get('address') && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm">{client.get('address')}</dd>
              </div>
            )}
            {client.get('notes') && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap">{client.get('notes')}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contact Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Contact</h2>
          <div className="space-y-2">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                📞 Call Client
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                ✉️ Email Client
              </a>
            )}
            <Link
              to={`/hearing-reports/new?clientId=${id}`}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              📋 New Hearing Report
            </Link>
          </div>
        </div>
      </div>

      {/* Hearing Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Hearing Reports</h2>
          <Link
            to={`/hearing-reports/new?clientId=${id}`}
            className="btn btn-primary"
          >
            New Report
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="text-gray-500">No hearing reports yet</p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {formatDate(report.get('testDate'))} - {report.get('typeOfTest') || 'Hearing Test'}
                    </p>
                    {report.get('diagnosis') && (
                      <p className="text-sm text-gray-600">{report.get('diagnosis')}</p>
                    )}
                  </div>
                  <Link
                    to={`/hearing-reports/${report.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Reminders</h2>
          <Link
            to={`/reminders?clientId=${id}`}
            className="btn btn-primary"
          >
            New Reminder
          </Link>
        </div>
        {reminders.length === 0 ? (
          <p className="text-gray-500">No reminders for this client</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{reminder.get('title')}</p>
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(reminder.get('dueAt'))}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      reminder.get('status') === 'done'
                        ? 'bg-green-100 text-green-800'
                        : reminder.get('status') === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {reminder.get('status')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

