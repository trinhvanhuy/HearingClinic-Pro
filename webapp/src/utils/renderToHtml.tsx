import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import PrintableHearingReport from '../components/PrintableHearingReport'

/**
 * Render PrintableHearingReport component to HTML string with all styles
 * Uses DOM rendering to support base64 images in charts
 */
export function renderReportToHtml(
  report: any,
  client: any,
  clinicConfig: any,
  chartImages: any,
  formData: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create temporary container
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.width = '210mm'
      container.style.backgroundColor = 'white'
      container.className = 'printable-container'
      document.body.appendChild(container)

      // Render component into container
      const root = createRoot(container)
      root.render(
        React.createElement(PrintableHearingReport, {
          report,
          client,
          clinicConfig,
          chartImages,
          formData,
        })
      )

      // Wait for images to load, then get HTML
      setTimeout(() => {
        try {
          // Get all images and wait for them to load
          const images = container.querySelectorAll('img')
          const imagePromises = Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve()
            return new Promise((resolve) => {
              img.onload = resolve
              img.onerror = resolve // Continue even if image fails
            })
          })

          Promise.all(imagePromises).then(async () => {
            // Convert all images (including logo) to base64
            const images = container.querySelectorAll('img')
            const imageConversionPromises = Array.from(images).map(async (img) => {
              const src = img.getAttribute('src')
              if (!src) return
              
              // If already base64, skip
              if (src.startsWith('data:')) return
              
              try {
                // Fetch image and convert to base64
                const response = await fetch(src)
                const blob = await response.blob()
                const reader = new FileReader()
                return new Promise<void>((resolve) => {
                  reader.onload = () => {
                    img.setAttribute('src', reader.result as string)
                    resolve()
                  }
                  reader.onerror = () => resolve() // Continue even if fails
                  reader.readAsDataURL(blob)
                })
              } catch (error) {
                console.warn('Failed to convert image to base64:', src, error)
              }
            })
            
            await Promise.all(imageConversionPromises)
            
            // Get HTML content (now with base64 images)
            const componentHtml = container.innerHTML

            // Get all stylesheets from document
            const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
              .map((link) => {
                const href = (link as HTMLLinkElement).href
                return `<link rel="stylesheet" href="${href}" />`
              })
              .join('\n')

            // Get inline styles from style tags
            const inlineStyles = Array.from(document.querySelectorAll('style'))
              .map((style) => style.innerHTML)
              .join('\n')

            // Get print.css content specifically (try to fetch it)
            const printCssLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
              .find((link) => (link as HTMLLinkElement).href.includes('print.css'))
            
            // Fetch print.css content
            let printCssContent = ''
            if (printCssLink) {
              try {
                const response = await fetch((printCssLink as HTMLLinkElement).href)
                printCssContent = await response.text()
              } catch (error) {
                console.warn('Failed to fetch print.css:', error)
              }
            }
            
            // Combine everything into full HTML document
            const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hearing Report</title>
  ${stylesheets}
  <style>
    ${inlineStyles}
    ${printCssContent}
    /* Additional print styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }
    .printable-container {
      width: 210mm;
      margin: 0;
      padding: 10mm;
      padding-top: 0;
      background: white;
    }
    .report-header {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
    .chart-container.audiogram-chart {
      width: 100% !important;
    }
    .chart-image.audiogram-image {
      width: 100% !important;
      height: auto !important;
    }
    .audiogram-wrapper svg {
      width: 100% !important;
      height: auto !important;
    }
  </style>
</head>
<body>
  <div class="printable-container">
    ${componentHtml}
  </div>
</body>
</html>`

            // Cleanup
            root.unmount()
            if (document.body.contains(container)) {
              document.body.removeChild(container)
            }

            resolve(fullHtml)
          }).catch((error) => {
            root.unmount()
            if (document.body.contains(container)) {
              document.body.removeChild(container)
            }
            reject(error)
          })
        } catch (error) {
          root.unmount()
          document.body.removeChild(container)
          reject(error)
        }
      }, 500) // Wait 500ms for rendering
    } catch (error) {
      reject(error)
    }
  })
}

