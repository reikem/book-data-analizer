import type { ProcessedDataRow, SociedadMapping } from "./types/type"

export function parseCSV(csvText: string, filename: string): ProcessedDataRow[] {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const data: ProcessedDataRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
    if (values.length !== headers.length) continue

    const row: ProcessedDataRow = {
      _source: filename,
      SociedadCodigo: "",
      SociedadNombre: "",
      MontoEstandarizado: 0,
    }

    headers.forEach((header, index) => {
      const value = values[index]

      // Try to parse as number
      const numValue = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
      if (!isNaN(numValue) && value.match(/[\d.-]/)) {
        row[header] = numValue
      } else {
        row[header] = value
      }

      // Map common company fields
      if (header.toLowerCase().includes("sociedad") || header.toLowerCase().includes("empresa")) {
        row.SociedadNombre = value
      }
      if (header.toLowerCase().includes("codigo") || header.toLowerCase().includes("cod") || header === "Soc.") {
        row.SociedadCodigo = value
      }
      if (header.toLowerCase().includes("monto") || header.toLowerCase().includes("importe")) {
        row.MontoEstandarizado = numValue || 0
      }
    })

    // Ensure required fields have values
    if (!row.SociedadNombre && row.SociedadCodigo) {
      row.SociedadNombre = row.SociedadCodigo
    }
    if (!row.SociedadCodigo && row.SociedadNombre) {
      row.SociedadCodigo = row.SociedadNombre
    }

    data.push(row)
  }

  return data
}

export function processAndUnifyData(filesData: { name: string; data: any[] }[]): {
  unifiedData: ProcessedDataRow[]
  sociedadMappings: SociedadMapping[]
} {
  const unifiedData: ProcessedDataRow[] = []
  const sociedadMappings: SociedadMapping[] = []

  filesData.forEach((fileData) => {
    // Convert each row to ProcessedDataRow format
    fileData.data.forEach((row) => {
      const processedRow: ProcessedDataRow = {
        _source: fileData.name,
        SociedadCodigo: "",
        SociedadNombre: "",
        MontoEstandarizado: 0,
        ...row, // Spread all original properties
      }

      // Map common fields
      Object.keys(row).forEach((key) => {
        const value = row[key]
        const lowerKey = key.toLowerCase()

        if (lowerKey.includes("sociedad") || lowerKey.includes("empresa")) {
          processedRow.SociedadNombre = value
        }
        if (lowerKey.includes("codigo") || lowerKey.includes("cod") || key === "Soc.") {
          processedRow.SociedadCodigo = value
        }
        if (lowerKey.includes("monto") || lowerKey.includes("importe")) {
          const numValue = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""))
          processedRow.MontoEstandarizado = isNaN(numValue) ? 0 : numValue
        }
      })

      // Ensure required fields have values
      if (!processedRow.SociedadNombre && processedRow.SociedadCodigo) {
        processedRow.SociedadNombre = processedRow.SociedadCodigo
      }
      if (!processedRow.SociedadCodigo && processedRow.SociedadNombre) {
        processedRow.SociedadCodigo = processedRow.SociedadNombre
      }

      unifiedData.push(processedRow)
    })
  })

  // Extract sociedad mappings
  const mappingsMap = new Map<string, string>()
  unifiedData.forEach((row) => {
    if (row.SociedadCodigo && row.SociedadNombre && row.SociedadCodigo !== row.SociedadNombre) {
      mappingsMap.set(row.SociedadCodigo, row.SociedadNombre)
    }
  })

  mappingsMap.forEach((sociedad, codigo) => {
    sociedadMappings.push({ codigo, sociedad })
  })

  return { unifiedData, sociedadMappings }
}

export function createRelationalData(data: ProcessedDataRow[]): ProcessedDataRow[] {
  return data.map((row) => ({
    ...row,
    RelatedRecords: data.filter((r) => r.SociedadCodigo === row.SociedadCodigo).length,
    RelatedSources: [
      ...new Set(data.filter((r) => r.SociedadCodigo === row.SociedadCodigo).map((r) => r._source)),
    ].join(", "),
  }))
}
