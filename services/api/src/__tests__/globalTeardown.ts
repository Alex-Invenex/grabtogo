export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')

  // Clean up any global resources
  // Note: Individual test cleanup should be handled in afterEach/afterAll hooks

  console.log('✅ Test cleanup complete')
}