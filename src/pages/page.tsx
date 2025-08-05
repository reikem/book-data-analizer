import { useState } from "react"
import { useDataStore } from "@/lib/store"
import { Dashboard } from "@/component/Dashboard"
import { DataUploader } from "@/component/DataUploader"
import { DataTable } from "@/component/DateTable"
import { ChartGenerator } from "@/component/charts/AreaaChart"
import { ExampleFiles } from "@/component/ExampleFile"
import { HelpGuide } from "@/component/HelpGuide"
import { ReportGenerator } from "@/component/reportGenerator"
import { useOnDataLoaded } from "@/hook/useOnDataLoaded"
import { Sidebar } from "@/component/SideBar"
import { ChatInterface } from "@/component/ChatInterface"

export default function Home() {
  const [activeSection, setActiveSection] = useState("examples")
  const { data } = useDataStore()

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
        return <Dashboard />
      case "table":
        return <DataTable />
      case "charts":
        return <ChartGenerator />
      case "reports":
        return <ReportGenerator />
      case "chat":
        return <ChatInterface />
      case "help":
        return <HelpGuide />
      default:
        return <ExampleFiles />
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="container mx-auto p-4 lg:p-6 pt-16 lg:pt-6">{renderContent()}</div>
      </main>
    </div>
  )
}
