import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts"
  
  interface BarChartProps {
    data: any[]
    xKey: string
    yKey: string
    title: string
  }
  
  export function BarChart({ data, xKey, yKey }: BarChartProps) {
    return (
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="hsl(var(--primary))" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  