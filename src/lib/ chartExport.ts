import html2canvas from "html2canvas"

export async function exportChartAsImage(chartId: string, filename: string) {
  const element = document.getElementById(chartId)
  if (!element) return

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "white",
      scale: 2,
      useCORS: true,
    })

    const link = document.createElement("a")
    link.download = `${filename}.png`
    link.href = canvas.toDataURL()
    link.click()
  } catch (error) {
    console.error("Error exporting chart:", error)
  }
}
