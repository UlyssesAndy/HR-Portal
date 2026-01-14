import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MyProfileRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  // Redirect to the user's actual profile page
  redirect(`/profile/${session.user.id}`);
}
