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
  const fullName = client.get('fullName')
  const gender = client.get('gender')
  const dateOfBirth = client.get('dateOfBirth')
  const isActive = client.get('isActive') !== false

  // Calculate age from date of birth
  const age = dateOfBirth ? Math.floor((new Date().getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link to="/clients" className="hover:text-blue-600">Patient</Link>
        <span>/</span>
        <span>Patient Details</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">{fullName}</span>
      </div>

      {/* Header with Icons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">In Patient Counselling</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Patient Profile Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-start gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {fullName?.charAt(0) || 'P'}
            </div>
          </div>

          {/* Patient Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h2>
            {email && (
              <p className="text-gray-600 mb-4">{email}</p>
            )}
            <Link
              to={`/clients/${id}/edit`}
              className="inline-block px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              Edit Profile
            </Link>
          </div>

          {/* Demographics Grid */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div>
              <p className="text-sm text-gray-500">Sex:</p>
              <p className="font-medium">{gender ? (gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : gender) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age:</p>
              <p className="font-medium">{age !== null ? `${age}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Blood:</p>
              <p className="font-medium">-</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status:</p>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department:</p>
              <p className="font-medium">Hearing Clinic</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registered Date:</p>
              <p className="font-medium">{client.get('createdAt') ? formatDate(client.get('createdAt')) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Appointment:</p>
              <p className="font-medium">{reports.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bed Number:</p>
              <p className="font-medium">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Current Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">mm/hg</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Blood Pressure</p>
          <p className="text-xs text-green-600">In the norm</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">BPM</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Heart rate</p>
          <p className="text-xs text-red-600">Above the norm</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">mg/dl</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Glucose</p>
          <p className="text-xs text-green-600">In the norm</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500">mg/dl</p>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">Cholesterol</p>
          <p className="text-xs text-green-600">In the norm</p>
        </div>
      </div>

      {/* Patient History */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Patient History</h2>
          <span className="text-sm text-gray-600">Total {reports.length} Visits</span>
        </div>
        
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hearing reports yet</p>
            <Link
              to={`/hearing-reports/new?clientId=${id}`}
              className="mt-4 inline-block btn btn-primary"
            >
              Create First Report
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date Of Visit</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Severity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Visits</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report, index) => {
                  const testDate = report.get('testDate')
                  const diagnosis = report.get('diagnosis') || report.get('typeOfTest') || 'Hearing Test'
                  const severity = report.get('severity') || 'Medium'
                  const isHigh = severity.toLowerCase().includes('high') || severity.toLowerCase().includes('severe')
                  const status = report.get('status') || 'Completed'
                  const isCured = status.toLowerCase().includes('cured') || status.toLowerCase().includes('completed')
                  
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{testDate ? formatDate(testDate) : '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{diagnosis}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          isHigh ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          isCured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isCured ? 'Cured' : 'Under Treatment'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/hearing-reports/${report.id}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

