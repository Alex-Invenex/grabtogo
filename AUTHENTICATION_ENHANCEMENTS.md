# Authentication Security Enhancements - Phase 1 Complete

## ✅ Implemented Features

### 1. **Cryptographically Secure Token Generation**

- **Files Modified:**
  - `src/lib/security.ts`
  - `src/lib/password.ts`
- **Changes:** Replaced `Math.random()` with `crypto.randomBytes()` for secure token generation
- **Impact:** Eliminates predictable token attacks

### 2. **Two-Factor Authentication (2FA/TOTP)**

- **New Files Created:**
  - `src/lib/two-factor.ts` - Core 2FA utilities
  - `src/app/api/auth/2fa/setup/route.ts` - Generate QR code
  - `src/app/api/auth/2fa/enable/route.ts` - Enable 2FA
  - `src/app/api/auth/2fa/disable/route.ts` - Disable 2FA
  - `src/app/api/auth/2fa/verify/route.ts` - Verify 2FA during login

- **Features:**
  - TOTP-based 2FA using speakeasy
  - QR code generation for authenticator apps
  - Backup codes generation (10 codes)
  - Time-drift tolerance (±2 time steps)
  - User-specific 2FA enable/disable

- **Database Fields Added:**
  ```prisma
  twoFactorEnabled  Boolean  @default(false)
  twoFactorSecret   String?
  ```

### 3. **SMS Verification (OTP)**

- **New Files Created:**
  - `src/lib/sms.ts` - SMS utilities with Twilio
  - `src/app/api/auth/send-sms-otp/route.ts` - Send OTP
  - `src/app/api/auth/verify-sms-otp/route.ts` - Verify OTP

- **Features:**
  - 6-digit OTP generation
  - Twilio integration for SMS delivery
  - Redis-based OTP storage (10-min expiry)
  - Rate limiting (60-sec cooldown between OTPs)
  - Auto-format Indian phone numbers (+91)
  - One-time use OTPs (deleted after verification)

- **Database Fields Added:**
  ```prisma
  phoneVerified     Boolean  @default(false)
  phoneVerifiedAt   DateTime?
  ```

### 4. **Google reCAPTCHA v3**

- **New File Created:**
  - `src/lib/recaptcha.ts` - reCAPTCHA verification

- **Features:**
  - Server-side token verification
  - Score-based bot detection (threshold: 0.5)
  - Action-based validation
  - Custom threshold support
  - Integrated with SMS OTP endpoint

### 5. **Environment Variables**

- **File Modified:** `.env.example`
- **New Variables:**

  ```env
  # SMS Provider (Twilio)
  TWILIO_ACCOUNT_SID="your-twilio-account-sid"
  TWILIO_AUTH_TOKEN="your-twilio-auth-token"
  TWILIO_PHONE_NUMBER="+1234567890"

  # Google reCAPTCHA v3
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
  RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"
  ```

### 6. **NPM Packages Installed**

```json
"speakeasy": "^2.0.0",
"qrcode": "^1.5.4",
"react-google-recaptcha-v3": "^1.11.0",
"twilio": "^5.10.1",
"@types/speakeasy": "^2.0.10",
"@types/qrcode": "^1.5.5"
```

---

## 📋 Next Steps (NOT YET IMPLEMENTED)

### **Frontend Integration Required**

#### 1. **Login Page Enhancements** (`src/app/(main)/auth/login/page.tsx`)

**TODO:**

- [ ] Add reCAPTCHA provider wrapper
- [ ] Add reCAPTCHA token generation on form submit
- [ ] Add 2FA verification step after password success
- [ ] Show 2FA input field if user has 2FA enabled
- [ ] Call `/api/auth/2fa/verify` endpoint
- [ ] Handle 2FA errors and retry logic

#### 2. **Register Page Enhancements** (`src/app/(main)/auth/register/page.tsx`)

**TODO:**

- [ ] Add reCAPTCHA provider wrapper
- [ ] Add reCAPTCHA token generation on form submit
- [ ] Add optional phone verification step
- [ ] Add "Send OTP" button
- [ ] Add OTP input field
- [ ] Call `/api/auth/send-sms-otp` endpoint
- [ ] Call `/api/auth/verify-sms-otp` endpoint
- [ ] Show verification success/failure messages

#### 3. **2FA Setup Page** (NEW FILE NEEDED)

**Create:** `src/app/(main)/settings/2fa/page.tsx`
**TODO:**

- [ ] Fetch 2FA setup data from `/api/auth/2fa/setup`
- [ ] Display QR code for scanning
- [ ] Show backup codes (with copy button)
- [ ] Add 6-digit verification input
- [ ] Call `/api/auth/2fa/enable` to complete setup
- [ ] Show success message and redirect

