import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/api';
import '../types/express';

// Middleware to ensure user is a vendor
export const requireVendorRole = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'No user found in request'
    });
    return;
  }

  if (req.user.role !== 'VENDOR') {
    res.status(403).json({
      success: false,
      message: 'Vendor access required',
      error: 'This endpoint is only accessible to vendors'
    });
    return;
  }

  if (!req.user.vendor) {
    res.status(403).json({
      success: false,
      message: 'Vendor profile not found',
      error: 'User is marked as vendor but has no vendor profile'
    });
    return;
  }

  next();
};

// Middleware to ensure vendor is approved
export const requireApprovedVendor = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user?.vendor) {
    res.status(403).json({
      success: false,
      message: 'Vendor profile required',
      error: 'No vendor profile found'
    });
    return;
  }

  if (!req.user.vendor.isApproved) {
    res.status(403).json({
      success: false,
      message: 'Vendor approval required',
      error: 'Your vendor account must be approved by admin before accessing this feature'
    });
    return;
  }

  next();
};

// Middleware to ensure registration fee is paid
export const requireRegistrationFeePaid = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user?.vendor) {
    res.status(403).json({
      success: false,
      message: 'Vendor profile required',
      error: 'No vendor profile found'
    });
    return;
  }

  if (!req.user.vendor.registrationFeePaid) {
    res.status(402).json({
      success: false,
      message: 'Registration fee payment required',
      error: 'Please complete your registration fee payment before accessing this feature'
    });
    return;
  }

  next();
};

// Middleware to ensure vendor has active subscription
export const requireActiveSubscription = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user?.vendor) {
    res.status(403).json({
      success: false,
      message: 'Vendor profile required',
      error: 'No vendor profile found'
    });
    return;
  }

  const { subscriptionStatus, trialEndsAt } = req.user.vendor;

  // Check if vendor has active subscription or is still in trial
  if (subscriptionStatus === 'ACTIVE') {
    next();
    return;
  }

  if (subscriptionStatus === 'TRIAL' && trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);

    if (now <= trialEnd) {
      next();
      return;
    }
  }

  res.status(402).json({
    success: false,
    message: 'Active subscription required',
    error: 'Please subscribe to a plan to access this feature',
    data: {
      subscriptionStatus,
      trialEndsAt,
      needsSubscription: true
    }
  });
};

// Middleware to ensure user is admin
export const requireAdminRole = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'No user found in request'
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'This endpoint is only accessible to administrators'
    });
    return;
  }

  next();
};

// Combined middleware for full vendor access (approved + paid + active subscription)
export const requireFullVendorAccess = [
  requireVendorRole,
  requireApprovedVendor,
  requireRegistrationFeePaid,
  requireActiveSubscription
];

// Combined middleware for basic vendor access (just approved + paid)
export const requireBasicVendorAccess = [
  requireVendorRole,
  requireApprovedVendor,
  requireRegistrationFeePaid
];