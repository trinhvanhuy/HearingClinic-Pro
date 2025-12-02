import { EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'
import { useMemo } from 'react'

interface PrintableAudiogramChartProps {
  rightEar?: EarThresholds
  leftEar?: EarThresholds
  width?: number
  height?: number
}

const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]
const HEARING_LEVELS = Array.from({ length: 14 }, (_, i) => -10 + i * 10)
const RIGHT_EAR_COLOR = '#E53935' // Red
const LEFT_EAR_COLOR = '#1E88E5' // Blue

const HEARING_ZONES = [
  { min: -10, max: 20, color: '#FFFFFF', name: 'normal' },
  { min: 20, max: 40, color: '#FFF9C4', name: 'mild' },
  { min: 40, max: 70, color: '#FFC107', name: 'moderate' },
  { min: 70, max: 90, color: '#FFCDD2', name: 'severe' },
  { min: 90, max: 120, color: '#D32F2F', name: 'profound' },
]

export default function PrintableAudiogramChart({
  rightEar = {},
  leftEar = {},
  width, // No default - will be 100% of container
  height = 600,
}: PrintableAudiogramChartProps) {
  // Use container width, default to 100% of parent
  const effectiveWidth = width || 1000
  const padding = { top: 50, right: 50, bottom: 70, left: 70 }
  const chartWidth = effectiveWidth - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Convert frequency to x position (logarithmic scale)
  const frequencyToX = (freq: number): number => {
    const minFreq = FREQUENCIES[0]
    const maxFreq = FREQUENCIES[FREQUENCIES.length - 1]
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(maxFreq)
    const logFreq = Math.log10(freq)
    const normalized = (logFreq - logMin) / (logMax - logMin)
    return padding.left + normalized * chartWidth
  }

  // Convert hearing level to y position
  const hearingLevelToY = (level: number): number => {
    const minLevel = HEARING_LEVELS[0]
    const maxLevel = HEARING_LEVELS[HEARING_LEVELS.length - 1]
    const normalized = (level - minLevel) / (maxLevel - minLevel)
    return padding.top + normalized * chartHeight
  }

  // Get points for right ear
  const rightPoints = useMemo(() => {
    return FREQUENCIES.map((freq) => {
      const value = rightEar[freq as keyof EarThresholds]
      if (value === undefined || value === null) return null
      return {
        x: frequencyToX(freq),
        y: hearingLevelToY(value),
        frequency: freq,
        value,
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null)
  }, [rightEar])

  // Get points for left ear
  const leftPoints = useMemo(() => {
    return FREQUENCIES.map((freq) => {
      const value = leftEar[freq as keyof EarThresholds]
      if (value === undefined || value === null) return null
      return {
        x: frequencyToX(freq),
        y: hearingLevelToY(value),
        frequency: freq,
        value,
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null)
  }, [leftEar])

  // Create path for right ear (connected lines)
  const rightPath = useMemo(() => {
    if (rightPoints.length === 0) return ''
    const pathData = rightPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    return pathData
  }, [rightPoints])

  // Create path for left ear (connected lines)
  const leftPath = useMemo(() => {
    if (leftPoints.length === 0) return ''
    const pathData = leftPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    return pathData
  }, [leftPoints])

  return (
    <div className="printable-audiogram-chart" style={{ width: '100%', margin: '0 auto' }}>
      <svg
        width={effectiveWidth}
        height={height}
        viewBox={`0 0 ${effectiveWidth} ${height}`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background zones */}
        {HEARING_ZONES.map((zone) => {
          const y1 = hearingLevelToY(zone.max)
          const y2 = hearingLevelToY(zone.min)
          return (
            <rect
              key={zone.name}
              x={padding.left}
              y={y1}
              width={chartWidth}
              height={y2 - y1}
              fill={zone.color}
            />
          )
        })}

        {/* Grid lines - Frequencies (vertical) */}
        {FREQUENCIES.map((freq) => {
          const x = frequencyToX(freq)
          return (
            <line
              key={`freq-${freq}`}
              x1={x}
              y1={padding.top}
              x2={x}
              y2={height - padding.bottom}
              stroke="#ccc"
              strokeWidth={0.5}
            />
          )
        })}

        {/* Grid lines - Hearing Levels (horizontal) */}
        {HEARING_LEVELS.map((level) => {
          const y = hearingLevelToY(level)
          return (
            <line
              key={`level-${level}`}
              x1={padding.left}
              y1={y}
              x2={effectiveWidth - padding.right}
              y2={y}
              stroke="#ccc"
              strokeWidth={0.5}
            />
          )
        })}

        {/* Right ear line */}
        {rightPath && (
          <path
            d={rightPath}
            fill="none"
            stroke={RIGHT_EAR_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Right ear points */}
        {rightPoints.map((point) => (
          <circle
            key={`right-${point.frequency}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={RIGHT_EAR_COLOR}
          />
        ))}

        {/* Left ear line */}
        {leftPath && (
          <path
            d={leftPath}
            fill="none"
            stroke={LEFT_EAR_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5,5"
          />
        )}

        {/* Left ear points */}
        {leftPoints.map((point) => (
          <circle
            key={`left-${point.frequency}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={LEFT_EAR_COLOR}
          />
        ))}

        {/* Axis labels - Frequencies */}
        {FREQUENCIES.map((freq) => {
          const x = frequencyToX(freq)
          return (
            <text
              key={`label-freq-${freq}`}
              x={x}
              y={height - padding.bottom + 25}
              textAnchor="middle"
              fontSize="12"
              fill="#000"
            >
              {freq}
            </text>
          )
        })}

        {/* Axis labels - Hearing Levels */}
        {HEARING_LEVELS.map((level) => {
          const y = hearingLevelToY(level)
          return (
            <text
              key={`label-level-${level}`}
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#000"
            >
              {level}
            </text>
          )
        })}

        {/* Axis titles */}
        <text
          x={effectiveWidth / 2}
          y={height - 15}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#000"
        >
          Frequency (Hz)
        </text>
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#000"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          Hearing Level (dB HL)
        </text>

        {/* Legend - Hidden for print */}
        {/* <g transform={`translate(${effectiveWidth - padding.right - 120}, ${padding.top})`}>
          <line x1={0} y1={0} x2={30} y2={0} stroke={RIGHT_EAR_COLOR} strokeWidth={2} />
          <text x={35} y={4} fontSize="12" fill="#000">Right</text>
          <line x1={0} y1={20} x2={30} y2={20} stroke={LEFT_EAR_COLOR} strokeWidth={2} strokeDasharray="5,5" />
          <text x={35} y={24} fontSize="12" fill="#000">Left</text>
        </g> */}
      </svg>
    </div>
  )
}

