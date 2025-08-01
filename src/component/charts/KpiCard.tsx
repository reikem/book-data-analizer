import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardProps {
  data: any[]
  metric: string
}

export function KPICard({ data, metric }: KPICardProps) {
  const kpiData = useMemo(() => {
    const values = data.map((row) => Number.parseFloat(row[metric])).filter((val) => !isNaN(val))

    if (values.length === 0) return null

    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    // Calculate trend (simplified)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    const trend = secondAvg > firstAvg ? "up" : secondAvg < firstAvg ? "down" : "stable"

    return { total, average, max, min, trend, count: values.length }
  }, [data, metric])

  if (!kpiData) {
    return <div className="text-center py-8 text-muted-foreground">No hay datos numéricos disponibles para el KPI</div>
  }

  const getTrendIcon = () => {
    switch (kpiData.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.total.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.average.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Máximo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.max.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Tendencia
            {getTrendIcon()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.count}</div>
          <p className="text-xs text-muted-foreground">registros</p>
        </CardContent>
      </Card>
    </div>
  )
}
