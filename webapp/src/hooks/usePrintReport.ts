import { useState, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

interface ChartImages {
  audiogram?: string
  speechAudiometry?: string
  discriminationLoss?: string
  leftTympanogram?: string
  rightTympanogram?: string
}

interface UsePrintReportOptions {
  onError?: (error: Error) => void
}

export function usePrintReport(options: UsePrintReportOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [chartImages, setChartImages] = useState<ChartImages>({})
  const printableRef = useRef<HTMLDivElement>(null)

  // Capture chart as image
  const captureChart = useCallback(async (element: HTMLElement | null): Promise<string | undefined> => {
    if (!element) return undefined

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
      })
      return canvas.toDataURL('image/png', 1.0)
    } catch (error) {
      console.error('Error capturing chart:', error)
      return undefined
    }
  }, [])

  // Capture all charts from the form page
  const captureCharts = useCallback(async (
    chartElements: {
      audiogram?: HTMLElement | null
      speechAudiometry?: HTMLElement | null
      discriminationLoss?: HTMLElement | null
      leftTympanogram?: HTMLElement | null
      rightTympanogram?: HTMLElement | null
    }
  ): Promise<ChartImages> => {
    const images: ChartImages = {}

    // Capture each chart if it exists
    if (chartElements.audiogram) {
      const img = await captureChart(chartElements.audiogram)
      if (img) images.audiogram = img
    }

    if (chartElements.speechAudiometry) {
      const img = await captureChart(chartElements.speechAudiometry)
      if (img) images.speechAudiometry = img
    }

    if (chartElements.discriminationLoss) {
      const img = await captureChart(chartElements.discriminationLoss)
      if (img) images.discriminationLoss = img
    }

    if (chartElements.leftTympanogram) {
      const img = await captureChart(chartElements.leftTympanogram)
      if (img) images.leftTympanogram = img
    }

    if (chartElements.rightTympanogram) {
      const img = await captureChart(chartElements.rightTympanogram)
      if (img) images.rightTympanogram = img
    }

    return images
  }, [captureChart])

  // Handle print/export
  const handlePrint = useCallback(async (
    report: HearingReport,
    client: any,
    clinicConfig: any,
    formData: any,
    chartElements: {
      audiogram?: HTMLElement | null
      speechAudiometry?: HTMLElement | null
      discriminationLoss?: HTMLElement | null
      leftTympanogram?: HTMLElement | null
      rightTympanogram?: HTMLElement | null
    }
  ) => {
    setIsGenerating(true)
    try {
      // Capture all charts
      const images = await captureCharts(chartElements)
      setChartImages(images)

      // Wait a bit for state to update, then trigger print
      setTimeout(() => {
        if (printableRef.current) {
          // Import CSS for print
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = '/src/styles/print.css'
          document.head.appendChild(link)

          // Trigger print
          window.print()
        }
      }, 100)
    } catch (error) {
      console.error('Error generating print:', error)
      options.onError?.(error as Error)
    } finally {
      setIsGenerating(false)
    }
  }, [captureCharts, options])

  return {
    isGenerating,
    chartImages,
    printableRef,
    handlePrint,
    captureCharts,
  }
}

