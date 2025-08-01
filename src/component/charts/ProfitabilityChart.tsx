import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useMemo } from "react"

interface ProfitabilityChartProps {
  data: any[]
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  const profitabilityData = useMemo(() => {
    // Calculate profitability metrics from data
    return data.slice(0, 12).map((row, index) => {
      const revenue =
        Number.parseFloat(Object.values(row).find((val) => !isNaN(Number.parseFloat(val as string))) as string) || 0
      const costs = revenue * (0.6 + Math.random() * 0.2) // Simulate costs
      const profit = revenue - costs
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0

      return {
        period: `Mes ${index + 1}`,
        revenue,
        costs,
        profit,
        margin,
      }
    })
  }, [data])

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={profitabilityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Ingresos" />
          <Line type="monotone" dataKey="costs" stroke="hsl(var(--destructive))" name="Costos" />
          <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-3))" name="Ganancia" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
