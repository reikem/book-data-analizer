import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts"
  
  interface LineChartProps {
    data: any[]
    xKey: string
    yKey: string
    title: string
  }
  
  export function LineChart({ data, xKey, yKey, title }: LineChartProps) {
    return (
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    )
  }
  