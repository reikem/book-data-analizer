// src/lib/unify.ts
import type { FileData, SociedadMapping, ProcessedDataRow } from "@/lib/types/type"

/** Campos que definen la “identidad” de un registro.
 *  Si 2 filas comparten estos valores se consideran el mismo registro. */
const DEDUP_FIELDS = ["SociedadCodigo", "LibroMayor", "Mes", "MontoEstandarizado"] as const

/** Convierte strings "190.440,13" o "-1.247,12" a número JS */
export function parseAmount(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number") return value
  const raw = String(value).trim()
  if (!raw) return 0
  const normalized = raw.replace(/\./g, "").replace(/,/g, ".")
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

function normalizeMonth(v: unknown): string {
  if (!v) return ""
  const s = String(v).trim()
  // Si necesitas mapear Ene->Enero, etc., hazlo aquí.
  return s
}

function pickLibroMayor(row: Record<string, any>): string {
  return (
    row["Libro Mayor"] ??
    row["Libro mayor"] ??
    row["Cuenta Contable"] ??
    row["libro_mayor"] ??
    row["cuenta_contable"] ??
    ""
  ).toString()
}

function pickSociedadCodigo(row: Record<string, any>): string {
  const v =
    row["Sociedad"] ??
    row["Soc."] ??
    row["SociedadCodigo"] ??
    row["codigo"] ??
    row["SOCIEDAD"] ??
    row["Codigo"] ??
    ""
  return v?.toString()?.trim() ?? ""
}

function pickSociedadNombre(
  row: Record<string, any>,
  codigo: string,
  sociedadMap: Record<string, string>,
): string {
  return (
    (row["SociedadNombre"] as string) ||
    (row["sociedad"] as string) ||
    sociedadMap[codigo] ||
    ""
  )
}

function pickMonto(row: Record<string, any>): number {
  const cand =
    row["MontoEstandarizado"] ??
    row["monto"] ??
    row["Importe en ML"] ??
    row["Saldo Contable"] ??
    row["importe_ml"] ??
    row["saldo_contable"]
  return parseAmount(cand)
}

function pickMes(row: Record<string, any>): string {
  return normalizeMonth(row["Mes"] ?? row["mes"] ?? "")
}

function buildDedupKey(row: ProcessedDataRow): string {
  const monto = Math.round((row.MontoEstandarizado ?? 0) * 100) / 100
  const parts = DEDUP_FIELDS.map((k) =>
    k === "MontoEstandarizado" ? String(monto) : String((row as any)[k] ?? ""),
  )
  return parts.join("|")
}

/** Unifica y deduplica varios archivos de datos en un arreglo ProcessedDataRow */
export function unifyFiles(files: FileData[], sociedadMappings: SociedadMapping[]): ProcessedDataRow[] {
  // Diccionario de código -> nombre
  const sociedadMap: Record<string, string> = {}
  for (const m of sociedadMappings) {
    const cod = (m?.codigo ?? "").toString().trim()
    if (cod) sociedadMap[cod] = (m?.sociedad ?? "").toString().trim()
  }

  const normalized: ProcessedDataRow[] = []

  for (const f of files) {
    const source = f.name
    for (const raw of f.data) {
      const SociedadCodigo = pickSociedadCodigo(raw)
      const SociedadNombre = pickSociedadNombre(raw, SociedadCodigo, sociedadMap)
      const Mes = pickMes(raw)
      const LibroMayor = pickLibroMayor(raw)
      const MontoEstandarizado = pickMonto(raw)

      const row: ProcessedDataRow = {
        _source: source,
        SociedadCodigo,
        SociedadNombre,
        LibroMayor,
        MontoEstandarizado,
        RelatedRecords: 1,
        RelatedSources: source,
      }

      if (Mes) (row as any).Mes = Mes
      normalized.push(row)
    }
  }

  // Deduplicación con consolidación de fuentes
  const byKey = new Map<string, ProcessedDataRow>()
  for (const row of normalized) {
    const key = buildDedupKey(row)
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
    } else {
      // acumular fuentes
      const srcSet = new Set(
        `${existing.RelatedSources ?? ""}`
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
      if (row._source) srcSet.add(row._source)
      existing.RelatedSources = Array.from(srcSet).join(", ")

      const prev = Number(existing.RelatedRecords ?? 1)
      existing.RelatedRecords = prev + 1

      // completar nombre de sociedad si faltaba
      if (!existing.SociedadNombre && row.SociedadNombre) {
        existing.SociedadNombre = row.SociedadNombre
      }
    }
  }

  return Array.from(byKey.values())
}

/** Genera el arreglo de compañías en formato 'Nombre - Código', sin duplicados y ordenado */
export function buildCompanyDisplayList(rows: ProcessedDataRow[]): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    const name = (r.SociedadNombre || "(Sin nombre)").toString().trim()
    const code = (r.SociedadCodigo || "").toString().trim()
    set.add(`${name} - ${code}`.trim())
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
}
