"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetchSpeciesInSingapore } from "@/lib/api"

interface SpeciesSelectorProps {
  onSelect: (speciesCode: string | null) => void
}

interface Species {
  code: string
  comName: string
  sciName: string
}

export default function SpeciesSelector({ onSelect }: SpeciesSelectorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    fetchSpeciesInSingapore()
      .then((data) => {
        if (isMounted) {
          setSpeciesList(data)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error("Failed to fetch species list:", error)
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredSpecies = useMemo(() => {
    if (!searchQuery) return speciesList
    const query = searchQuery.toLowerCase()
    return speciesList.filter(
      (species) =>
        species.comName.toLowerCase().includes(query) ||
        species.sciName.toLowerCase().includes(query) ||
        species.code.toLowerCase().includes(query),
    )
  }, [speciesList, searchQuery])

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleSelect = useCallback(
    (code: string) => {
      setValue(code)
      onSelect(code === "all" ? null : code)
      setOpen(false)
    },
    [onSelect],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {value
            ? speciesList.find((species) => species.code === value)?.comName
            : isLoading
              ? "Loading..."
              : "Select a species"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-h-[80vh] overflow-y-auto touch-auto overscroll-contain p-0 z-[2000]" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search species..." onValueChange={handleSearch} />
          <CommandList className="max-h-60 overflow-y-auto touch-auto">
            <CommandEmpty>No species found</CommandEmpty>
            <CommandGroup>
              <CommandItem
                key="all"
                value="all"
                onSelect={() => handleSelect("all")}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                All Species
              </CommandItem>
              {filteredSpecies.map((species) => (
                <CommandItem
                  key={species.code}
                  value={species.code}
                  onSelect={() => handleSelect(species.code)}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === species.code ? "opacity-100" : "opacity-0")}
                  />
                  {species.comName}{" "}
                  <span className="text-gray-500 text-xs ml-1">
                    ({species.sciName})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}