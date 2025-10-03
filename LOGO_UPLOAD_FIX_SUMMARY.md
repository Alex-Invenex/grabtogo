# Logo Upload Fix Summary

## Problem
Users could not upload logos or banners in the vendor registration form. File chooser dialogs would spawn infinitely (65+ dialogs) when the page loaded.

## Root Cause
The issue was caused by React Hook Form's `mode: 'onChange'` validation mode in `RegistrationWizard.tsx` line 121. When combined with:
- File input elements
- `event.target.value = ''` reset in upload handlers
- Form state changes triggering re-validation

This created an infinite validation loop that spawned file chooser dialogs on every render.

## Files Changed

### 1. `/src/app/(main)/auth/register/vendor/components/RegistrationWizard.tsx`
**Line 121**: Changed form mode from `'onChange'` to `'onBlur'`

```typescript
// BEFORE (BROKEN):
const methods = useForm({
  mode: 'onChange',  // ❌ Causes infinite re-renders with file inputs
  resolver: zodResolver(vendorRegistrationSchema),
  ...
});

// AFTER (FIXED):
const methods = useForm({
  mode: 'onBlur',  // ✅ Prevents infinite re-renders
  resolver: zodResolver(vendorRegistrationSchema),
  ...
});
```

### 2. `/src/app/(main)/auth/register/vendor/components/steps/LogoBrandingStep.tsx`
**Lines 99-162 & 164-219**: Removed `FormField` wrapper with inline render prop

```typescript
// BEFORE (BROKEN):
<FormField
  control={control}
  name="logo"
  render={() => (  // ❌ Creates new function every render, causing component remount
    <FormItem>
      {/* ... content ... */}
    </FormItem>
  )}
/>

// AFTER (FIXED):
<FormItem>
  {/* Direct implementation without render prop wrapper */}
  {/* ... content ... */}
</FormItem>
```

## Secondary Improvements Applied

### All Upload Step Components
Applied `useCallback` pattern to memoize upload handlers:

1. **LogoBrandingStep.tsx**
   - Memoized `handleLogoUpload` and `handleBannerUpload`
   - Added `useRef` for file input references
   - Added `useEffect` for state synchronization

2. **DocumentUploadStep.tsx**
   - Memoized `handleFileSelect` and `removeFile`

3. **GSTDocumentStep.tsx**
   - Memoized `handleFileSelect`, `removeFile`, `handleDragOver`, `handleDrop`, and `handleInputChange`

## Test Results
✅ No more infinite file chooser dialogs spawning
✅ Page loads correctly without errors
✅ Form validation works on blur instead of every change
✅ Upload functionality preserved

## Why The Fix Works

1. **Form Mode Change (`onBlur` vs `onChange`)**:
   - `onChange`: Validates on every input change → triggers re-render → resets file input → triggers onChange again → infinite loop
   - `onBlur`: Validates only when field loses focus → no re-render loop → file inputs work normally

2. **Removed FormField Render Prop**:
   - Inline arrow functions in render props create new function references on every render
   - New function reference = new component identity = React unmounts and remounts the component
   - Remounting breaks label-input association and prevents clicks from working
   - Direct `FormItem` implementation maintains stable component identity

## Additional Notes

- The `useCallback` improvements are still valuable for preventing unnecessary re-renders
- The form still validates properly, just on blur events instead of every keystroke
- This provides a better UX for file uploads while maintaining form validation integrity

## Verified By
- Browser testing showing no file chooser spawn
- Server compiled successfully with no errors
- Vendor registration page loads without infinite dialogs
