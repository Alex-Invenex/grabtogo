# Razorpay Integration Plan

## Overview
GrabtoGo uses Razorpay as the primary payment gateway for all monetary transactions on the platform. This document outlines the planned payment integrations and implementation strategy.

## Credentials Storage

**IMPORTANT**: Production credentials are stored in `.env` file which is gitignored.

Required environment variables:
- `RAZORPAY_KEY_ID` - Server-side key ID
- `RAZORPAY_KEY_SECRET` - Server-side secret key (NEVER expose to frontend)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Public key ID for frontend Razorpay Checkout

## Payment Use Cases

### 1. Vendor Registration Payment
**Status**: Partially Implemented

**Flow**:
- One-time payment during vendor onboarding
- Amount: ₹99 (registration fee)
- Payment success → Auto-approve vendor account OR Manual admin review
- Payment failure → Block registration completion

**Implementation Notes**:
- Existing code in: `/src/app/api/vendor-registration/verify-payment/route.ts`
- Currently uses test mode
- Need to switch to production keys

**Files to Update**:
- `src/app/(main)/auth/register/vendor/components/steps/SubmissionStep.tsx`
- `src/app/api/vendor-registration/submit/route.ts`
- `src/app/api/vendor-registration/verify-payment/route.ts`

---

### 2. Subscription Package Payments
**Status**: Planned (Not Implemented)

**Subscription Tiers** (From database schema):
- **Basic**: ₹99/month
  - Limited product listings
  - Basic analytics
  - Standard support

- **Premium**: ₹199/month
  - More product listings
  - Advanced analytics
  - Priority support
  - Featured placement

- **Enterprise**: ₹299/month
  - Unlimited products
  - Premium analytics
  - Dedicated support
  - Top placement

**Payment Methods**:
1. **UPI AutoPay** (Recommended)
   - Recurring UPI mandate
   - Auto-debit on subscription renewal
   - Razorpay API: Create Subscription with UPI autopay

2. **Card AutoPay**
   - Tokenized card payments
   - PCI-compliant recurring billing
   - Razorpay API: Create Subscription with saved card

3. **Manual Renewal**
   - One-time payment per billing cycle
   - Reminder emails before expiry

**Implementation Requirements**:
- Database: `vendor_subscriptions` table (already exists)
- Razorpay Subscriptions API integration
- Webhook handlers for subscription events:
  - `subscription.activated`
  - `subscription.charged`
  - `subscription.cancelled`
  - `subscription.paused`
  - `payment.failed`

**Files to Create**:
- `src/app/api/subscriptions/create/route.ts`
- `src/app/api/subscriptions/cancel/route.ts`
- `src/app/api/subscriptions/pause/route.ts`
- `src/app/api/webhooks/razorpay/route.ts`
- `src/app/vendor/subscriptions/page.tsx` (UI)

---

### 3. Ad Placement Payments
**Status**: Planned (Not Implemented)

**Ad Products**:
- **Homepage Banner**: ₹500/day
- **Category Sponsored**: ₹300/day
- **Search Top Result**: ₹200/day
- **Story Promotion**: ₹100/day

**Payment Flow**:
- Vendor selects ad type and duration
- Creates Razorpay order
- Payment success → Ad goes live immediately OR scheduled start
- Payment stored in database with ad metadata

**Implementation Requirements**:
- Database: Create `vendor_ads` table
  ```sql
  CREATE TABLE vendor_ads (
    id TEXT PRIMARY KEY,
    vendorId TEXT NOT NULL,
    adType TEXT NOT NULL, -- 'homepage_banner', 'category_sponsored', etc.
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentId TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
    createdAt TIMESTAMP DEFAULT NOW()
  );
  ```

**Files to Create**:
- `src/app/api/ads/create-order/route.ts`
- `src/app/api/ads/verify-payment/route.ts`
- `src/app/vendor/ads/create/page.tsx`
- `src/app/vendor/ads/page.tsx` (Ad management dashboard)

---

### 4. Commission-Based Marketplace Payments
**Status**: Future Consideration

For when vendors want to sell directly through platform:
- Customer pays for product
- Platform holds payment
- After delivery confirmation:
  - Vendor receives: Product price - Platform commission (e.g., 5-10%)
  - Platform retains commission
- Requires Razorpay Route/Linked Accounts

---

## Technical Implementation Guide

### A. Payment Order Creation (Server-Side)

```typescript
// Example: src/app/api/payments/create-order/route.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { amount, currency = 'INR', receipt, notes } = await req.json();

  const order = await razorpay.orders.create({
    amount: amount * 100, // Amount in paise
    currency,
    receipt,
    notes,
  });

  return Response.json({ orderId: order.id });
}
```

### B. Frontend Payment Initialization

