import html2canvas from 'html2canvas'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

interface ChartImages {
  audiogram?: string
  speechAudiometry?: string
  discriminationLoss?: string
  leftTympanogram?: string
  rightTympanogram?: string
}

interface ExportReportData {
  report: HearingReport | any
  client: any
  clinicConfig?: any
  formData?: any
}

/**
 * Capture a chart element as an image
 * For audiogram, only capture the SVG, not the buttons/controls
 */
export async function captureChartAsImage(
  element: HTMLElement | null,
  options: { scale?: number; onlySvg?: boolean } = {}
): Promise<string | undefined> {
  if (!element) return undefined

  try {
    // If onlySvg is true, find SVG container (div with overflow-x-auto) inside element
    let targetElement = element
    if (options.onlySvg) {
      // Find the div that contains the SVG (usually has class "overflow-x-auto")
      const svgContainer = element.querySelector('div.overflow-x-auto, svg')?.parentElement
      if (svgContainer && svgContainer !== element) {
        targetElement = svgContainer as HTMLElement
      } else {
        // Fallback: find SVG directly and create wrapper
        const svg = element.querySelector('svg')
        if (svg) {
          const wrapper = document.createElement('div')
          wrapper.style.position = 'absolute'
          wrapper.style.left = '-9999px'
          wrapper.style.top = '-9999px'
          wrapper.style.backgroundColor = '#ffffff'
          
          const rect = svg.getBoundingClientRect()
          wrapper.style.width = `${rect.width}px`
          wrapper.style.height = `${rect.height}px`
          
          const svgClone = svg.cloneNode(true) as SVGSVGElement
          svgClone.style.width = '100%'
          svgClone.style.height = '100%'
          wrapper.appendChild(svgClone)
          document.body.appendChild(wrapper)
          
          try {
            const canvas = await html2canvas(wrapper, {
              scale: options.scale || 2,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
            })
            const dataUrl = canvas.toDataURL('image/png', 1.0)
            document.body.removeChild(wrapper)
            return dataUrl
          } catch (err) {
            if (document.body.contains(wrapper)) {
              document.body.removeChild(wrapper)
            }
            throw err
          }
        }
      }
    }

    const canvas = await html2canvas(targetElement, {
      scale: options.scale || 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: targetElement.offsetWidth || targetElement.scrollWidth,
      height: targetElement.offsetHeight || targetElement.scrollHeight,
    })
    return canvas.toDataURL('image/png', 1.0)
  } catch (error) {
    console.error('Error capturing chart:', error)
    return undefined
  }
}

/**
 * Capture all charts from the form page
 */
export async function captureAllCharts(chartRefs: {
  audiogram?: HTMLElement | null
  speechAudiometry?: HTMLElement | null
  discriminationLoss?: HTMLElement | null
  leftTympanogram?: HTMLElement | null
  rightTympanogram?: HTMLElement | null
}): Promise<ChartImages> {
  const images: ChartImages = {}

  // Find and capture each chart
  const capturePromises: Promise<void>[] = []

  if (chartRefs.audiogram) {
    capturePromises.push(
      captureChartAsImage(chartRefs.audiogram, { onlySvg: true, scale: 3 }).then((img) => {
        if (img) images.audiogram = img
      })
    )
  }

  if (chartRefs.speechAudiometry) {
    capturePromises.push(
      captureChartAsImage(chartRefs.speechAudiometry, { scale: 3 }).then((img) => {
        if (img) images.speechAudiometry = img
      })
    )
  }

  if (chartRefs.discriminationLoss) {
    capturePromises.push(
      captureChartAsImage(chartRefs.discriminationLoss, { scale: 3 }).then((img) => {
        if (img) images.discriminationLoss = img
      })
    )
  }

  if (chartRefs.leftTympanogram) {
    capturePromises.push(
      captureChartAsImage(chartRefs.leftTympanogram).then((img) => {
        if (img) images.leftTympanogram = img
      })
    )
  }

  if (chartRefs.rightTympanogram) {
    capturePromises.push(
      captureChartAsImage(chartRefs.rightTympanogram).then((img) => {
        if (img) images.rightTympanogram = img
      })
    )
  }

  await Promise.all(capturePromises)
  return images
}

/**
 * Prepare report data for export
 */
export function prepareReportData(data: ExportReportData) {
  const reportData = {
    report: data.report,
    client: data.client,
    clinicConfig: data.clinicConfig,
    formData: data.formData,
  }
  return reportData
}

