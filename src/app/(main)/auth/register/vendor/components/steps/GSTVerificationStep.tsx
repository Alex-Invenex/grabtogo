'use client'

import { useFormContext } from 'react-hook-form'
import { useState } from 'react'
import { Info, Shield, Loader2, CheckCircle, MapPin, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { verifyGST, getStateFromGST } from '../../lib/gstVerification'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function GSTVerificationStep() {
  const { control, setValue, watch } = useFormContext()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  const gstNumber = watch('gstNumber')
  const gstVerified = watch('gstVerified')
  const gstDetails = watch('gstDetails')

  const handleVerifyGST = async () => {
    if (!gstNumber) return

    setIsVerifying(true)
    setVerificationError('')

    try {
      const details = await verifyGST(gstNumber)

      if (details) {
        setValue('gstVerified', true)
        setValue('gstDetails', details)
      } else {
        setVerificationError('Unable to verify GST number. Please check and try again.')
        setValue('gstVerified', false)
        setValue('gstDetails', null)
      }
    } catch {
      setVerificationError('Verification failed. Please try again later.')
      setValue('gstVerified', false)
      setValue('gstDetails', null)
    } finally {
      setIsVerifying(false)
    }
  }

  const formatGSTInput = (value: string) => {
    // Remove all non-alphanumeric characters and convert to uppercase
    return value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">GST Verification</h2>
        <p className="text-gray-600 mt-1">Verify your business GST details</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          GST verification is mandatory for vendor registration. Your GST number will be verified with government records.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <FormField
          control={control}
          name="gstNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                GST Number
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    {...field}
                    onChange={(e) => field.onChange(formatGSTInput(e.target.value))}
                    className="h-12 font-mono uppercase"
                    maxLength={15}
                  />
                  <Button
                    type="button"
                    variant={gstVerified ? 'default' : 'outline'}
                    onClick={handleVerifyGST}
                    disabled={!gstNumber || gstNumber.length !== 15 || isVerifying}
                    className="px-6"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying
                      </>
                    ) : gstVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-sm text-gray-500">
                Format: 22AAAAA0000A1Z5 (15 characters)
              </p>
              {gstNumber && gstNumber.length >= 2 && (
                <p className="text-sm text-blue-600">
                  State: {getStateFromGST(gstNumber)}
                </p>
              )}
            </FormItem>
          )}
        />

        {verificationError && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {verificationError}
            </AlertDescription>
          </Alert>
        )}

        {gstVerified && gstDetails && (
          <div className="p-6 bg-green-50 rounded-lg border border-green-200 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-900 text-lg">GST Verified Successfully</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Legal Business Name</label>
                <p className="mt-1 font-semibold text-gray-900">{gstDetails.legalBusinessName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Trade Name</label>
                <p className="mt-1 font-semibold text-gray-900">{gstDetails.tradeName}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Business Address
                </label>
                <p className="mt-1 font-semibold text-gray-900">{gstDetails.businessAddress}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">GST Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    gstDetails.gstStatus === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {gstDetails.gstStatus}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Registration Date
                </label>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(gstDetails.registrationDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-green-200">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Your GST details have been verified and saved
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}