// src/hook/useUnifiedCsvImport.ts
import Papa from "papaparse"
import { useCallback, useState } from "react"
import type { FileData, SociedadMapping } from "@/lib/types/type"

import { useDataStore } from "@/lib/store"
import { buildCompanyDisplayList, unifyFiles } from "@/lib/unitify"

type ImportState = "idle" | "parsing" | "unifying" | "done" | "error"

export function useUnifiedCsvImport() {
  const [state, setState] = useState<ImportState>("idle")
  const [error, setError] = useState<string | null>(null)
  const setData = useDataStore((s) => s.setData)
  const setCompanies = useDataStore((s) => s.setCompanies)

  const parseFile = (file: File) =>
    new Promise<FileData>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({ name: file.name, data: results.data as Record<string, unknown>[] })
        },
        error: (err) => reject(err),
      })
    })

  const importFiles = useCallback(
    async (files: File[]) => {
      try {
        setState("parsing")
        setError(null)

        // 1) Parsear todos los CSV
        const parsed = await Promise.all(files.map(parseFile))

        // 2) Separar archivo de mapping de sociedades (por nombre)
        const mappingFile = parsed.find((f) => f.name.toLowerCase().includes("sociedad"))
        const dataFiles = parsed.filter((f) => f !== mappingFile)

        const sociedadMappings: SociedadMapping[] =
          (mappingFile?.data as any[])?.map((r) => ({
            codigo: String(r["codigo"] ?? r["Codigo"] ?? r["Sociedad"] ?? r["SociedadCodigo"] ?? "").trim(),
            sociedad: String(r["sociedad"] ?? r["SociedadNombre"] ?? r["Nombre"] ?? "").trim(),
          })) ?? []

        // 3) Unificar + deduplicar
        setState("unifying")
        const unified = unifyFiles(dataFiles, sociedadMappings)

        // 4) Poblar store (REEMPLAZA la data; no concatena → evita duplicar por reimportes)
        setData(unified)

        // 5) Multiselector de compañías
        const companies = buildCompanyDisplayList(unified)
        setCompanies(companies)

        setState("done")
        return { rows: unified, companies }
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "Error importando archivos")
        setState("error")
        throw e
      }
    },
    [setData, setCompanies],
  )

  return { importFiles, state, error }
}
