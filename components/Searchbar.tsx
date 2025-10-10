"use client"

import { useState } from "react"
import { Search, RotateCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from "next/image"

interface SearchbarProps {
  onSearch: (query: string) => void
  hasResults?: boolean
  onStartOver?: () => void
}

export default function Searchbar({ onSearch, hasResults = false, onStartOver }: SearchbarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (hasResults && onStartOver) {
      setSearchQuery("") // Clear the input when starting over
      onStartOver()
    } else if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e)
    }
  }

  const handleIconClick = () => {
    if (hasResults && onStartOver) {
      setSearchQuery("")
      onStartOver()
    } else if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-3xl">
      <Image 
        src="/zyris-logo.webp" 
        alt="Zyris" 
        width={40} 
        height={40} 
        className="absolute left-5 top-1/2 transform -translate-y-1/2 h-10 w-auto" 
      />
      {hasResults ? (
        <RotateCw 
          onClick={handleIconClick}
          className="absolute right-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-pink-500 cursor-pointer hover:scale-110 transition-transform duration-200" 
        />
      ) : (
        <Search 
          onClick={handleIconClick}
          strokeWidth={3}
          className="absolute right-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-pink-500 cursor-pointer hover:scale-110 transition-transform duration-200" 
        />
      )}
      <Input
        type="text"
        placeholder="Paste Practice Name, and Address to Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="pl-32 pr-24 py-5 text-lg font-medium rounded-full !border-0 focus:!border-0 focus:!ring-0 focus:!outline-none shadow-lg h-16 bg-white placeholder:text-gray-200 placeholder:italic !ring-0 !ring-offset-0 flex items-center"
      />
    </form>
  )
}
