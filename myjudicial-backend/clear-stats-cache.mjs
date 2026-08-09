#!/usr/bin/env node
/**
 * Clear Admin Stats Cache
 * 
 * This script clears the cached statistics in Redis
 */

import 'dotenv/config';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ REDIS_URL not found in environment variables');
  process.exit(1);
}

async function clearStatsCache() {
  const redis = createClient({
    url: REDIS_URL,
  });

  try {
    console.log('🔌 Connecting to Redis...\n');
    await redis.connect();
    console.log('✅ Connected successfully\n');

    // Clear admin stats cache
    console.log('🗑️  Clearing admin stats cache...\n');
    
    const patterns = [
      'admin:experts:stats*',
      'admin:stats*',
      'expert:*',
      'user:*',
    ];

    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys matching "${pattern}"`);
        for (const key of keys) {
          await redis.del(key);
          console.log(`  ✓ Deleted: ${key}`);
        }
        totalDeleted += keys.length;
      }
    }

    console.log(`\n✅ Cleared ${totalDeleted} cache entries\n`);
    console.log('Next steps:');
    console.log('  1. Refresh admin dashboard (Ctrl+R or F5)');
    console.log('  2. Stats should now show correct values');
    console.log('  3. Expected: Verified = 0 or 1 (depending on Mugisha\'s actual status)\n');

  } catch (error) {
    console.error('\n❌ Error clearing cache:', error.message);
    throw error;
  } finally {
    await redis.quit();
    console.log('🔌 Redis connection closed\n');
  }
}

console.log('\n' + '='.repeat(80));
console.log('🗑️  CLEAR ADMIN STATS CACHE');
console.log('='.repeat(80) + '\n');

clearStatsCache()
  .then(() => {
    console.log('✅ Cache cleared successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to clear cache:', error.message);
    process.exit(1);
  });
