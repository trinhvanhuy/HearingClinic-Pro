import { useI18n } from '../i18n/I18nContext'

interface LogoProps {
  variant?: 'full' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const { t } = useI18n()
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  }

  if (variant === 'icon') {
    return (
      <img
        src="/assets/logo-icon.png"
        alt={t.config.defaultClinicName}
        className={`${sizeClasses[size]} ${className}`}
        onError={(e) => {
          // Fallback if image not found
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const fallback = document.createElement('div')
          fallback.className = `${sizeClasses[size]} w-${sizeClasses[size].split('-')[1]} bg-red-500 rounded flex items-center justify-center`
          fallback.innerHTML = '<span class="text-white text-xl font-bold">+</span>'
          target.parentNode?.appendChild(fallback)
        }}
      />
    )
  }

  return (
    <img
      src="/assets/logo-light.png"
      alt="Hearing Clinic Pro"
      className={`${sizeClasses[size]} ${className}`}
      onError={(e) => {
        // Fallback if image not found
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
        const fallback = document.createElement('div')
        fallback.className = `flex items-center gap-2 ${className}`
        fallback.innerHTML = `
          <div class="flex items-center gap-1">
            <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <span class="text-white text-xl font-bold">+</span>
            </div>
            <div class="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <span class="text-white text-xl font-bold">+</span>
            </div>
          </div>
          <h1 class="text-2xl font-bold text-white">Hearing Clinic</h1>
        `
        target.parentNode?.appendChild(fallback)
      }}
    />
  )
}

