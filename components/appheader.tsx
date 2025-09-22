"use client"

import { useState } from "react"
import { User, LogOut, Settings, HelpCircle, ChevronDown, Bell } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUsers } from "@/hooks/useUsers"

interface UserDropdownProps {
  userName: string
  userEmail: string
  userImage?: string
}

export function UserDropdown({ userName, userEmail, userImage }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useUsers()

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-pink-50 focus:outline-none">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarImage src={userImage || "/placeholder.svg"} alt={userName} />
            <AvatarFallback className="bg-gray-100 text-gray-700 text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-700">{userName}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2 md:hidden">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium text-gray-700">{userName}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="md:hidden" />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 focus:bg-red-50 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface AppHeaderProps {
  userName?: string
  userEmail?: string
  userImage?: string
}

export function AppHeader({ userName, userEmail, userImage }: AppHeaderProps) {
  const pathname = usePathname()
  const { user } = useUsers()

  const displayName = userName || user?.user_metadata?.name || user?.email?.split('@')[0] || "User"
  const displayEmail = userEmail || user?.email || ""

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Image src="/zyris-logo.webp" alt="Zyris" width={200} height={67} className="h-12 w-auto" priority />
          
          {/* Navigation Tabs */}
          <nav className="flex items-center">
            <div className="bg-gray-50 border border-gray-200 rounded-full p-1.5 shadow-sm">
              <div className="flex items-center gap-1">
                <Button 
                  size="sm"
                  className="px-3 py-1 text-sm font-bold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2 bg-pink-500 text-white shadow-md"
                >
                  Search
                </Button>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
            <span className="sr-only">Notifications</span>
          </Button>
          <UserDropdown 
            userName={displayName}
            userEmail={displayEmail}
            userImage={userImage}
          />
        </div>
      </div>
    </header>
  )
} 