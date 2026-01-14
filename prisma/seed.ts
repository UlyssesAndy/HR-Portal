import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create service categories
  const hrCategory = await prisma.serviceCategory.create({
    data: { name: 'HR & Benefits', sortOrder: 1 },
  });
  const itCategory = await prisma.serviceCategory.create({
    data: { name: 'IT & Tools', sortOrder: 2 },
  });
  const finCategory = await prisma.serviceCategory.create({
    data: { name: 'Finance', sortOrder: 3 },
  });
  const commCategory = await prisma.serviceCategory.create({
    data: { name: 'Communication', sortOrder: 4 },
  });

  console.log('✅ Created 4 service categories');

  // Create sample services
  await prisma.serviceLink.createMany({
    data: [
      {
        title: 'Jira',
        description: 'Project management and issue tracking',
        url: 'https://jira.yourcompany.com',
        categoryId: itCategory.id,
        sortOrder: 1,
      },
      {
        title: 'Confluence',
        description: 'Team collaboration and documentation',
        url: 'https://confluence.yourcompany.com',
        categoryId: itCategory.id,
        sortOrder: 2,
      },
      {
        title: 'Gmail',
        description: 'Corporate email',
        url: 'https://mail.google.com',
        categoryId: commCategory.id,
        sortOrder: 1,
      },
      {
        title: 'Google Drive',
        description: 'Cloud file storage',
        url: 'https://drive.google.com',
        categoryId: itCategory.id,
        sortOrder: 3,
      },
      {
        title: 'Google Calendar',
        description: 'Schedule and meeting management',
        url: 'https://calendar.google.com',
        categoryId: commCategory.id,
        sortOrder: 2,
      },
      {
        title: 'Slack',
        description: 'Team messaging platform',
        url: 'https://yourcompany.slack.com',
        categoryId: commCategory.id,
        sortOrder: 3,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 6 service links');

  // Create sample departments
  const engDept = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG' },
  });
  const prodDept = await prisma.department.create({
    data: { name: 'Product', code: 'PROD' },
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR' },
  });
  const finDept = await prisma.department.create({
    data: { name: 'Finance', code: 'FIN' },
  });
  const marketDept = await prisma.department.create({
    data: { name: 'Marketing', code: 'MKT' },
  });
  const opsDept = await prisma.department.create({
    data: { name: 'Operations', code: 'OPS' },
  });

  console.log('✅ Created 6 departments');

  // Create sample positions
  await prisma.position.createMany({
    data: [
      { title: 'Software Engineer', departmentId: engDept.id },
      { title: 'Senior Software Engineer', departmentId: engDept.id },
      { title: 'Engineering Manager', departmentId: engDept.id },
      { title: 'Product Manager', departmentId: prodDept.id },
      { title: 'Senior Product Manager', departmentId: prodDept.id },
      { title: 'HR Specialist', departmentId: hrDept.id },
      { title: 'HR Manager', departmentId: hrDept.id },
      { title: 'Financial Analyst', departmentId: finDept.id },
      { title: 'Finance Manager', departmentId: finDept.id },
      { title: 'Marketing Specialist', departmentId: marketDept.id },
      { title: 'Operations Manager', departmentId: opsDept.id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 11 positions');

  // Get positions for employees
  const positions = await prisma.position.findMany();
  const engPositions = positions.filter(p => p.title.includes('Engineer'));
  const hrPositions = positions.filter(p => p.title.includes('HR'));
  const pmPositions = positions.filter(p => p.title.includes('Product'));

  // Create sample employees
  const today = new Date();
  const birthdayThisWeek = new Date(today);
  birthdayThisWeek.setFullYear(1990);
  birthdayThisWeek.setDate(today.getDate() + 2);

  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        email: 'john.smith@corp.example.com',
        fullName: 'John Smith',
        firstName: 'John',
        lastName: 'Smith',
        departmentId: engDept.id,
        positionId: engPositions.find(p => p.title === 'Engineering Manager')?.id,
        status: 'ACTIVE',
        startDate: new Date('2022-03-15'),
        birthDate: birthdayThisWeek,
        phone: '+1-555-0101',
        location: 'New York',
        timezone: 'America/New_York',
        employmentType: 'FULL_TIME',
      },
    }),
    prisma.employee.create({
      data: {
        email: 'sarah.johnson@corp.example.com',
        fullName: 'Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        departmentId: hrDept.id,
        positionId: hrPositions.find(p => p.title === 'HR Manager')?.id,
        status: 'ACTIVE',
        startDate: new Date('2021-06-01'),
        birthDate: new Date('1988-07-22'),
        phone: '+1-555-0102',
        location: 'San Francisco',
        timezone: 'America/Los_Angeles',
        employmentType: 'FULL_TIME',
      },
    }),
    prisma.employee.create({
      data: {
        email: 'alex.chen@corp.example.com',
        fullName: 'Alex Chen',
        firstName: 'Alex',
        lastName: 'Chen',
        departmentId: engDept.id,
        positionId: engPositions.find(p => p.title === 'Senior Software Engineer')?.id,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (new hire)
        birthDate: new Date('1992-11-15'),
        phone: '+1-555-0103',
        location: 'Seattle',
        timezone: 'America/Los_Angeles',
        employmentType: 'FULL_TIME',
      },
    }),
    prisma.employee.create({
      data: {
        email: 'maria.garcia@corp.example.com',
        fullName: 'Maria Garcia',
        firstName: 'Maria',
        lastName: 'Garcia',
        departmentId: prodDept.id,
        positionId: pmPositions.find(p => p.title === 'Product Manager')?.id,
        status: 'ON_LEAVE',
        statusNote: 'Vacation until January 20',
        statusStartDate: new Date('2026-01-10'),
        statusEndDate: new Date('2026-01-20'),
        startDate: new Date('2023-01-10'),
        birthDate: new Date('1995-03-08'),
        phone: '+1-555-0104',
        location: 'Austin',
        timezone: 'America/Chicago',
        employmentType: 'FULL_TIME',
      },
    }),
    prisma.employee.create({
      data: {
        email: 'david.kim@corp.example.com',
        fullName: 'David Kim',
        firstName: 'David',
        lastName: 'Kim',
        departmentId: engDept.id,
        positionId: engPositions.find(p => p.title === 'Software Engineer')?.id,
        status: 'ACTIVE',
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (new hire)
        birthDate: new Date('1997-09-25'),
        phone: '+1-555-0105',
        location: 'Boston',
        timezone: 'America/New_York',
        employmentType: 'FULL_TIME',
      },
    }),
  ]);

  // Set manager relationships
  await prisma.employee.update({
    where: { id: employees[2].id },
    data: { managerId: employees[0].id },
  });
  await prisma.employee.update({
    where: { id: employees[4].id },
    data: { managerId: employees[0].id },
  });

  console.log('✅ Created 5 sample employees');

  // Assign roles
  await prisma.roleAssignment.createMany({
    data: [
      { employeeId: employees[0].id, role: 'MANAGER' },
      { employeeId: employees[1].id, role: 'HR' },
      { employeeId: employees[1].id, role: 'ADMIN' },
    ],
  });

  console.log('✅ Assigned roles to employees');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
