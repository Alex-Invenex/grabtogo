import { AuthUser } from './auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      userId?: string;
      clerkUser?: any;
    }
  }
}

export {};