import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfileRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const username = (session.user as { username?: string | null }).username;
  redirect(`/profile/${username || session.user.id}`);
}
