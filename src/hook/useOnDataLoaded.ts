import { useEffect } from "react"
import { useDataStore } from "@/lib/store"
import type { ProcessedDataRow } from "@/lib/types/type"

type Options = {
  /** Ejecutar solo la primera vez que pase a cargado */
  once?: boolean
  /** Mínimo de filas para considerarlo “cargado” */
  minRows?: number
}

/**
 * Ejecuta `cb` cuando la data del store pasa de “no cargada” a “cargada”.
 * Por defecto, se dispara una sola vez cuando hay ≥ 1 fila.
 */
export function useOnDataLoaded(
  cb: (data: ProcessedDataRow[]) => void,
  { once = true, minRows = 1 }: Options = {},
) {
  useEffect(() => {
    let called = false

    // Si YA está cargada al montar el componente, dispara de inmediato
    const initial = useDataStore.getState().data
    if (initial.length >= minRows) {
      cb(initial)
      called = true
      if (once) return
    }

    // Suscribirse a cambios en `data` del store (sin re-render)
    const unsubscribe = useDataStore.subscribe(
      (s) => s.data,
      (data, prev) => {
        const wasLoaded = prev.length >= minRows
        const isLoaded = data.length >= minRows

        // Transición de “no cargado” -> “cargado”
        if (!wasLoaded && isLoaded) {
          if (!once || !called) {
            cb(data)
            called = true
          }
        }
      },
    )

    return () => unsubscribe()
  }, [cb, once, minRows])
}
