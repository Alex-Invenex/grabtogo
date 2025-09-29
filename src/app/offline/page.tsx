'use client'

import * as React from 'react'
import { WifiOff, RefreshCw, Home, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function OfflinePage() {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)

    try {
      // Check if we're back online by trying to fetch a simple resource
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      if (response.ok) {
        // We're back online, reload the page
        window.location.reload()
      } else {
        throw new Error('Still offline')
      }
    } catch (error) {
      // Still offline
      setTimeout(() => setIsRetrying(false), 1000)
    }
  }

  const goHome = () => {
    router.push('/')
  }

  const goToProducts = () => {
    router.push('/products')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <WifiOff className="h-10 w-10 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">You're Offline</h1>
              <p className="text-muted-foreground">
                It looks like you're not connected to the internet.
                Check your connection and try again.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking Connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={goHome}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button variant="outline" onClick={goToProducts}>
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">While you're offline, you can:</p>
              <ul className="space-y-1 text-left">
                <li>• Browse previously viewed products</li>
                <li>• View your order history</li>
                <li>• Access your profile information</li>
                <li>• Continue shopping from your cart</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                GrabtoGo works offline thanks to Progressive Web App technology.
                Some features may be limited without an internet connection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}