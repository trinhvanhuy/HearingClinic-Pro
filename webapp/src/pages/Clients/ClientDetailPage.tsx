import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clientService } from '../../api/clientService'
import { appointmentService } from '../../api/appointmentService'
import { hearingReportService } from '../../api/hearingReportService'
import { useI18n } from '../../i18n/I18nContext'
import { formatDate, formatPhone, formatDateTime } from '@hearing-clinic/shared/src/utils/formatting'
import { AppointmentType } from '@hearing-clinic/shared/src/models/appointment'
import { useState } from 'react'
import RepairAppointmentModal from '../../components/RepairAppointmentModal'
import Parse from '../../api/parseClient'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, { en: string; vi: string }> = {
  REPAIR: { en: 'Repair', vi: 'Sửa máy' },
  PURCHASE: { en: 'Purchase', vi: 'Mua máy' },
  AUDIOGRAM: { en: 'Audiogram', vi: 'Đo thính lực' },
  COUNSELING: { en: 'Counseling', vi: 'Tư vấn thính học' },
}

const STATUS_LABELS: Record<string, { en: string; vi: string }> = {
  COMPLETED: { en: 'Completed', vi: 'Hoàn thành' },
  CANCELED: { en: 'Canceled', vi: 'Đã hủy' },
  SCHEDULED: { en: 'Scheduled', vi: 'Đang chờ' },
}

