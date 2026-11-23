import { requireAdminProfile } from "@/lib/admin-auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile, pendingCount } = await requireAdminProfile();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <DashboardSidebar
        adminName={profile.full_name}
        adminEmail={profile.email}
        isSuperAdmin={profile.is_super_admin}
        pendingCount={pendingCount}
      />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
