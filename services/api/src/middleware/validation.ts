import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiResponse } from '../types/api';

export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};

    errors.array().forEach((error) => {
      const field = 'path' in error ? error.path : 'unknown';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'Please check the provided data',
      errors: formattedErrors
    });
    return;
  }

  next();
};

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .isIn(['CUSTOMER', 'VENDOR'])
    .withMessage('Role must be either CUSTOMER or VENDOR'),
  body('firstName')
    .if(body('role').equals('CUSTOMER'))
    .notEmpty()
    .withMessage('First name is required for customers')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .if(body('role').equals('CUSTOMER'))
    .notEmpty()
    .withMessage('Last name is required for customers')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('companyName')
    .if(body('role').equals('VENDOR'))
    .notEmpty()
    .withMessage('Company name is required for vendors')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('address')
    .if(body('role').equals('VENDOR'))
    .notEmpty()
    .withMessage('Address is required for vendors')
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array')
    .custom((categories) => {
      if (categories && categories.length > 10) {
        throw new Error('Maximum 10 categories allowed');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];