import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  UsersClient,
  type UserWithComplex,
} from "@/components/dashboard/users-client";

export default async function UsersPage() {
  const { profile } = await requireAdminProfile();
  const supabase = await createClient();

  let usersQuery = supabase
    .from("profiles")
    .select("*, complexes(name)")
    .order("created_at", { ascending: false });

  if (!profile.is_super_admin) {
    usersQuery = usersQuery.eq("complex_id", profile.complex_id);
  }

  const { data } = await usersQuery;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Manajemen Pengguna
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Lihat daftar warga terdaftar serta aktifkan atau nonaktifkan peran
          Kurir Komplek.
        </p>
      </div>

      <UsersClient users={(data ?? []) as unknown as UserWithComplex[]} />
    </div>
  );
}
