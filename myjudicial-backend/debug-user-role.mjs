import { PrismaClient } from "./src/generated/prisma/client.ts";

const prisma = new PrismaClient();

async function debugUserRoles() {
  try {
    console.log("=== MyJudicial User Role Debug ===\n");
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        expertProfile: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log("Recent Users (last 10):");
    console.log("========================");
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role} | Status: ${user.status}`);
      console.log(`   Expert Profile: ${user.expertProfile ? `ID: ${user.expertProfile.id}, Status: ${user.expertProfile.status}` : 'None'}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log("");
    });

    console.log("Role Distribution:");
    console.log("==================");
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });
    
    roleStats.forEach(stat => {
      console.log(`${stat.role}: ${stat._count.role} users`);
    });

    // Check specific user if you provide email
    const targetEmail = process.argv[2];
    if (targetEmail) {
      console.log(`\nChecking specific user: ${targetEmail}`);
      console.log("=======================================");
      const specificUser = await prisma.user.findUnique({
        where: { email: targetEmail },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          expertProfile: {
            select: { id: true, status: true, displayName: true }
          }
        }
      });

      if (specificUser) {
        console.log(`Found user:`, JSON.stringify(specificUser, null, 2));
      } else {
        console.log(`No user found with email: ${targetEmail}`);
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserRoles();