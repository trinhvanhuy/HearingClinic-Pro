import { formatDate } from '@hearing-clinic/shared/src/utils/formatting'
import { HearingReport } from '@hearing-clinic/shared/src/models/hearingReport'
import { EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'
import PrintableAudiogramChart from './PrintableAudiogramChart'
import { DEFAULT_LOGO } from '../constants/logo'
import { translations, Language } from '../i18n/translations'

interface ClinicConfig {
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  logoUrl?: string
}

interface ChartImages {
  audiogram?: string
  speechAudiometry?: string
  discriminationLoss?: string
  leftTympanogram?: string
  rightTympanogram?: string
}

interface PrintableHearingReportProps {
  report: HearingReport | {
    get: (key: string) => any
  }
  client: {
    get: (key: string) => any
  }
  clinicConfig?: ClinicConfig
  chartImages?: ChartImages
  formData?: {
    leftEarThresholds?: EarThresholds
    rightEarThresholds?: EarThresholds
    speechAudiometry?: any
    discriminationLoss?: any
    leftTympanogram?: any
    rightTympanogram?: any
    results?: string
    recommendations?: string
    printName?: string
    signatureDate?: string
  }
  language?: Language
}

const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]

export default function PrintableHearingReport({
  report,
  client,
  clinicConfig,
  chartImages,
  formData,
  language = 'en',
}: PrintableHearingReportProps) {
  const t = translations[language]
  const leftEarThresholds = formData?.leftEarThresholds || report.get('leftEarThresholds') || {}
  const rightEarThresholds = formData?.rightEarThresholds || report.get('rightEarThresholds') || {}
  const results = formData?.results || report.get('results') || ''
  const recommendations = formData?.recommendations || report.get('recommendations') || ''
  const printName = formData?.printName || report.get('printName') || ''
  const signatureDate = formData?.signatureDate || report.get('signatureDate') || report.get('testDate') || ''
  const testDate = report.get('testDate')
  // Map typeOfTest value to translation if it's in English
  const rawTypeOfTest = report.get('typeOfTest') || ''
  const typeOfTest = rawTypeOfTest.toLowerCase() === 'pure tone audiometry' 
    ? t.hearingReports.pureToneAudiometry 
    : rawTypeOfTest || t.hearingReports.pureToneAudiometry

  const formatDateValue = (date: any) => {
    if (!date) return 'N/A'
    if (typeof date === 'string') {
      return formatDate(new Date(date))
    }
    return formatDate(date)
  }

  return (
    <div className="printable-hearing-report">
      {/* Header */}
      <div className="report-header">
        <div className="header-content">
          <div className="header-logo-title">
            <img src={clinicConfig?.logoUrl || DEFAULT_LOGO} alt="Logo" className="logo" />
            <h1 className="report-title">{t.hearingReports.hearingLossAssessment}</h1>
          </div>
          <div className="clinic-info">
            <p className="clinic-name">{clinicConfig?.clinicName || t.config.defaultClinicName}</p>
            {clinicConfig?.clinicAddress && <p className="clinic-address">{clinicConfig.clinicAddress}</p>}
            {clinicConfig?.clinicPhone && <p className="clinic-phone">{t.hearingReports.tel}: {clinicConfig.clinicPhone}</p>}
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="section patient-info">
        <h2 className="section-title">{t.hearingReports.patientInformation}</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">{t.hearingReports.lastName}:</span>
            <span className="info-value">{client.get('lastName') || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.hearingReports.firstName}:</span>
            <span className="info-value">{client.get('firstName') || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.clients.address}:</span>
            <span className="info-value">{client.get('address') || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.hearingReports.cityTown}:</span>
            <span className="info-value">{client.get('city') || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.hearingReports.telephoneNumber}:</span>
            <span className="info-value">{client.get('phone') || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.hearingReports.dateOfBirth}:</span>
            <span className="info-value">
              {client.get('dateOfBirth') ? formatDateValue(client.get('dateOfBirth')) : 'N/A'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.hearingReports.dateOfService}:</span>
            <span className="info-value">{formatDateValue(testDate)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">{t.appointments.hearingTestType}:</span>
            <span className="info-value">{typeOfTest}</span>
          </div>
        </div>
      </div>

      {/* Pure Tone Audiometry */}
      <div className="section pure-tone-section">
        <h2 className="section-title">{t.hearingReports.pureToneAudiometry}</h2>
        
        {/* Audiogram Chart */}
        <div className="chart-container audiogram-chart">
          {chartImages?.audiogram ? (
            <img src={chartImages.audiogram} alt={t.hearingReports.pureToneAudiometry} className="chart-image audiogram-image" />
          ) : (
            <div className="audiogram-wrapper">
              <PrintableAudiogramChart
                rightEar={rightEarThresholds}
                leftEar={leftEarThresholds}
              />
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.hearingReports.frequency}</th>
                {FREQUENCIES.map((freq) => (
                  <th key={freq}>{freq}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ear-label right-ear">{t.hearingReports.right}</td>
                {FREQUENCIES.map((freq) => {
                  const value = rightEarThresholds[freq as keyof EarThresholds]
                  return <td key={freq}>{value !== undefined && value !== null ? value : ''}</td>
                })}
              </tr>
              <tr>
                <td className="ear-label left-ear">{t.hearingReports.left}</td>
                {FREQUENCIES.map((freq) => {
                  const value = leftEarThresholds[freq as keyof EarThresholds]
                  return <td key={freq}>{value !== undefined && value !== null ? value : ''}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Results - Show recommendations if available, otherwise empty box for handwriting */}
      <div className="section results-section">
        <h2 className="section-title">{t.hearingReports.results}</h2>
        <div className="result-box">
          {recommendations ? (
            <div className="result-content">{recommendations}</div>
          ) : (
            [...Array(5)].map((_, i) => (
              <div key={i} className="result-line">
                <span className="result-dots">................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................................</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Signature */}
      {(printName || signatureDate) && (
        <div className="section signature-section">
          <div className="signature-info">
            {printName && (
              <div className="signature-item">
                <span className="signature-label">{t.hearingReports.printName}:</span>
                <span className="signature-value">{printName}</span>
              </div>
            )}
            {signatureDate && (
              <div className="signature-item">
                <span className="signature-label">{t.hearingReports.signatureDate}:</span>
                <span className="signature-value">{formatDateValue(signatureDate)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

