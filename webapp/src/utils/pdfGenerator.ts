// @ts-ignore - jsPDF types may not be available
import { jsPDF } from 'jspdf'
// @ts-ignore - html2canvas types may not be available
import html2canvas from 'html2canvas'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'

interface PDFOptions {
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
}

export async function generateHearingReportPDF(
  report: HearingReport,
  client: any,
  charts: {
    audiogram?: HTMLElement | null
    speechAudiometry?: HTMLElement | null
    discriminationLoss?: HTMLElement | null
    leftTympanogram?: HTMLElement | null
    rightTympanogram?: HTMLElement | null
  },
  options: PDFOptions = {}
): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = margin
  const lineHeight = 7
  const chartWidth = pageWidth - 2 * margin

  // Helper function to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Helper function to draw text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y)
    return lines.length * (fontSize * 0.35)
  }

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Hearing Loss Assessment', pageWidth / 2, yPos, { align: 'center' })
  yPos += lineHeight

  // Clinic info
  if (options.clinicName) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(options.clinicName, pageWidth / 2, yPos, { align: 'center' })
    yPos += lineHeight
  }
  if (options.clinicAddress) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(options.clinicAddress, pageWidth / 2, yPos, { align: 'center' })
    yPos += lineHeight
  }
  if (options.clinicPhone) {
    doc.setFontSize(10)
    doc.text(`Tel: ${options.clinicPhone}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += lineHeight * 1.5
  }

  // Client info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Information', margin, yPos)
  yPos += lineHeight

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const clientInfo = [
    `Name: ${client?.get('fullName') || 'N/A'}`,
    `Date of Birth: ${client?.get('dateOfBirth') ? new Date(client.get('dateOfBirth')).toLocaleDateString() : 'N/A'}`,
    `Test Date: ${report.get('testDate') ? new Date(report.get('testDate')).toLocaleDateString() : 'N/A'}`,
    `Type of Test: ${report.get('typeOfTest') || 'Pure Tone Audiometry'}`,
  ]
  clientInfo.forEach((info) => {
    doc.text(info, margin, yPos)
    yPos += lineHeight
  })
  yPos += lineHeight

  // Audiogram Chart
  if (charts.audiogram) {
    checkNewPage(80)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Audiogram', margin, yPos)
    yPos += lineHeight

    try {
      const audiogramCanvas = await html2canvas(charts.audiogram, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const audiogramImg = audiogramCanvas.toDataURL('image/png')
      const imgWidth = chartWidth
      const imgHeight = (audiogramCanvas.height * imgWidth) / audiogramCanvas.width
      
      checkNewPage(imgHeight + 5)
      doc.addImage(audiogramImg, 'PNG', margin, yPos, imgWidth, imgHeight)
      yPos += imgHeight + lineHeight
    } catch (error) {
      console.error('Error rendering audiogram chart:', error)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text('Audiogram chart could not be rendered', margin, yPos)
      yPos += lineHeight
    }
  }

  // Speech Audiometry Chart
  if (charts.speechAudiometry) {
    checkNewPage(80)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Speech Audiometry', margin, yPos)
    yPos += lineHeight

    try {
      const speechCanvas = await html2canvas(charts.speechAudiometry, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const speechImg = speechCanvas.toDataURL('image/png')
      const imgWidth = chartWidth
      const imgHeight = (speechCanvas.height * imgWidth) / speechCanvas.width
      
      checkNewPage(imgHeight + 5)
      doc.addImage(speechImg, 'PNG', margin, yPos, imgWidth, imgHeight)
      yPos += imgHeight + lineHeight
    } catch (error) {
      console.error('Error rendering speech audiometry chart:', error)
    }
  }

  // Discrimination Loss Chart
  if (charts.discriminationLoss) {
    checkNewPage(80)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Word Recognition', margin, yPos)
    yPos += lineHeight

    try {
      const discriminationCanvas = await html2canvas(charts.discriminationLoss, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const discriminationImg = discriminationCanvas.toDataURL('image/png')
      const imgWidth = chartWidth
      const imgHeight = (discriminationCanvas.height * imgWidth) / discriminationCanvas.width
      
      checkNewPage(imgHeight + 5)
      doc.addImage(discriminationImg, 'PNG', margin, yPos, imgWidth, imgHeight)
      yPos += imgHeight + lineHeight
    } catch (error) {
      console.error('Error rendering discrimination loss chart:', error)
    }
  }

  // Tympanograms
  if (charts.leftTympanogram || charts.rightTympanogram) {
    checkNewPage(80)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Tympanometry', margin, yPos)
    yPos += lineHeight

    // Render tympanograms side by side if both exist
    const tympanogramWidth = (chartWidth - 10) / 2
    let leftImg: string | null = null
    let rightImg: string | null = null

    if (charts.leftTympanogram) {
      try {
        const leftCanvas = await html2canvas(charts.leftTympanogram, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        })
        leftImg = leftCanvas.toDataURL('image/png')
      } catch (error) {
        console.error('Error rendering left tympanogram:', error)
      }
    }

    if (charts.rightTympanogram) {
      try {
        const rightCanvas = await html2canvas(charts.rightTympanogram, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        })
        rightImg = rightCanvas.toDataURL('image/png')
      } catch (error) {
        console.error('Error rendering right tympanogram:', error)
      }
    }

    if (leftImg || rightImg) {
      const maxHeight = Math.max(
        leftImg ? 60 : 0,
        rightImg ? 60 : 0
      )
      checkNewPage(maxHeight + 10)

      if (leftImg) {
        const leftHeight = 60
        doc.text('Left Ear', margin, yPos)
        yPos += 5
        doc.addImage(leftImg, 'PNG', margin, yPos, tympanogramWidth, leftHeight)
      }

      if (rightImg) {
        const rightHeight = 60
        if (!leftImg) {
          doc.text('Right Ear', margin, yPos)
          yPos += 5
        } else {
          doc.text('Right Ear', margin + tympanogramWidth + 10, yPos - 60)
        }
        doc.addImage(rightImg, 'PNG', margin + tympanogramWidth + 10, yPos - (leftImg ? 0 : 60), tympanogramWidth, rightHeight)
      }

      yPos += (leftImg ? 60 : 60) + lineHeight
    }
  }

  // Results and Recommendations
  if (report.get('results')) {
    checkNewPage(30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Results', margin, yPos)
    yPos += lineHeight

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const resultsHeight = addText(report.get('results') || '', margin, yPos, chartWidth, 10)
    yPos += resultsHeight + lineHeight
  }

  if (report.get('recommendations')) {
    checkNewPage(30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Recommendations', margin, yPos)
    yPos += lineHeight

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const recommendationsHeight = addText(report.get('recommendations') || '', margin, yPos, chartWidth, 10)
    yPos += recommendationsHeight + lineHeight
  }

  // Signature
  if (report.get('printName')) {
    checkNewPage(20)
    yPos += lineHeight
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Signed by: ${report.get('printName')}`, margin, yPos)
    yPos += lineHeight
    if (report.get('signatureDate')) {
      doc.text(`Date: ${new Date(report.get('signatureDate')).toLocaleDateString()}`, margin, yPos)
    }
  }

  return doc
}