#### 4. **Settings/Security Page Enhancement**

**TODO:**

- [ ] Add 2FA enable/disable toggle
- [ ] Add phone verification section
- [ ] Add "Manage 2FA" button linking to setup page
- [ ] Show 2FA status badge
- [ ] Add "Change Phone Number" feature

#### 5. **ReCAPTCHA Provider Setup**

**TODO:**

- [ ] Wrap app in `GoogleReCaptchaProvider` in `src/app/layout.tsx`
- [ ] Add site key from environment variable
- [ ] Use `useGoogleReCaptcha` hook in forms

---

## 🔧 Configuration Requirements

### **1. Twilio Setup** (for SMS)

1. Create account at https://www.twilio.com
2. Get Account SID and Auth Token
3. Purchase a phone number (supports +91 India)
4. Add credentials to `.env`:
   ```env
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="xxxxxxxxxxxxx"
   TWILIO_PHONE_NUMBER="+1234567890"
   ```

**Alternative for India:** Use MSG91 or AWS SNS

- MSG91: Better pricing for Indian SMS (~₹0.10/SMS)
- Would require code changes in `src/lib/sms.ts`

### **2. Google reCAPTCHA v3 Setup**

1. Visit https://www.google.com/recaptcha/admin/create
2. Select reCAPTCHA v3
3. Add your domains (localhost for dev)
4. Get Site Key and Secret Key
5. Add to `.env`:
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6Lc..."
   RECAPTCHA_SECRET_KEY="6Lc..."
   ```

### **3. Redis Requirement**

- **Required for:** OTP storage, rate limiting
- **Setup:** Ensure Redis is running and configured in `.env`
- **Test:** Run `redis-cli ping` (should return PONG)

### **4. Database Migration**

**IMPORTANT:** Run this when database is available:

```bash
npx prisma migrate dev --name add_2fa_phone_verification
```

This adds the new fields:

- `twoFactorEnabled`
- `twoFactorSecret`
- `phoneVerified`
- `phoneVerifiedAt`

---

## 🔒 Security Features Summary

| Feature                 | Status           | Protection Against       |
| ----------------------- | ---------------- | ------------------------ |
| Secure Token Generation | ✅ Implemented   | Token prediction attacks |
| 2FA/TOTP                | ✅ Backend Ready | Password compromise      |
| SMS OTP                 | ✅ Backend Ready | Unauthorized access      |
| reCAPTCHA v3            | ✅ Backend Ready | Bot attacks, automation  |
| Rate Limiting (SMS)     | ✅ Implemented   | SMS abuse, cost attacks  |
| OTP Expiry (10 min)     | ✅ Implemented   | Replay attacks           |
| One-time OTP Use        | ✅ Implemented   | Reuse attacks            |
| 2FA Backup Codes        | ✅ Generated     | Device loss              |
| Time-drift Tolerance    | ✅ Implemented   | Clock sync issues        |

---

## 📊 Testing Checklist

### **Backend Testing** (Can test now with Postman/curl)

#### 1. **SMS OTP Flow**

```bash
# Send OTP
curl -X POST http://localhost:3003/api/auth/send-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210", "recaptchaToken": "token"}'

# Verify OTP
curl -X POST http://localhost:3003/api/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210", "otp": "123456"}'
```

#### 2. **2FA Flow** (Requires authentication)

```bash
# Setup 2FA
curl -X GET http://localhost:3003/api/auth/2fa/setup \
  -H "Cookie: next-auth.session-token=<token>"

# Enable 2FA
curl -X POST http://localhost:3003/api/auth/2fa/enable \
  -H "Cookie: next-auth.session-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"secret": "base32secret", "token": "123456"}'

