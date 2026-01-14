import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Updating all user credentials to require password change...");

  const result = await prisma.userCredentials.updateMany({
    where: {
      passwordHash: { not: null },
    },
    data: {
      requirePasswordChange: true,
    },
  });

  console.log(`✅ Updated ${result.count} user credentials`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
