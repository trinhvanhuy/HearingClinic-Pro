import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffService, StaffRole } from '../../api/staffService'
import { useI18n } from '../../i18n/I18nContext'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

const STAFF_ROLES: { value: StaffRole; label: { en: string; vi: string } }[] = [
  { value: 'technical_specialist', label: { en: 'Technical Specialist', vi: 'Chuyên viên kĩ thuật' } },
  { value: 'consultant', label: { en: 'Consultant', vi: 'Nhân viên Tư vấn' } },
  { value: 'audiologist', label: { en: 'Audiologist', vi: 'Chuyên gia thính học' } },
  { value: 'hearing_doctor', label: { en: 'Hearing Doctor', vi: 'Bác sĩ thính học' } },
]

export default function StaffFormPage() {
  const { t, language } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', id],
    queryFn: () => staffService.getById(id!),
    enabled: isEdit,
  })

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    staffRole: '' as StaffRole | '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (staff) {
      setFormData({
        username: staff.get('username') || '',
        password: '',
        confirmPassword: '',
        email: staff.get('email') || '',
        fullName: staff.get('fullName') || '',
        staffRole: (staff.get('staffRole') as StaffRole) || '',
      })
    }
  }, [staff])

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEdit) {
        const updateData: any = {
          email: data.email || undefined,
          fullName: data.fullName || undefined,
          staffRole: data.staffRole || undefined,
        }
        if (data.password) {
          updateData.password = data.password
        }
        return staffService.update(id!, updateData)
      } else {
        if (!data.password) {
          throw new Error(t.staff.passwordRequired)
        }
        return staffService.create({
          username: data.username,
          password: data.password,
          email: data.email || undefined,
          staffRole: data.staffRole as StaffRole,
          fullName: data.fullName || undefined,
        })
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? t.staff.staffUpdated : t.staff.staffCreated)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      navigate('/staff')
    },
    onError: (error: any) => {
      toast.error(error.message || t.common.save)
    },
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!isEdit && !formData.username) {
      newErrors.username = t.staff.username + ' ' + t.common.required
    }

    if (!isEdit && !formData.password) {
      newErrors.password = t.staff.password + ' ' + (t.common.required || 'is required')
    }

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

  if (isEdit && isLoading) {
    return <div className="text-center py-8">{t.common.loading}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? t.staff.editStaff : t.staff.newStaff}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {!isEdit && (
          <div>
            <label className="label">{t.staff.username} *</label>
            <input
              type="text"
              className={`input ${errors.username ? 'border-danger' : ''}`}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            {errors.username && (
              <p className="text-sm text-danger mt-1">{errors.username}</p>
            )}
          </div>
        )}

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
            {t.staff.password} {isEdit && `(${t.staff.leaveBlank})`} {!isEdit && '*'}
          </label>
          <input
            type="password"
            className={`input ${errors.password ? 'border-danger' : ''}`}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!isEdit}
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

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="btn btn-secondary"
          >
            {t.common.cancel}
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? t.common.loading : t.common.save}
          </button>
        </div>
      </form>
    </div>
  )
}

