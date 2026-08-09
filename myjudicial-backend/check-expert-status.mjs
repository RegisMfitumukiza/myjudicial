#!/usr/bin/env node
/**
 * Check Expert Verification Status
 * 
 * This script checks the current state of all experts in the database
 * and identifies any inconsistencies in verification status.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpertStatus() {
  console.log('🔍 Checking Expert Verification Status...\n');

  try {
    // Get all experts with their verification records
    const experts = await prisma.user.findMany({
      where: { role: 'EXPERT' },
      include: {
        expertProfile: {
          include: {
            verifications: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`📊 Total Experts: ${experts.length}\n`);

    if (experts.length === 0) {
      console.log('No experts found in database.');
      return;
    }

    // Analyze each expert
    const issues = [];
    
    for (const user of experts) {
      const profile = user.expertProfile;
      if (!profile) {
        console.log(`⚠️  User ${user.email} has EXPERT role but no expert profile!`);
        continue;
      }

      const verification = profile.verifications[0];
      const hasVerification = verification !== undefined;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`Expert: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`${'='.repeat(80)}`);
      console.log(`User ID: ${user.id}`);
      console.log(`Account Status: ${user.status}`);
      console.log(`Expert Profile Status: ${profile.status}`);
      console.log(`Bar Number: ${profile.barNumber || 'Not set'}`);
      console.log(`Verification Record: ${hasVerification ? 'EXISTS' : 'MISSING'}`);
      
      if (hasVerification) {
        console.log(`Verification Status: ${verification.status}`);
        console.log(`Submitted At: ${verification.createdAt.toISOString()}`);
        if (verification.reviewedAt) {
          console.log(`Reviewed At: ${verification.reviewedAt.toISOString()}`);
        }
        if (verification.rejectionReason) {
          console.log(`Rejection Reason: ${verification.rejectionReason}`);
        }
      }

      // Check for inconsistencies
      const inconsistencies = [];

      // Issue 1: PENDING_VERIFICATION without verification record
      if (profile.status === 'PENDING_VERIFICATION' && !hasVerification) {
        inconsistencies.push('❌ Status is PENDING_VERIFICATION but no verification record exists');
        issues.push({
          expertId: profile.id,
          userId: user.id,
          email: user.email,
          issue: 'PENDING_WITHOUT_SUBMISSION',
          fix: 'Set status to DRAFT',
        });
      }

      // Issue 2: VERIFIED without APPROVED verification
      if (profile.status === 'VERIFIED' && (!hasVerification || verification.status !== 'APPROVED')) {
        inconsistencies.push('❌ Status is VERIFIED but verification is not APPROVED');
        issues.push({
          expertId: profile.id,
          userId: user.id,
          email: user.email,
          issue: 'VERIFIED_WITHOUT_APPROVAL',
          fix: 'Set status to DRAFT or investigate',
        });
      }

      // Issue 3: REJECTED status but verification is not REJECTED
      if (profile.status === 'REJECTED' && (!hasVerification || verification.status !== 'REJECTED')) {
        inconsistencies.push('❌ Status is REJECTED but verification is not REJECTED');
        issues.push({
          expertId: profile.id,
          userId: user.id,
          email: user.email,
          issue: 'REJECTED_WITHOUT_REJECTION',
          fix: 'Set status to DRAFT',
        });
      }

      // Issue 4: Has bar number but status is DRAFT (not necessarily wrong, but worth noting)
      if (profile.barNumber && profile.status === 'DRAFT') {
        inconsistencies.push('ℹ️  Has bar number but status is DRAFT (expert may need to submit documents)');
      }

      // Issue 5: Verification APPROVED but status not VERIFIED
      if (hasVerification && verification.status === 'APPROVED' && profile.status !== 'VERIFIED') {
        inconsistencies.push('❌ Verification is APPROVED but status is not VERIFIED');
        issues.push({
          expertId: profile.id,
          userId: user.id,
          email: user.email,
          issue: 'APPROVED_WITHOUT_VERIFIED',
          fix: 'Set status to VERIFIED',
        });
      }

      if (inconsistencies.length > 0) {
        console.log(`\n🔴 INCONSISTENCIES FOUND:`);
        inconsistencies.forEach(i => console.log(`   ${i}`));
      } else {
        console.log(`\n✅ Status is consistent`);
      }
    }

    // Summary
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📋 SUMMARY');
    console.log(`${'='.repeat(80)}\n`);

    const statusCount = experts.reduce((acc, u) => {
      const status = u.expertProfile?.status || 'NO_PROFILE';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('Expert Status Distribution:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    const verificationCount = experts.reduce((acc, u) => {
      const hasVerif = u.expertProfile?.verifications.length > 0;
      const status = hasVerif ? u.expertProfile.verifications[0].status : 'NO_SUBMISSION';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nVerification Status Distribution:');
    Object.entries(verificationCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    if (issues.length > 0) {
      console.log(`\n\n🚨 ISSUES FOUND: ${issues.length}`);
      console.log(`${'='.repeat(80)}\n`);
      
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.email}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Fix: ${issue.fix}`);
        console.log(`   Expert ID: ${issue.expertId}`);
        console.log(``);
      });

      console.log('\n💡 RECOMMENDED ACTION:');
      console.log('Run fix-verification-data.sql to correct these inconsistencies.\n');
    } else {
      console.log('\n\n✅ No inconsistencies found! All experts are in valid states.\n');
    }

  } catch (error) {
    console.error('❌ Error checking expert status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkExpertStatus()
  .then(() => {
    console.log('✅ Check complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
