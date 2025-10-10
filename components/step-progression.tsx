"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, BadgeCheck, UserRoundSearch, BriefcaseMedical, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    id: 1,
    title: "Dispatched",
    icon: BadgeCheck,
    duration: 5000, // 5 seconds
  },
  {
    id: 2,
    title: "Searching practice site",
    icon: UserRoundSearch,
    duration: 10000, // 10 seconds
  },
  {
    id: 3,
    title: "Looking into staff",
    icon: BriefcaseMedical,
    duration: 112500, // 112.5 seconds
  },
  {
    id: 4,
    title: "Waiting for n8n",
    icon: Workflow,
    duration: 112500, // 112.5 seconds
  },
]

interface StepProgressionProps {
  isComplete?: boolean
}

export function StepProgression({ isComplete = false }: StepProgressionProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // If job is complete, jump to last step
    if (isComplete) {
      setCurrentStep(steps.length - 1)
      return
    }

    // Don't progress if we're at the last step
    if (currentStep >= steps.length - 1) {
      return
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }, steps[currentStep].duration)

    return () => clearTimeout(timer)
  }, [currentStep, isComplete])

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-12 left-0 right-0 h-1 bg-gray-300" />

        <div
          className="absolute top-12 left-0 h-1 bg-pink-500 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div key={step.id} className="flex flex-col items-center gap-4">
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all duration-500",
                    isActive && "border-pink-500 bg-pink-500 shadow-lg scale-110",
                    isCompleted && "border-pink-500 bg-pink-500",
                    !isActive && !isCompleted && "border-muted bg-background",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-10 h-10 transition-all duration-500",
                      (isActive || isCompleted) && "text-white",
                      !isActive && !isCompleted && "text-muted-foreground",
                    )}
                  />

                  {/* Checkmark overlay for completed steps */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-background rounded-full">
                      <CheckCircle2 className="w-6 h-6 text-pink-500" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1 text-center min-h-[60px]">
                  {isActive && (
                    <h3 className="font-medium text-base text-gray-700 transition-all duration-500">{step.title}</h3>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