```typescript
// Example: Vendor registration payment
const initiatePayment = async () => {
  // 1. Create order
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({
      amount: 99,
      receipt: `reg_${vendorId}`,
      notes: { type: 'vendor_registration' },
    }),
  });

  const { orderId } = await res.json();

  // 2. Open Razorpay Checkout
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: 9900, // Amount in paise
    currency: 'INR',
    name: 'GrabtoGo',
    description: 'Vendor Registration Fee',
    order_id: orderId,
    handler: function (response) {
      // 3. Verify payment
      verifyPayment(response.razorpay_payment_id, response.razorpay_order_id);
    },
    prefill: {
      name: vendorName,
      email: vendorEmail,
      contact: vendorPhone,
    },
    theme: {
      color: '#DB4A2B', // Primary brand color
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

### C. Payment Verification (Server-Side)

```typescript
// Example: src/app/api/payments/verify/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(sign)
    .digest('hex');

  if (razorpay_signature === expectedSign) {
    // Payment is legitimate
    // Update database, activate subscription, etc.
    return Response.json({ verified: true });
  } else {
    // Payment verification failed
    return Response.json({ verified: false }, { status: 400 });
  }
}
```

### D. Webhook Handler

```typescript
// src/app/api/webhooks/razorpay/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case 'subscription.charged':
      // Handle successful subscription payment
      await handleSubscriptionCharged(event.payload);
      break;

    case 'subscription.cancelled':
      // Handle subscription cancellation
      await handleSubscriptionCancelled(event.payload);
      break;

    case 'payment.failed':
      // Handle payment failure
      await handlePaymentFailed(event.payload);
      break;
  }

  return Response.json({ received: true });
}
```

---

## Security Checklist

- [x] Store keys in `.env` (gitignored)
- [x] Use `NEXT_PUBLIC_*` only for public key ID
- [ ] NEVER expose `RAZORPAY_KEY_SECRET` to frontend
- [ ] Implement webhook signature verification
- [ ] Add webhook secret to environment variables
- [ ] Validate all payment amounts server-side
- [ ] Implement idempotency for payment verification
- [ ] Add payment fraud detection (Razorpay provides this)
- [ ] Log all payment attempts for audit trail
- [ ] Implement retry logic for failed payments

---

## Testing Strategy

### Test Mode (Development)
1. Use test keys: `rzp_test_*`
2. Test cards: https://razorpay.com/docs/payments/payments/test-card-details/
3. Test UPI: `success@razorpay`

### Production Mode
1. Switch to live keys: `rzp_live_*` ✅ (Already configured)
2. Test with small amounts first (₹1)
3. Verify webhook delivery in production
4. Monitor Razorpay Dashboard for issues

---

## Migration Path

### Phase 1: Update Existing Registration Payment ✅
- [x] Add production keys to `.env`
- [ ] Update frontend to use `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] Test registration payment end-to-end
- [ ] Deploy to production

### Phase 2: Implement Subscriptions
- [ ] Create subscription API routes
- [ ] Add subscription UI in vendor dashboard
- [ ] Implement UPI autopay flow
- [ ] Setup webhook handlers
- [ ] Create subscription management page
- [ ] Test subscription lifecycle (create, charge, cancel)

### Phase 3: Add Ad Placement
- [ ] Create ads database table
- [ ] Build ad creation API
- [ ] Add ad management UI for vendors
- [ ] Implement ad display logic on frontend
- [ ] Create analytics for ad performance

### Phase 4: Optimize & Scale
- [ ] Add payment analytics dashboard
- [ ] Implement refund automation
- [ ] Add payment reminders for failed subscriptions
- [ ] Setup automated reconciliation reports

---

## Razorpay Dashboard Configuration

**Important Settings**:

1. **Webhooks**: Configure at https://dashboard.razorpay.com/webhooks
   - URL: `https://grabtogo.in/api/webhooks/razorpay`
   - Events to subscribe:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `subscription.charged`
     - `subscription.cancelled`
     - `subscription.paused`
     - `order.paid`

2. **Checkout Settings**:
   - Theme color: `#DB4A2B` (brand color)
   - Company logo: Upload GrabtoGo logo
   - Business name: GrabtoGo

3. **Payment Methods** (Enable):
   - Cards (Debit/Credit)
   - UPI
   - Net Banking
   - Wallets (Paytm, PhonePe, etc.)
   - EMI (for high-value subscriptions)

---

## Support & Documentation

- **Razorpay Docs**: https://razorpay.com/docs/
- **API Reference**: https://razorpay.com/docs/api/
- **Subscriptions**: https://razorpay.com/docs/payments/subscriptions/
- **Webhooks**: https://razorpay.com/docs/webhooks/
- **Dashboard**: https://dashboard.razorpay.com/

---

## Contact & Access

**Production Account**:
- Dashboard: https://dashboard.razorpay.com/
- Credentials stored in: `.env` (local), Vercel env vars (production)

**Next Steps**: See Migration Path above.
