import { useState } from "react"
import { useDataStore } from "@/lib/store"
import { CompanyMultiSelector } from "@/component/CompanyMultiSelector"
import { Dashboard } from "@/component/Dashboard"
import { DataUploader } from "@/component/DataUploader"
import { DataTable } from "@/component/DateTable"
import { ChartGenerator } from "@/component/charts/AreaaChart"
import { ExampleFiles } from "@/component/ExampleFile"
import { HelpGuide } from "@/component/HelpGuide"
import { ReportGenerator } from "@/component/reportGenerator"
import { useOnDataLoaded } from "@/hook/useOnDataLoaded"
import { Sidebar } from "@/component/SideBar"


export default function Home() {
  const [activeSection, setActiveSection] = useState("examples")
  const { data } = useDataStore()

  // ✅ Cambia automáticamente a “dashboard” cuando se cargue la data
  useOnDataLoaded(() => {
    if (activeSection === "upload" || activeSection === "examples") {
      setActiveSection("dashboard")
    }
  })

  const renderContent = () => {
    switch (activeSection) {
      case "examples":
        return <ExampleFiles />
      case "upload":
        return <DataUploader />
      case "dashboard":
        return (
          <div className="space-y-6">
            {data.length > 0 && <CompanyMultiSelector />}
            <Dashboard />
          </div>
        )
      case "table":
        return (
          <div className="space-y-6">
            {data.length > 0 && <CompanyMultiSelector />}
            <DataTable />
          </div>
        )
      case "charts":
        return (
          <div className="space-y-6">
            {data.length > 0 && <CompanyMultiSelector />}
            <ChartGenerator />
          </div>
        )
      case "reports":
        return <ReportGenerator />
      case "chat":
        return (
          <div className="space-y-6">
            {data.length > 0 && <CompanyMultiSelector />}
            {/* tu ChatInterface */}
          </div>
        )
      case "help":
        return <HelpGuide />
      default:
        return <ExampleFiles />
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="container mx-auto p-4 lg:p-6 pt-16 lg:pt-6">{renderContent()}</div>
      </main>
    </div>
  )
}
