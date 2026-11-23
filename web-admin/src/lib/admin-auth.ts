import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface AdminContext {
  profile: Profile;
  pendingCount: number;
}

export async function requireAdminProfile(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || (!profile.is_admin && !profile.is_super_admin)) {
    redirect("/login?error=unauthorized");
  }

  let pendingResidentsQuery = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "pending");

  let pendingSellersQuery = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("seller_request_status", "pending");

  if (!profile.is_super_admin) {
    pendingResidentsQuery = pendingResidentsQuery.eq(
      "complex_id",
      profile.complex_id
    );
    pendingSellersQuery = pendingSellersQuery.eq(
      "complex_id",
      profile.complex_id
    );
  }

  const [{ count: residentCount }, { count: sellerCount }] = await Promise.all([
    pendingResidentsQuery,
    pendingSellersQuery,
  ]);

  return {
    profile,
    pendingCount: (residentCount ?? 0) + (sellerCount ?? 0),
  };
}
