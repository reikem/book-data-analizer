import { useMemo } from "react"

type Row = {
  SociedadNombre?: string
  MontoEstandarizado?: number
  [key: string]: any
}

interface HeatMapChartProps {
  data: Row[]
  /** columnas del grid (por defecto 10) */
  columns?: number
}

export function HeatMapChart({ data, columns = 10 }: HeatMapChartProps) {
  // Limitar por performance (puedes aumentar si lo necesitas)
  const limited = data.slice(0, 100)

  const cellW = 64
  const cellH = 48
  const gap = 2

  const rowsCount = Math.max(1, Math.ceil(limited.length / columns))
  const svgW = columns * (cellW + gap) - gap
  const svgH = rowsCount * (cellH + gap) - gap

  const formatCurrency = (n = 0) => {
    const v = Math.abs(n)
    if (v >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${Math.round(n).toLocaleString()}`
  }

  const heatmapData = useMemo(() => {
    return limited.map((row, index) => {
      const value = Number(row.MontoEstandarizado ?? 0)
      const name = String(row.SociedadNombre ?? "—")
      const x = (index % columns) * (cellW + gap)
      const y = Math.floor(index / columns) * (cellH + gap)
      return { x, y, value, name }
    })
  }, [limited, columns])

  const { minValue, maxValue } = useMemo(() => {
    if (heatmapData.length === 0) return { minValue: 0, maxValue: 1 }
    const vals = heatmapData.map((d) => d.value)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    return { minValue: min, maxValue: max === min ? min + 1 : max } // evita división por 0
  }, [heatmapData])

  const getFill = (value: number) => {
    // Intensidad normalizada [0..1]
    const t = (value - minValue) / (maxValue - minValue)
    // Alpha mínimo para que nunca quede invisible
    const alpha = 0.15 + 0.85 * Math.max(0, Math.min(1, t))
    return `hsl(var(--primary) / ${alpha})`
  }

  const getTextColor = (value: number) => {
    // Contraste simple según intensidad
    const t = (value - minValue) / (maxValue - minValue)
    return t > 0.55 ? "white" : "hsl(var(--foreground))"
  }

  return (
    <div className="w-full overflow-auto">
      <svg
        width={svgW}
        height={svgH}
        className="border rounded"
        style={{ borderColor: "hsl(var(--border))" }}
        role="img"
        aria-label="Mapa de calor"
      >
        {heatmapData.map((cell, i) => {
          const cx = cell.x
          const cy = cell.y
          const fill = getFill(cell.value)
          const textFill = getTextColor(cell.value)

          // Texto: primera línea = monto (centrado), segunda línea = sociedad (truncada)
          const nameMaxChars = 12
          const nameShort =
            cell.name.length > nameMaxChars ? cell.name.slice(0, nameMaxChars - 1) + "…" : cell.name

          return (
            <g key={i}>
              <title>{`${cell.name} • ${formatCurrency(cell.value)}`}</title>
              <rect
                x={cx}
                y={cy}
                width={cellW}
                height={cellH}
                rx="6"
                fill={fill}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {/* Monto */}
              <text
                x={cx + cellW / 2}
                y={cy + cellH / 2 - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight={600}
                style={{ fill: textFill, pointerEvents: "none" }}
              >
                {formatCurrency(cell.value)}
              </text>
              {/* Sociedad */}
              <text
                x={cx + cellW / 2}
                y={cy + cellH / 2 + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                style={{ fill: textFill, opacity: 0.9, pointerEvents: "none" }}
              >
                {nameShort}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
