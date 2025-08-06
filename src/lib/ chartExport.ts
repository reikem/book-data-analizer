
import html2canvas from "html2canvas"


function inlineComputedStyles(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let node = root as HTMLElement | null

  const copyProps = [
    "color",
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "fill",
    "stroke",
    "boxShadow",
    "textShadow",
    "backgroundImage",
  ]

  while (node) {
    const cs = getComputedStyle(node)
    copyProps.forEach((p) => {
      const v = cs.getPropertyValue(p)
      if (v) node!.style.setProperty(p, v)
    })

    // evita fondos transparentes que luego se ven "negros" al rasterizar
    if (cs.backgroundColor === "rgba(0, 0, 0, 0)") {
      node.style.backgroundColor = "#ffffff"
    }

    node = walker.nextNode() as HTMLElement | null
  }
}


export async function exportChartAsImage(elementId: string, fileName = "chart") {
  const source = document.getElementById(elementId)
  if (!source) throw new Error(`No se encontró el elemento #${elementId}`)


  const clone = source.cloneNode(true) as HTMLElement
  clone.style.width = `${source.offsetWidth}px`
  clone.style.height = `${source.offsetHeight}px`
  clone.style.background = "#fff"

  const wrapper = document.createElement("div")
  wrapper.style.position = "fixed"
  wrapper.style.left = "-10000px"
  wrapper.style.top = "0"
  wrapper.style.pointerEvents = "none"
  wrapper.style.background = "#fff"
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)


  inlineComputedStyles(clone)

  try {
    const canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: 2, // más nítido
      useCORS: true,
      logging: false,
      removeContainer: true,
      // evitar que transforms arruinen el render
      onclone: (doc) => {
        const el = doc.getElementById(elementId)
        if (el) {
          ;(el as HTMLElement).style.transform = "none"
          ;(el as HTMLElement).style.filter = "none"
        }
      },
    })

    const dataUrl = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${fileName.replace(/\s+/g, "_")}.png`
    a.click()
  } catch (err) {
    console.error("Error exporting chart:", err)
    throw err
  } finally {
    document.body.removeChild(wrapper)
  }
}
