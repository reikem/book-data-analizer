export function parseCSV(csvText: string, filename: string): any[] {
    const lines = csvText.trim().split("\n")
    if (lines.length < 2) return []
  
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []
  
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        data.push(row)
      }
    }
  
    return data
  }
  