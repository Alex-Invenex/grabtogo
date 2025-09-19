import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CustomError } from '../types/api';

export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (error instanceof CustomError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
      errors: error.errors
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'Duplicate entry found',
        error: 'A record with this information already exists'
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
        error: 'The requested resource was not found'
      });
      return;
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};

export const notFoundHandler = (req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.path}`
  });
};