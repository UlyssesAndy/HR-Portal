const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function disable2FA() {
  try {
    console.log('🔧 Disabling 2FA for all users...');
    
    const result = await prisma.userCredentials.updateMany({
      where: {
        totpEnabled: true,
      },
      data: {
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
      },
    });
    
    console.log(`✅ Disabled 2FA for ${result.count} users`);
    
    // Show which users had 2FA
    const users = await prisma.userCredentials.findMany({
      include: {
        employee: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });
    
    console.log('\n📋 All users:');
    users.forEach(u => {
      console.log(`  - ${u.employee.fullName} (${u.employee.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

disable2FA();
