import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/lib/store"

export function CompanyMultiSelector() {
  const [open, setOpen] = useState(false)
  const { companies, selectedCompanies, setSelectedCompanies } = useDataStore()

  const toggleCompany = (company: string) => {
    if (selectedCompanies.includes(company)) {
      setSelectedCompanies(selectedCompanies.filter((c) => c !== company))
    } else {
      setSelectedCompanies([...selectedCompanies, company])
    }
  }

  const removeCompany = (company: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c !== company))
  }

  const selectAll = () => setSelectedCompanies(companies)
  const clearAll = () => setSelectedCompanies([])

  if (companies.length === 0) return null

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Sociedades</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] p-2 bg-transparent"
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedCompanies.length === 0 ? (
                <span className="text-muted-foreground">Seleccionar sociedades...</span>
              ) : selectedCompanies.length <= 2 ? (
                selectedCompanies.map((company) => (
                  <Badge key={company} variant="secondary" className="text-xs max-w-[200px] truncate">
                    {company}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCompany(company)
                      }}
                    />
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {selectedCompanies.length} sociedades seleccionadas
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar sociedad..." />
            <CommandList>
              <CommandEmpty>No se encontraron sociedades.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={selectAll} className="cursor-pointer">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCompanies.length === companies.length ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Seleccionar todas ({companies.length})
                </CommandItem>
                <CommandItem onSelect={clearAll} className="cursor-pointer">
                  <X className="mr-2 h-4 w-4" />
                  Limpiar selección
                </CommandItem>
                <div className="border-t my-1" />
                {companies.map((company) => (
                  <CommandItem key={company} onSelect={() => toggleCompany(company)} className="cursor-pointer">
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedCompanies.includes(company) ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{company}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCompanies.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedCompanies.length} de {companies.length} sociedades seleccionadas
        </div>
      )}
    </div>
  )
}
