'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  Bell,
  Settings,
  LogOut,
  Store,
  LayoutDashboard,
  MessageSquare
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchBar } from '@/components/ui/search-bar'
import { useAuth } from '@/components/auth/protected-route'
import { NotificationBell } from '@/components/notifications/notification-center'

export function Header() {
  const router = useRouter()
  const { user, isAuthenticated, role } = useAuth()

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getDashboardUrl = () => {
    switch (role) {
      case 'ADMIN':
        return '/admin'
      case 'VENDOR':
        return '/vendor/dashboard'
      default:
        return '/profile'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Store className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block text-2xl">
              GrabtoGo
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/products" className="transition-colors hover:text-foreground/80">
              Products
            </Link>
            <Link href="/vendors" className="transition-colors hover:text-foreground/80">
              Vendors
            </Link>
            <Link href="/categories" className="transition-colors hover:text-foreground/80">
              Categories
            </Link>
          </nav>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Search */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <SearchBar
              placeholder="Search products..."
              onSearch={handleSearch}
              className="md:w-[200px] lg:w-[320px]"
            />
          </div>

          {/* Navigation items */}
          <nav className="flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* Chat (for vendors and customers) */}
                {(role === 'VENDOR' || role === 'CUSTOMER') && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/chat">
                      <MessageSquare className="h-5 w-5" />
                      <span className="sr-only">Messages</span>
                    </Link>
                  </Button>
                )}

                {/* Shopping Cart (for customers) */}
                {role === 'CUSTOMER' && (
                  <Button variant="ghost" size="icon" className="relative" asChild>
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                        0
                      </Badge>
                      <span className="sr-only">Shopping Cart</span>
                    </Link>
                  </Button>
                )}

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                        <AvatarFallback>
                          {user?.name ? getInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <Badge variant="secondary" className="w-fit text-xs">
                          {role}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href={getDashboardUrl()}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}