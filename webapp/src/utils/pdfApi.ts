/**
 * Generate PDF using server-side Playwright
 */
export async function generatePdfFromHtml(html: string, options?: {
  format?: 'A4' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}): Promise<Blob> {
  // Get backend URL from Parse Server URL (remove /parse suffix) or use default
  const parseServerUrl = (import.meta as any).env?.VITE_PARSE_SERVER_URL || 'http://localhost:1338/parse'
  const backendBaseUrl = parseServerUrl.replace('/parse', '')
  const apiUrl = (import.meta as any).env?.VITE_API_URL || backendBaseUrl || 'http://localhost:1338'
  
  const pdfApiUrl = `${apiUrl}/api/pdf/export`
  console.log('[PDF API] Generating PDF:', { apiUrl, pdfApiUrl, parseServerUrl })
  
  const response = await fetch(pdfApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      options: {
        format: options?.format || 'A4',
        margin: {
          top: options?.margin?.top || '0mm',
          right: options?.margin?.right || '10mm',
          bottom: options?.margin?.bottom || '10mm',
          left: options?.margin?.left || '10mm',
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
    throw new Error(error.error || 'Failed to generate PDF')
  }

  return await response.blob()
}

/**
 * Download PDF from blob
 */
export function downloadPdf(blob: Blob, filename: string = 'hearing-report.pdf') {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Open PDF in new window for printing
 */
export function printPdf(blob: Blob) {
  const url = window.URL.createObjectURL(blob)
  const printWindow = window.open(url, '_blank')
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print()
    }
  }
  // Clean up after a delay
  setTimeout(() => {
    window.URL.revokeObjectURL(url)
  }, 1000)
}

