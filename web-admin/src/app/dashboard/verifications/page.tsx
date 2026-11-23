import { requireAdminProfile } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  VerificationsClient,
  type VerificationProfile,
} from "@/components/dashboard/verifications-client";

export default async function VerificationsPage() {
  const { profile } = await requireAdminProfile();
  const supabase = await createClient();

  let residentsQuery = supabase
    .from("profiles")
    .select("*, complexes(name)")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false });

  let sellersQuery = supabase
    .from("profiles")
    .select("*, complexes(name)")
    .eq("seller_request_status", "pending")
    .order("created_at", { ascending: false });

  if (!profile.is_super_admin) {
    residentsQuery = residentsQuery.eq("complex_id", profile.complex_id);
    sellersQuery = sellersQuery.eq("complex_id", profile.complex_id);
  }

  const [{ data: residentsData }, { data: sellersData }] = await Promise.all([
    residentsQuery,
    sellersQuery,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">
          Verifikasi Warga &amp; Pengajuan Seller
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Warga berstatus pending hanya memiliki akses Browse-Only. Penjual
          yang disetujui otomatis mendapat Gratis 30 Hari pertama.
        </p>
      </div>

      <VerificationsClient
        pendingResidents={(residentsData ?? []) as unknown as VerificationProfile[]}
        pendingSellers={(sellersData ?? []) as unknown as VerificationProfile[]}
      />
    </div>
  );
}
