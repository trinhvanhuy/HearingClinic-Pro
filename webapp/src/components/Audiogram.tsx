import { useState, useRef, useEffect } from 'react'
import { EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'

interface AudiogramProps {
  leftEarThresholds: EarThresholds
  rightEarThresholds: EarThresholds
  onThresholdChange: (
    ear: 'leftEarThresholds' | 'rightEarThresholds',
    frequency: number,
    value: number | undefined
  ) => void
  activeEar?: 'left' | 'right'
  onEarChange?: (ear: 'left' | 'right') => void
}

// Standard frequencies in Hz (logarithmic scale)
const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]

// Hearing levels in dB HL (from -10 to 120, in 10 dB steps)
const HEARING_LEVELS = Array.from({ length: 14 }, (_, i) => -10 + i * 10)

// Normal hearing range (typically -10 to 25 dB HL)
const NORMAL_HEARING_MAX = 25

export default function Audiogram({
  leftEarThresholds,
  rightEarThresholds,
  onThresholdChange,
  activeEar = 'right',
  onEarChange,
}: AudiogramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ ear: 'left' | 'right'; frequency: number } | null>(null)

  // SVG dimensions
  const width = 800
  const height = 500
  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Convert frequency to x position (logarithmic scale)
  const frequencyToX = (freq: number): number => {
    const minFreq = 125
    const maxFreq = 8000
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(maxFreq)
    const logFreq = Math.log10(freq)
    const normalized = (logFreq - logMin) / (logMax - logMin)
    return padding.left + normalized * chartWidth
  }

  // Convert hearing level to y position
  const hearingLevelToY = (level: number): number => {
    const minLevel = -10
    const maxLevel = 120
    const normalized = (level - minLevel) / (maxLevel - minLevel)
    return padding.top + (1 - normalized) * chartHeight
  }

  // Convert x position to frequency
  const xToFrequency = (x: number): number => {
    const minFreq = 125
    const maxFreq = 8000
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(maxFreq)
    const normalized = Math.max(0, Math.min(1, (x - padding.left) / chartWidth))
    const logFreq = logMin + normalized * (logMax - logMin)
    return Math.round(Math.pow(10, logFreq))
  }

  // Convert y position to hearing level (snap to 5 dB increments)
  const yToHearingLevel = (y: number): number => {
    const minLevel = -10
    const maxLevel = 120
    const normalized = Math.max(0, Math.min(1, (y - padding.top) / chartHeight))
    const level = minLevel + (1 - normalized) * (maxLevel - minLevel)
    // Snap to nearest 5 dB
    return Math.round(level / 5) * 5
  }

  // Find closest frequency to clicked position
  const findClosestFrequency = (x: number): number => {
    const clickedFreq = xToFrequency(x)
    return FREQUENCIES.reduce((prev, curr) => {
      return Math.abs(curr - clickedFreq) < Math.abs(prev - clickedFreq) ? curr : prev
    })
  }

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is within chart area
    if (
      x < padding.left ||
      x > width - padding.right ||
      y < padding.top ||
      y > height - padding.bottom
    ) {
      return
    }

    const frequency = findClosestFrequency(x)
    const hearingLevel = yToHearingLevel(y)

    // Toggle or set threshold
    const ear = activeEar === 'right' ? 'rightEarThresholds' : 'leftEarThresholds'
    const currentThreshold =
      activeEar === 'right'
        ? rightEarThresholds[frequency as keyof EarThresholds]
        : leftEarThresholds[frequency as keyof EarThresholds]

    if (currentThreshold === hearingLevel) {
      // Remove point if clicking on existing point
      onThresholdChange(ear, frequency, undefined)
    } else {
      // Set new threshold
      onThresholdChange(ear, frequency, hearingLevel)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (
      x < padding.left ||
      x > width - padding.right ||
      y < padding.top ||
      y > height - padding.bottom
    ) {
      setHoveredPoint(null)
      return
    }

    const frequency = findClosestFrequency(x)
    setHoveredPoint({ ear: activeEar, frequency })
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  // Render grid lines
  const renderGrid = () => {
    const gridLines = []

    // Vertical lines (frequencies)
    FREQUENCIES.forEach((freq) => {
      const x = frequencyToX(freq)
      gridLines.push(
        <line
          key={`v-${freq}`}
          x1={x}
          y1={padding.top}
          x2={x}
          y2={height - padding.bottom}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      )
    })

    // Horizontal lines (hearing levels)
    HEARING_LEVELS.forEach((level) => {
      const y = hearingLevelToY(level)
      gridLines.push(
        <line
          key={`h-${level}`}
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke={level === NORMAL_HEARING_MAX ? "#3b82f6" : "#e5e7eb"}
          strokeWidth={level === NORMAL_HEARING_MAX ? 2 : 1}
          strokeDasharray={level === NORMAL_HEARING_MAX ? "5,5" : undefined}
        />
      )
    })

    return gridLines
  }

  // Render normal hearing zone
  const renderNormalHearingZone = () => {
    const yTop = hearingLevelToY(-10)
    const yBottom = hearingLevelToY(NORMAL_HEARING_MAX)
    return (
      <rect
        x={padding.left}
        y={yTop}
        width={chartWidth}
        height={yBottom - yTop}
        fill="#dbeafe"
        opacity={0.5}
      />
    )
  }

  // Render threshold points
  const renderPoints = () => {
    const points = []

    // Right ear points (red circles)
    FREQUENCIES.forEach((freq) => {
      const threshold = rightEarThresholds[freq as keyof EarThresholds]
      if (threshold !== undefined) {
        const x = frequencyToX(freq)
        const y = hearingLevelToY(threshold)
        points.push(
          <g key={`right-${freq}`}>
            <circle
              cx={x}
              cy={y}
              r={6}
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth={2}
              className="cursor-pointer"
            />
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={hearingLevelToY(0)}
              stroke="#ef4444"
              strokeWidth={2}
              opacity={0.3}
              strokeDasharray="3,3"
            />
          </g>
        )
      }
    })

    // Left ear points (blue X marks)
    FREQUENCIES.forEach((freq) => {
      const threshold = leftEarThresholds[freq as keyof EarThresholds]
      if (threshold !== undefined) {
        const x = frequencyToX(freq)
        const y = hearingLevelToY(threshold)
        const size = 6
        points.push(
          <g key={`left-${freq}`}>
            <line
              x1={x - size}
              y1={y - size}
              x2={x + size}
              y2={y + size}
              stroke="#2563eb"
              strokeWidth={3}
              strokeLinecap="round"
              className="cursor-pointer"
            />
            <line
              x1={x - size}
              y1={y + size}
              x2={x + size}
              y2={y - size}
              stroke="#2563eb"
              strokeWidth={3}
              strokeLinecap="round"
              className="cursor-pointer"
            />
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={hearingLevelToY(0)}
              stroke="#2563eb"
              strokeWidth={2}
              opacity={0.3}
              strokeDasharray="3,3"
            />
          </g>
        )
      }
    })

    return points
  }

  // Render hover indicator
  const renderHoverIndicator = () => {
    if (!hoveredPoint) return null

    const frequency = hoveredPoint.frequency
    const x = frequencyToX(frequency)
    const threshold =
      hoveredPoint.ear === 'right'
        ? rightEarThresholds[frequency as keyof EarThresholds]
        : leftEarThresholds[frequency as keyof EarThresholds]

    if (threshold === undefined) return null

    const y = hearingLevelToY(threshold)
    const color = hoveredPoint.ear === 'right' ? '#ef4444' : '#2563eb'

    return (
      <g>
        <circle cx={x} cy={y} r={8} fill={color} opacity={0.3} />
        <text
          x={x}
          y={y - 15}
          fill={color}
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
        >
          {threshold} dB
        </text>
      </g>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg border p-4">
      {/* Legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <span className="text-sm font-medium">Right Ear (O)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-primary font-bold text-xs">X</span>
              </div>
            </div>
            <span className="text-sm font-medium">Left Ear (X)</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onEarChange?.('right')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeEar === 'right'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Right Ear
          </button>
          <button
            onClick={() => onEarChange?.('left')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeEar === 'left'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Left Ear
          </button>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 mb-4">
        Click on the grid to add/remove hearing threshold points. Click on existing points to remove them.
      </p>

      {/* Audiogram SVG */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border rounded cursor-crosshair"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background */}
          <rect width={width} height={height} fill="#ffffff" />

          {/* Normal hearing zone */}
          {renderNormalHearingZone()}

          {/* Grid lines */}
          {renderGrid()}

          {/* Labels for normal hearing zone */}
          <text
            x={width - padding.right - 10}
            y={hearingLevelToY((NORMAL_HEARING_MAX - 10) / 2)}
            fill="#3b82f6"
            fontSize="10"
            textAnchor="end"
            fontWeight="bold"
          >
            Normal hearing ability
          </text>
          <text
            x={width - padding.right - 10}
            y={hearingLevelToY((NORMAL_HEARING_MAX + 120) / 2)}
            fill="#6b7280"
            fontSize="10"
            textAnchor="end"
            fontWeight="bold"
          >
            Decreased hearing ability
          </text>

          {/* Threshold points */}
          {renderPoints()}

          {/* Hover indicator */}
          {renderHoverIndicator()}

          {/* X-axis labels (frequencies) */}
          {FREQUENCIES.map((freq) => {
            const x = frequencyToX(freq)
            return (
              <text
                key={`x-label-${freq}`}
                x={x}
                y={height - padding.bottom + 20}
                fill="#374151"
                fontSize="12"
                textAnchor="middle"
                fontWeight="medium"
              >
                {freq}
              </text>
            )
          })}
          <text
            x={width / 2}
            y={height - 10}
            fill="#374151"
            fontSize="14"
            textAnchor="middle"
            fontWeight="bold"
          >
            Frequency (Hz)
          </text>

          {/* Y-axis labels (hearing levels) */}
          {HEARING_LEVELS.map((level) => {
            const y = hearingLevelToY(level)
            return (
              <text
                key={`y-label-${level}`}
                x={padding.left - 10}
                y={y + 4}
                fill="#374151"
                fontSize="11"
                textAnchor="end"
              >
                {level}
              </text>
            )
          })}
          <text
            x={20}
            y={height / 2}
            fill="#374151"
            fontSize="14"
            textAnchor="middle"
            fontWeight="bold"
            transform={`rotate(-90, 20, ${height / 2})`}
          >
            Hearing Level (dB HL)
          </text>

          {/* Axis lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#374151"
            strokeWidth={2}
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#374151"
            strokeWidth={2}
          />
        </svg>
      </div>
    </div>
  )
}

