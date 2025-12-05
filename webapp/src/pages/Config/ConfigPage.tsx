import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { configService } from '../../api/configService'
import { useI18n } from '../../i18n/I18nContext'
import { useAuth } from '../../hooks/useAuth'
import { isAdminSync } from '../../utils/roleHelper'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'

export default function ConfigPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = isAdminSync(user)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ['clinic-config'],
    queryFn: () => configService.getConfig(),
  })

  const [formData, setFormData] = useState({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData({
        clinicName: config.clinicName,
        clinicAddress: config.clinicAddress,
        clinicPhone: config.clinicPhone || '',
      })
      if (config.logoUrl) {
        setLogoPreview(config.logoUrl)
      } else {
        setLogoPreview(null)
      }
    }
  }, [config])

  const mutation = useMutation({
    mutationFn: (data: typeof formData & { logoFile?: File; removeLogo?: boolean }) => configService.updateConfig(data),
    onSuccess: () => {
      toast.success(t.config.configUpdated)
      queryClient.invalidateQueries({ queryKey: ['clinic-config'] })
      setLogoFile(null)
      setRemoveLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
    mutation.mutate({
      ...formData,
      logoFile: logoFile || undefined,
      removeLogo: removeLogo,
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t.config.pleaseSelectImage)
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t.config.imageSizeLimit)
        return
      }
      setLogoFile(file)
      setRemoveLogo(false) // Cancel remove if uploading new logo
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setRemoveLogo(true)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t.config.title}</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">{t.config.clinicName} *</label>
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
          <label className="label">{t.config.clinicPhone}</label>
          <input
            type="text"
            className="input"
            value={formData.clinicPhone}
            onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{t.config.logo || 'Clinic Logo'}</label>
          <div className="space-y-3">
            {(logoPreview || config?.logoUrl) && (
              <div className="relative inline-block">
                <img
                  src={logoPreview || config?.logoUrl}
                  alt={t.config.logoPreview}
                  className="h-20 w-auto border border-gray-300 rounded-lg p-2 bg-white"
                />
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="btn btn-secondary cursor-pointer"
              >
                {logoPreview ? t.config.changeLogo : t.config.uploadLogo}
              </label>
              {(logoPreview || config?.logoUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="btn btn-secondary"
                >
                  {t.config.removeLogo || 'Remove Logo'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {t.config.logoHint}
            </p>
          </div>
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

