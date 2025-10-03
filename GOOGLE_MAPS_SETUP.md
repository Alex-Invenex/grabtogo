# Google Maps API Setup Guide

## ✅ Quick Fix Applied

The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` has been added to your `.env` file with a demo key. The error should now be resolved.

**Current Status**: The Google Maps location picker should now work in development.

---

## 🔑 Getting Your Own Google Maps API Key (Recommended for Production)

For production use, you should obtain your own Google Maps API key. Here's how:

### Step 1: Go to Google Cloud Console

Visit: [Google Cloud Console](https://console.cloud.google.com/)

### Step 2: Create a New Project (or select existing)

1. Click on the project dropdown at the top
2. Click "New Project"
3. Name it (e.g., "GrabtoGo")
4. Click "Create"

### Step 3: Enable Required APIs

You need to enable these Google Maps APIs:

1. Go to **APIs & Services** → **Library**
2. Search for and enable each of these:
   - ✅ **Maps JavaScript API** (for displaying maps)
   - ✅ **Geocoding API** (for address lookup)
   - ✅ **Places API** (for location search)

### Step 4: Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **API key**
3. Your API key will be generated
4. **Important**: Restrict your API key immediately (see below)

### Step 5: Restrict Your API Key (CRITICAL for Security)

**⚠️ NEVER deploy an unrestricted API key to production!**

1. Click on your newly created API key
2. Under **API restrictions**:
   - Select "Restrict key"
   - Check only the APIs you enabled:
     - Maps JavaScript API
     - Geocoding API
     - Places API

3. Under **Application restrictions**:
   - For **development**: Select "HTTP referrers (web sites)"
     - Add: `http://localhost:3000/*`
     - Add: `http://localhost:*`

   - For **production**: Add your domain
     - Add: `https://yourdomain.com/*`
     - Add: `https://*.yourdomain.com/*`

4. Click **Save**

### Step 6: Add to Your .env File

Replace the demo key in your `.env` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
```

### Step 7: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## 💰 Pricing Information

Google Maps provides **$200 of free usage per month**, which includes:

- **Maps JavaScript API**: 28,000 map loads/month
- **Geocoding API**: 40,000 requests/month
- **Places API**: Varies by request type

For a typical marketplace application, the free tier is usually sufficient during development and early production.

**Monitor your usage**: [Google Cloud Console → Billing](https://console.cloud.google.com/billing)

---

## 🧪 Testing Your API Key

After adding your API key, test it by:

1. Restart your dev server: `npm run dev`
2. Navigate to vendor registration: http://localhost:3000/auth/register/vendor
3. Go to Step 3 (Address & Location)
4. The map should load without errors
5. Try searching for a location
6. Try clicking on the map to drop a pin

---

## 🔧 Features Using Google Maps in Your App

The following features use Google Maps API:

1. **Vendor Registration** (Step 3):
   - Location picker for business address
   - Search for business location
   - Drag marker to adjust location
   - Get current location

2. **Vendor Profile Management**:
   - Update business location
   - Set delivery radius

3. **Customer Experience**:
   - Find vendors near user location
   - Display vendor locations on map
   - Calculate delivery distance

---

## ⚠️ Common Issues & Solutions

### Issue 1: "This page can't load Google Maps correctly"

**Solution**: Your API key is either:
- Not set in `.env` file
- Restricted to wrong domain
- Doesn't have required APIs enabled

**Fix**:
1. Check `.env` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Verify API restrictions in Google Cloud Console
3. Ensure all 3 APIs are enabled (Maps JavaScript, Geocoding, Places)

### Issue 2: Map loads but search doesn't work

**Solution**: Places API not enabled

**Fix**: Enable "Places API" in Google Cloud Console

### Issue 3: Map loads but geocoding (address lookup) fails

**Solution**: Geocoding API not enabled

**Fix**: Enable "Geocoding API" in Google Cloud Console

### Issue 4: API key exposed in browser console

**This is normal and expected!**

The API key is **public** (starts with `NEXT_PUBLIC_`). This is why:
- ✅ API restrictions are critical
- ✅ HTTP referrer restrictions protect you
- ✅ API-specific restrictions limit abuse

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] Obtained your own Google Maps API key
- [ ] Enabled all required APIs (Maps JavaScript, Geocoding, Places)
- [ ] Restricted API key to your production domain
- [ ] Restricted API key to only required APIs
- [ ] Set up billing alerts in Google Cloud Console
- [ ] Added production domain to HTTP referrer restrictions
- [ ] Tested location picker on production domain
- [ ] Updated `.env` or environment variables on hosting platform

---

## 📚 Additional Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Places API Documentation](https://developers.google.com/maps/documentation/places)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Pricing Calculator](https://mapsplatformtransition.withgoogle.com/calculator)

---

## 🆘 Support

If you encounter issues:

1. Check the browser console for specific error messages
2. Verify API key restrictions in Google Cloud Console
3. Ensure all required APIs are enabled
4. Check your billing account is active

---

**Last Updated**: October 3, 2025
