import { useMemo } from "react"
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CandlestickChartProps {
  data: any[]
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const candlestickData = useMemo(() => {
    // Simulate OHLC data from available data
    return data.slice(0, 20).map((row, index) => {
      const value =
        Number.parseFloat(Object.values(row).find((val) => !isNaN(Number.parseFloat(val as string))) as string) || 0
      const variation = Math.random() * 0.1 * value

      return {
        name: `Period ${index + 1}`,
        open: value,
        high: value + variation,
        low: value - variation,
        close: value + (Math.random() - 0.5) * variation,
      }
    })
  }, [data])

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={candlestickData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="high" fill="hsl(var(--primary))" fillOpacity={0.3} />
          <Bar dataKey="low" fill="hsl(var(--destructive))" fillOpacity={0.3} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
