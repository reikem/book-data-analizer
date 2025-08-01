import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, TrendingUp, Building2, CreditCard } from "lucide-react"

const exampleFiles = [
  {
    name: "Provisiones - Ejemplo.csv",
    description: "Datos de provisiones contables con sociedades, montos y fechas",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
    data: `Sociedad,Libro Mayor,monto,Fecha Dcto,status,Mes,moneda
1960,2102012004,-3558.46,31/12/2024,Vigente,Febrero,USD
1020,2103011004,2450.30,28/02/2024,Vigente,Febrero,CLP
1210,2104015006,-1200.75,15/03/2024,Pendiente,Marzo,USD
1960,2102012005,5600.20,31/01/2024,Vigente,Enero,USD
1020,2103011005,-890.45,29/02/2024,Vigente,Febrero,CLP`,
  },
  {
    name: "Estado Resultados - Ejemplo.csv",
    description: "Estado de resultados con clientes e importes por sociedad",
    icon: Building2,
    color: "from-green-500 to-emerald-500",
    data: `Soc.,Libro mayor,Nombre del Cliente,Importe en ML,Comentario GL,Mes
1020,2103011004,INMOBILIARIA ULTRATERRA LIMITADA,-120.84,Compensado,Febrero
1960,2102012004,CONSTRUCTORA PACIFIC LTDA,2500.30,Facturado,Enero
1210,2104015006,SERVICIOS INTEGRALES SA,-450.60,Pendiente,Marzo
1020,2103011005,COMERCIAL ANDINA LTDA,1800.75,Pagado,Febrero
1960,2102012005,INVERSIONES DEL SUR SPA,-320.90,Compensado,Enero`,
  },
  {
    name: "Conciliación - Ejemplo.csv",
    description: "Conciliación bancaria con cuentas contables y saldos",
    icon: CreditCard,
    color: "from-purple-500 to-violet-500",
    data: `Sociedad,Cuenta Contable,BANCO,Saldo Contable
1960,1101021010,BCI Dólar USD Bco. Propia Cta Cte 11184680,1071599.34
1020,1101021011,Banco Estado CLP Cta Cte 22345678,850000.50
1210,1101021012,Santander USD Cta Cte 33456789,650000.75
1960,1101021013,BCI CLP Cta Cte 44567890,1200000.20
1020,1101021014,Banco Chile USD Cta Cte 55678901,950000.80`,
  },
  {
    name: "Sociedades - Ejemplo.csv",
    description: "Mapeo de códigos de sociedad con nombres de empresas",
    icon: FileSpreadsheet,
    color: "from-orange-500 to-red-500",
    data: `codigo,sociedad
1210,Full Pack
1020,Inversiones Norte
1960,Grupo Empresarial Sur
1500,Comercial Central
1800,Servicios Integrados`,
  },
]

export function ExampleFiles() {
  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const downloadAll = () => {
    exampleFiles.forEach((file) => {
      setTimeout(() => downloadFile(file.name, file.data), 100)
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <FileSpreadsheet className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Bienvenido a Analytics Pro
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
            Comienza descargando nuestros archivos de ejemplo
          </p>
        </div>
      </div>

      {/* Download All Button */}
      <div className="flex justify-center">
        <Button
          onClick={downloadAll}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Download className="h-5 w-5 mr-2" />
          Descargar Todos los Ejemplos
        </Button>
      </div>

      {/* Example Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exampleFiles.map((file, index) => {
          const Icon = file.icon
          return (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${file.color} flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{file.name}</CardTitle>
                    <CardDescription className="text-sm">{file.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    <div className="text-gray-600 dark:text-gray-400">
                      {file.data.split("\n").slice(0, 3).join("\n")}
                      {file.data.split("\n").length > 3 && "\n..."}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{file.data.split("\n").length - 1} registros</span>
                    <span>{file.data.split("\n")[0].split(",").length} columnas</span>
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={() => downloadFile(file.name, file.data)}
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Archivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">¿Cómo empezar?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-700 dark:text-blue-300">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
              1
            </div>
            <p>Descarga uno o varios archivos de ejemplo</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
              2
            </div>
            <p>Ve a la sección "Cargar Datos" y sube los archivos</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center font-bold">
              3
            </div>
            <p>Explora el dashboard, crea gráficos y genera informes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
