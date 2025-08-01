import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDataStore } from "@/lib/store"

export function CompanySelector() {
  const { companies, selectedCompany, setSelectedCompany } = useDataStore()

  if (companies.length === 0) {
    return null
  }

  return (
    <Select value={selectedCompany || "all"} onValueChange={setSelectedCompany}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Seleccionar sociedad" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las sociedades</SelectItem>
        {companies.map((company) => (
          <SelectItem key={company} value={company}>
            {company}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
