// src/component/DataUploader.tsx
import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X, Link, CheckCircle } from "lucide-react"
import { useDataStore } from "@/lib/store"
import type { FileData, SociedadMapping } from "@/lib/types/type"
import { buildCompanyDisplayList, unifyFiles } from "@/lib/unitify"


export function DataUploader() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [success, setSuccess] = useState(false)

  const { setData, setCompanies, setSociedadMappings } = useDataStore()

  const parseCsvFile = (file: File): Promise<FileData> =>
    new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve({ name: file.name, data: res.data as Record<string, unknown>[] }),
        error: (err) => reject(err),
      })
    })

  const extractSociedadMappings = (mappingFile?: FileData): SociedadMapping[] => {
    if (!mappingFile) return []
    return (mappingFile.data as any[]).map((r) => ({
      codigo: String(
        r["codigo"] ??
          r["Codigo"] ??
          r["SOCIEDAD"] ??
          r["Sociedad"] ??
          r["SociedadCodigo"] ??
          "",
      ).trim(),
      sociedad: String(
        r["sociedad"] ??
          r["SociedadNombre"] ??
          r["Nombre"] ??
          "",
      ).trim(),
    }))
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null)
      setSuccess(false)
      setUploading(true)
      setProgress(0)

      try {
        if (acceptedFiles.length === 0) {
          throw new Error("Selecciona al menos un archivo .csv")
        }

        // 1) Parsear CSVs
        const parsed: FileData[] = []
        for (let i = 0; i < acceptedFiles.length; i++) {
          const f = acceptedFiles[i]
          const fileData = await parseCsvFile(f)
          if (!fileData.data || fileData.data.length === 0) {
            throw new Error(`El archivo ${f.name} no contiene datos`)
          }
          parsed.push(fileData)
          setProgress(Math.round(((i + 1) / acceptedFiles.length) * 40)) // hasta 40% al parsear
        }

        // 2) Separar archivo de sociedades (opcional) + datos
        setProgress(50)
        const mappingFile = parsed.find((p) => p.name.toLowerCase().includes("sociedad"))
        const dataFiles = parsed.filter((p) => p !== mappingFile)

        // 3) Mapeo de sociedades
        const sociedadMappings = extractSociedadMappings(mappingFile)
        setProgress(60)

        // 4) Unificar + deduplicar (SELECT DISTINCT lógico)
        const unified = unifyFiles(dataFiles, sociedadMappings)
        if (unified.length === 0) {
          throw new Error("No se pudieron unificar datos válidos")
        }
        setProgress(80)

        // 5) Poblar store: data + companies “Nombre - Código” + mappings
        const companies = buildCompanyDisplayList(unified)

        setData(unified)                 // REEMPLAZA la data -> evita duplicados entre cargas
        setCompanies(companies)          // para el multiselector
        setSociedadMappings(sociedadMappings)

        setUploadedFiles(acceptedFiles)
        setProgress(100)
        setSuccess(true)

        // Info util en consola
        console.log("Unificación completada:", {
          totalRows: unified.length,
          companiesCount: companies.length,
          files: parsed.map((p) => p.name),
        })
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "Error al procesar los archivos CSV")
      } finally {
        setUploading(false)
      }
    },
    [setData, setCompanies, setSociedadMappings],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    multiple: true,
  })

  const removeFile = (index: number) => {
    const next = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(next)
    if (next.length === 0) {
      // Limpia store si quitas todo
      setData([])
      setCompanies([])
      setSociedadMappings([])
      setSuccess(false)
    }
  }

  return (
    <div className="space-y-6" id="upload-section">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Cargar Datos
        </h1>
        <p className="text-gray-700 dark:text-gray-300">Sube tus archivos CSV para comenzar el análisis</p>
      </div>

      {/* Área de drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg">Suelta los archivos aquí…</p>
        ) : (
          <>
            <p className="text-lg mb-2">Arrastra archivos CSV aquí o haz clic para seleccionar</p>
            <p className="text-sm text-muted-foreground">Puedes subir múltiples archivos. Se unificarán y deduplicarán automáticamente.</p>
          </>
        )}
      </div>

      {/* Progreso */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Procesando y unificando archivos…</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Éxito */}
      {success && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            ¡Datos cargados exitosamente! Ya puedes usar el dashboard y las visualizaciones.
          </AlertDescription>
        </Alert>
      )}

      {/* Archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Link className="h-4 w-4" />
            Archivos cargados y unificados:
          </h4>

          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
            ✓ Datos unificados sin duplicados (con fuentes relacionadas)
          </div>
        </div>
      )}
    </div>
  )
}
