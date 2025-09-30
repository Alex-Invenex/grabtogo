'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Building,
  MapPin,
  Users,
  Shield,
  Palette,
  Package,
  CheckCircle,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

// Import step components
import PersonalInfoStep from './steps/PersonalInfoStep';
import BusinessDetailsStep from './steps/BusinessDetailsStep';
import AddressLocationStep from './steps/AddressLocationStep';
import AgentReferenceStep from './steps/AgentReferenceStep';
import GSTDocumentStep from './steps/GSTDocumentStep';
import LogoBrandingStep from './steps/LogoBrandingStep';
import PackageSelectionStep from './steps/PackageSelectionStep';
import ReviewConfirmStep from './steps/ReviewConfirmStep';
import SubmissionStep from './steps/SubmissionStep';

// Import validation schemas
import {
  personalInfoSchema,
  businessDetailsSchema,
  addressLocationSchema,
  agentReferenceSchema,
  gstDocumentSchema,
  logoBrandingSchema,
  packageSelectionSchema,
  reviewConfirmSchema,
  vendorRegistrationSchema,
} from '../lib/validationSchemas';

const STEPS = [
  {
    id: 1,
    name: 'Personal Info',
    icon: User,
    component: PersonalInfoStep,
    schema: personalInfoSchema,
  },
  {
    id: 2,
    name: 'Business Details',
    icon: Building,
    component: BusinessDetailsStep,
    schema: businessDetailsSchema,
  },
  {
    id: 3,
    name: 'Address & Location',
    icon: MapPin,
    component: AddressLocationStep,
    schema: addressLocationSchema,
  },
  {
    id: 4,
    name: 'Agent Reference',
    icon: Users,
    component: AgentReferenceStep,
    schema: agentReferenceSchema,
  },
  {
    id: 5,
    name: 'GST & Document',
    icon: Shield,
    component: GSTDocumentStep,
    schema: gstDocumentSchema,
  },
  {
    id: 6,
    name: 'Logo & Branding',
    icon: Palette,
    component: LogoBrandingStep,
    schema: logoBrandingSchema,
  },
  {
    id: 7,
    name: 'Select Package',
    icon: Package,
    component: PackageSelectionStep,
    schema: packageSelectionSchema,
  },
  {
    id: 8,
    name: 'Review',
    icon: CheckCircle,
    component: ReviewConfirmStep,
    schema: reviewConfirmSchema,
  },
  {
    id: 9,
    name: 'Submit',
    icon: Send,
    component: SubmissionStep,
    schema: null, // Submission step handles its own validation
  },
];

export default function RegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      // Personal Info
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',

      // Business Details
      companyName: '',
      businessType: undefined,
      yearsInBusiness: 0,
      numberOfEmployees: undefined,
      businessCategory: '',

      // Address
      useCurrentLocation: false,
      addressLine1: '',
      addressLine2: '',
      city: undefined,
      state: 'Kerala', // Default to Kerala since we only operate there
      pinCode: '',
      landmark: '',
      coordinates: null,
      deliveryRadius: 5,

      // Agent
      agentCode: '',
      agentName: '',
      agentPhone: '',
      agentVisitDate: '',
      referenceNotes: '',

      // GST & Document
      gstNumber: '',
      gstVerified: false,
      gstDetails: null,
      gstCertificate: null,

      // Branding
      logo: null,
      banner: null,
      tagline: '',

      // Package - Default to premium for free trial
      selectedPackage: 'premium',
      billingCycle: 'monthly',
      addOns: [],

      // Agreement
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  // Form methods destructured (unused intentionally for future use)
  // const { trigger, formState: { errors } } = methods

  // Remove Razorpay script loading since we no longer need payment

  const validateCurrentStep = async () => {
    const step = STEPS.find((s) => s.id === currentStep);
    if (!step?.schema) return true;

    try {
      const formData = methods.getValues();
      await step.schema.parseAsync(formData);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = async () => {
    setIsNavigating(true);

    // Add a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const isValid = await validateCurrentStep();

    if (isValid && currentStep < STEPS.length) {
      setCompletedSteps((prev) => {
        const newSteps = [...prev, currentStep];
        return Array.from(new Set(newSteps));
      });
      setCurrentStep((prev) => prev + 1);
    }

    setIsNavigating(false);
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = async (stepId: number) => {
    if (stepId <= currentStep || completedSteps.includes(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const CurrentStepComponent =
    STEPS.find((s) => s.id === currentStep)?.component || PersonalInfoStep;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold" style={{ color: '#db4a2b' }}>
              Become a GrabtoGo Vendor
            </h1>
            <p className="text-gray-600 mt-2">
              Join India&apos;s fastest growing local marketplace
            </p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || isCompleted;

              return (
                <motion.div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center flex-1 cursor-pointer transition-all',
                    isAccessible ? 'opacity-100' : 'opacity-50'
                  )}
                  onClick={() => handleStepClick(step.id)}
                  whileHover={isAccessible ? { scale: 1.05 } : {}}
                  whileTap={isAccessible ? { scale: 0.95 } : {}}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform',
                      isCompleted
                        ? 'bg-green-600 border-green-600 text-white shadow-lg scale-105'
                        : isCurrent
                          ? 'border-[#db4a2b] text-[#db4a2b] bg-white shadow-xl scale-110 ring-4 ring-[#db4a2b]/20'
                          : isAccessible
                            ? 'border-gray-300 text-gray-400 bg-white hover:border-[#db4a2b] hover:scale-105'
                            : 'border-gray-200 text-gray-300 bg-gray-50'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs mt-2 text-center font-medium hidden sm:block',
                      isCurrent ? 'text-[#db4a2b]' : 'text-gray-500'
                    )}
                  >
                    {step.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-2 rounded-full"
                style={{ backgroundColor: '#db4a2b' }}
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </div>

        {/* Form Container */}
        <motion.div
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        >
          <FormProvider {...methods}>
            <Form {...methods}>
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CurrentStepComponent />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="bg-gray-50 px-8 py-6 border-t">
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1 || isNavigating}
                    className={cn(
                      'flex items-center gap-3 px-6 py-4 text-lg font-medium border-2 rounded-xl transition-all duration-300 hover:scale-105 disabled:scale-100 border-gray-300 hover:border-[#db4a2b] hover:text-[#db4a2b]',
                      currentStep === 1 && 'invisible'
                    )}
                  >
                    <motion.div whileHover={{ x: -5 }} transition={{ duration: 0.2 }}>
                      <ChevronLeft className="w-5 h-5" />
                    </motion.div>
                    <span>Previous</span>
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>
                      Step {currentStep} of {STEPS.length}
                    </span>
                  </div>

                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isNavigating}
                      className="flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                      style={{ backgroundColor: '#db4a2b' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c43e29')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#db4a2b')}
                    >
                      {isNavigating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Validating...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="w-5 h-5" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="w-24" /> // Spacer to maintain layout
                  )}
                </div>
              </div>
            </Form>
          </FormProvider>
        </motion.div>

        {/* Help Text */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a
              href="mailto:info@grabtogo.in"
              className="hover:underline"
              style={{ color: '#db4a2b' }}
            >
              info@grabtogo.in
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
