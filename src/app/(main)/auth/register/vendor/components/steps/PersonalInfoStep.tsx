'use client'

import { useFormContext } from 'react-hook-form'
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

export default function PersonalInfoStep() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { control, watch } = useFormContext()

  const password = watch('password')

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 15
    if (/[^A-Za-z0-9]/.test(password)) strength += 10
    return strength
  }

  const passwordStrength = password ? calculatePasswordStrength(password) : 0

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600 text-lg">Let&apos;s start with your basic details for your Kerala business</p>
        <div className="mt-4 w-24 h-1 bg-gradient-to-r from-[#db4a2b] to-[#c43e29] rounded-full mx-auto"></div>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        <FormField
          control={control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your full name"
                  {...field}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-[#db4a2b] focus:ring-2 focus:ring-[#db4a2b]/20 transition-all duration-200 hover:border-gray-300"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  {...field}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-[#db4a2b] focus:ring-2 focus:ring-[#db4a2b]/20 transition-all duration-200 hover:border-gray-300"
                />
              </FormControl>
              <p className="text-sm text-gray-500 mt-1">This will be your login email for the vendor dashboard</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+91 9876543210"
                  {...field}
                  className="h-14 text-lg border-2 border-gray-200 focus:border-[#db4a2b] focus:ring-2 focus:ring-[#db4a2b]/20 transition-all duration-200 hover:border-gray-300"
                />
              </FormControl>
              <p className="text-sm text-gray-500 mt-1">Kerala customers will contact you on this number</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    {...field}
                    className="h-14 text-lg border-2 border-gray-200 focus:border-[#db4a2b] focus:ring-2 focus:ring-[#db4a2b]/20 transition-all duration-200 hover:border-gray-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-[#db4a2b] transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </FormControl>
              {password && (
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength < 30
                            ? 'bg-red-500'
                            : passwordStrength < 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      passwordStrength < 30
                        ? 'text-red-600'
                        : passwordStrength < 70
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {passwordStrength < 30
                        ? 'Weak'
                        : passwordStrength < 70
                        ? 'Medium'
                        : 'Strong'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Use 8+ characters with uppercase, lowercase, numbers & symbols</p>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    {...field}
                    className="h-14 text-lg border-2 border-gray-200 focus:border-[#db4a2b] focus:ring-2 focus:ring-[#db4a2b]/20 transition-all duration-200 hover:border-gray-300 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-[#db4a2b] transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}