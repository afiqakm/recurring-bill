import { redirect } from "next/navigation";

import { Categories } from "@/containers/categories";
import { getPageSession } from "@/server/auth";

export default async function CategoriesPage() {
  const session = await getPageSession();
  if (!session) {
    redirect("/login");
  }

  return <Categories />;
}
