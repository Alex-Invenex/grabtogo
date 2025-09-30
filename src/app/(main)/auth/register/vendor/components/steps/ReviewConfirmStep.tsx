'use client';

import { useFormContext } from 'react-hook-form';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  User,
  Building,
  MapPin,
  Users,
  Shield,
  FileText,
  Palette,
  Package,
  Edit,
} from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PACKAGES, REGISTRATION_FEE, GST_RATE } from '../../lib/constants';

interface SectionData {
  icon: any;
  title: string;
  data: { [key: string]: any };
  editStep: number;
}

export default function ReviewConfirmStep() {
  const { watch, control } = useFormContext();
  const [openSections, setOpenSections] = useState<string[]>(['summary']);

  const formData = watch();

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const sections: SectionData[] = [
    {
      icon: User,
      title: 'Personal Information',
      data: {
        'Full Name': formData.fullName,
        Email: formData.email,
        Phone: formData.phone,
      },
      editStep: 1,
    },
    {
      icon: Building,
      title: 'Business Details',
      data: {
        'Company Name': formData.companyName,
        'Business Type': formData.businessType,
        'Years in Business': formData.yearsInBusiness,
        Employees: formData.numberOfEmployees,
        Category: formData.businessCategory,
      },
      editStep: 2,
    },
    {
      icon: MapPin,
      title: 'Address & Location',
      data: {
        Address: `${formData.addressLine1}, ${formData.city}, ${formData.state} - ${formData.pinCode}`,
        'Delivery Radius': `${formData.deliveryRadius} km`,
        Coordinates: formData.coordinates
          ? `${formData.coordinates.lat.toFixed(4)}, ${formData.coordinates.lng.toFixed(4)}`
          : 'Not set',
      },
      editStep: 3,
    },
    {
      icon: Users,
      title: 'Agent Reference',
      data: {
        'Agent Code': formData.agentCode,
        'Agent Name': formData.agentName,
        'Visit Date': formData.agentVisitDate,
      },
      editStep: 4,
    },
    {
      icon: Shield,
      title: 'GST Details',
      data: {
        'GST Number': formData.gstNumber,
        Status: formData.gstVerified ? 'Verified ✓' : 'Not Verified',
        'Legal Name': formData.gstDetails?.legalBusinessName,
        'Trade Name': formData.gstDetails?.tradeName,
      },
      editStep: 5,
    },
    {
      icon: FileText,
      title: 'Documents',
      data: {
        'GST Certificate': formData.gstCertificate ? '✓ Uploaded' : '✗ Not uploaded',
        'PAN Card': formData.panCard ? '✓ Uploaded' : '✗ Not uploaded',
        'Business Registration': formData.businessRegistration ? '✓ Uploaded' : '✗ Not uploaded',
        'Bank Proof': formData.bankProof ? '✓ Uploaded' : '✗ Not uploaded',
      },
      editStep: 6,
    },
    {
      icon: Palette,
      title: 'Branding',
      data: {
        Logo: formData.logo ? '✓ Uploaded' : '✗ Not uploaded',
        Banner: formData.banner ? '✓ Uploaded' : 'Not uploaded',
        Tagline: formData.tagline || 'Not set',
      },
      editStep: 7,
    },
  ];

  const calculateTotals = () => {
    const registrationFee = REGISTRATION_FEE;
    const gst = registrationFee * GST_RATE;
    const packagePrice = formData.selectedPackage
      ? formData.billingCycle === 'yearly'
        ? PACKAGES[formData.selectedPackage as keyof typeof PACKAGES].yearly
        : PACKAGES[formData.selectedPackage as keyof typeof PACKAGES].monthly
      : 0;

    const total = registrationFee + gst + packagePrice;

    return { registrationFee, gst, packagePrice, total };
  };

  const { registrationFee, gst, packagePrice, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Review & Confirm</h2>
        <p className="text-gray-600 mt-1">Please review all your information before proceeding</p>
      </div>

      {/* Summary Section */}
      <Collapsible
        open={openSections.includes('summary')}
        onOpenChange={() => toggleSection('summary')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5" />
              <span className="text-lg font-semibold">Package & Pricing Summary</span>
            </div>
            {openSections.includes('summary') ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            {formData.selectedPackage && (
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Package</h4>
                <p className="text-lg font-bold text-blue-600">
                  {PACKAGES[formData.selectedPackage as keyof typeof PACKAGES].name} -
                  {formData.billingCycle === 'yearly' ? ' Yearly' : ' Monthly'}
                </p>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Registration Fee</span>
                <span>₹{registrationFee}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{gst}</span>
              </div>
              {packagePrice > 0 && (
                <div className="flex justify-between">
                  <span>Package Fee</span>
                  <span>₹{packagePrice}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-blue-600">₹{total}</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Information Sections */}
      <div className="space-y-2">
        {sections.map((section) => (
          <Collapsible
            key={section.title}
            open={openSections.includes(section.title)}
            onOpenChange={() => toggleSection(section.title)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {openSections.includes(section.title) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                {Object.entries(section.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{value || 'Not provided'}</span>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // This would trigger navigation to the specific step
                      console.log(`Edit step ${section.editStep}`);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <FormField
          control={control}
          name="termsAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </a>
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="privacyAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  I agree to the{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> After payment confirmation, your vendor account will be reviewed by
          our team within 24-48 hours. You will receive email notifications about your application
          status at <strong>{formData.email}</strong>.
        </p>
      </div>
    </div>
  );
}
