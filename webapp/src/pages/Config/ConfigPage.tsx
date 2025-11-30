import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../../api/configService'
import { useI18n } from '../../i18n/I18nContext'
import { useAuth } from '../../hooks/useAuth'
import { isAdminSync } from '../../utils/roleHelper'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

export default function ConfigPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = isAdminSync(user)

  const { data: config, isLoading } = useQuery({
    queryKey: ['clinic-config'],
    queryFn: () => configService.getConfig(),
  })

  const [formData, setFormData] = useState({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
  })

  useEffect(() => {
    if (config) {
      setFormData({
        clinicName: config.clinicName,
        clinicAddress: config.clinicAddress,
        clinicPhone: config.clinicPhone || '',
      })
    }
  }, [config])

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => configService.updateConfig(data),
    onSuccess: () => {
      toast.success(t.config.configUpdated || 'Configuration updated successfully')
      queryClient.invalidateQueries({ queryKey: ['clinic-config'] })
    },
    onError: (error: any) => {
      toast.error(error.message || t.common.save)
    },
  })

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return <div className="text-center py-8">{t.common.loading}</div>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t.config.title || 'Clinic Configuration'}</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">{t.config.clinicName || 'Clinic Name'} *</label>
          <input
            type="text"
            className="input"
            value={formData.clinicName}
            onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">{t.config.clinicAddress || 'Clinic Address'} *</label>
          <textarea
            className="input"
            rows={3}
            value={formData.clinicAddress}
            onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">{t.config.clinicPhone || 'Clinic Phone'}</label>
          <input
            type="text"
            className="input"
            value={formData.clinicPhone}
            onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t.common.loading : t.common.save}
          </button>
        </div>
      </form>
    </div>
  )
}

