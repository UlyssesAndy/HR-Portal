const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function disable2FA() {
  try {
    console.log('🔧 Disabling 2FA for andrew.ascherbev@alg.team...');
    
    // Find the employee
    const employee = await prisma.employee.findUnique({
      where: { email: 'andrew.ascherbev@alg.team' },
      include: { credentials: true }
    });
    
    if (!employee) {
      console.error('❌ Employee not found!');
      return;
    }
    
    if (!employee.credentials) {
      console.error('❌ No credentials found!');
      return;
    }
    
    console.log(`✅ Found: ${employee.fullName} (${employee.email})`);
    console.log(`   Current 2FA status: ${employee.credentials.totpEnabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (!employee.credentials.totpEnabled) {
      console.log('✅ 2FA already disabled!');
      return;
    }
    
    // Disable 2FA
    await prisma.userCredentials.update({
      where: { id: employee.credentials.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        backupCodes: [],
      },
    });
    
    console.log('✅ 2FA DISABLED successfully!');
    console.log('✅ You can now login with just email + password');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

disable2FA();
