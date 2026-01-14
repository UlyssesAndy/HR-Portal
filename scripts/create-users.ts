import { PrismaClient, AppRole, EmployeeStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Creating users...");

  // Admin users
  const adminUsers = [
    {
      email: "mairbek.adaev@alg.team",
      firstName: "Маирбек",
      lastName: "Адаев",
      roles: [AppRole.ADMIN, AppRole.HR],
    },
    {
      email: "dmitrii.zausaev@alg.team",
      firstName: "Дмитрий",
      lastName: "Заусаев",
      roles: [AppRole.ADMIN, AppRole.HR],
    },
    {
      email: "julia.zagryadskaya@alg.team",
      firstName: "Юлия",
      lastName: "Загрядская",
      roles: [AppRole.ADMIN, AppRole.HR],
    },
  ];

  // Super admin (all roles)
  const superAdmin = {
    email: "andrew.ashichev@alg.team",
    firstName: "Андрей",
    lastName: "Ашичев",
    roles: [AppRole.ADMIN, AppRole.HR, AppRole.PAYROLL_FINANCE, AppRole.MANAGER],
  };

  // Test users
  const testUsers = [
    {
      email: "test.user1@alg.team",
      firstName: "Тестовый",
      lastName: "Пользователь 1",
      roles: [AppRole.EMPLOYEE],
    },
    {
      email: "test.user2@alg.team",
      firstName: "Тестовый",
      lastName: "Пользователь 2",
      roles: [AppRole.EMPLOYEE],
    },
  ];

  const allUsers = [...adminUsers, superAdmin, ...testUsers];

  // Default password for all users
  const defaultPassword = "Algonova2025!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  for (const userData of allUsers) {
    try {
      // Check if user already exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { email: userData.email },
      });

      if (existingEmployee) {
        console.log(`⏭️  Employee ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create employee with credentials
      const employee = await prisma.employee.create({
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          fullName: `${userData.firstName} ${userData.lastName}`,
          status: EmployeeStatus.ACTIVE,
          credentials: {
            create: {
              passwordHash: hashedPassword,
              passwordSetAt: new Date(),
            },
          },
          roleAssignments: {
            create: userData.roles.map((role) => ({
              role,
              isManualOverride: true,
              grantedAt: new Date(),
            })),
          },
        },
        include: {
          credentials: true,
          roleAssignments: true,
        },
      });

      console.log(
        `✅ Created employee: ${employee.email} (${userData.roles.join(", ")}) - Password: ${defaultPassword}`
      );
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error);
    }
  }

  console.log("\n🎉 All employees created successfully!");
  console.log(`\n🔑 Default password for all employees: ${defaultPassword}`);
  console.log("\n📧 Created employees:");
  allUsers.forEach((u) => console.log(`   - ${u.email} (${u.roles.join(", ")})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
