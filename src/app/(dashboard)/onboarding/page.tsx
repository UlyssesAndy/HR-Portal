import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Find employee by email
  const employee = await db.employee.findFirst({
    where: { email: session.user.email! },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      phone: true,
      timezone: true,
      departmentId: true,
      position: { select: { title: true } },
      department: { select: { id: true, name: true } },
      manager: { select: { fullName: true, avatarUrl: true } },
    },
  });

  if (!employee) {
    redirect("/");
  }

  // Get teammates
  const teammates = employee.departmentId ? await db.employee.findMany({
    where: {
      departmentId: employee.departmentId,
      id: { not: employee.id },
      status: "ACTIVE",
    },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      position: { select: { title: true } },
    },
    take: 12,
  }) : [];

  return (
    <OnboardingWizard 
      initialData={{
        employee: {
          id: employee.id,
          fullName: employee.fullName,
          email: employee.email,
          avatarUrl: employee.avatarUrl,
          phone: employee.phone,
          timezone: employee.timezone,
          position: employee.position,
          department: employee.department,
          manager: employee.manager,
        },
        teammates,
        progress: 0,
      }}
    />
  );
}
