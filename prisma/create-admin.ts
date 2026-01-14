import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  const adminEmail = 'admin@test.com';
  
  console.log('🔧 Creating admin user...\n');

  // Check if employee exists
  let employee = await prisma.employee.findUnique({
    where: { email: adminEmail },
    include: { roleAssignments: true },
  });

  if (!employee) {
    // Create employee
    employee = await prisma.employee.create({
      data: {
        email: adminEmail,
        fullName: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        status: 'ACTIVE',
        isSyncedFromGoogle: false,
        roleAssignments: {
          create: [
            { role: 'ADMIN' },
            { role: 'HR' },
            { role: 'EMPLOYEE' },
          ],
        },
      },
      include: { roleAssignments: true },
    });
    console.log('✅ Created admin employee:', adminEmail);
  } else {
    console.log('ℹ️  Employee already exists:', adminEmail);
    
    // Ensure admin role
    const hasAdmin = employee.roleAssignments.some(r => r.role === 'ADMIN');
    if (!hasAdmin) {
      await prisma.roleAssignment.create({
        data: {
          employeeId: employee.id,
          role: 'ADMIN',
        },
      });
      console.log('✅ Added ADMIN role');
    }
    
    // Ensure HR role
    const hasHR = employee.roleAssignments.some(r => r.role === 'HR');
    if (!hasHR) {
      await prisma.roleAssignment.create({
        data: {
          employeeId: employee.id,
          role: 'HR',
        },
      });
      console.log('✅ Added HR role');
    }
  }

  // Also create a regular employee for testing
  const regularEmail = 'user@test.com';
  let regular = await prisma.employee.findUnique({
    where: { email: regularEmail },
  });

  if (!regular) {
    regular = await prisma.employee.create({
      data: {
        email: regularEmail,
        fullName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        status: 'ACTIVE',
        isSyncedFromGoogle: false,
        roleAssignments: {
          create: [{ role: 'EMPLOYEE' }],
        },
      },
    });
    console.log('✅ Created regular employee:', regularEmail);
  } else {
    console.log('ℹ️  Regular employee already exists:', regularEmail);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST ACCOUNTS READY:\n');
  console.log('👑 ADMIN:    admin@test.com');
  console.log('   Roles:    ADMIN, HR, EMPLOYEE');
  console.log('   Access:   Full admin console, all features\n');
  console.log('👤 USER:     user@test.com');
  console.log('   Roles:    EMPLOYEE');
  console.log('   Access:   Basic directory, profile view\n');
  console.log('='.repeat(50));
  console.log('\n🚀 Go to http://localhost:3000/login and sign in!\n');
}

createAdmin()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
