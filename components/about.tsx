"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Info, X} from "lucide-react"

export default function AboutSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const handleClose = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
    }, 300)
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full mb-4 p-6 bg-slate-800 text-white hover:bg-slate-700"
      >
        <Info className="h-4 w-4 mr-2" />
        About App
      </Button>

      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center overflow-y-auto transition-all duration-300 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
        >
          <div
            className={`bg-white max-w-4xl max-h-[90vh] overflow-y-auto w-full relative transition-all duration-300 ${
              isAnimating ? "scale-95 translate-y-4" : "scale-100 translate-y-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-slate-800 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold" id="about-title">
                Singapore Bird Observation Map
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-slate-700"
                onClick={handleClose}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              <section className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">About the Application</h3>
                <p className="mb-4">
                  This application is an interactive map that visualizes bird observation data in Singapore over time. It
                  uses data from the eBird API to display bird observation locations and times on the map.
                </p>

                <h4 className="font-semibold mt-6 mb-2">Main Features</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Interactive map display of bird observation data</li>
                  <li>Time-series animation showing changes in observation data</li>
                  <li>Species filtering functionality</li>
                  <li>Period selection (this year, past 3 years, specific year, custom period)</li>
                  <li>Heatmap overlay showing observation density</li>
                  <li>Responsive design for mobile devices</li>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">How to Use</h3>
                <ol className="list-decimal list-inside space-y-4 ml-4">
                  <li>
                    <span className="font-medium">Period Selection</span>: Choose a date range from the left panel.
                  </li>
                  <li>
                    <span className="font-medium">Species Selection</span>: Filter observations by species.
                  </li>
                  <li>
                    <span className="font-medium">Timeline Controls</span>: Use the slider and play button to animate through time.
                  </li>
                  <li>
                    <span className="font-medium">Heatmap Toggle</span>: Show or hide density overlays using the toggle.
                  </li>
                </ol>
              </section>

              <section className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Data Processing Logic</h3>
                <h4 className="font-semibold mb-3">Pulse Effect</h4>
                <ul className="list-disc list-inside ml-4 mb-4 text-gray-700">
                  <li>Each pulse lasts 6 seconds to simulate visibility.</li>
                  <li>The pulse size is based on the reported bird count at each location.</li>
                  <li>This visual does not imply continuous presence throughout the duration.</li>
                  <li>Pulse radius is calculated with clamped scaling:</li>
                  <pre className="bg-gray-100 text-sm p-2 mt-2 rounded border">
{`radius = clamp(min, birdCount * multiplier, max)`}
                  </pre>
                </ul>

                <h4 className="font-semibold mb-3">Heatmap Calculation</h4>
                <ul className="list-disc list-inside ml-4 mb-4 text-gray-700">
                  <li>When data is sparse, a larger date window (±3 to ±60 days) is used to enhance visibility.</li>
                  <li>Observation weight is scaled logarithmically:</li>
                  <pre className="bg-gray-100 text-sm p-2 mt-2 rounded border">
{`weight = Math.log2(1 + numberOfBirds)`}
                  </pre>
                  <li>Radius adjusts with zoom and density:</li>
                  <pre className="bg-gray-100 text-sm p-2 mt-2 rounded border">
{`radius = Math.max(12, 30 - (17 - zoomLevel) * 4)`}
                  </pre>
                </ul>
              </section>

              <section className="mb-8">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Data Limitations</h3>
                <ul className="list-disc list-inside ml-4 space-y-1 text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-md">
                  <li>Observation data is available from 2000 onward.</li>
                  <li>Rare or protected species may be excluded from public datasets.</li>
                  <li>Data accuracy depends on volunteer observations submitted to eBird.</li>
                  <li>Hotspot biases may distort true bird distributions.</li>
                </ul>
              </section>

              <section className="mt-10">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Sources</h3>
                <ul className="list-disc list-inside ml-2 space-y-1 text-gray-700 text-sm">
                  <li>
                    <a
                      href="https://gist.github.com/cheeaun/78bb5c3bd27759a14b3cf8e6b6568080"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Singapore land boundary GEOJSON by @cheeaun
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.birds.cornell.edu/clementschecklist/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Clements et al. (2024). The eBird/Clements checklist of Birds of the World: v2024. Cornell Lab of Ornithology
                    </a>
                  </li>
                </ul>
              </section>

              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                © 2025 Singapore Bird Observation Map |{' '}
                <a
                  href="https://github.com/fairy-pitta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Developer Info
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
