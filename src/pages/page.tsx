import { useState, useEffect } from "react"

import { useDataStore } from "@/lib/store"
import { ChartGenerator } from "@/component/charts/AreaaChart"
import { ChatInterface } from "@/component/ChatInterface"
import { CompanyMultiSelector } from "@/component/CompanyMultiSelector"
import { Dashboard } from "@/component/Dashboard"
import { DataUploader } from "@/component/DataUploader"
import { DataTable } from "@/component/DateTable"
import { ExampleFiles } from "@/component/ExampleFile"
import { HelpGuide } from "@/component/HelpGuide"
import { ReportGenerator } from "@/component/reportGenerator"
import { Sidebar } from "lucide-react"

export default function Home() {
  const [activeSection, setActiveSection] = useState("examples")
  const { data } = useDataStore()

  // Auto-switch to dashboard when data is loaded
  useEffect(() => {
    if (data.length > 0 && activeSection === "upload") {
      setActiveSection("dashboard")
    }
  }, [data.length, activeSection])

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
            <ChatInterface />
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