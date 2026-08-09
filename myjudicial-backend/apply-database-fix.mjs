#!/usr/bin/env node
/**
 * Apply Database Fix for Expert Verification Status
 * 
 * This script fixes experts that have PENDING_VERIFICATION status
 * but no actual verification record (documents not submitted).
 */

import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function applyFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Step 1: Check current state
    console.log('📊 STEP 1: Checking current expert status...\n');
    console.log('='.repeat(80));
    
    const checkQuery = `
      SELECT 
        u.email,
        u."firstName" || ' ' || u."lastName" as full_name,
        ep.status as profile_status,
        ep."barNumber",
        ev.id as verification_id,
        ev.status as verification_status,
        ev."createdAt" as docs_submitted_at
      FROM users u
      JOIN experts ep ON ep."userId" = u.id
      LEFT JOIN expert_verifications ev ON ev."expertId" = ep.id
      WHERE u.role = 'EXPERT'
      ORDER BY u."createdAt" DESC;
    `;

    const checkResult = await client.query(checkQuery);
    
    console.log(`Found ${checkResult.rows.length} expert(s):\n`);
    checkResult.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.full_name} (${row.email})`);
      console.log(`   Profile Status: ${row.profile_status}`);
      console.log(`   Bar Number: ${row.barNumber || 'Not set'}`);
      console.log(`   Verification Record: ${row.verification_id ? 'EXISTS' : '❌ MISSING'}`);
      console.log(`   Verification Status: ${row.verification_status || 'N/A'}`);
      console.log('');
    });

    // Step 2: Identify experts with issues
    console.log('\n📋 STEP 2: Identifying experts with PENDING_VERIFICATION but no verification...\n');
    console.log('='.repeat(80));

    const issuesQuery = `
      SELECT 
        u.email,
        u."firstName" || ' ' || u."lastName" as full_name,
        ep.id as expert_id,
        ep.status as profile_status
      FROM users u
      JOIN experts ep ON ep."userId" = u.id
      LEFT JOIN expert_verifications ev ON ev."expertId" = ep.id
      WHERE u.role = 'EXPERT'
        AND ep.status = 'PENDING_VERIFICATION'
        AND ev.id IS NULL;
    `;

    const issuesResult = await client.query(issuesQuery);
    
    if (issuesResult.rows.length === 0) {
      console.log('✅ No issues found! All experts are in consistent state.\n');
      return;
    }

    console.log(`Found ${issuesResult.rows.length} expert(s) with inconsistent status:\n`);
    issuesResult.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.full_name} (${row.email})`);
      console.log(`   Expert ID: ${row.expert_id}`);
      console.log(`   Issue: Status is PENDING_VERIFICATION but no verification record exists`);
      console.log('');
    });

    // Step 3: Apply fix
    console.log('\n🔧 STEP 3: Applying fix (resetting to DRAFT status)...\n');
    console.log('='.repeat(80));

    const updateQuery = `
      UPDATE experts
      SET status = 'DRAFT'
      WHERE id IN (
        SELECT ep.id
        FROM experts ep
        LEFT JOIN expert_verifications ev ON ev."expertId" = ep.id
        WHERE ep.status = 'PENDING_VERIFICATION'
          AND ev.id IS NULL
      )
      RETURNING id;
    `;

    const updateResult = await client.query(updateQuery);
    
    console.log(`✅ Updated ${updateResult.rows.length} expert(s) to DRAFT status\n`);

    // Step 4: Verify fix
    console.log('\n✅ STEP 4: Verifying fix...\n');
    console.log('='.repeat(80));

    const verifyResult = await client.query(checkQuery);
    
    console.log(`Expert status after fix:\n`);
    verifyResult.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.full_name} (${row.email})`);
      console.log(`   Profile Status: ${row.profile_status}`);
      console.log(`   Bar Number: ${row.barNumber || 'Not set'}`);
      console.log(`   Verification Record: ${row.verification_id ? 'EXISTS' : 'None (OK for DRAFT)'}`);
      console.log('');
    });

    // Step 5: Summary
    console.log('\n📊 STEP 5: Summary of all expert statuses...\n');
    console.log('='.repeat(80));

    const summaryQuery = `
      SELECT 
        ep.status as profile_status,
        COALESCE(ev.status::text, 'NO_SUBMISSION') as verification_status,
        COUNT(*) as count
      FROM experts ep
      LEFT JOIN expert_verifications ev ON ev."expertId" = ep.id
      GROUP BY ep.status, ev.status
      ORDER BY ep.status, ev.status;
    `;

    const summaryResult = await client.query(summaryQuery);
    
    console.log('Expert Status Distribution:\n');
    summaryResult.rows.forEach(row => {
      console.log(`  ${row.profile_status} + ${row.verification_status}: ${row.count}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ FIX COMPLETE!\n');
    console.log('Next steps:');
    console.log('  1. Restart backend server to clear any caches');
    console.log('  2. Refresh admin dashboard');
    console.log('  3. Verify stats show: Pending Review = 0, Verified = 0');
    console.log('  4. Have experts submit documents via proper flow');
    console.log('  5. Admin can then approve submissions\n');

  } catch (error) {
    console.error('\n❌ Error applying fix:', error.message);
    console.error(error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the fix
console.log('\n' + '='.repeat(80));
console.log('🔧 EXPERT VERIFICATION STATUS DATABASE FIX');
console.log('='.repeat(80));
console.log('\nThis will fix experts with PENDING_VERIFICATION status but no verification record.\n');

applyFix()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
