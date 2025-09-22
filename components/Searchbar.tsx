"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export default function Searchbar() {
  return (
    <div className="relative w-full max-w-2xl">
      <Image 
        src="/zyris-logo.webp" 
        alt="Zyris" 
        width={40} 
        height={40} 
        className="absolute left-5 top-1/2 transform -translate-y-1/2 h-10 w-auto" 
      />
      <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
      <Input
        type="text"
        placeholder="Search for practices"
        className="pl-32 pr-24 py-5 text-lg font-medium rounded-full !border-0 focus:!border-0 focus:!ring-0 focus:!outline-none shadow-lg h-16 bg-white placeholder:text-gray-200 !ring-0 !ring-offset-0 flex items-center"
      />
    </div>
  )
}
