import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"

interface TourStep {
    target: string
    title: string
    content: string
    position: "top" | "bottom" | "left" | "right"
}

const tourSteps: TourStep[] = [
    {
        target: "#upload-section",
        title: "Cargar Datos",
        content: "Comienza subiendo tus archivos CSV aquí. Puedes arrastrar y soltar múltiples archivos.",
        position: "bottom",
    },
    {
        target: "#table-section",
        title: "Tabla de Datos",
        content: "Visualiza tus datos en una tabla responsiva. Puedes filtrar, buscar y ocultar columnas.",
        position: "top",
    },
    {
        target: "#charts-section",
        title: "Generar Gráficos",
        content: "Crea diferentes tipos de visualizaciones de tus datos.",
        position: "top",
    },
    {
        target: "#export-section",
        title: "Exportar Datos",
        content: "Exporta tus datos en múltiples formatos: CSV, SQL, PowerBI.",
        position: "top",
    },
    {
        target: "#reports-section",
        title: "Generar Informes",
        content: "Crea informes PDF y presentaciones PPT con tus gráficos.",
        position: "top",
    },
    {
        target: "#chat-section",
        title: "Asistente IA",
        content: "Haz hasta 3 preguntas sobre tus datos usando inteligencia artificial.",
        position: "top",
    },
]

export function TourGuide() {
    const [isActive, setIsActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tourPosition, setTourPosition] = useState({ top: 0, left: 0 })

    const startTour = () => {
        setIsActive(true)
        setCurrentStep(0)
        scrollToStep(0)
    }

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            const next = currentStep + 1
            setCurrentStep(next)
            scrollToStep(next)
        } else {
            endTour()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            const prev = currentStep - 1
            setCurrentStep(prev)
            scrollToStep(prev)
        }
    }

    const endTour = () => {
        setIsActive(false)
        setCurrentStep(0)
    }

    const scrollToStep = (stepIndex: number) => {
        const step = tourSteps[stepIndex]
        const element = document.querySelector(step.target)
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" })

            // Calculate position for tour card
            const rect = element.getBoundingClientRect()
            let top = rect.top
            let left = rect.left

            switch (step.position) {
                case "bottom":
                    top = rect.bottom + 10
                    left = rect.left + rect.width / 2 - 200
                    break
                case "top":
                    top = rect.top - 200
                    left = rect.left + rect.width / 2 - 200
                    break
                case "left":
                    top = rect.top + rect.height / 2 - 100
                    left = rect.left - 420
                    break
                case "right":
                    top = rect.top + rect.height / 2 - 100
                    left = rect.right + 10
                    break
            }

            setTourPosition({ top, left })
        }
    }

    useEffect(() => {
        if (isActive) {
            scrollToStep(currentStep)
        }
    }, [isActive, currentStep])

    return (
        <>
            <Button variant="outline" onClick={startTour}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Tour Guiado
            </Button>

            {isActive && (
                <>

                    <div className="fixed inset-0 bg-black/50 z-40" />


                    <Card
                        className="fixed z-50 w-96 shadow-lg"
                        style={{
                            top: `${tourPosition.top}px`,
                            left: `${tourPosition.left}px`,
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">{tourSteps[currentStep].title}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={endTour}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{tourSteps[currentStep].content}</p>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {currentStep + 1} de {tourSteps.length}
                                </span>

                                <div className="flex space-x-2">
                                    {currentStep > 0 && (
                                        <Button variant="outline" size="sm" onClick={prevStep}>
                                            Anterior
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={nextStep}>
                                        {currentStep === tourSteps.length - 1 ? "Finalizar" : "Siguiente"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </>
    )
}
