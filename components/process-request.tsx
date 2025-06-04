import { ReactNode } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

interface ProcessRequestProps {
  progress: number
  isAnimating: boolean
  statusMessages: { icon: string; message: string }[]
  displayedStep: number
  currentStep: number
  Loader2: React.ElementType
  Clock: React.ElementType
  children?: ReactNode
}

export default function ProcessRequest({
  progress,
  isAnimating,
  statusMessages,
  displayedStep,
  currentStep,
  Loader2,
  Clock,
  children,
}: ProcessRequestProps) {
  return (
    <Card className="w-full max-w-2xl mt-8 overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4 px-8 pt-8">
        <CardTitle className="text-xl font-medium">Processing Your Request</CardTitle>
        <div className="relative h-3 mt-3">
          {children}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Estimated time: ~30 seconds
          </p>
          <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
        </div>
      </CardHeader>
      <CardContent className="px-8 py-6">
        <div className="h-24 flex items-center justify-center">
          <div
            className={`flex items-center gap-4 p-5 rounded-xl bg-gray-50/80 w-full transition-opacity duration-500 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="text-3xl">{statusMessages[displayedStep].icon}</div>
            <div className="flex-1">
              <p className="text-base font-medium text-gray-800">{statusMessages[displayedStep].message}</p>
            </div>
            {displayedStep !== statusMessages.length - 1 && (
              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-gray-50/50 py-4 px-8">
        <p className="text-sm text-gray-500 w-full text-center">
          {currentStep === statusMessages.length - 1
            ? "All leads have been processed successfully!"
            : "Please wait while we process your request..."}
        </p>
      </CardFooter>
    </Card>
  )
} 