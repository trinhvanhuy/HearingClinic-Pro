import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffService, StaffRole } from '../api/staffService'
import { useI18n } from '../i18n/I18nContext'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import Modal from './Modal'
import Parse from 'parse'

const STAFF_ROLES: { value: StaffRole; label: { en: string; vi: string } }[] = [
  { value: 'technical_specialist', label: { en: 'Technical Specialist', vi: 'Chuyên viên kĩ thuật' } },
  { value: 'consultant', label: { en: 'Consultant', vi: 'Nhân viên Tư vấn' } },
  { value: 'audiologist', label: { en: 'Audiologist', vi: 'Chuyên gia thính học' } },
  { value: 'hearing_doctor', label: { en: 'Hearing Doctor', vi: 'Bác sĩ thính học' } },
]

interface EditStaffModalProps {
  isOpen: boolean
  onClose: () => void
  staffId: string | null
  staffData?: Parse.User | null // Optional: pass staff data directly to avoid query
}

export default function EditStaffModal({ isOpen, onClose, staffId, staffData }: EditStaffModalProps) {
  const { t, language } = useI18n()
  const queryClient = useQueryClient()

  const { data: staffFromQuery, isLoading } = useQuery({
    queryKey: ['staff', 'detail', staffId],
    queryFn: () => staffService.getById(staffId!),
    enabled: isOpen && !!staffId && !staffData, // Only query if staffData is not provided
    staleTime: 0, // Always fetch fresh data when modal opens
  })

  // Use staffData if provided, otherwise use data from query
  const staff = staffData || staffFromQuery

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    staffRole: '' as StaffRole | '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load staff data when modal opens
  useEffect(() => {
    if (staff && isOpen) {
      setFormData({
        password: '',
        confirmPassword: '',
        email: staff.get('email') || '',
        fullName: staff.get('fullName') || '',
        staffRole: (staff.get('staffRole') as StaffRole) || '',
      })
      setErrors({})
    }
  }, [staff, isOpen])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!staffId) throw new Error(t.staff.staffIdRequired)
      const updateData: any = {
        email: data.email || undefined,
        fullName: data.fullName || undefined,
        staffRole: data.staffRole || undefined,
      }
      if (data.password) {
        updateData.password = data.password
      }
      return staffService.update(staffId, updateData)
    },
    onSuccess: () => {
      toast.success(t.staff.staffUpdated)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message || t.common.save)
    },
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.password && formData.password.length < 6) {
      newErrors.password = t.staff.passwordMinLength
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.staff.passwordMismatch || 'Passwords do not match'
    }

    if (!formData.staffRole) {
      newErrors.staffRole = t.staff.staffRole + ' ' + t.common.required
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      mutation.mutate(formData)
    }
  }

  const handleClose = () => {
    setFormData({
      password: '',
      confirmPassword: '',
      email: '',
      fullName: '',
      staffRole: '' as StaffRole | '',
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t.staff.editStaff}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={mutation.isPending || (isLoading && !staffData)}
          >
            {mutation.isPending ? t.common.loading : t.common.save}
          </button>
        </>
      }
    >
      {(isLoading && !staffData) ? (
        <div className="text-center py-8">{t.common.loading}</div>
      ) : staff ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t.staff.username}</label>
            <input
              type="text"
              className="input"
              value={staff.get('username') || ''}
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">{t.staff.usernameCannotChange || 'Username cannot be changed'}</p>
          </div>

          <div>
            <label className="label">{t.staff.fullName}</label>
            <input
              type="text"
              className="input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="label">{t.staff.email}</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">{t.staff.staffRole} *</label>
            <select
              className={`input ${errors.staffRole ? 'border-danger' : ''}`}
              value={formData.staffRole}
              onChange={(e) => setFormData({ ...formData, staffRole: e.target.value as StaffRole })}
              required
            >
              <option value="">{t.staff.selectRole || 'Select role...'}</option>
              {STAFF_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label[language]}
                </option>
              ))}
            </select>
            {errors.staffRole && (
              <p className="text-sm text-danger mt-1">{errors.staffRole}</p>
            )}
          </div>

          <div>
            <label className="label">
              {t.staff.password} ({t.staff.leaveBlank})
            </label>
            <input
              type="password"
              className={`input ${errors.password ? 'border-danger' : ''}`}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password && (
              <p className="text-sm text-danger mt-1">{errors.password}</p>
            )}
          </div>

          {formData.password && (
            <div>
              <label className="label">{t.staff.confirmPassword} *</label>
              <input
                type="password"
                className={`input ${errors.confirmPassword ? 'border-danger' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required={!!formData.password}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-danger mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}
        </form>
      ) : (
        <div className="text-center py-8 text-gray-500">{t.staff.staffNotFound || 'Staff not found'}</div>
      )}
    </Modal>
  )
}

