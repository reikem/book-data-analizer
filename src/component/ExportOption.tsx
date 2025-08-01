import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Database, BarChart } from "lucide-react"
import { useDataStore } from "@/lib/store"
import { exportToCSV, exportToSQL, exportToPowerBI } from "@/lib/exportUtils"

export function ExportOptions() {
  const data = useDataStore((s) => s.data)
  const selectedCompany = useDataStore((s) => s.selectedCompany)
  const [exporting, setExporting] = useState<string | null>(null)

  const filteredData = useMemo(() => {
    if (!selectedCompany) return data
    return data.filter(
      (row: any) =>
        row.Sociedad === selectedCompany ||
        row["Soc."] === selectedCompany ||
        row.codigo === selectedCompany
    )
  }, [data, selectedCompany])

  const handleExport = async (format: string) => {
    if (filteredData.length === 0) return
    setExporting(format)
    try {
      switch (format) {
        case "csv":
          exportToCSV(filteredData, `datos_${selectedCompany || "todos"}.csv`)
          break
        case "sql":
          exportToSQL(filteredData, `datos_${selectedCompany || "todos"}.sql`)
          break
        case "powerbi":
          exportToPowerBI(filteredData, `datos_${selectedCompany || "todos"}.pbix`)
          break
      }
    } catch (error) {
      console.error("Error exporting:", error)
    } finally {
      setExporting(null)
    }
  }

  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No hay datos para exportar</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <FileText className="h-5 w-5" />
              <span>Exportar CSV</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Exporta los datos en formato CSV para Excel o Google Sheets
            </p>
            <Button onClick={() => handleExport("csv")} disabled={exporting === "csv"} className="w-full">
              {exporting === "csv" ? "Exportando..." : "Descargar CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Database className="h-5 w-5" />
              <span>Exportar SQL</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Genera script SQL para importar en bases de datos</p>
            <Button onClick={() => handleExport("sql")} disabled={exporting === "sql"} className="w-full">
              {exporting === "sql" ? "Generando..." : "Generar SQL"}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <BarChart className="h-5 w-5" />
              <span>Exportar PowerBI</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Prepara los datos para importar en Microsoft Power BI</p>
            <Button onClick={() => handleExport("powerbi")} disabled={exporting === "powerbi"} className="w-full">
              {exporting === "powerbi" ? "Preparando..." : "Preparar para PowerBI"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground">
        {selectedCompany ? (
          <p>
            Exportando datos de: <strong>{selectedCompany}</strong> ({filteredData.length} registros)
          </p>
        ) : (
          <p>Exportando todos los datos ({filteredData.length} registros)</p>
        )}
      </div>
    </div>
  )
}
