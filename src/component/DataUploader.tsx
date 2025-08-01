import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X, Link, CheckCircle } from "lucide-react"
import { useDataStore } from "@/lib/store"
import { parseCSV, processAndUnifyData, createRelationalData } from "@/lib/dataProcessor"


export function DataUploader() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [success, setSuccess] = useState(false)
  const { setData, setCompanies, setSociedadMappings } = useDataStore()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null)
      setSuccess(false)
      setUploading(true)
      setProgress(0)

      try {
        const filesData: { name: string; data: any[] }[] = []

        // Process each file
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i]
          setProgress((i / acceptedFiles.length) * 40) // First 40% for file processing

          const text = await file.text()
          const parsedData = parseCSV(text, file.name)

          if (parsedData.length === 0) {
            throw new Error(`El archivo ${file.name} no contiene datos válidos`)
          }

          filesData.push({
            name: file.name,
            data: parsedData,
          })
        }

        setProgress(50)

        // Unify and process data with relationships
        const { unifiedData, sociedadMappings } = processAndUnifyData(filesData)
        setProgress(70)

        if (unifiedData.length === 0) {
          throw new Error("No se pudieron procesar los datos de los archivos")
        }

        // Create relational data
        const relationalData = createRelationalData(unifiedData)
        setProgress(85)

        // Extract company information with names and codes
        const companiesSet = new Set<string>()
        relationalData.forEach((row) => {
          if (row.SociedadCodigo && row.SociedadNombre) {
            companiesSet.add(`${row.SociedadNombre} - ${row.SociedadCodigo}`)
          } else if (row.SociedadCodigo) {
            companiesSet.add(row.SociedadCodigo)
          } else if (row.SociedadNombre) {
            companiesSet.add(row.SociedadNombre)
          }
        })


        setData(relationalData)
        setCompanies(Array.from(companiesSet))
        setSociedadMappings(sociedadMappings)
        setUploadedFiles(acceptedFiles)
        setProgress(100)
        setSuccess(true)

        console.log("Datos procesados:", {
          totalRecords: relationalData.length,
          companies: Array.from(companiesSet),
          mappings: sociedadMappings,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al procesar los archivos CSV"
        setError(errorMessage)
        console.error("Error processing files:", err)
      } finally {
        setUploading(false)
      }
    },
    [setData, setCompanies, setSociedadMappings],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    multiple: true,
  })

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    if (newFiles.length === 0) {
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
        <p className="text-gray-600 dark:text-gray-400">Sube tus archivos CSV para comenzar el análisis</p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg">Suelta los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-lg mb-2">Arrastra archivos CSV aquí o haz clic para seleccionar</p>
            <p className="text-sm text-muted-foreground">
              Soporta múltiples archivos CSV. Los datos se unificarán automáticamente.
            </p>
          </div>
        )}
      </div>

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Procesando y unificando archivos...</span>
            <span>{Math.round(progress)}%</span>
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

      {/* Success */}
      {success && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            ¡Datos cargados exitosamente! Ahora puedes explorar el dashboard y crear visualizaciones.
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
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
            ✓ Datos unificados con relaciones entre archivos establecidas
          </div>
        </div>
      )}
    </div>
  )
}
