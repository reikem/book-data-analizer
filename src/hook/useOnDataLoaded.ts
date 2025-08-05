import { useEffect } from "react"
import { useDataStore } from "@/lib/store"
import type { ProcessedDataRow } from "@/lib/types/type"

type Options = { once?: boolean; minRows?: number }

export function useOnDataLoaded(
  cb: (data: ProcessedDataRow[]) => void,
  { once = true, minRows = 1 }: Options = {},
) {
  useEffect(() => {
    let called = false

    // disparo inmediato si ya está cargado
    const initial = useDataStore.getState().data
    if (initial.length >= minRows) {
      cb(initial)
      called = true
      if (once) return
    }

    const unsubscribe = useDataStore.subscribe((state, prevState) => {
      const wasLoaded = prevState.data.length >= minRows
      const isLoaded = state.data.length >= minRows
      if (!wasLoaded && isLoaded) {
        if (!once || !called) {
          cb(state.data)
          called = true
        }
      }
    })

    return () => unsubscribe()
  }, [cb, once, minRows])
}
