"use client"

import { useState, useEffect } from "react"
import { Stethoscope, ClipboardPlus, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

const icons = [
  { Icon: Stethoscope, name: "stethoscope" },
  { Icon: ClipboardPlus, name: "clipboard-plus" },
  { Icon: Building2, name: "building-2" },
]

interface JobLoaderProps {
  className?: string
}

export function JobLoader({ className }: JobLoaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % icons.length)
    }, 1000) // 1000ms per icon, 3 icons total = 3 seconds to complete cycle

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-8 h-8">
        {icons.map(({ Icon, name }, index) => (
          <Icon
            key={name}
            size={32}
            className={cn(
              "absolute top-0 left-0 text-pink-500 transition-all duration-500 ease-in-out",
              index === currentIndex ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 rotate-12",
            )}
          />
        ))}
      </div>
    </div>
  )
}
