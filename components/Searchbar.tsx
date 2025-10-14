"use client"

import { useState, useRef, useEffect } from "react"
import { Search, RotateCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

interface SearchbarProps {
  onSearch: (query: string) => void
  hasResults?: boolean
  onStartOver?: () => void
}

export default function Searchbar({ onSearch, hasResults = false, onStartOver }: SearchbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [searchQuery])

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
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
      <div className="absolute left-5 top-0 bottom-0 flex items-center z-10 pointer-events-none">
        <Image 
          src="/zyris-logo.webp" 
          alt="Zyris" 
          width={40} 
          height={40} 
          className="h-10 w-auto" 
        />
      </div>
      <div className="absolute right-5 top-0 bottom-0 flex items-center z-10">
        {hasResults ? (
          <RotateCw 
            onClick={handleIconClick}
            className="h-6 w-6 text-pink-500 cursor-pointer hover:scale-110 transition-transform duration-200" 
          />
        ) : (
          <Search 
            onClick={handleIconClick}
            strokeWidth={3}
            className="h-6 w-6 text-pink-500 cursor-pointer hover:scale-110 transition-transform duration-200" 
          />
        )}
      </div>
      <Textarea
        ref={textareaRef}
        placeholder="Paste Practice Name, and Address to Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyPress}
        className="pl-32 pr-20 pt-[1.35rem] pb-5 text-lg font-medium rounded-3xl !border-0 focus:!border-0 focus:!ring-0 focus:!outline-none shadow-lg min-h-[4rem] max-h-[12rem] bg-white placeholder:text-gray-200 placeholder:italic !ring-0 !ring-offset-0 resize-none overflow-y-auto leading-relaxed"
        rows={1}
      />
    </form>
  )
}
