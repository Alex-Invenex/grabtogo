import * as z from 'zod';

// Step 1: Personal Information
export const personalInfoSchema = z
  .object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^\+91[0-9]{10}$/, 'Please enter a valid Indian phone number (+91XXXXXXXXXX)'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Step 2: Business Details
export const businessDetailsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  businessType: z.enum(['Retail', 'Wholesale', 'Service', 'Manufacturing'], {
    message: 'Please select a business type',
  }),
  yearsInBusiness: z.number().min(0).max(50),
  numberOfEmployees: z.enum(['1-10', '11-50', '51-100', '100+'], {
    message: 'Please select number of employees',
  }),
  businessCategory: z.string().min(1, 'Please select a business category'),
});

// Kerala cities for validation
const KERALA_CITIES = [
  'Thiruvananthapuram',
  'Kochi (Ernakulam)',
  'Kozhikode (Calicut)',
  'Thrissur',
  'Kottayam',
  'Alappuzha (Alleppey)',
  'Palakkad',
  'Malappuram',
  'Kannur',
  'Kollam',
  'Kasaragod',
  'Pathanamthitta',
  'Wayanad',
  'Idukki',
  'Thodupuzha',
  'Muvattupuzha',
  'Perumbavoor',
  'Kothamangalam',
  'Chalakudy',
  'Irinjalakuda',
  'Kodungallur',
  'Guruvayur',
  'Ottapalam',
  'Shoranur',
  'Mannarkkad',
  'Chittur',
  'Ponnani',
  'Tirur',
  'Tanur',
  'Perinthalmanna',
  'Manjeri',
  'Kondotty',
  'Payyanur',
  'Taliparamba',
  'Koyilandy',
  'Vadakara',
  'Kalpetta',
  'Mananthavady',
  'Sulthan Bathery',
  'Munnar',
  'Devikulam',
  'Kumily',
  'Nedumkandam',
  'Cherthala',
  'Kayamkulam',
  'Mavelikkara',
  'Changanassery',
  'Pala',
  'Ettumanoor',
  'Vaikom',
  'Mundakayam',
  'Punalur',
  'Paravur',
  'Karunagappally',
  'Varkala',
  'Attingal',
  'Nedumangad',
  'Vithura',
  'Neyyattinkara',
  'Kattakkada',
  'Adoor',
  'Pandalam',
  'Mallappally',
  'Thiruvalla',
  'Ranni',
  'Kozhencherry',
] as const;

// Step 3: Address & Location
export const addressLocationSchema = z.object({
  useCurrentLocation: z.boolean().default(false),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.enum(KERALA_CITIES, {
    message: 'Please select a city in Kerala',
  }),
  state: z.string().default('Kerala'), // Always Kerala
  pinCode: z.string().regex(/^[0-9]{6}$/, 'PIN code must be 6 digits'),
  landmark: z.string().optional(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable(),
  deliveryRadius: z.number().min(1).max(10),
});

// Step 4: Agent Reference
export const agentReferenceSchema = z.object({
  agentCode: z.string().regex(/^AG-[0-9]{4}$/, 'Agent code must be in format AG-XXXX'),
  agentName: z.string().optional(),
  agentPhone: z.string().optional(),
  agentVisitDate: z.string().refine((date) => {
    const visitDate = new Date(date);
    const today = new Date();
    return visitDate <= today;
  }, 'Visit date cannot be in the future'),
  referenceNotes: z.string().max(200, 'Notes must be less than 200 characters').optional(),
});

// Step 5: GST Verification & Document Upload (Combined)
export const gstDocumentSchema = z.object({
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format'
    ),
  gstVerified: z.boolean(),
  gstDetails: z
    .object({
      legalBusinessName: z.string(),
      tradeName: z.string(),
      businessAddress: z.string(),
      gstStatus: z.enum(['Active', 'Inactive']),
      registrationDate: z.string(),
    })
    .nullable(),
  gstCertificate: z.string().refine(
    (str) => str.startsWith('data:') || str.startsWith('https://'),
    { message: 'GST Certificate is required' }
  ),
});

// Step 6: Logo & Branding
export const logoBrandingSchema = z.object({
  logo: z.string().refine(
    (str) => str.startsWith('data:') || str.startsWith('https://'),
    'Business logo is required'
  ),
  banner: z
    .string()
    .refine(
      (str) => !str || str.startsWith('data:') || str.startsWith('https://'),
      'Invalid banner URL'
    )
    .optional()
    .nullable(),
  tagline: z.string().max(60, 'Tagline must be less than 60 characters').optional(),
});

// Step 7: Package Selection
export const packageSelectionSchema = z.object({
  selectedPackage: z.enum(['basic', 'standard', 'premium'], {
    message: 'Please select a package',
  }),
  billingCycle: z.enum(['monthly', 'yearly']),
  addOns: z.array(z.string()).default([]),
});

// Step 8: Review & Confirm
export const reviewConfirmSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  privacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
});

// Combined schema for the entire form
export const vendorRegistrationSchema = z.object({
  ...personalInfoSchema.shape,
  ...businessDetailsSchema.shape,
  ...addressLocationSchema.shape,
  ...agentReferenceSchema.shape,
  ...gstDocumentSchema.shape,
  ...logoBrandingSchema.shape,
  ...packageSelectionSchema.shape,
  ...reviewConfirmSchema.shape,
});

export type VendorRegistrationData = z.infer<typeof vendorRegistrationSchema>;
