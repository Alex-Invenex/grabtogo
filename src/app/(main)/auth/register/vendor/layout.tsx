import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vendor Registration - GrabtoGo',
  description: 'Join GrabtoGo as a vendor and grow your business with India\'s fastest growing local marketplace',
}

export default function VendorRegistrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {children}
    </div>
  )
}