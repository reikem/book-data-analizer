import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Columns, ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useDataStore } from "@/lib/store"

import type { ProcessedDataRow } from "@/lib/types/type"
import { useToast } from "@/hook/useToast"


type SortDirection = "asc" | "desc" | null

interface TableQueryResult {
  data: ProcessedDataRow[]
  totalCount: number
}

export function DataTable() {
  const { data, selectedCompanies } = useDataStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()

  // Use TanStack Query for data processing
  const {
    data: processedData,
    isLoading,
    error,
  } = useQuery<TableQueryResult>({
    queryKey: ["tableData", data, selectedCompanies, searchTerm, sortColumn, sortDirection],
    queryFn: async (): Promise<TableQueryResult> => {
      // Simulate async processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      let filtered = [...data]

      // Filter by selected companies
      if (selectedCompanies.length > 0) {
        filtered = filtered.filter((row) => {
          const companyDisplay = `${row.SociedadNombre} - ${row.SociedadCodigo}`
          return (
            selectedCompanies.includes(companyDisplay) ||
            selectedCompanies.includes(row.SociedadCodigo) ||
            selectedCompanies.includes(row.SociedadNombre)
          )
        })
      }

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter((row) =>
          Object.values(row).some((value) => value?.toString().toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }

      // Sort data
      if (sortColumn && sortDirection) {
        filtered = [...filtered].sort((a, b) => {
          const aVal = a[sortColumn]
          const bVal = b[sortColumn]

          // Handle numeric values
          if (typeof aVal === "number" && typeof bVal === "number") {
            return sortDirection === "asc" ? aVal - bVal : bVal - aVal
          }

          // Handle string values
          const aStr = aVal?.toString() || ""
          const bStr = bVal?.toString() || ""

          if (sortDirection === "asc") {
            return aStr.localeCompare(bStr)
          } else {
            return bStr.localeCompare(aStr)
          }
        })
      }

      return {
        data: filtered,
        totalCount: filtered.length,
      }
    },
    enabled: data.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const filteredData = processedData?.data || []
  const totalCount = processedData?.totalCount || 0

  const columns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter((key) => !hiddenColumns.has(key) && !key.startsWith("_"))
  }, [data, hiddenColumns])

  const allColumns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter((key) => !key.startsWith("_"))
  }, [data])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const toggleColumn = (column: string) => {
    const newHiddenColumns = new Set(hiddenColumns)
    if (newHiddenColumns.has(column)) {
      newHiddenColumns.delete(column)
    } else {
      newHiddenColumns.add(column)
    }
    setHiddenColumns(newHiddenColumns)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-primary" />
    }
    return <ArrowDown className="h-4 w-4 text-primary" />
  }

  const exportTableData = () => {
    const headers = columns.join(",")
    const csvContent = [
      headers,
      ...filteredData.map((row) =>
        columns
          .map((col) => {
            const value = row[col]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `datos_filtrados_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    toast({
      title: "Datos exportados",
      description: `Se han exportado ${filteredData.length} registros correctamente`,
    })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Procesando datos...</h3>
        <p className="text-gray-500 dark:text-gray-500">Por favor espera mientras procesamos la información</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
          <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Error al procesar datos</h3>
        <p className="text-gray-500 dark:text-gray-500">Hubo un problema al procesar los datos</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
          <Table className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No hay datos para mostrar</h3>
        <p className="text-gray-500 dark:text-gray-500">Carga archivos CSV para comenzar a visualizar los datos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6" id="table-section">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Tabla de Datos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Visualiza y filtra tus datos de manera interactiva</p>
        </div>
        {selectedCompanies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.slice(0, 2).map((company) => (
              <Badge key={company} variant="outline" className="bg-white/50 dark:bg-slate-800/50 text-xs">
                {company.length > 20 ? `${company.slice(0, 20)}...` : company}
              </Badge>
            ))}
            {selectedCompanies.length > 2 && (
              <Badge variant="outline" className="bg-white/50 dark:bg-slate-800/50 text-xs">
                +{selectedCompanies.length - 2} más
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en los datos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Items per page */}
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-32 bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 filas</SelectItem>
                  <SelectItem value="50">50 filas</SelectItem>
                  <SelectItem value="100">100 filas</SelectItem>
                  <SelectItem value="200">200 filas</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Columnas ({columns.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
                  {allColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column}
                      checked={!hiddenColumns.has(column)}
                      onCheckedChange={() => toggleColumn(column)}
                    >
                      {column}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                onClick={exportTableData}
                className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b-2 border-slate-200 dark:border-slate-600">
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className="whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {getSortIcon(column)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
                  >
                    {columns.map((column) => (
                      <TableCell key={column} className="whitespace-nowrap py-3 text-slate-600 dark:text-slate-400">
                        {row[column]?.toString() || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-gray-200/50 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} a{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount.toLocaleString()} registros
              {selectedCompanies.length > 0 && (
                <span className="ml-2">(filtrado de {data.length.toLocaleString()} total)</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <span className="text-sm px-3 py-1 bg-white/50 dark:bg-slate-800/50 rounded border text-gray-900 dark:text-gray-100">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-white/50 dark:bg-slate-800/50 text-gray-900 dark:text-gray-100"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}