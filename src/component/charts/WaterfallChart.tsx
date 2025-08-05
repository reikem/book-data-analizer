import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useMemo } from "react"

interface WaterfallChartProps {
  data: any[]
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const waterfallData = useMemo(() => {
    let cumulative = 0
    return data.slice(0, 10).map((item,) => {
      const value = Object.values(item)[1] as number
      const start = cumulative
      cumulative += value

      return {
        name: Object.values(item)[0] as string,
        value: value,
        cumulative: cumulative,
        start: start,
        isPositive: value >= 0,
      }
    })
  }, [data])

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={waterfallData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {waterfallData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
