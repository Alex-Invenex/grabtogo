'use client'

import { useFormContext } from 'react-hook-form'
import { useState } from 'react'
import { Users, Hash, Phone, Calendar, FileText, CheckCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

export default function AgentReferenceStep() {
  const { control, setValue, watch } = useFormContext()
  const [isVerifying, setIsVerifying] = useState(false)
  const [agentVerified, setAgentVerified] = useState(false)

  const agentCode = watch('agentCode')

  const handleVerifyAgent = async () => {
    if (!agentCode || !/^AG-[0-9]{4}$/.test(agentCode)) {
      return
    }

    setIsVerifying(true)

    // Simulate API call to verify agent
    setTimeout(() => {
      setValue('agentName', 'Rajesh Kumar')
      setValue('agentPhone', '+91 9876543210')
      setAgentVerified(true)
      setIsVerifying(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Agent Reference</h2>
        <p className="text-gray-600 mt-1">Enter your GrabtoGo agent details</p>
      </div>

      <div className="space-y-4">
        <FormField
          control={control}
          name="agentCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Agent Code
              </FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    placeholder="AG-XXXX"
                    {...field}
                    className="h-12 uppercase"
                    maxLength={7}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyAgent}
                    disabled={!agentCode || isVerifying || agentVerified}
                    className="px-6"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Verifying
                      </>
                    ) : agentVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
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
                Enter the code provided by your GrabtoGo agent
              </p>
            </FormItem>
          )}
        />

        {agentVerified && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Agent Verified Successfully</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="agentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Agent Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12 bg-white"
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="agentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Agent Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-12 bg-white"
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <FormField
          control={control}
          name="agentVisitDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Agent Visit
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  className="h-12"
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-gray-500">
                When did the agent visit your business?
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="referenceNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reference Notes (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information about the agent visit..."
                  {...field}
                  className="min-h-[100px]"
                  maxLength={200}
                />
              </FormControl>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Optional notes about your interaction</span>
                <span>{field.value?.length || 0}/200</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}