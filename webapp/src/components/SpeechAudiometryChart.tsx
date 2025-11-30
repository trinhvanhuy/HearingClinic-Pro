import { useRef, useCallback, useState } from 'react'

export interface SpeechAudiometryPoint {
  ear: 'R' | 'L'
  dbHL: number
  recognitionPercent: number
}

export interface SpeechAudiometryData {
  rightEar: SpeechAudiometryPoint[]
  leftEar: SpeechAudiometryPoint[]
}

interface SpeechAudiometryChartProps {
  data: SpeechAudiometryData
  mode?: 'R' | 'L'
  onModeChange?: (mode: 'R' | 'L') => void
  onAddPoint?: (point: SpeechAudiometryPoint) => void
}

const RIGHT_EAR_COLOR = '#E53935' // Red
const LEFT_EAR_COLOR = '#1E88E5' // Blue

export default function SpeechAudiometryChart({ 
  data, 
  mode = 'R',
  onModeChange,
  onAddPoint 
}: SpeechAudiometryChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ ear: 'R' | 'L'; index: number } | null>(null)

  // SVG dimensions
  const width = 800
  const height = 500
  const padding = { top: 50, right: 50, bottom: 70, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // X-axis: Intensity (dB HL), Range: 0-120
  const xMin = 0
  const xMax = 120
  const xStep = 20

  // Y-axis: Speech Recognition (%), Range: 0-100
  const yMin = 0
  const yMax = 100
  const yStep = 10

  // Convert dB HL to x position
  const dbHLToX = (dbHL: number): number => {
    const normalized = (dbHL - xMin) / (xMax - xMin)
    return padding.left + normalized * chartWidth
  }

  // Convert % Recognition to y position (inverted: 100% at top, 0% at bottom)
  const percentToY = (percent: number): number => {
    const normalized = (percent - yMin) / (yMax - yMin)
    return padding.top + (1 - normalized) * chartHeight // Inverted
  }

  // Convert x position to dB HL
  const xToDbHL = useCallback((x: number): number => {
    const normalized = Math.max(0, Math.min(1, (x - padding.left) / chartWidth))
    const dbHL = xMin + normalized * (xMax - xMin)
    return Math.round(dbHL / 5) * 5 // Snap to 5 dB increments
  }, [padding.left, chartWidth, xMin, xMax])

  // Convert y position to % Recognition
  const yToPercent = useCallback((y: number): number => {
    const normalized = Math.max(0, Math.min(1, (y - padding.top) / chartHeight))
    const percent = yMin + (1 - normalized) * (yMax - yMin) // Inverted
    return Math.round(percent / 5) * 5 // Snap to 5% increments
  }, [padding.top, chartHeight, yMin, yMax])

  // Sort data points by dB HL for line drawing
  // Keep original indices for hover detection
  const sortedRight = data.rightEar.map((p, i) => ({ ...p, originalIndex: i })).sort((a, b) => a.dbHL - b.dbHL)
  const sortedLeft = data.leftEar.map((p, i) => ({ ...p, originalIndex: i })).sort((a, b) => a.dbHL - b.dbHL)

  // Handle click on chart
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onAddPoint) return

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

    const dbHL = xToDbHL(x)
    const recognitionPercent = yToPercent(y)

    // Validate ranges
    if (dbHL < xMin || dbHL > xMax || recognitionPercent < yMin || recognitionPercent > yMax) {
      return
    }

    const newPoint: SpeechAudiometryPoint = {
      ear: mode,
      dbHL,
      recognitionPercent,
    }

    onAddPoint(newPoint)
  }, [onAddPoint, mode, xToDbHL, yToPercent, padding, width, height, xMin, xMax, yMin, yMax])

  // Handle mouse move for hover
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

    // Check if hovering over existing points
    // Recalculate sorted arrays here to avoid stale closure
    const currentSortedRight = data.rightEar.map((p, i) => ({ ...p, originalIndex: i })).sort((a, b) => a.dbHL - b.dbHL)
    const currentSortedLeft = data.leftEar.map((p, i) => ({ ...p, originalIndex: i })).sort((a, b) => a.dbHL - b.dbHL)
    
    const threshold = 10 // pixels
    const allPoints = [
      ...currentSortedRight.map((p) => ({ ...p, ear: 'R' as const })),
      ...currentSortedLeft.map((p) => ({ ...p, ear: 'L' as const })),
    ]

    for (const point of allPoints) {
      const pointX = dbHLToX(point.dbHL)
      const pointY = percentToY(point.recognitionPercent)
      if (Math.abs(x - pointX) < threshold && Math.abs(y - pointY) < threshold) {
        setHoveredPoint({ ear: point.ear, index: (point as any).originalIndex })
        return
      }
    }

    setHoveredPoint(null)
  }, [padding, width, height, data.rightEar, data.leftEar, dbHLToX, percentToY])

  // Render grid lines
  const renderGrid = () => {
    const gridLines = []

    // Vertical lines (dB HL)
    for (let x = xMin; x <= xMax; x += xStep) {
      const xPos = dbHLToX(x)
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={xPos}
          y1={padding.top}
          x2={xPos}
          y2={height - padding.bottom}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      )
    }

    // Horizontal lines (% Recognition)
    for (let y = yMin; y <= yMax; y += yStep) {
      const yPos = percentToY(y)
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={padding.left}
          y1={yPos}
          x2={width - padding.right}
          y2={yPos}
          stroke="#E5E7EB"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      )
    }

    return gridLines
  }

  // Render line for right ear
  const renderRightEarLine = () => {
    if (sortedRight.length < 2) return null

    const points = sortedRight.map(p => `${dbHLToX(p.dbHL)},${percentToY(p.recognitionPercent)}`).join(' ')

    return (
      <polyline
        points={points}
        fill="none"
        stroke={RIGHT_EAR_COLOR}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  // Render line for left ear
  const renderLeftEarLine = () => {
    if (sortedLeft.length < 2) return null

    const points = sortedLeft.map(p => `${dbHLToX(p.dbHL)},${percentToY(p.recognitionPercent)}`).join(' ')

    return (
      <polyline
        points={points}
        fill="none"
        stroke={LEFT_EAR_COLOR}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  // Render points
  const renderPoints = () => {
    const points = []

    // Right ear points (red circles)
    sortedRight.forEach((point) => {
      const x = dbHLToX(point.dbHL)
      const y = percentToY(point.recognitionPercent)
      const originalIndex = (point as any).originalIndex
      const isHovered = hoveredPoint?.ear === 'R' && hoveredPoint?.index === originalIndex
      points.push(
        <g key={`right-${originalIndex}`}>
          <circle
            cx={x}
            cy={y}
            r={isHovered ? 7 : 5}
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
              {point.dbHL} dB | {point.recognitionPercent}%
            </text>
          )}
        </g>
      )
    })

    // Left ear points (blue X marks)
    sortedLeft.forEach((point) => {
      const x = dbHLToX(point.dbHL)
      const y = percentToY(point.recognitionPercent)
      const originalIndex = (point as any).originalIndex
      const size = hoveredPoint?.ear === 'L' && hoveredPoint?.index === originalIndex ? 6 : 5
      points.push(
        <g key={`left-${originalIndex}`}>
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
          {hoveredPoint?.ear === 'L' && hoveredPoint?.index === originalIndex && (
            <text
              x={x}
              y={y - 15}
              fill={LEFT_EAR_COLOR}
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              {point.dbHL} dB | {point.recognitionPercent}%
            </text>
          )}
        </g>
      )
    })

    return points
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      {/* Legend and Mode Selector */}
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
        {onModeChange && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onModeChange('R')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'R'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={mode === 'R' ? { backgroundColor: RIGHT_EAR_COLOR } : {}}
            >
              Right Ear
            </button>
            <button
              type="button"
              onClick={() => onModeChange('L')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'L'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={mode === 'L' ? { backgroundColor: LEFT_EAR_COLOR } : {}}
            >
              Left Ear
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {onAddPoint && (
        <p className="text-xs text-gray-500 mb-4">
          Click on the chart to add a data point for {mode === 'R' ? 'Right' : 'Left'} ear
        </p>
      )}

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className={`border border-gray-300 rounded ${onAddPoint ? 'cursor-crosshair' : ''}`}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background */}
          <rect width={width} height={height} fill="#FFFFFF" />

          {/* Grid lines */}
          {renderGrid()}

          {/* Lines */}
          {renderRightEarLine()}
          {renderLeftEarLine()}

          {/* Points */}
          {renderPoints()}

          {/* X-axis labels (dB HL) */}
          {Array.from({ length: (xMax - xMin) / xStep + 1 }, (_, i) => {
            const value = xMin + i * xStep
            const x = dbHLToX(value)
            return (
              <text
                key={`x-label-${value}`}
                x={x}
                y={height - padding.bottom + 25}
                fill="#374151"
                fontSize="12"
                textAnchor="middle"
                fontWeight="500"
              >
                {value}
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
            Intensity (dB HL)
          </text>

          {/* Y-axis labels (% Recognition) */}
          {Array.from({ length: (yMax - yMin) / yStep + 1 }, (_, i) => {
            const value = yMin + i * yStep
            const y = percentToY(value)
            return (
              <text
                key={`y-label-${value}`}
                x={padding.left - 15}
                y={y + 4}
                fill="#374151"
                fontSize="11"
                textAnchor="end"
                fontWeight="500"
              >
                {value}
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
            Speech Recognition (%)
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

