import {
    ComposedChart as RechartsComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts"
  
  interface ComposedChartProps {
    data: any[]
    xKey: string
    yKey: string
    title: string
  }
  
  export function ComposedChart({ data, xKey, yKey }: ComposedChartProps) {
    return (
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="hsl(var(--primary))" fillOpacity={0.6} />
            <Line type="monotone" dataKey={yKey} stroke="hsl(var(--destructive))" strokeWidth={2} />
          </RechartsComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }
  