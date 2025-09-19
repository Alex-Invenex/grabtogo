import { PrismaClient, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

const subscriptionPlans = [
  {
    planType: PlanType.BASIC,
    name: 'Basic Plan',
    description: 'Perfect for small businesses getting started',
    price: 99,
    currency: 'INR',
    duration: 30, // 30 days
    features: [
      'No feature listing',
      'Booking module included',
      'Review module included',
      '3 gallery images',
      'Pricing menu access',
      'Social links integration',
      'Opening hours display',
      'No video module',
      '5 status updates per day',
      'Basic analytical dashboard',
      'No social media ads',
      'No campaign access',
      'No WhatsApp/Email blast',
      'No future dev access',
      'UPI AutoPay recurring',
      'Monthly billing'
    ],
    maxProducts: null, // Will be managed by feature limits
    maxOffers: null,   // Will be managed by feature limits
    featureLimits: {
      featureListing: 'none',
      galleryImages: 3,
      videoModule: false,
      statusUpdatesPerDay: 5,
      analyticalDashboard: 'basic',
      socialMediaAds: false,
      campaignAccess: false,
      whatsappEmailBlast: false,
      futureDevAccess: false
    },
    isActive: true,
  },
  {
    planType: PlanType.STANDARD,
    name: 'Standard Plan',
    description: 'Most popular choice for growing businesses',
    price: 199,
    currency: 'INR',
    duration: 30, // 30 days
    features: [
      'Weekly 3-day feature listing',
      'Booking module included',
      'Review module included',
      '5 gallery images',
      'Pricing menu access',
      'Social links integration',
      'Opening hours display',
      'Video module included',
      '10 status updates per day',
      'Extended analytical dashboard',
      'No social media ads',
      'No campaign access',
      'No WhatsApp/Email blast',
      'No future dev access',
      'UPI AutoPay recurring',
      'Monthly billing'
    ],
    maxProducts: null, // Will be managed by feature limits
    maxOffers: null,   // Will be managed by feature limits
    featureLimits: {
      featureListing: 'weekly_3_days',
      galleryImages: 5,
      videoModule: true,
      statusUpdatesPerDay: 10,
      analyticalDashboard: 'extended',
      socialMediaAds: false,
      campaignAccess: false,
      whatsappEmailBlast: false,
      futureDevAccess: false
    },
    isActive: true,
  },
  {
    planType: PlanType.PREMIUM,
    name: 'Premium Plan',
    description: 'Complete solution for established businesses',
    price: 299,
    currency: 'INR',
    duration: 30, // 30 days
    features: [
      'Unlimited feature listing',
      'Booking module included',
      'Review module included',
      'Unlimited gallery images',
      'Pricing menu access',
      'Social links integration',
      'Opening hours display',
      'Video module included',
      'Unlimited status updates',
      'Professional analytical dashboard',
      'Social media ads included',
      'Campaign access included',
      'WhatsApp/Email blast (1/week)',
      'Future dev access included',
      'UPI AutoPay recurring',
      'Monthly billing'
    ],
    maxProducts: null, // Unlimited
    maxOffers: null,   // Unlimited
    featureLimits: {
      featureListing: 'unlimited',
      galleryImages: 'unlimited',
      videoModule: true,
      statusUpdatesPerDay: 'unlimited',
      analyticalDashboard: 'professional',
      socialMediaAds: true,
      campaignAccess: true,
      whatsappEmailBlast: true,
      whatsappEmailBlastFrequency: 'weekly',
      futureDevAccess: true
    },
    isActive: true,
  },
];

async function seedSubscriptionPlans() {
  try {
    console.log('Seeding subscription plans...');

    for (const plan of subscriptionPlans) {
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { planType: plan.planType },
      });

      if (existingPlan) {
        // Update existing plan
        await prisma.subscriptionPlan.update({
          where: { planType: plan.planType },
          data: {
            name: plan.name,
            description: plan.description,
            price: plan.price,
            currency: plan.currency,
            duration: plan.duration,
            features: plan.features,
            maxProducts: plan.maxProducts,
            maxOffers: plan.maxOffers,
            isActive: plan.isActive,
          },
        });
        console.log(`Updated ${plan.name}`);
      } else {
        // Create new plan
        await prisma.subscriptionPlan.create({
          data: plan,
        });
        console.log(`Created ${plan.name}`);
      }
    }

    console.log('Subscription plans seeded successfully!');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedSubscriptionPlans();
}

export { seedSubscriptionPlans };