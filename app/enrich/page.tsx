"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/appheader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Footer from "@/components/footer"
export default function EnrichPage() {

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
        <AppHeader />
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 pt-24">
          <Card className="w-full max-w-4xl border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">New Input Form</h2>
                <p className="text-gray-500">A new input form will be created here soon.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
} 