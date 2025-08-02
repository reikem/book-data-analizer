import { useDataStore } from "@/lib/store"

export function useDataStatus(minRows = 1) {
  const count = useDataStore((s) => s.data.length)
  return {
    isLoaded: count >= minRows,
    count,
  }
}