import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { staffService, StaffRole } from '../../api/staffService'
import { useI18n } from '../../i18n/I18nContext'
import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import EditStaffModal from '../../components/EditStaffModal'
import Parse from 'parse'

const STAFF_ROLE_LABELS: Record<StaffRole, { en: string; vi: string }> = {
  technical_specialist: {
    en: 'Technical Specialist',
    vi: 'Chuyên viên kĩ thuật',
  },
  consultant: {
    en: 'Consultant',
    vi: 'Nhân viên Tư vấn',
  },
  audiologist: {
    en: 'Audiologist',
    vi: 'Chuyên gia thính học',
  },
  hearing_doctor: {
    en: 'Hearing Doctor',
    vi: 'Bác sĩ thính học',
  },
}

export default function StaffListPage() {
  const { t, language } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<StaffRole | ''>('')
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [editingStaff, setEditingStaff] = useState<Parse.User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', searchTerm, selectedRole],
    queryFn: () =>
      staffService.getAll({
        search: searchTerm || undefined,
        role: selectedRole || undefined,
      }),
  })

  const getRoleLabel = (role: StaffRole): string => {
    return STAFF_ROLE_LABELS[role]?.[language] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: '#2D2D2D' }}>
          {t.staff.title}
        </h1>
        <Link to="/staff/new" className="btn btn-primary">
          {t.staff.newStaff}
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.common.search}</label>
            <input
              type="text"
              className="input"
              placeholder={t.staff.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t.staff.role}</label>
            <select
              className="input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as StaffRole | '')}
            >
              <option value="">{t.staff.allRoles}</option>
              {Object.entries(STAFF_ROLE_LABELS).map(([role, labels]) => (
                <option key={role} value={role}>
                  {labels[language]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">{t.common.loading}</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t.staff.noStaffFound}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.staff.username}</th>
                  <th>{t.staff.fullName}</th>
                  <th>{t.staff.email}</th>
                  <th>{t.staff.role}</th>
                  <th>{t.staff.createdAt}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member, index) => {
                  const role = member.get('staffRole') as StaffRole | undefined
                  const memberId = member.id || (member as any).objectId || (member as any)._id || `staff-${index}`
                  return (
                    <tr key={memberId}>
                      <td className="font-medium">{member.get('username')}</td>
                      <td>{member.get('fullName') || '-'}</td>
                      <td>{member.get('email') || '-'}</td>
                      <td>
                        {role ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getRoleLabel(role)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {member.get('createdAt')
                          ? formatDate(member.get('createdAt'))
                          : '-'}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setEditingStaffId(memberId)
                            setEditingStaff(member)
                            setIsEditModalOpen(true)
                          }}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          {t.common.edit}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Staff Modal */}
      <EditStaffModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingStaffId(null)
          setEditingStaff(null)
        }}
        staffId={editingStaffId}
        staffData={editingStaff}
      />
    </div>
  )
}

