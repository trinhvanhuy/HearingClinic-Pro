import Modal from './Modal'
import { useI18n } from '../i18n/I18nContext'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName?: string
  isLoading?: boolean
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  const { t } = useI18n()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={isLoading}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? t.common.loading : t.common.delete}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-gray-900">{message}</p>
        {itemName && (
          <p className="text-sm text-gray-500 font-medium">{itemName}</p>
        )}
      </div>
    </Modal>
  )
}

