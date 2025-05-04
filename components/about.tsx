"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Info, Github, Twitter, ExternalLink, X } from "lucide-react"

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Basic Operations</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>
                        <span className="font-medium">Period Selection</span>: Choose observation period in the left panel
                        <div className="text-sm text-gray-600 ml-6 mt-1">
                          Select from this year, past 3 years, specific year, or custom period
                        </div>
                      </li>
                      <li>
                        <span className="font-medium">Species Selection</span>: Filter by specific bird species
                        <div className="text-sm text-gray-600 ml-6 mt-1">Select "All Species" to display all species</div>
                      </li>
                      <li>
                        <span className="font-medium">Timeline Controls</span>: Adjust time using the slider at the bottom
                        <div className="text-sm text-gray-600 ml-6 mt-1">
                          Use play button for animation, "Show All" to display all data
                        </div>
                      </li>
                      <li>
                        <span className="font-medium">Heatmap Toggle</span>: Switch heatmap layer on/off with the toggle
                        <div className="text-sm text-gray-600 ml-6 mt-1">
                          When enabled, a red gradient overlay shows areas with many observations (based on count and frequency)
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Understanding Markers</h4>
                    <div className="space-y-3 ml-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                        <span>Small red dots: Observation locations</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-red-500 opacity-60 mr-3"></div>
                        <span>Red circles: Active observations (at currently displayed time)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-red-500 opacity-60 mr-3"></div>
                        <span>Large circles: Locations with many birds observed</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-4 rounded bg-gradient-to-r from-transparent via-red-500 to-transparent mr-3"></div>
                        <span>Heatmap overlay: Density visualization based on all records</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="font-semibold mb-2 text-amber-800 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Data Limitations
                  </h4>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-amber-800">
                    <li>Observation data is most comprehensive from 2000 onwards</li>
                    <li>Data for rare or protected species may not be displayed</li>
                    <li>Data accuracy depends on observer reports</li>
                    <li>Data tends to be concentrated in popular observation spots</li>
                  </ul>
                </div>
              </section>

              <section className="mt-10">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Sources</h3>
                <ul className="list-disc list-inside ml-2 space-y-1 text-gray-700 text-sm">
                  <li>
                    <a href="https://gist.github.com/cheeaun/78bb5c3bd27759a14b3cf8e6b6568080" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Gist: Singapore Bird Map Observations by @cheeaun
                    </a>
                  </li>
                  <li>
                    <a href="https://www.birds.cornell.edu/clementschecklist/download/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
