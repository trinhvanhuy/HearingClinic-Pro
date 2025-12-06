const express = require('express')
const router = express.Router()
const { chromium } = require('playwright')

/**
 * Generate PDF from HTML content
 * POST /api/pdf/export
 * Body: { html: string, options?: { format?: 'A4', margin?: {...} } }
 */
router.post('/export', async (req, res) => {
  try {
    const { html, options = {} } = req.body

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' })
    }

    // Launch browser
    // Use system Chromium if available (for Docker/Alpine)
    const launchOptions = {
      headless: true,
      args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--font-render-hinting=none', // Better font rendering
        '--disable-font-subpixel-positioning', // Better font rendering
      ],
    }
    
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    }
    
    const browser = await chromium.launch(launchOptions)
    
    // Create browser context with proper locale for Vietnamese
    const context = await browser.newContext({
      locale: 'vi-VN',
      timezoneId: 'Asia/Ho_Chi_Minh',
    })

    const page = await context.newPage()

    // Set content with HTML first
    // Use 'networkidle' to wait for fonts from Google Fonts to load
    await page.setContent(html, {
      waitUntil: 'networkidle', // Wait for all network requests including fonts
      timeout: 60000, // 60 seconds timeout for complex HTML with embedded images
    })
    
    // Wait for fonts to be fully loaded and rendered
    await page.waitForTimeout(3000) // Increased wait time for Google Fonts
    
    // Force font rendering with Noto Sans as primary
    await page.addStyleTag({
      content: `
        * {
          font-family: 'Noto Sans', 'Arial', 'Tahoma', 'Roboto', 'DejaVu Sans', 'Liberation Sans', sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        /* Ensure bold text uses real bold font, not fake bold */
        h1, h2, h3, .report-title, .section-title, .clinic-name, 
        .data-table th, .ear-label, strong, b {
          font-weight: 700 !important;
          font-family: 'Noto Sans', sans-serif !important;
        }
        @supports (font-variant-ligatures: normal) {
          * {
            font-variant-ligatures: normal;
          }
        }
      `
    })
    
    // Wait for font styles to apply
    await page.waitForTimeout(1000)
    
    // Verify fonts are loaded by checking computed styles
    try {
      await page.evaluate(() => {
        const testElement = document.createElement('div')
        testElement.style.fontFamily = 'Noto Sans'
        testElement.style.position = 'absolute'
        testElement.style.visibility = 'hidden'
        testElement.textContent = 'Đánh giá Mất thính lực'
        document.body.appendChild(testElement)
        const computedStyle = window.getComputedStyle(testElement)
        console.log('Font family:', computedStyle.fontFamily)
        document.body.removeChild(testElement)
      })
    } catch (error) {
      console.warn('Font verification failed:', error)
    }

    // Generate PDF with no header/footer
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      margin: options.margin || {
        top: '0mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
      printBackground: true,
      displayHeaderFooter: false, // This removes browser header/footer
      preferCSSPageSize: true,
    })

    await context.close()
    await browser.close()

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="hearing-report.pdf"')
    res.setHeader('Content-Length', pdfBuffer.length)

    // Send PDF
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ error: 'Failed to generate PDF', message: error.message })
  }
})

module.exports = router

