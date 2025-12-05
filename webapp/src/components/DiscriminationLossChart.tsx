import { useRef } from 'react'

export interface DiscriminationLossData {
  rightEar: {
    correctPercent: number
    lossPercent: number
  }
  leftEar: {
    correctPercent: number
    lossPercent: number
  }
}

interface DiscriminationLossChartProps {
  data: DiscriminationLossData
}

const RIGHT_EAR_COLOR = '#E53935' // Red
const LEFT_EAR_COLOR = '#1E88E5' // Blue

export default function DiscriminationLossChart({ data }: DiscriminationLossChartProps) {
  // SVG dimensions
  const width = 600
  const height = 400
  const padding = { top: 50, right: 50, bottom: 70, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Bar chart settings
  const barWidth = chartWidth / 4 // Space for 2 bars with gaps
  const barSpacing = barWidth / 2
  const rightBarX = padding.left + barSpacing
  const leftBarX = padding.left + barWidth + barSpacing * 2

  // Convert % to y position (inverted: 100% at top, 0% at bottom)
  const percentToY = (percent: number): number => {
    const normalized = percent / 100
    return padding.top + (1 - normalized) * chartHeight
  }

  // Calculate bar heights
  const rightBarHeight = chartHeight * (data.rightEar.correctPercent / 100)
  const leftBarHeight = chartHeight * (data.leftEar.correctPercent / 100)

  return (
    <div className="w-full bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Discrimination Loss Chart</h3>
      
      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          className="border border-gray-300 rounded"
        >
          {/* Background */}
          <rect width={width} height={height} fill="#FFFFFF" />

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = percentToY(percent)
            return (
              <line
                key={`grid-${percent}`}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
            )
          })}

          {/* Right ear bar */}
          <rect
            x={rightBarX}
            y={percentToY(data.rightEar.correctPercent)}
            width={barWidth}
            height={rightBarHeight}
            fill={RIGHT_EAR_COLOR}
            opacity={0.8}
          />
          <text
            x={rightBarX + barWidth / 2}
            y={percentToY(data.rightEar.correctPercent) - 5}
            fill="#374151"
            fontSize="12"
            textAnchor="middle"
            fontWeight="600"
          >
            {data.rightEar.correctPercent}%
          </text>
          <text
            x={rightBarX + barWidth / 2}
            y={percentToY(data.rightEar.correctPercent) + rightBarHeight + 15}
            fill="#374151"
            fontSize="11"
            textAnchor="middle"
          >
            Loss: {data.rightEar.lossPercent}%
          </text>

          {/* Left ear bar */}
          <rect
            x={leftBarX}
            y={percentToY(data.leftEar.correctPercent)}
            width={barWidth}
            height={leftBarHeight}
            fill={LEFT_EAR_COLOR}
            opacity={0.8}
          />
          <text
            x={leftBarX + barWidth / 2}
            y={percentToY(data.leftEar.correctPercent) - 5}
            fill="#374151"
            fontSize="12"
            textAnchor="middle"
            fontWeight="600"
          >
            {data.leftEar.correctPercent}%
          </text>
          <text
            x={leftBarX + barWidth / 2}
            y={percentToY(data.leftEar.correctPercent) + leftBarHeight + 15}
            fill="#374151"
            fontSize="11"
            textAnchor="middle"
          >
            Loss: {data.leftEar.lossPercent}%
          </text>

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((percent) => {
            const y = percentToY(percent)
            return (
              <text
                key={`y-label-${percent}`}
                x={padding.left - 15}
                y={y + 4}
                fill="#374151"
                fontSize="11"
                textAnchor="end"
                fontWeight="500"
              >
                {percent}%
              </text>
            )
          })}

          {/* X-axis labels */}
          <text
            x={rightBarX + barWidth / 2}
            y={height - padding.bottom + 30}
            fill="#374151"
            fontSize="12"
            textAnchor="middle"
            fontWeight="600"
          >
            Right Ear
          </text>
          <text
            x={leftBarX + barWidth / 2}
            y={height - padding.bottom + 30}
            fill="#374151"
            fontSize="12"
            textAnchor="middle"
            fontWeight="600"
          >
            Left Ear
          </text>

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 15}
            fill="#374151"
            fontSize="14"
            textAnchor="middle"
            fontWeight="bold"
          >
            Ear
          </text>
          <text
            x={20}
            y={height / 2}
            fill="#374151"
            fontSize="14"
            textAnchor="middle"
            fontWeight="bold"
            transform={`rotate(-90, 20, ${height / 2})`}
          >
            % Correct
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

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: RIGHT_EAR_COLOR, opacity: 0.8 }}></div>
          <span className="text-sm font-medium text-gray-900">Right Ear</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: LEFT_EAR_COLOR, opacity: 0.8 }}></div>
          <span className="text-sm font-medium text-gray-900">Left Ear</span>
        </div>
      </div>
    </div>
  )
}

