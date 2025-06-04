"use client"

import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 shadow-sm mt-12">
      <div className="w-full px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/zyris-logo.webp" alt="Zyris" width={120} height={40} className="h-10 w-auto" priority />
          <span className="text-gray-400 text-sm hidden md:inline-block">&copy; {new Date().getFullYear()} Zyris. All rights reserved.</span>
        </div>
        <nav className="flex gap-6 text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-pink-500 transition-colors">Home</Link>
          <Link href="#about" className="hover:text-pink-500 transition-colors">About</Link>
          <Link href="#contact" className="hover:text-pink-500 transition-colors">Contact</Link>
        </nav>
        <span className="text-gray-400 text-xs md:hidden text-center">&copy; {new Date().getFullYear()} Zyris. All rights reserved.</span>
      </div>
    </footer>
  )
} 