import { redirect } from "next/navigation";

import Profile from "@/containers/profile";
import { getPageSession } from "@/server/auth";

export default async function ProfilePage() {
  const session = await getPageSession();
  if (!session) {
    redirect("/login");
  }

  return <Profile />;
}
