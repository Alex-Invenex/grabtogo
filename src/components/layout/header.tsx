'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  Grid3x3,
  Heart,
  Package,
  Settings,
  LogOut,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBar } from '@/components/ui/search-bar';
import { useAuth } from '@/components/auth/protected-route';

// Dynamically import NotificationBell to avoid SSR issues
const NotificationBell = dynamic(
  () => import('@/components/notifications/notification-center').then(mod => ({ default: mod.NotificationBell })),
  { ssr: false }
);

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsSearchOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-md">
      <div className="container-custom">
        <div className="flex h-20 items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-10">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-10 h-10 group-hover:scale-105 transition-all duration-300">
                <img src="/logo.svg" alt="GrabtoGo Logo" className="w-full h-full object-contain" />
              </div>
              <span className="hidden md:inline-block font-display font-bold text-xl text-gray-900">
                GrabtoGo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6" aria-label="Main navigation">
              <Link
                href="/"
                className="font-medium text-sm text-gray-700 hover:text-primary transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/listings"
                className="font-medium text-sm text-gray-700 hover:text-primary transition-colors duration-200"
              >
                Listings
              </Link>
              <Link
                href="/offers/new"
                className="font-medium text-sm text-gray-700 hover:text-primary transition-colors duration-200"
              >
                New Offers
              </Link>
              <Link
                href="/shop"
                className="font-medium text-sm text-gray-700 hover:text-primary transition-colors duration-200"
              >
                Shop
              </Link>
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <SearchBar
              placeholder="Search for deals, vendors, or products..."
              onSearch={handleSearch}
              className="w-full"
            />
          </div>

          {/* Right Section - Simplified */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Link href="/wishlist" aria-label="View wishlist">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex text-gray-700 hover:bg-gray-50"
                  >
                    <Heart className="h-5 w-5" />
                    <span className="sr-only">Wishlist</span>
                  </Button>
                </Link>

                {/* Cart - Hidden on mobile */}
                {role === 'CUSTOMER' && (
                  <Link href="/cart" aria-label="View cart" className="hidden md:block">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-gray-700 hover:bg-gray-50"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-[10px] bg-primary text-white border-0"
                        aria-label="0 items in cart"
                      >
                        0
                      </Badge>
                      <span className="sr-only">Shopping cart with 0 items</span>
                    </Button>
                  </Link>
                )}

                {/* Notifications */}
                <NotificationBell />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 hover:bg-gray-50 px-2"
                      aria-label="User menu"
                    >
                      <Avatar className="h-9 w-9 border-2 border-gray-200 shadow-sm">
                        <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                        <AvatarFallback className="bg-primary text-white text-sm font-semibold">
                          {user?.name ? getInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown
                        className="h-4 w-4 hidden md:block text-gray-700"
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-2" align="end">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                          <AvatarFallback className="bg-primary text-white">
                            {user?.name ? getInitials(user.name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {role !== 'ADMIN' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            My Profile
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/wishlist">
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {(role === 'VENDOR' || role === 'ADMIN') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={role === 'ADMIN' ? '/admin' : '/vendor/dashboard'}>
                            <Grid3x3 className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {role !== 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Customer Sign In / Sign Up */}
                <Link href="/auth/login" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="default"
                    className="text-gray-700 hover:text-primary hover:bg-gray-50 font-medium text-sm px-4"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" className="hidden md:block">
                  <Button
                    size="default"
                    className="bg-primary text-white hover:bg-primary/90 font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200"
                  >
                    Sign Up
                  </Button>
                </Link>
                <Link href="/auth/register/vendor" className="hidden md:block">
                  <Button
                    variant="outline"
                    size="default"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Become a Vendor
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="lg:hidden py-3 border-t border-gray-100">
            <SearchBar
              placeholder="Search for restaurants, cuisines, or dishes..."
              onSearch={handleSearch}
              className="h-10 bg-gray-50"
              autoFocus
            />
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link
                href="/listings"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Grid3x3 className="w-4 h-4" />
                Listings
              </Link>
              <Link
                href="/offers/new"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Package className="w-4 h-4" />
                New Offers
              </Link>
              <Link
                href="/shop"
                className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Store className="w-4 h-4" />
                Shop
              </Link>
              {!isAuthenticated && (
                <>
                  <div className="pt-2 border-t border-gray-100">
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Sign In
                    </Link>
                  </div>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary text-white hover:bg-primary/90 font-bold text-base py-6 rounded-2xl shadow-lg">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
              {(!isAuthenticated || role === 'CUSTOMER') && (
                <Link href="/auth/register/vendor" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold text-base py-6 rounded-2xl"
                  >
                    <Store className="w-5 h-5 mr-2" />
                    Become a Vendor
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
