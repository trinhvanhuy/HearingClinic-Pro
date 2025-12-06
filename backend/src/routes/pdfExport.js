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
    }
    
    if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    }
    
    const browser = await chromium.launch(launchOptions)

    const page = await browser.newPage()

    // Set default font for Vietnamese support
    await page.addStyleTag({
      content: `
        * {
          font-family: 'Arial', 'Tahoma', 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', sans-serif !important;
        }
      `
    })

    // Set content with HTML
    // Use 'domcontentloaded' - faster, doesn't wait for network requests
    // All CSS and images should be embedded inline (base64) in the HTML
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 60000, // 60 seconds timeout for complex HTML with embedded images
    })
    
    // Wait a bit more for any embedded images/CSS to render
    await page.waitForTimeout(1000)

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

