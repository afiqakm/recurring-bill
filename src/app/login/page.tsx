import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { getPageSession } from "@/server/auth";

export default async function LoginPage() {
  const session = await getPageSession();
  if (session) {
    redirect("/");
  }
  return <LoginForm />;
}
