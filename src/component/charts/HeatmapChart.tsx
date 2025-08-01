import { useMemo } from "react"

interface HeatMapChartProps {
  data: any[]
}

export function HeatMapChart({ data }: HeatMapChartProps) {
  const heatmapData = useMemo(() => {
    // Process data for heatmap visualization
    const processedData = data.slice(0, 100) // Limit for performance
    return processedData.map((row, index) => ({
      x: index % 10,
      y: Math.floor(index / 10),
      value: (Object.values(row).find((val) => !isNaN(Number.parseFloat(val as string))) as number) || 0,
    }))
  }, [data])

  const maxValue = Math.max(...heatmapData.map((d) => d.value))
  const minValue = Math.min(...heatmapData.map((d) => d.value))

  const getColor = (value: number) => {
    const intensity = (value - minValue) / (maxValue - minValue)
    return `hsl(var(--primary) / ${intensity})`
  }

  return (
    <div className="w-full h-96 overflow-auto">
      <svg width="500" height="400" className="border rounded">
        {heatmapData.map((cell, index) => (
          <rect
            key={index}
            x={cell.x * 50}
            y={cell.y * 40}
            width="48"
            height="38"
            fill={getColor(cell.value)}
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  )
}
