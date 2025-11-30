import { useRef, useCallback, useState } from 'react'

export interface TympanogramPoint {
  ear: 'R' | 'L'
  pressure: number // mmH₂O, range: -400 to +200
  admittance: number
}

export interface TympanogramData {
  rightEar: TympanogramPoint[]
  leftEar: TympanogramPoint[]
}

interface TympanogramChartProps {
  data: TympanogramData
  mode?: 'R' | 'L'
  onModeChange?: (mode: 'R' | 'L') => void
  onAddPoint?: (point: TympanogramPoint) => void
}

const RIGHT_EAR_COLOR = '#E53935' // Red
const LEFT_EAR_COLOR = '#1E88E5' // Blue

export default function TympanogramChart({ 
  data, 
  mode = 'R',
  onModeChange,
  onAddPoint 
}: TympanogramChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ ear: 'R' | 'L'; index: number } | null>(null)
  
  // SVG dimensions
  const width = 800
  const height = 500
  const padding = { top: 50, right: 50, bottom: 70, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // X-axis: Pressure (mmH₂O), Range: -400 to +200
  const xMin = -400
  const xMax = 200
  const xStep = 100

  // Y-axis: Admittance (auto-scale based on data)
  const allAdmittances = [
    ...data.rightEar.map(p => p.admittance),
    ...data.leftEar.map(p => p.admittance)
  ]
  // Default range if no data
  const defaultYMin = 0
  const defaultYMax = 2
  const yMin = allAdmittances.length > 0 ? Math.min(0, ...allAdmittances) - 0.1 : defaultYMin
  const yMax = allAdmittances.length > 0 ? Math.max(...allAdmittances, defaultYMax) + 0.1 : defaultYMax
  const yStep = (yMax - yMin) / 10

  // Convert pressure to x position
  const pressureToX = (pressure: number): number => {
    const normalized = (pressure - xMin) / (xMax - xMin)
    return padding.left + normalized * chartWidth
  }

  // Convert admittance to y position (inverted: max at top, min at bottom)
  const admittanceToY = (admittance: number): number => {
    const normalized = (admittance - yMin) / (yMax - yMin)
    return padding.top + (1 - normalized) * chartHeight
  }

  // Convert x position to pressure
  const xToPressure = useCallback((x: number): number => {
    const normalized = Math.max(0, Math.min(1, (x - padding.left) / chartWidth))
    const pressure = xMin + normalized * (xMax - xMin)
    return Math.round(pressure / 10) * 10 // Snap to 10 mmH₂O increments
  }, [padding.left, chartWidth, xMin, xMax])

  // Convert y position to admittance
  const yToAdmittance = useCallback((y: number): number => {
    const normalized = Math.max(0, Math.min(1, (y - padding.top) / chartHeight))
    const admittance = yMin + (1 - normalized) * (yMax - yMin) // Inverted
    return Math.round(admittance * 100) / 100 // Snap to 0.01 increments
  }, [padding.top, chartHeight, yMin, yMax])

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

    const pressure = xToPressure(x)
    const admittance = yToAdmittance(y)

    // Validate ranges
    if (pressure < xMin || pressure > xMax || admittance < yMin || admittance > yMax) {
      return
    }

    const newPoint: TympanogramPoint = {
      ear: mode,
      pressure,
      admittance,
    }

    onAddPoint(newPoint)
  }, [onAddPoint, mode, xToPressure, yToAdmittance, padding, width, height, xMin, xMax, yMin, yMax])

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
    const threshold = 10 // pixels
    const allPoints = [
      ...sortedRight.map((p) => ({ ...p, ear: 'R' as const })),
      ...sortedLeft.map((p) => ({ ...p, ear: 'L' as const })),
    ]

    for (const point of allPoints) {
      const pointX = pressureToX(point.pressure)
      const pointY = admittanceToY(point.admittance)
      if (Math.abs(x - pointX) < threshold && Math.abs(y - pointY) < threshold) {
        setHoveredPoint({ ear: point.ear, index: (point as any).originalIndex })
        return
      }
    }

    setHoveredPoint(null)
  }, [padding, width, height, sortedRight, sortedLeft, pressureToX, admittanceToY])

  // Sort data points by pressure for smooth line drawing
  // Keep original indices for hover detection
  const sortedRight = data.rightEar.map((p, i) => ({ ...p, originalIndex: i })).sort((a, b) => a.pressure - b.pressure)
  const sortedLeft = data.leftEar.map((p, i) => ({ ...p, originalIndex: i })).sort((a, b) => a.pressure - b.pressure)

  // Render grid lines
  const renderGrid = () => {
    const gridLines = []

    // Vertical lines (Pressure)
    for (let x = xMin; x <= xMax; x += xStep) {
      const xPos = pressureToX(x)
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

    // Horizontal lines (Admittance)
    for (let y = yMin; y <= yMax; y += yStep) {
      const yPos = admittanceToY(y)
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

  // Render smooth line for right ear using quadratic curves
  const renderRightEarLine = () => {
    if (sortedRight.length < 2) return null

    // Create smooth curve using quadratic bezier
    let path = `M ${pressureToX(sortedRight[0].pressure)} ${admittanceToY(sortedRight[0].admittance)}`
    
    for (let i = 1; i < sortedRight.length; i++) {
      const prev = sortedRight[i - 1]
      const curr = sortedRight[i]
      const midX = (pressureToX(prev.pressure) + pressureToX(curr.pressure)) / 2
      const midY = (admittanceToY(prev.admittance) + admittanceToY(curr.admittance)) / 2
      
      if (i === 1) {
        path += ` Q ${pressureToX(prev.pressure)} ${admittanceToY(prev.admittance)} ${midX} ${midY}`
      }
      path += ` T ${pressureToX(curr.pressure)} ${admittanceToY(curr.admittance)}`
    }

    return (
      <path
        d={path}
        fill="none"
        stroke={RIGHT_EAR_COLOR}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  // Render smooth line for left ear
  const renderLeftEarLine = () => {
    if (sortedLeft.length < 2) return null

    let path = `M ${pressureToX(sortedLeft[0].pressure)} ${admittanceToY(sortedLeft[0].admittance)}`
    
    for (let i = 1; i < sortedLeft.length; i++) {
      const prev = sortedLeft[i - 1]
      const curr = sortedLeft[i]
      const midX = (pressureToX(prev.pressure) + pressureToX(curr.pressure)) / 2
      const midY = (admittanceToY(prev.admittance) + admittanceToY(curr.admittance)) / 2
      
      if (i === 1) {
        path += ` Q ${pressureToX(prev.pressure)} ${admittanceToY(prev.admittance)} ${midX} ${midY}`
      }
      path += ` T ${pressureToX(curr.pressure)} ${admittanceToY(curr.admittance)}`
    }

    return (
      <path
        d={path}
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
      const x = pressureToX(point.pressure)
      const y = admittanceToY(point.admittance)
      const originalIndex = (point as any).originalIndex
      const isHovered = hoveredPoint?.ear === 'R' && hoveredPoint?.index === originalIndex
      points.push(
        <g key={`right-${originalIndex}`}>
          <circle
            cx={x}
            cy={y}
            r={isHovered ? 6 : 4}
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
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              {point.pressure} mmH₂O | {point.admittance.toFixed(2)}
            </text>
          )}
        </g>
      )
    })

    // Left ear points (blue X marks)
    sortedLeft.forEach((point) => {
      const x = pressureToX(point.pressure)
      const y = admittanceToY(point.admittance)
      const originalIndex = (point as any).originalIndex
      const size = hoveredPoint?.ear === 'L' && hoveredPoint?.index === originalIndex ? 5 : 4
      points.push(
        <g key={`left-${originalIndex}`}>
          <line
            x1={x - size}
            y1={y - size}
            x2={x + size}
            y2={y + size}
            stroke={LEFT_EAR_COLOR}
            strokeWidth={2.5}
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
            strokeWidth={2.5}
            strokeLinecap="round"
            className="cursor-pointer"
            style={{ cursor: 'grab' }}
          />
          {hoveredPoint?.ear === 'L' && hoveredPoint?.index === originalIndex && (
            <text
              x={x}
              y={y - 15}
              fill={LEFT_EAR_COLOR}
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
            >
              {point.pressure} mmH₂O | {point.admittance.toFixed(2)}
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
            <span className="text-sm font-medium text-gray-900">Right Ear</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-4 h-4 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: LEFT_EAR_COLOR }}>X</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Left Ear</span>
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

          {/* X-axis labels (Pressure) */}
          {Array.from({ length: (xMax - xMin) / xStep + 1 }, (_, i) => {
            const value = xMin + i * xStep
            const x = pressureToX(value)
            return (
              <text
                key={`x-label-${value}`}
                x={x}
                y={height - padding.bottom + 25}
                fill="#374151"
                fontSize="11"
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
            Pressure (mmH₂O)
          </text>

          {/* Y-axis labels (Admittance) */}
          {Array.from({ length: 11 }, (_, i) => {
            const value = yMin + i * ((yMax - yMin) / 10)
            const y = admittanceToY(value)
            return (
              <text
                key={`y-label-${i}`}
                x={padding.left - 15}
                y={y + 4}
                fill="#374151"
                fontSize="10"
                textAnchor="end"
                fontWeight="500"
              >
                {value.toFixed(2)}
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
            Admittance
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

