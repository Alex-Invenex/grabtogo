'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Lock } from "lucide-react"

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Demo credentials for admin access
      if (formData.email === 'admin@grabtogo.com' && formData.password === 'admin123') {
        // Store admin session
        localStorage.setItem('adminAuth', 'true')
        localStorage.setItem('adminRole', 'super_admin')
        localStorage.setItem('adminEmail', formData.email)
        localStorage.setItem('adminLoginTime', new Date().toISOString())

        // Redirect to admin dashboard
        router.push('/dashboard')
      } else if (formData.email === 'manager@grabtogo.com' && formData.password === 'manager123') {
        localStorage.setItem('adminAuth', 'true')
        localStorage.setItem('adminRole', 'admin')
        localStorage.setItem('adminEmail', formData.email)
        localStorage.setItem('adminLoginTime', new Date().toISOString())

        router.push('/dashboard')
      } else {
        setError('Invalid email or password. Access denied.')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-600 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Admin Access</CardTitle>
            <CardDescription className="text-gray-300">
              Secure admin portal for GrabtoGo platform management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-500 bg-red-500/10">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Admin Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@grabtogo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Admin Login
                  </div>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-600">
              <div className="text-sm text-gray-400 space-y-2">
                <p className="font-medium text-gray-300">Demo Credentials:</p>
                <div className="bg-gray-700/50 p-3 rounded text-xs space-y-1">
                  <p><span className="text-red-400">Super Admin:</span> admin@grabtogo.com / admin123</p>
                  <p><span className="text-blue-400">Admin:</span> manager@grabtogo.com / manager123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}