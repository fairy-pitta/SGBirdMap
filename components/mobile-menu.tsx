"use client"

import type React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface MobileMenuProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MobileMenu({ children, open, onOpenChange }: MobileMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85%] sm:w-[385px] pt-16 z-[1001]">
        <div className="h-full overflow-y-auto pb-20">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
