import { AdminGuard } from "@/components";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { getAuditLogs, getUsers, getStaffPermissions } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const perms = await getStaffPermissions();
  if (!perms.isSuperAdmin) {
    redirect("/");
  }

  let logs: any[] = [];
  let users: any[] = [];

  try {
    const data = await Promise.all([
      getAuditLogs().catch((e) => {
        console.error("Failed to fetch logs:", e);
        return [];
      }),
      getUsers().catch((e) => {
        console.error("Failed to fetch users:", e);
        return [];
      }),
    ]);
    logs = data[0];
    users = data[1];
  } catch (error) {
    console.error("Error loading admin data:", error);
  }

  return (
    <AdminGuard>
      <AdminDashboard logs={logs} users={users} />
    </AdminGuard>
  );
}
