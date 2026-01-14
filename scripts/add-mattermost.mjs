// Script to add Mattermost service to the database
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Adding Mattermost service...");

  // First, create or find Communication category
  let category = await prisma.serviceCategory.findFirst({
    where: { name: "Communication" }
  });

  if (!category) {
    category = await prisma.serviceCategory.create({
      data: {
        name: "Communication",
        sortOrder: 1,
        isActive: true
      }
    });
    console.log("✅ Created Communication category");
  } else {
    console.log("📁 Found existing Communication category");
  }

  // Check if Mattermost already exists
  const existingMattermost = await prisma.serviceLink.findFirst({
    where: { title: "Mattermost" }
  });

  if (existingMattermost) {
    console.log("⚠️ Mattermost service already exists, updating...");
    await prisma.serviceLink.update({
      where: { id: existingMattermost.id },
      data: {
        url: process.env.MATTERMOST_URL || "https://mattermost.example.com",
        description: "Team messaging and collaboration platform",
        iconUrl: "https://mattermost.com/wp-content/uploads/2022/02/icon_WS.png",
        categoryId: category.id,
        isActive: true
      }
    });
    console.log("✅ Updated Mattermost service");
  } else {
    // Create Mattermost service
    await prisma.serviceLink.create({
      data: {
        title: "Mattermost",
        url: process.env.MATTERMOST_URL || "https://mattermost.example.com",
        description: "Team messaging and collaboration platform",
        iconUrl: "https://mattermost.com/wp-content/uploads/2022/02/icon_WS.png",
        categoryId: category.id,
        sortOrder: 1,
        isActive: true,
        visibleRoles: {
          create: [] // Visible to everyone
        }
      }
    });
    console.log("✅ Created Mattermost service");
  }

  // Also add some other common services if they don't exist
  const commonServices = [
    {
      title: "Google Workspace",
      url: "https://workspace.google.com",
      description: "Email, Calendar, Drive, Meet and more",
      iconUrl: "https://ssl.gstatic.com/images/branding/product/1x/googleg_48dp.png",
      categoryId: category.id,
      sortOrder: 2
    },
    {
      title: "Jira",
      url: "https://jira.atlassian.com",
      description: "Project and issue tracking",
      iconUrl: "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png",
      sortOrder: 10
    },
    {
      title: "Confluence",
      url: "https://confluence.atlassian.com",
      description: "Team wiki and documentation",
      iconUrl: "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png",
      sortOrder: 11
    }
  ];

  for (const service of commonServices) {
    const exists = await prisma.serviceLink.findFirst({
      where: { title: service.title }
    });

    if (!exists) {
      await prisma.serviceLink.create({
        data: {
          ...service,
          isActive: true
        }
      });
      console.log(`✅ Created ${service.title} service`);
    } else {
      console.log(`⏭️ ${service.title} already exists, skipping`);
    }
  }

  console.log("\n🎉 Done! Services added successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
