#!/usr/bin/env node
import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function testAPIResponse() {
  try {
    await client.connect();
    
    console.log('\n🔍 SIMULATING API RESPONSE\n');
    console.log('='.repeat(80) + '\n');
    
    // Simulate what admin-expert.service.ts returns
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u."firstName" || ' ' || u."lastName" as full_name,
        u.status as account_status,
        ep.status as expert_status,
        ep."barNumber"
      FROM users u
      JOIN experts ep ON ep."userId" = u.id
      WHERE u.role = 'EXPERT'
      ORDER BY u."createdAt" DESC;
    `);
    
    console.log('API Response (what backend returns):\n');
    result.rows.forEach((row, idx) => {
      // This mimics the transformation in admin-expert.service.ts line 130
      const verified = row.expert_status === 'VERIFIED';
      
      console.log(`${idx + 1}. ${row.full_name}`);
      console.log(`   email: ${row.email}`);
      console.log(`   accountStatus: ${row.account_status}`);
      console.log(`   expertStatus: ${row.expert_status}`);
      console.log(`   verified: ${verified}`);
      console.log(`   barNumber: ${row.barNumber}`);
      console.log('');
    });
    
    console.log('='.repeat(80));
    console.log('\n📊 FILTER RESULTS\n');
    
    // Test ?verified=true filter
    const verifiedCount = result.rows.filter(r => r.expert_status === 'VERIFIED').length;
    console.log(`Query: /admin/experts?verified=true`);
    console.log(`Expected Count: ${verifiedCount}`);
    console.log(`(Filters where expertStatus = 'VERIFIED')`);
    
    console.log('\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testAPIResponse();
