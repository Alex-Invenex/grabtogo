#!/usr/bin/env node

/**
 * Cache cleanup script for development server
 * Clears Redis cache and Next.js build cache when server is killed
 */

const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Track if cleanup has been performed
let cleanupDone = false;

async function clearRedisCache() {
  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 0,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    await redis.connect();
    console.log('🧹 Clearing Redis cache...');
    await redis.flushall();
    console.log('✅ Redis cache cleared');
    await redis.quit();
  } catch (error) {
    // Silently ignore if Redis is not available
    console.log('⚠️  Redis not available (cache not cleared)');
  }
}

async function clearNextCache() {
  try {
    const nextCachePath = path.join(process.cwd(), '.next/cache');
    if (fs.existsSync(nextCachePath)) {
      console.log('🧹 Clearing Next.js cache...');
      fs.rmSync(nextCachePath, { recursive: true, force: true });
      console.log('✅ Next.js cache cleared');
    }
  } catch (error) {
    console.error('❌ Failed to clear Next.js cache:', error.message);
  }
}

async function performCleanup() {
  if (cleanupDone) return;
  cleanupDone = true;

  console.log('\n🛑 Server shutdown detected...');

  // Clear caches
  await clearRedisCache();
  await clearNextCache();

  console.log('✨ Cache cleanup complete\n');
}

// Start Next.js dev server
const nextDev = spawn('next', ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

// Handle cleanup on various exit signals
const exitHandler = async (signal) => {
  console.log(`\n📡 Received ${signal} signal`);

  // Perform cleanup
  await performCleanup();

  // Kill the Next.js process
  if (nextDev && !nextDev.killed) {
    nextDev.kill(signal);
  }

  // Exit with appropriate code
  process.exit(signal === 'SIGINT' ? 0 : 1);
};

// Register signal handlers
process.on('SIGINT', () => exitHandler('SIGINT'));  // Ctrl+C
process.on('SIGTERM', () => exitHandler('SIGTERM')); // Kill command
process.on('SIGHUP', () => exitHandler('SIGHUP'));   // Terminal closed

// Handle Next.js process exit
nextDev.on('exit', async (code, signal) => {
  await performCleanup();
  process.exit(code || 0);
});

// Handle errors
nextDev.on('error', (error) => {
  console.error('❌ Failed to start Next.js dev server:', error);
  process.exit(1);
});

console.log('🚀 Next.js dev server started with auto-cleanup on exit\n');
