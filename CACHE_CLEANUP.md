# Automatic Cache Cleanup

## Overview

The development server now automatically clears caches when stopped or killed. This ensures a clean state between development sessions.

## What Gets Cleared

When you stop the dev server (Ctrl+C or kill process), the following caches are automatically cleared:

1. **Redis Cache** - All cached data including:
   - Admin data (`admin:*`)
   - Session data (`session:*`)
   - User data (`user:*`)
   - Notifications (`notifications:*`)
   - All other cached keys

2. **Next.js Build Cache** - The `.next/cache` directory containing:
   - Compiled pages
   - API route caches
   - Static optimization artifacts

## How It Works

### Implementation

The cleanup is handled by `/scripts/clear-cache-on-exit.js` which:

1. Wraps the Next.js dev server process
2. Listens for termination signals (SIGINT, SIGTERM, SIGHUP)
3. On shutdown:
   - Flushes all Redis keys
   - Removes Next.js cache directory
   - Exits gracefully

### Signals Handled

- `SIGINT` - Ctrl+C in terminal
- `SIGTERM` - Kill command
- `SIGHUP` - Terminal window closed

## Usage

### Normal Development (with auto-cleanup)

```bash
npm run dev
```

When you press Ctrl+C to stop the server, you'll see:

```
📡 Received SIGINT signal
🛑 Server shutdown detected...
🧹 Clearing Redis cache...
✅ Redis cache cleared
🧹 Clearing Next.js cache...
✅ Next.js cache cleared
✨ Cache cleanup complete
```

### Development Without Auto-Cleanup

If you need to preserve cache between restarts:

```bash
npm run dev:no-cleanup
```

This runs `next dev` directly without the cleanup wrapper.

## Manual Cache Clearing

### Via Script

```bash
node scripts/clear-cache-on-exit.js
# Then immediately Ctrl+C to trigger cleanup
```

### Via API (Admin Only)

```bash
curl -X POST http://localhost:3000/api/admin/clear-cache \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Directly in Redis

```bash
redis-cli FLUSHALL
```

### Directly Remove Next.js Cache

```bash
rm -rf .next/cache
```

## Troubleshooting

### Redis Not Available

If Redis is not running, you'll see:

```
⚠️  Redis not available (cache not cleared)
```

This is normal and won't affect development - the cleanup script continues gracefully.

### Cache Not Clearing

1. Check if the cleanup script is executable:
   ```bash
   ls -la scripts/clear-cache-on-exit.js
   ```

2. Verify the script is being used:
   ```bash
   cat package.json | grep "\"dev\":"
   # Should show: "dev": "node scripts/clear-cache-on-exit.js"
   ```

3. Test manually:
   ```bash
   npm run dev
   # Press Ctrl+C immediately
   # You should see cleanup messages
   ```

## Benefits

1. **Clean Development State** - No stale cache between sessions
2. **Easier Debugging** - Cache-related issues are eliminated on restart
3. **Consistent Behavior** - Every dev session starts fresh
4. **Automatic** - No manual cache clearing needed

## Configuration

The cleanup script uses environment variables from `.env`:

- `REDIS_HOST` - Redis server host (default: `localhost`)
- `REDIS_PORT` - Redis server port (default: `6379`)
- `REDIS_PASSWORD` - Redis password (optional)

## Notes

- This feature is only active in development mode (`npm run dev`)
- Production builds use `npm run build` which doesn't include cleanup
- The cleanup adds ~1-2 seconds to shutdown time
- Failed cache operations are logged but won't prevent server shutdown
