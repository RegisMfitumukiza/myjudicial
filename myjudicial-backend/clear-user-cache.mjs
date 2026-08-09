import { createClient } from 'redis';

async function clearUserCache() {
  const redis = createClient({
    url: 'rediss://default:gQAAAAAAAbn9AAIgcDIwNzczMDc0MzAxMWI0OWE0YTMwNGJmNGQ5NTMwMTY3Nw@free-rooster-113149.upstash.io:6379'
  });

  try {
    await redis.connect();
    console.log('Connected to Redis');

    // Clear all user cache keys
    const userCacheKeys = await redis.keys('user:*');
    console.log(`Found ${userCacheKeys.length} user cache keys`);

    if (userCacheKeys.length > 0) {
      await redis.del(userCacheKeys);
      console.log(`Deleted ${userCacheKeys.length} user cache keys`);
    }

    // Clear all revoked token keys
    const revokedKeys = await redis.keys('revoked:*');
    console.log(`Found ${revokedKeys.length} revoked token keys`);

    if (revokedKeys.length > 0) {
      await redis.del(revokedKeys);
      console.log(`Deleted ${revokedKeys.length} revoked token keys`);
    }

    console.log('User cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
  } finally {
    await redis.quit();
  }
}

clearUserCache();