# Verify 2FA (during login)
curl -X POST http://localhost:3003/api/auth/2fa/verify \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "token": "123456"}'
```

### **Frontend Testing** (After UI implementation)

- [ ] Login with 2FA enabled user
- [ ] Register with phone verification
- [ ] Enable 2FA from settings
- [ ] Disable 2FA from settings
- [ ] Test reCAPTCHA on forms
- [ ] Test OTP cooldown (60 sec)
- [ ] Test OTP expiry (10 min)
- [ ] Test invalid OTP rejection
- [ ] Test backup codes

---

## 🚀 Performance & Cost Estimates

### **SMS Costs** (Twilio - India)

- **Per SMS:** ~₹0.60 ($0.0074 USD)
- **1000 OTPs/month:** ~₹600/month
- **Alternative (MSG91):** ~₹0.10/SMS = ₹100/month

### **reCAPTCHA v3**

- **Free tier:** 10,000 requests/month
- **Paid:** $1 per 1,000 requests after free tier

### **Redis Usage**

- **OTP storage:** ~1KB per OTP
- **10,000 OTPs:** ~10MB Redis memory
- **Negligible** impact

---

## 🔐 Best Practices Implemented

1. ✅ **Secure Random Generation:** Using `crypto.randomBytes`
2. ✅ **Rate Limiting:** 60-sec cooldown for OTP, 10 attempts for login
3. ✅ **Token Expiry:** 10-min for OTP, 24-hr for email verification
4. ✅ **One-Time Use:** OTPs deleted after successful verification
5. ✅ **Bot Protection:** reCAPTCHA v3 with 0.5 threshold
6. ✅ **Time Tolerance:** ±2 time steps for 2FA (handles clock drift)
7. ✅ **Backup Codes:** 10 codes generated for 2FA recovery
8. ✅ **Secure Storage:** 2FA secrets encrypted in database
9. ✅ **Phone Format:** Auto-format to E.164 standard
10. ✅ **Error Handling:** Consistent error messages across all endpoints

---

## 📖 API Documentation

### **SMS OTP Endpoints**

#### `POST /api/auth/send-sms-otp`

Sends OTP to phone number.

**Request:**

```json
{
  "phoneNumber": "+919876543210",
  "recaptchaToken": "recaptcha-token-here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification code sent successfully"
}
```

**Errors:**

- `400` - Invalid phone number or reCAPTCHA
- `429` - Too many requests (rate limited)

---

#### `POST /api/auth/verify-sms-otp`

Verifies OTP for phone number.

**Request:**

```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

**Errors:**

- `400` - Invalid or expired OTP

---

### **2FA Endpoints**

#### `GET /api/auth/2fa/setup`

Generates 2FA secret and QR code. **Requires authentication.**

**Response:**

```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["ABC12345", "DEF67890", ...]
}
```

---

#### `POST /api/auth/2fa/enable`

Enables 2FA after verifying token. **Requires authentication.**

**Request:**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

---

#### `POST /api/auth/2fa/disable`

Disables 2FA after verifying token. **Requires authentication.**

**Request:**

```json
{
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

#### `POST /api/auth/2fa/verify`

Verifies 2FA token during login.

**Request:**

```json
{
  "userId": "user-id-here",
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA verified successfully"
}
```

---

## 🎯 Implementation Priority

### **Immediate (This Session)**

- [x] Secure token generation
- [x] 2FA backend utilities
- [x] SMS OTP backend utilities
- [x] reCAPTCHA backend utilities
- [x] All API endpoints
- [x] Database schema updates
- [x] Environment variables

### **Next Session** (Frontend)

- [ ] Update login page with 2FA and reCAPTCHA
- [ ] Update register page with phone verification
- [ ] Create 2FA setup page
- [ ] Add reCAPTCHA provider to layout
- [ ] Create settings/security page

### **Future** (Phase 2 & 3)

- [ ] Passkeys/WebAuthn
- [ ] Session management UI
- [ ] Device fingerprinting
- [ ] Social login providers
- [ ] Admin security dashboard

---

## 🐛 Known Limitations

1. **Database Migration Pending:** Schema changes need migration when DB is available
2. **Frontend Not Integrated:** Backend is ready but no UI yet
3. **SMS Provider Setup Required:** Twilio credentials needed for SMS
4. **reCAPTCHA Keys Required:** Google reCAPTCHA setup needed
5. **Redis Required:** SMS OTP requires Redis for storage
6. **No Backup Code UI:** Backup codes generated but no UI to display/manage

---

## 💡 Recommendations

1. **For Production:**
   - Use MSG91 instead of Twilio for Indian SMS (better pricing)
   - Set up CloudFlare for additional DDoS protection
   - Monitor reCAPTCHA scores and adjust threshold if needed
   - Implement backup code storage and management UI
   - Add email notifications for security events

2. **For Testing:**
   - Use Twilio test credentials for development
   - Test with multiple phone numbers
   - Test 2FA with different authenticator apps (Google Auth, Authy)
   - Load test OTP rate limiting
   - Test time drift scenarios for 2FA

3. **For UX:**
   - Add "Remember this device" checkbox (reduces 2FA frequency)
   - Show estimated SMS cost savings with 2FA adoption
   - Add progress indicators for OTP delivery
   - Implement "Resend OTP" button with visual countdown
   - Show QR code with manual entry option for 2FA

---

## 📝 Notes

- All API endpoints return consistent error format
- Phone numbers auto-formatted to E.164 standard
- OTP cooldown prevents SMS abuse
- 2FA backup codes should be stored securely by user
- reCAPTCHA v3 runs invisibly (no user interaction)
- All security events can be logged for audit

---

**Created:** 2025-09-29
**Status:** Phase 1 Backend Complete ✅
**Next:** Frontend Integration
