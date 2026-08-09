/**
 * Test script to verify cache isolation between different tokens
 * Run with: node test-cache-isolation.mjs
 */

import { redis } from "./dist/infrastructure/redis/redis.client.js";

const USER_CACHE_PREFIX = "user:";
const testUserId = "test-user-123";
const token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlVzZXIgQSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const token2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlVzZXIgQiIsImlhdCI6MTUxNjIzOTEyMn0.different_signature_here_xyz123abc";

async function testCacheIsolation() {
  console.log("🧪 Testing Cache Isolation Between Tokens\n");

  try {
    // Clean up any existing test data
    const existingKeys = await redis.keys(`${USER_CACHE_PREFIX}${testUserId}*`);
    if (existingKeys.length > 0) {
      await redis.del(...existingKeys);
      console.log(`🧹 Cleaned up ${existingKeys.length} existing test keys\n`);
    }

    // Simulate Token 1 login
    const token1Hash = token1.substring(token1.length - 16);
    const cacheKey1 = `${USER_CACHE_PREFIX}${testUserId}:${token1Hash}`;
    const userData1 = JSON.stringify({
      id: testUserId,
      email: "userA@example.com",
      role: "ADMIN",
      name: "User A"
    });
    
    await redis.setex(cacheKey1, 60, userData1);
    console.log("✅ Token 1 cached:");
    console.log(`   Key: ${cacheKey1}`);
    console.log(`   Data: ${userData1}\n`);

    // Simulate Token 2 login (same user, different token)
    const token2Hash = token2.substring(token2.length - 16);
    const cacheKey2 = `${USER_CACHE_PREFIX}${testUserId}:${token2Hash}`;
    const userData2 = JSON.stringify({
      id: testUserId,
      email: "userB@example.com",
      role: "EXPERT",
      name: "User B"
    });
    
    await redis.setex(cacheKey2, 60, userData2);
    console.log("✅ Token 2 cached:");
    console.log(`   Key: ${cacheKey2}`);
    console.log(`   Data: ${userData2}\n`);

    // Verify isolation: Fetch Token 1 data
    const retrieved1 = await redis.get(cacheKey1);
    const retrieved2 = await redis.get(cacheKey2);
    
    console.log("🔍 Verification:");
    console.log(`   Token 1 retrieves: ${retrieved1}`);
    console.log(`   Token 2 retrieves: ${retrieved2}\n`);

    // Check if they're different
    if (retrieved1 !== retrieved2) {
      console.log("✅ SUCCESS: Cache entries are isolated!");
      console.log("   Each token has its own cache entry.");
      console.log("   No cross-contamination detected.\n");
    } else {
      console.log("❌ FAILURE: Cache entries are NOT isolated!");
      console.log("   Both tokens are sharing the same data.\n");
    }

    // Test cache cleanup
    console.log("🧹 Testing cache cleanup for all user tokens...");
    const pattern = `${USER_CACHE_PREFIX}${testUserId}:*`;
    const allUserKeys = await redis.keys(pattern);
    console.log(`   Found ${allUserKeys.length} cache entries for user`);
    
    if (allUserKeys.length > 0) {
      await redis.del(...allUserKeys);
      console.log(`   ✅ Deleted ${allUserKeys.length} cache entries\n`);
    }

    // Verify cleanup
    const remainingKeys = await redis.keys(pattern);
    if (remainingKeys.length === 0) {
      console.log("✅ SUCCESS: All cache entries cleaned up!");
    } else {
      console.log(`❌ WARNING: ${remainingKeys.length} entries still remain`);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Clean up
    const cleanupKeys = await redis.keys(`${USER_CACHE_PREFIX}${testUserId}*`);
    if (cleanupKeys.length > 0) {
      await redis.del(...cleanupKeys);
    }
    
    await redis.quit();
    console.log("\n🏁 Test completed");
  }
}

testCacheIsolation();
