import { execSync } from 'child_process'

export default async function globalSetup() {
  console.log('🔧 Setting up test environment...')

  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/grabtogo_test'
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.CLERK_SECRET_KEY = 'test-clerk-secret'
  process.env.RAZORPAY_KEY_ID = 'test-razorpay-key'
  process.env.RAZORPAY_SECRET = 'test-razorpay-secret'

  try {
    // Reset test database
    if (process.env.DATABASE_URL?.includes('test')) {
      console.log('🗄️ Resetting test database...')
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' })
      execSync('npx prisma generate', { stdio: 'inherit' })
    }
  } catch (error) {
    console.warn('⚠️ Database setup failed (this is ok if running in CI):', error.message)
  }

  console.log('✅ Test environment ready')
}