#!/usr/bin/env node
import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function checkState() {
  try {
    await client.connect();
    
    console.log('\n📊 CURRENT EXPERT STATUS\n');
    console.log('='.repeat(80) + '\n');
    
    const result = await client.query(`
      SELECT 
        u.email,
        u."firstName" || ' ' || u."lastName" as full_name,
        ep.status as profile_status,
        ep."barNumber",
        ev.id as verification_id,
        ev.status as verification_status
      FROM users u
      JOIN experts ep ON ep."userId" = u.id
      LEFT JOIN expert_verifications ev ON ev."expertId" = ep.id
      WHERE u.role = 'EXPERT'
      ORDER BY u."createdAt" DESC;
    `);
    
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.full_name} (${row.email})`);
      console.log(`   Profile Status: ${row.profile_status}`);
      console.log(`   Bar Number: ${row.barNumber}`);
      console.log(`   Verification Record: ${row.verification_id ? 'EXISTS' : 'NONE'}`);
      console.log(`   Verification Status: ${row.verification_status || 'N/A'}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('\n📈 STATS CALCULATION\n');
    
    // Calculate what stats SHOULD be
    const stats = {
      total: result.rows.length,
      verified: result.rows.filter(r => r.profile_status === 'VERIFIED').length,
      pending: result.rows.filter(r => r.profile_status === 'PENDING_VERIFICATION' && r.verification_id).length,
      draft: result.rows.filter(r => r.profile_status === 'DRAFT').length,
    };
    
    console.log(`Total: ${stats.total}`);
    console.log(`Verified (profile_status = 'VERIFIED'): ${stats.verified}`);
    console.log(`Pending Review (has verification record): ${stats.pending}`);
    console.log(`Draft (no verification submitted): ${stats.draft}`);
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkState();
