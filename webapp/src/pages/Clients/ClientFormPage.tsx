import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '../../api/clientService'
import { useI18n } from '../../i18n/I18nContext'
import { Client } from '@hearing-clinic/shared/src/models/client'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'

export default function ClientFormPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientService.getById(id!),
    enabled: isEdit,
  })

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    isActive: true,
    referrer: '',
    hearingAidLeft: '',
    hearingAidRight: '',
  })

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.get('firstName') || '',
        lastName: client.get('lastName') || '',
        dateOfBirth: client.get('dateOfBirth')
          ? new Date(client.get('dateOfBirth')).toISOString().split('T')[0]
          : '',
        gender: client.get('gender') || '',
        phone: client.get('phone') || '',
        email: client.get('email') || '',
        address: client.get('address') || '',
        notes: client.get('notes') || '',
        isActive: client.get('isActive') ?? true,
        referrer: client.get('referrer') || '',
        hearingAidLeft: client.get('hearingAidLeft') || '',
        hearingAidRight: client.get('hearingAidRight') || '',
      })
    }
  }, [client])

  const mutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      if (isEdit) {
        return clientService.update(id!, data)
      } else {
        return clientService.create(data)
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? t.clients.editClient : t.clients.newClient)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigate('/clients')
    },
    onError: (error: any) => {
      toast.error(error.message || t.common.save)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      isActive: true, // Always active
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
      gender: formData.gender || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
    }
    mutation.mutate(data)
  }

  if (isEdit && isLoading) {
    return <div className="text-center py-8">{t.common.loading}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? t.clients.editClient : t.clients.newClient}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.clients.firstName} *</label>
            <input
              type="text"
              className="input"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">{t.clients.lastName} *</label>
            <input
              type="text"
              className="input"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.clients.dateOfBirth}</label>
            <input
              type="date"
              className="input"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t.clients.gender}</label>
            <select
              className="input"
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as any })
              }
            >
              <option value="">{t.clients.selectGender}</option>
              <option value="male">{t.clients.male}</option>
              <option value="female">{t.clients.female}</option>
              <option value="other">{t.clients.other}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">{t.clients.phone} *</label>
          <input
            type="tel"
            className="input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label">{t.clients.email}</label>
          <input
            type="email"
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{t.clients.address}</label>
          <textarea
            className="input"
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{t.clients.notes}</label>
          <textarea
            className="input"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div>
          <label className="label">{t.clients.referrer}</label>
          <input
            type="text"
            className="input"
            value={formData.referrer}
            onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
            placeholder={t.clients.referrerPlaceholder}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t.clients.hearingAidLeft || 'Loại máy đang đeo bên trái'}</label>
            <input
              type="text"
              className="input"
              value={formData.hearingAidLeft}
              onChange={(e) => setFormData({ ...formData, hearingAidLeft: e.target.value })}
              placeholder={t.clients.hearingAidPlaceholder}
            />
          </div>
          <div>
            <label className="label">{t.clients.hearingAidRight}</label>
            <input
              type="text"
              className="input"
              value={formData.hearingAidRight}
              onChange={(e) => setFormData({ ...formData, hearingAidRight: e.target.value })}
              placeholder={t.clients.hearingAidPlaceholder}
            />
          </div>
        </div>


        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate('/clients')}
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

