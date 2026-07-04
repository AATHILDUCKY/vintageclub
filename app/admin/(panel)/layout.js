import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getSetting } from "@/lib/models";
import AdminShell from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const logo = getSetting("store_logo", "");
  return <AdminShell user={user} logo={logo}>{children}</AdminShell>;
}
