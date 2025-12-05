import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PrintableHearingReport from './PrintableHearingReport'
import { useI18n } from '../i18n/I18nContext'

interface PrintPortalProps {
  report: any
  client: any
  clinicConfig?: any
  chartImages?: {
    audiogram?: string
    speechAudiometry?: string
    discriminationLoss?: string
    leftTympanogram?: string
    rightTympanogram?: string
  }
  formData?: any
  isOpen: boolean
  onAfterPrint?: () => void
}

export default function PrintPortal({
  report,
  client,
  clinicConfig,
  chartImages,
  formData,
  isOpen,
  onAfterPrint,
}: PrintPortalProps) {
  const { language } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current)
      }
      containerRef.current = null
      setMounted(false)
      return
    }

    // Create hidden container for printing
    const printContainer = document.createElement('div')
    printContainer.className = 'printable-container'
    printContainer.style.position = 'fixed'
    printContainer.style.left = '-9999px'
    printContainer.style.top = '-9999px'
    printContainer.style.width = '210mm'
    printContainer.style.background = 'white'
    printContainer.style.padding = '12mm'
    printContainer.style.zIndex = '999999'
    printContainer.style.visibility = 'hidden'
    document.body.appendChild(printContainer)
    containerRef.current = printContainer
    setMounted(true)

    // Handle after print
    const handleAfterPrint = () => {
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current)
      }
      containerRef.current = null
      setMounted(false)
      onAfterPrint?.()
    }

    // Listen for print events
    window.addEventListener('afterprint', handleAfterPrint)

    // Trigger print after content is rendered
    const timeoutId = setTimeout(() => {
      if (printContainer) {
        printContainer.style.visibility = 'visible'
        window.print()
      }
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('afterprint', handleAfterPrint)
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current)
      }
      containerRef.current = null
      setMounted(false)
    }
  }, [isOpen, onAfterPrint])

  if (!isOpen || !mounted || !containerRef.current) return null

  return createPortal(
    <PrintableHearingReport
      report={report}
      client={client}
      clinicConfig={clinicConfig}
      chartImages={chartImages}
      formData={formData}
      language={language}
    />,
    containerRef.current
  )
}

