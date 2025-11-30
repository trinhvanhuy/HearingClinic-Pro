import { useState, useRef, useEffect, useCallback } from 'react'
import { EarThresholds } from '@hearing-clinic/shared/src/models/hearingReport'

interface AudiogramChartProps {
  rightEar?: EarThresholds
  leftEar?: EarThresholds
  mode?: 'right' | 'left'
  onChangeRight?: (frequency: number, value: number | undefined) => void
  onChangeLeft?: (frequency: number, value: number | undefined) => void
  onModeChange?: (mode: 'right' | 'left') => void
}

// Standard frequencies in Hz
const FREQUENCIES = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000]

// Hearing levels in dB HL (from -10 to 120, in 10 dB steps)
const HEARING_LEVELS = Array.from({ length: 14 }, (_, i) => -10 + i * 10)

// Normal hearing range (-10 to 20 dB HL)
const NORMAL_HEARING_MIN = -10
const NORMAL_HEARING_MAX = 20

// Colors according to Audiology standards
const RIGHT_EAR_COLOR = '#E53935' // Red
const LEFT_EAR_COLOR = '#1E88E5' // Blue
const NORMAL_HEARING_COLOR = '#E3F2FD' // Light blue

export default function AudiogramChart({
  rightEar = {},
  leftEar = {},
  mode = 'right',
  onChangeRight,
  onChangeLeft,
  onModeChange,
}: AudiogramChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{ ear: 'right' | 'left'; frequency: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ ear: 'right' | 'left'; frequency: number; x: number; y: number } | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ ear: 'right' | 'left'; frequency: number } | null>(null)

  // SVG dimensions
  const width = 900
  const height = 600
  const padding = { top: 50, right: 50, bottom: 70, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Cell size for grid (approximately 50-60px)
  const cellWidth = chartWidth / (FREQUENCIES.length - 1)
  const cellHeight = chartHeight / (HEARING_LEVELS.length - 1)

  // Convert frequency to x position (logarithmic scale)
  const frequencyToX = useCallback((freq: number): number => {
    const minFreq = FREQUENCIES[0]
    const maxFreq = FREQUENCIES[FREQUENCIES.length - 1]
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(maxFreq)
    const logFreq = Math.log10(freq)
    const normalized = (logFreq - logMin) / (logMax - logMin)
    return padding.left + normalized * chartWidth
  }, [padding.left, chartWidth])

  // Convert hearing level to y position (inverted - higher dB at bottom)
  const hearingLevelToY = useCallback((level: number): number => {
    const minLevel = HEARING_LEVELS[0]
    const maxLevel = HEARING_LEVELS[HEARING_LEVELS.length - 1]
    const normalized = (level - minLevel) / (maxLevel - minLevel)
    return padding.top + (1 - normalized) * chartHeight
  }, [padding.top, chartHeight])

  // Convert x position to frequency
  const xToFrequency = useCallback((x: number): number => {
    const minFreq = FREQUENCIES[0]
    const maxFreq = FREQUENCIES[FREQUENCIES.length - 1]
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(maxFreq)
    const normalized = Math.max(0, Math.min(1, (x - padding.left) / chartWidth))
    const logFreq = logMin + normalized * (logMax - logMin)
    return Math.pow(10, logFreq)
  }, [padding.left, chartWidth])

  // Convert y position to hearing level (snap to 10 dB increments)
  const yToHearingLevel = useCallback((y: number): number => {
    const minLevel = HEARING_LEVELS[0]
    const maxLevel = HEARING_LEVELS[HEARING_LEVELS.length - 1]
    const normalized = Math.max(0, Math.min(1, (y - padding.top) / chartHeight))
    const level = minLevel + (1 - normalized) * (maxLevel - minLevel)
    // Snap to nearest 10 dB
    return Math.round(level / 10) * 10
  }, [padding.top, chartHeight])

  // Find closest frequency to clicked position
  const findClosestFrequency = useCallback((x: number): number => {
    const clickedFreq = xToFrequency(x)
    return FREQUENCIES.reduce((prev, curr) => {
      return Math.abs(curr - clickedFreq) < Math.abs(prev - clickedFreq) ? curr : prev
    })
  }, [xToFrequency])

  // Validate hearing level
  const validateHearingLevel = useCallback((level: number): number => {
    return Math.max(-10, Math.min(120, level))
  }, [])

  // Handle click on grid
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || contextMenu) {
      setContextMenu(null)
      return
    }

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
    const hearingLevel = validateHearingLevel(yToHearingLevel(y))

    if (mode === 'right' && onChangeRight) {
      const currentValue = rightEar[frequency as keyof EarThresholds]
      if (currentValue === hearingLevel) {
        // Remove point if clicking on existing point
        onChangeRight(frequency, undefined)
      } else {
        onChangeRight(frequency, hearingLevel)
      }
    } else if (mode === 'left' && onChangeLeft) {
      const currentValue = leftEar[frequency as keyof EarThresholds]
      if (currentValue === hearingLevel) {
        onChangeLeft(frequency, undefined)
      } else {
        onChangeLeft(frequency, hearingLevel)
      }
    }
  }, [contextMenu, padding, width, height, findClosestFrequency, validateHearingLevel, yToHearingLevel, mode, onChangeRight, onChangeLeft, rightEar, leftEar])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
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

    // Check if hovering over an existing point
    const rightValue = rightEar[frequency as keyof EarThresholds]
    const leftValue = leftEar[frequency as keyof EarThresholds]
    const rightY = rightValue !== undefined ? hearingLevelToY(rightValue) : null
    const leftY = leftValue !== undefined ? hearingLevelToY(leftValue) : null

    const threshold = 10 // pixels
    if (rightY !== null && Math.abs(x - frequencyToX(frequency)) < threshold && Math.abs(y - rightY) < threshold) {
      setHoveredPoint({ ear: 'right', frequency })
    } else if (leftY !== null && Math.abs(x - frequencyToX(frequency)) < threshold && Math.abs(y - leftY) < threshold) {
      setHoveredPoint({ ear: 'left', frequency })
    } else {
      setHoveredPoint(null)
    }

    // Handle dragging
    if (dragging) {
      const hearingLevel = validateHearingLevel(yToHearingLevel(y))
      if (dragging.ear === 'right' && onChangeRight) {
        onChangeRight(dragging.frequency, hearingLevel)
      } else if (dragging.ear === 'left' && onChangeLeft) {
        onChangeLeft(dragging.frequency, hearingLevel)
      }
    }
  }, [padding, width, height, findClosestFrequency, rightEar, leftEar, hearingLevelToY, frequencyToX, dragging, validateHearingLevel, yToHearingLevel, onChangeRight, onChangeLeft])

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (hoveredPoint) {
      setDragging(hoveredPoint)
    }
  }, [hoveredPoint])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  // Handle context menu
  const handleContextMenu = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault()
    if (hoveredPoint) {
      setContextMenu({
        ...hoveredPoint,
        x: e.clientX,
        y: e.clientY,
      })
    }
  }, [hoveredPoint])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // Render grid lines
  const renderGrid = () => {
    const gridLines = []

    // Vertical lines (frequencies) - major lines
    FREQUENCIES.forEach((freq) => {
      const x = frequencyToX(freq)
      gridLines.push(
        <line
          key={`v-${freq}`}
          x1={x}
          y1={padding.top}
          x2={x}
          y2={height - padding.bottom}
          stroke="#9CA3AF"
          strokeWidth={1.5}
        />
      )
    })

    // Horizontal lines (hearing levels) - major lines
    HEARING_LEVELS.forEach((level) => {
      const y = hearingLevelToY(level)
      gridLines.push(
        <line
          key={`h-${level}`}
          x1={padding.left}
          y1={y}
          x2={width - padding.right}
          y2={y}
          stroke="#9CA3AF"
          strokeWidth={1.5}
        />
      )
    })

    return gridLines
  }

  // Render normal hearing zone
  const renderNormalHearingZone = () => {
    const yTop = hearingLevelToY(NORMAL_HEARING_MIN)
    const yBottom = hearingLevelToY(NORMAL_HEARING_MAX)
    const zoneHeight = Math.abs(yBottom - yTop)
    // Ensure height is positive
    if (zoneHeight <= 0) return null
    return (
      <rect
        x={padding.left}
        y={Math.min(yTop, yBottom)}
        width={chartWidth}
        height={zoneHeight}
        fill={NORMAL_HEARING_COLOR}
        opacity={0.3}
      />
    )
  }

  // Render connection lines for right ear
  const renderRightEarLine = () => {
    const points = FREQUENCIES.map((freq) => {
      const value = rightEar[freq as keyof EarThresholds]
      if (value === undefined) return null
      return `${frequencyToX(freq)},${hearingLevelToY(value)}`
    }).filter(Boolean) as string[]

    if (points.length < 2) return null

    return (
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={RIGHT_EAR_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  // Render connection lines for left ear
  const renderLeftEarLine = () => {
    const points = FREQUENCIES.map((freq) => {
      const value = leftEar[freq as keyof EarThresholds]
      if (value === undefined) return null
      return `${frequencyToX(freq)},${hearingLevelToY(value)}`
    }).filter(Boolean) as string[]

    if (points.length < 2) return null

    return (
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={LEFT_EAR_COLOR}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  // Render threshold points
  const renderPoints = () => {
    const points = []

    // Right ear points (red circles - O)
    FREQUENCIES.forEach((freq) => {
      const threshold = rightEar[freq as keyof EarThresholds]
      if (threshold !== undefined) {
        const x = frequencyToX(freq)
        const y = hearingLevelToY(threshold)
        const isHovered = hoveredPoint?.ear === 'right' && hoveredPoint?.frequency === freq
        const isDragging = dragging?.ear === 'right' && dragging?.frequency === freq

        points.push(
          <g key={`right-${freq}`}>
            <circle
              cx={x}
              cy={y}
              r={isHovered || isDragging ? 8 : 6}
              fill={RIGHT_EAR_COLOR}
              stroke="#FFFFFF"
              strokeWidth={2}
              className="cursor-pointer"
              style={{ cursor: 'grab' }}
            />
            {isHovered && (
              <text
                x={x}
                y={y - 15}
                fill={RIGHT_EAR_COLOR}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {threshold} dB
              </text>
            )}
          </g>
        )
      }
    })

    // Left ear points (blue X marks)
    FREQUENCIES.forEach((freq) => {
      const threshold = leftEar[freq as keyof EarThresholds]
      if (threshold !== undefined) {
        const x = frequencyToX(freq)
        const y = hearingLevelToY(threshold)
        const isHovered = hoveredPoint?.ear === 'left' && hoveredPoint?.frequency === freq
        const isDragging = dragging?.ear === 'left' && dragging?.frequency === freq
        const size = isHovered || isDragging ? 8 : 6

        points.push(
          <g key={`left-${freq}`}>
            <line
              x1={x - size}
              y1={y - size}
              x2={x + size}
              y2={y + size}
              stroke={LEFT_EAR_COLOR}
              strokeWidth={3}
              strokeLinecap="round"
              className="cursor-pointer"
              style={{ cursor: 'grab' }}
            />
            <line
              x1={x - size}
              y1={y + size}
              x2={x + size}
              y2={y - size}
              stroke={LEFT_EAR_COLOR}
              strokeWidth={3}
              strokeLinecap="round"
              className="cursor-pointer"
              style={{ cursor: 'grab' }}
            />
            {isHovered && (
              <text
                x={x}
                y={y - 15}
                fill={LEFT_EAR_COLOR}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {threshold} dB
              </text>
            )}
          </g>
        )
      }
    })

    return points
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      {/* Legend and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: RIGHT_EAR_COLOR, border: '2px solid white', boxShadow: '0 0 0 1px #E5E7EB' }}></div>
            <span className="text-sm font-medium text-gray-900">Right Ear (O)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: LEFT_EAR_COLOR }}>X</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Left Ear (X)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange?.('right')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'right'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={mode === 'right' ? { backgroundColor: RIGHT_EAR_COLOR } : {}}
          >
            Right Ear
          </button>
          <button
            onClick={() => onModeChange?.('left')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'left'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={mode === 'left' ? { backgroundColor: LEFT_EAR_COLOR } : {}}
          >
            Left Ear
          </button>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 mb-4">
        Click on the grid to add/remove hearing threshold points. Drag existing points to adjust values. Right-click on points to delete.
      </p>

      {/* Audiogram SVG */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-300 rounded cursor-crosshair"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoveredPoint(null)
            setDragging(null)
          }}
          onContextMenu={handleContextMenu}
        >
          {/* Background */}
          <rect width={width} height={height} fill="#FFFFFF" />

          {/* Normal hearing zone */}
          {renderNormalHearingZone()}

          {/* Grid lines */}
          {renderGrid()}

          {/* Zone labels */}
          <text
            x={width - padding.right - 10}
            y={hearingLevelToY((NORMAL_HEARING_MIN + NORMAL_HEARING_MAX) / 2)}
            fill="#1976D2"
            fontSize="11"
            textAnchor="end"
            fontWeight="600"
          >
            Normal hearing ability
          </text>
          <text
            x={width - padding.right - 10}
            y={hearingLevelToY((NORMAL_HEARING_MAX + 120) / 2)}
            fill="#6B7280"
            fontSize="11"
            textAnchor="end"
            fontWeight="600"
          >
            Decreased hearing ability
          </text>

          {/* Connection lines */}
          {renderRightEarLine()}
          {renderLeftEarLine()}

          {/* Threshold points */}
          {renderPoints()}

          {/* X-axis labels (frequencies) */}
          {FREQUENCIES.map((freq) => {
            const x = frequencyToX(freq)
            return (
              <text
                key={`x-label-${freq}`}
                x={x}
                y={height - padding.bottom + 25}
                fill="#374151"
                fontSize="12"
                textAnchor="middle"
                fontWeight="500"
              >
                {freq}
              </text>
            )
          })}
          <text
            x={width / 2}
            y={height - 15}
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
                x={padding.left - 15}
                y={y + 4}
                fill="#374151"
                fontSize="11"
                textAnchor="end"
                fontWeight="500"
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              if (contextMenu.ear === 'right' && onChangeRight) {
                onChangeRight(contextMenu.frequency, undefined)
              } else if (contextMenu.ear === 'left' && onChangeLeft) {
                onChangeLeft(contextMenu.frequency, undefined)
              }
              setContextMenu(null)
            }}
          >
            Remove point
          </button>
        </div>
      )}
    </div>
  )
}

