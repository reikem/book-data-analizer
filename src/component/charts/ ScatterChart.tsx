import {
    ScatterChart as RechartsScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts"
  
  interface ScatterChartProps {
    data: any[]
    xKey: string
    yKey: string
    title: string
  }
  
  export function ScatterChart({ data, xKey, yKey }: ScatterChartProps) {
    return (
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis dataKey={yKey} />
            <Tooltip />
            <Legend />
            <Scatter dataKey={yKey} fill="hsl(var(--primary))" />
          </RechartsScatterChart>
        </ResponsiveContainer>
      </div>
    )
  }
  