export default function ClientDetailPage() {
  const { t, language } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedType, setSelectedType] = useState<AppointmentType | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false)
  const [selectedRepairAppointmentId, setSelectedRepairAppointmentId] = useState<string | undefined>()

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: !!id,
  })

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', 'client', id, selectedType, currentPage],
    queryFn: () =>
      appointmentService.getAll({
        clientId: id,
        type: selectedType !== 'ALL' ? selectedType : undefined,
        limit: pageSize,
        skip: (currentPage - 1) * pageSize,
      }),
    enabled: !!id,
  })

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['appointments', 'count', id, selectedType],
    queryFn: async () => {
      const allAppointments = await appointmentService.getAll({
        clientId: id,
        type: selectedType !== 'ALL' ? selectedType : undefined,
      })
      return allAppointments.length
    },
    enabled: !!id,
  })

  // Get latest hearing report for the client - query directly to avoid cache issues
  const { data: latestReportData, isLoading: latestReportLoading } = useQuery({
    queryKey: ['hearing-reports', 'client', id, 'latest', 'client-detail'],
    queryFn: async () => {
      if (!id) return null
      
      try {
        // Query directly without cache to ensure fresh data
        const query = new Parse.Query(HearingReport)
        const client = Parse.Object.createWithoutData('Client', id)
        query.equalTo('client', client)
        query.descending('updatedAt')
        query.addDescending('testDate')
        query.include('client')
        query.include('audiologist')
        query.limit(1)
        
        const reports = await query.find()
        
        console.log('ClientDetailPage - Latest hearing report query:', {
          clientId: id,
          count: reports.length,
          reports: reports.map((r: any) => ({
            id: r.id,
            objectId: (r as any).objectId,
            testDate: r.get('testDate'),
            clientId: r.get('client')?.id,
            allIds: { id: r.id, _id: r._id, objectId: (r as any).objectId },
          })),
        })
        
        return reports.length > 0 ? reports[0] : null
      } catch (error) {
        console.error('Error fetching latest hearing report:', error)
        return null
      }
    },
    enabled: !!id,
    refetchOnMount: 'always',
    staleTime: 0,
  })
  
  const latestReport = latestReportData

  if (clientLoading) {
    return <div className="text-center py-8">{t.common.loading}</div>
  }

  if (!client) {
    return <div className="text-center py-8">{t.clientDetail.clientNotFound}</div>
  }

  const phone = client.get('phone')
  const fullName = client.get('fullName')
  const gender = client.get('gender')
  const dateOfBirth = client.get('dateOfBirth')

  // Calculate age from date of birth
  const age = dateOfBirth
    ? Math.floor((new Date().getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const totalPages = Math.ceil(totalCount / pageSize)

  const getTypeLabel = (type: AppointmentType): string => {
    return APPOINTMENT_TYPE_LABELS[type]?.[language] || type
  }

  const getStatusLabel = (status: string): string => {
    return STATUS_LABELS[status]?.[language] || status
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELED':
        return 'bg-gray-100 text-gray-800'
      case 'SCHEDULED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRowClick = (appointment: any) => {
    const type = appointment.get('type')
    if (type === 'REPAIR') {
      // Open repair modal for viewing/editing
      setSelectedRepairAppointmentId(appointment.id)
      setIsRepairModalOpen(true)
    } else {
      const hearingReport = appointment.get('hearingReport')
      if (hearingReport) {
        const reportId = hearingReport.id || hearingReport.objectId
        navigate(`/hearing-reports/${reportId}`)
      }
    }
  }

  const handleCloseRepairModal = () => {
    setIsRepairModalOpen(false)
    setSelectedRepairAppointmentId(undefined)
  }

  const handleOpenNewRepairModal = () => {
    setSelectedRepairAppointmentId(undefined)
    setIsRepairModalOpen(true)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Patient Summary Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{fullName}</h1>
            
            {/* Contact Info */}
            <div className="space-y-2 mb-6">
              {phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm">{formatPhone(phone)}</span>
                </div>
              )}
              {dateOfBirth && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{formatDate(dateOfBirth)}</span>
                </div>
              )}
              {client.get('address') && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{client.get('address')}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Link
                to={`/clients/${id}/edit`}
                className="inline-flex items-center justify-center w-10 h-10 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                title={t.clientDetail.editProfile}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              {latestReportLoading ? (
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : latestReport ? (
                <Link
                  to={`/hearing-reports/${latestReport.id || (latestReport as any).objectId}/edit`}
                  className="inline-flex items-center justify-center w-10 h-10 bg-secondary text-white rounded-lg hover:bg-secondary-600 transition-colors"
                  title={t.hearingReports.viewAudiogram}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Link>
              ) : (
                <Link
                  to={`/hearing-reports/new?clientId=${id}`}
                  className="inline-flex items-center justify-center w-10 h-10 bg-secondary text-white rounded-lg hover:bg-secondary-600 transition-colors"
                  title={t.hearingReports.createAudiogram}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
              )}
            </div>
          </div>

          {/* Right side - Info Grid */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.sex}:</p>
              <p className="font-medium">
                {gender ? (gender === 'male' ? t.clients.male : gender === 'female' ? t.clients.female : gender) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.age}:</p>
              <p className="font-medium">{age !== null ? `${age}` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.blood}:</p>
              <p className="font-medium">-</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.registeredDate}:</p>
              <p className="font-medium">{client.get('createdAt') ? formatDate(client.get('createdAt')) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.appointment}:</p>
              <p className="font-medium">{totalCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.referrer || 'Người giới thiệu'}:</p>
              <p className="font-medium">{client.get('referrer') || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.hearingAidLeft || 'Loại máy đang đeo bên trái'}:</p>
              <p className="font-medium">{client.get('hearingAidLeft') || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t.clientDetail.hearingAidRight || 'Loại máy đang đeo bên phải'}:</p>
              <p className="font-medium">{client.get('hearingAidRight') || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient History Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t.clientDetail.patientHistory}</h2>
          <span className="text-sm text-gray-600">
            {t.clientDetail.totalVisitsCount}: {totalCount}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
          {(['ALL', 'REPAIR', 'PURCHASE', 'AUDIOGRAM', 'COUNSELING'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL'
                ? t.clientDetail.allAppointments || 'Tất cả'
                : getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Appointments Table */}
        {appointmentsLoading ? (
          <div className="text-center py-8">{t.common.loading}</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t.clientDetail.noAppointments || 'Chưa có lịch hẹn nào'}</p>
            {selectedType === 'REPAIR' ? (
              <button
                onClick={handleOpenNewRepairModal}
                className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                {t.clientDetail.createFirstReport || 'Tạo báo cáo đầu tiên'}
              </button>
            ) : selectedType === 'AUDIOGRAM' ? (
              <Link
                to={`/hearing-reports/new?clientId=${id}`}
                className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                {t.clientDetail.createFirstReport}
              </Link>
            ) : (
              <Link
                to={`/appointments/new?clientId=${id}&type=${selectedType}`}
                className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                {t.clientDetail.createFirstReport || 'Tạo báo cáo đầu tiên'}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t.clientDetail.date || 'Ngày'}</th>
                    <th>{t.clientDetail.type || 'Loại hẹn'}</th>
                    <th>{t.clientDetail.description || 'Mô tả'}</th>
                    <th>{t.clientDetail.hearingReport || 'Báo cáo thính lực'}</th>
                    <th>{t.clientDetail.staff || 'Nhân viên phụ trách'}</th>
                    <th>{t.clientDetail.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => {
                    const date = appointment.get('date')
                    const type = appointment.get('type') as AppointmentType
                    const note = appointment.get('note')
                    const hearingReport = appointment.get('hearingReport')
                    const staffName = appointment.get('staffName')
                    const status = appointment.get('status')
                    const deviceName = appointment.get('deviceName')
                    const ear = appointment.get('ear')

                    // Build description text
                    let description = note || ''
                    if (type === 'REPAIR') {
                      const parts: string[] = []
                      if (deviceName) parts.push(`Máy: ${deviceName}`)
                      if (ear) {
                        const earLabels: Record<string, string> = { LEFT: 'Trái', RIGHT: 'Phải', BOTH: 'Cả hai' }
                        parts.push(`Tai: ${earLabels[ear] || ear}`)
                      }
                      if (note) parts.push(`Ghi chú: ${note}`)
                      description = parts.join(' | ')
                    }

                    return (
                      <tr
                        key={appointment.id}
                        onClick={() => handleRowClick(appointment)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td>{date ? formatDateTime(date) : '-'}</td>
                        <td>
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getTypeLabel(type)}
                          </span>
                        </td>
                        <td className="max-w-md truncate" title={description}>{description || '-'}</td>
                        <td>
                          {hearingReport ? (
                            <Link
                              to={`/hearing-reports/${hearingReport.id || hearingReport.objectId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {t.clientDetail.viewReport || 'Xem báo cáo'}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>{staffName || '-'}</td>
                        <td>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {t.common.showing || 'Hiển thị'} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} {t.common.of || 'của'} {totalCount}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {t.common.previous || 'Trước'}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {t.common.next || 'Tiếp'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Repair Appointment Modal */}
      {id && (
        <RepairAppointmentModal
          isOpen={isRepairModalOpen}
          onClose={handleCloseRepairModal}
          clientId={id}
          appointmentId={selectedRepairAppointmentId}
        />
      )}
    </div>
  )
}
