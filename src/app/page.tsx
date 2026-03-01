import { redirect } from "next/navigation";

import { getPageSession } from "@/server/auth";
import { Transactions } from "@/containers/transactions";

export default async function HomePage() {
  const session = await getPageSession();
  if (!session) {
    redirect("/login");
  }

  return <Transactions />;
}
