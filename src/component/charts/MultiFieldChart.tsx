import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface MultiFieldChartProps {
  data: any[]
  xKey: string
  title: string
  type: "line" | "bar"
  availableFields: string[]
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
]

export function MultiFieldChart({ data, xKey, title, type, availableFields }: MultiFieldChartProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [fieldToAdd, setFieldToAdd] = useState<string>("")

  const addField = () => {
    if (fieldToAdd && !selectedFields.includes(fieldToAdd)) {
      setSelectedFields([...selectedFields, fieldToAdd])
      setFieldToAdd("")
    }
  }

  const removeField = (field: string) => {
    setSelectedFields(selectedFields.filter((f) => f !== field))
  }

  const processedData = data.map((row) => {
    const processedRow = { [xKey]: row[xKey] }
    selectedFields.forEach((field) => {
      const value = row[field]
      if (typeof value === "string") {
        const numValue = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
        processedRow[field] = isNaN(numValue) ? 0 : numValue
      } else {
        processedRow[field] = Number.parseFloat(value) || 0
      }
    })
    return processedRow
  })

  const availableToAdd = availableFields.filter((field) => !selectedFields.includes(field))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="space-y-3">
          {/* Field Selection */}
          <div className="flex items-center space-x-2">
            <Select value={fieldToAdd} onValueChange={setFieldToAdd}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Agregar campo..." />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addField} disabled={!fieldToAdd} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Fields */}
          {selectedFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFields.map((field, index) => (
                <Badge key={field} variant="outline" className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  {field}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeField(field)} />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {selectedFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona al menos un campo para visualizar el gráfico
          </div>
        ) : (
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              {type === "line" ? (
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xKey} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [Number(value).toLocaleString(), name]} />
                  <Legend />
                  {selectedFields.map((field, index) => (
                    <Line
                      key={field}
                      type="monotone"
                      dataKey={field}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xKey} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [Number(value).toLocaleString(), name]} />
                  <Legend />
                  {selectedFields.map((field, index) => (
                    <Bar key={field} dataKey={field} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
