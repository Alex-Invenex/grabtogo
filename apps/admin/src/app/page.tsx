'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if admin is already logged in
    const adminAuth = localStorage.getItem('adminAuth')

    if (adminAuth === 'true') {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
    </div>
  )
}